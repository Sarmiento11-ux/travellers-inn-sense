"""
Feedback + Sentiment Service
Orchestrates: save feedback → run NLP → save sentiment & themes.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.feedback import Feedback, SentimentResult, FeedbackTheme
from app.models.user import User
from app.ml.sentiment_model import classify_sentiment, extract_themes, MODEL_VERSION

def create_feedback_with_analysis(
    db: Session,
    user: User,
    rating: int,
    feedback_text: str,
    category: str = "General",
    booking_id: int = None,
) -> Feedback:
    # 1. Save feedback
    fb = Feedback(
        user_id=user.id,
        booking_id=booking_id,
        rating=rating,
        feedback_text=feedback_text,
        category=category,
    )
    db.add(fb)
    db.flush()  # get fb.id without full commit

    # 2. Sentiment analysis
    sentiment_label, confidence = classify_sentiment(rating, feedback_text)
    sr = SentimentResult(
        feedback_id=fb.id,
        sentiment=sentiment_label,
        confidence_score=confidence,
        model_version=MODEL_VERSION,
    )
    db.add(sr)

    # 3. Theme extraction
    themes = extract_themes(feedback_text, category)
    for theme in themes:
        db.add(FeedbackTheme(feedback_id=fb.id, theme=theme))

    db.commit()
    db.refresh(fb)
    return fb
