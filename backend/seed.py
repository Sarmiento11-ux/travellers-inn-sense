"""
Database seed script
Run: python seed.py   (from the backend/ directory)

Creates tables, seeds admin + demo data.
Demo accounts (development only):
  Admin:    admin@gmail.com / admin123
  Customer: alice@example.com / password123
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timezone, timedelta
from app.database.base import Base
from app.database.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.room import Room
from app.models.booking import Booking
from app.models.feedback import Feedback, SentimentResult, FeedbackTheme
from app.models.pricing import PricingRecommendation
from app.core.security import get_password_hash
from app.ml.sentiment_model import classify_sentiment, extract_themes, MODEL_VERSION
from app.core.config import settings

print("Creating tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Wipe existing seed data ──────────────────────────────────────────────────
print("Clearing old seed data...")
for model in [PricingRecommendation, FeedbackTheme, SentimentResult, Feedback, Booking, Room, User]:
    db.query(model).delete()
db.commit()

# ── Admin account ─────────────────────────────────────────────────────────────
admin = User(
    first_name="Admin",
    last_name="User",
    email=settings.ADMIN_EMAIL,
    password_hash=get_password_hash(settings.ADMIN_PASSWORD),
    role=UserRole.admin,
    is_active=True,
)
db.add(admin)

# ── Demo customers ────────────────────────────────────────────────────────────
customers = [
    User(first_name="Alice", last_name="Santos",  email="alice@example.com",   password_hash=get_password_hash("password123"), role=UserRole.customer),
    User(first_name="Bob",   last_name="Reyes",   email="bob@example.com",     password_hash=get_password_hash("password123"), role=UserRole.customer),
    User(first_name="Charlie",last_name="Cruz",   email="charlie@example.com", password_hash=get_password_hash("password123"), role=UserRole.customer),
    User(first_name="Diana", last_name="Lim",     email="diana@example.com",   password_hash=get_password_hash("password123"), role=UserRole.customer),
]
for c in customers:
    db.add(c)
db.flush()

# ── Rooms ─────────────────────────────────────────────────────────────────────
rooms_data = [
    dict(name="Budget Single",   type="Standard", base_price=1000, capacity=1, availability_status="available",
         amenities=json.dumps(["Free Wi-Fi","Fan","Shared Bathroom"]),
         description="Affordable accommodation for solo travelers on a budget.",
         image_url="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"),
    dict(name="Standard Room",   type="Standard", base_price=1500, capacity=2, availability_status="available",
         amenities=json.dumps(["Free Wi-Fi","Air Conditioning","TV","Private Bathroom"]),
         description="A comfortable standard room suitable for couples or solo travelers.",
         image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80"),
    dict(name="Deluxe Twin",     type="Deluxe",   base_price=2500, capacity=4, availability_status="available",
         amenities=json.dumps(["Free Wi-Fi","Air Conditioning","Smart TV","Mini Fridge","Private Bathroom"]),
         description="Spacious twin room with modern amenities, perfect for small families or friends.",
         image_url="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80"),
    dict(name="Family Suite",    type="Suite",    base_price=4000, capacity=6, availability_status="available",
         amenities=json.dumps(["Free Wi-Fi","Air Conditioning","2 Smart TVs","Mini Kitchen","Lounge Area"]),
         description="A large suite designed for families, featuring a separate lounge area.",
         image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"),
    dict(name="Executive Suite", type="Suite",    base_price=5000, capacity=2, availability_status="available",
         amenities=json.dumps(["Premium Wi-Fi","Air Conditioning","Smart TV","Mini Bar","Bathtub","Balcony"]),
         description="Luxurious suite for business travelers or couples seeking a premium experience.",
         image_url="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"),
]
rooms = []
for rd in rooms_data:
    r = Room(**rd, current_price=rd["base_price"])
    db.add(r)
    rooms.append(r)
db.flush()

# ── Bookings ──────────────────────────────────────────────────────────────────
today = date.today()
bookings_seed = [
    dict(booking_reference="BKG-001001", user_id=customers[0].id, room_id=rooms[1].id,
         check_in=today-timedelta(days=10), check_out=today-timedelta(days=8),
         number_of_guests=2, booking_amount=3000, status="completed"),
    dict(booking_reference="BKG-001002", user_id=customers[1].id, room_id=rooms[3].id,
         check_in=today+timedelta(days=5),  check_out=today+timedelta(days=8),
         number_of_guests=5, booking_amount=12000, status="confirmed"),
    dict(booking_reference="BKG-001003", user_id=customers[2].id, room_id=rooms[0].id,
         check_in=today-timedelta(days=3),  check_out=today-timedelta(days=1),
         number_of_guests=1, booking_amount=2000, status="completed"),
    dict(booking_reference="BKG-001004", user_id=customers[3].id, room_id=rooms[2].id,
         check_in=today+timedelta(days=2),  check_out=today+timedelta(days=4),
         number_of_guests=3, booking_amount=5000, status="confirmed"),
]
bkg_objs = []
for bd in bookings_seed:
    b = Booking(**bd)
    db.add(b)
    bkg_objs.append(b)
db.flush()

# ── Feedback + Sentiment + Themes ─────────────────────────────────────────────
feedbacks_seed = [
    dict(user=customers[0], rating=5, text="The room was incredibly clean and smelled fresh. Will definitely return!", category="Cleanliness"),
    dict(user=customers[1], rating=2, text="The AC was quite noisy and took a long time to cool the room down.", category="Facilities"),
    dict(user=customers[2], rating=4, text="Staff were very accommodating and helped us with our luggage.", category="Staff Service"),
    dict(user=customers[3], rating=3, text="Breakfast was okay, standard fare. Nothing spectacular but not bad either.", category="Food & Dining"),
    dict(user=customers[0], rating=1, text="Felt overpriced for the amenities provided compared to other hotels.", category="Pricing"),
    dict(user=customers[1], rating=5, text="Amazing experience. The room was spacious, bed was very comfortable, and the view was breathtaking.", category="Room Comfort"),
    dict(user=customers[2], rating=4, text="Check-in was smooth and fast. The front desk was very professional.", category="Staff Service"),
    dict(user=customers[3], rating=2, text="Wi-Fi kept disconnecting throughout our stay. Very frustrating.", category="Facilities"),
]
for fd in feedbacks_seed:
    fb = Feedback(
        user_id=fd["user"].id,
        rating=fd["rating"],
        feedback_text=fd["text"],
        category=fd["category"],
    )
    db.add(fb)
    db.flush()
    sentiment, conf = classify_sentiment(fd["rating"], fd["text"])
    db.add(SentimentResult(feedback_id=fb.id, sentiment=sentiment, confidence_score=conf, model_version=MODEL_VERSION))
    for theme in extract_themes(fd["text"], fd["category"]):
        db.add(FeedbackTheme(feedback_id=fb.id, theme=theme))

db.commit()
print("SEED COMPLETE!")
print()
print("Demo accounts:")
print(f"  Admin:    {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
print(f"  Customer: alice@example.com / password123")
print(f"  Customer: bob@example.com   / password123")
db.close()
