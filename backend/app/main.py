import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, rooms, bookings, feedback, pricing, analytics, users

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Travellers Inn Sense API",
    description=(
        "Backend API for Travellers Inn Sense: Machine Learning-Based "
        "Guest Experience Analytics and Dynamic Room Pricing"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(bookings.router)
app.include_router(feedback.router)
app.include_router(pricing.router)
app.include_router(analytics.router)
app.include_router(users.router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Travellers Inn Sense API is running"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
