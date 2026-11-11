"""
Sentiment Analysis Service
==========================
Implementation: Rule-based approach using TextBlob polarity + star-rating override.

Algorithm:
  1. Star rating is the primary signal (matches frontend logic):
     - 5 stars         → Positive  (confidence ≈ 0.97)
     - 4 stars         → Positive  (confidence ≈ 0.82)
     - 3 stars         → Neutral   (confidence ≈ 0.75)
     - 2 stars         → Negative  (confidence ≈ 0.85)
     - 1 star          → Negative  (confidence ≈ 0.96)

  2. TextBlob polarity on the feedback text provides a secondary
     confidence adjustment (±0.10) so that strongly worded reviews
     get a slightly different confidence value.

  3. Themes are identified by keyword scanning across eight predefined
     category dimensions.

This is clearly documented as rule-based (v1).
A trained ML model (e.g. a fine-tuned BERT classifier) can replace
classify_sentiment() without changing any API surface.
"""

from textblob import TextBlob
from typing import Tuple, List

MODEL_VERSION = "rule-based-v1"

# ── Theme keyword map ──────────────────────────────────────────────────────
THEME_KEYWORDS: dict[str, List[str]] = {
    "Room Cleanliness": [
        "clean", "dirty", "dust", "smell", "fresh", "hygiene", "sanitary",
        "spotless", "tidy", "filthy", "odor", "mold",
    ],
    "Staff Service": [
        "staff", "service", "helpful", "rude", "friendly", "accommodating",
        "reception", "front desk", "responsive", "professional", "courteous",
    ],
    "Room Comfort": [
        "comfortable", "bed", "pillow", "mattress", "noisy", "quiet",
        "spacious", "cramped", "cozy", "sleep", "rest",
    ],
    "Facilities": [
        "facility", "pool", "gym", "wifi", "internet", "parking",
        "elevator", "amenity", "tv", "shower", "ac", "air conditioning",
        "bathroom", "restroom",
    ],
    "Food and Dining": [
        "food", "breakfast", "lunch", "dinner", "restaurant", "meal",
        "buffet", "taste", "delicious", "bland", "menu", "dining",
    ],
    "Pricing": [
        "price", "expensive", "cheap", "value", "overpriced", "affordable",
        "worth", "cost", "rate", "budget",
    ],
    "Booking Experience": [
        "booking", "reservation", "check-in", "check-out", "online",
        "confirmation", "process", "website", "app",
    ],
    "Location and Accessibility": [
        "location", "nearby", "accessible", "transport", "distance",
        "view", "area", "surroundings",
    ],
}


def classify_sentiment(rating: int, text: str) -> Tuple[str, float]:
    """
    Classify sentiment from star rating (primary) + TextBlob polarity (secondary).

    Returns:
        (sentiment_label, confidence_score)
        sentiment_label: "Positive" | "Neutral" | "Negative"
        confidence_score: float in [0, 1]
    """
    # Primary rule from star rating
    if rating >= 4:
        label = "Positive"
        base_conf = 0.97 if rating == 5 else 0.82
    elif rating == 3:
        label = "Neutral"
        base_conf = 0.75
    else:
        label = "Negative"
        base_conf = 0.96 if rating == 1 else 0.85

    # TextBlob secondary adjustment
    try:
        polarity = TextBlob(text).sentiment.polarity  # -1.0 to 1.0
    except Exception:
        polarity = 0.0

    # Minor confidence adjustment based on text polarity alignment
    text_agrees = (
        (label == "Positive" and polarity > 0) or
        (label == "Negative" and polarity < 0) or
        (label == "Neutral"  and -0.1 <= polarity <= 0.1)
    )
    adjustment = 0.05 if text_agrees else -0.05
    confidence = max(0.5, min(1.0, base_conf + adjustment))

    return label, round(confidence, 4)


def extract_themes(text: str, category: str = "") -> List[str]:
    """
    Extract relevant feedback themes from text using keyword matching.

    Returns a list of matched theme names (may be empty).
    """
    text_lower = text.lower()
    matched: List[str] = []

    for theme, keywords in THEME_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            matched.append(theme)

    # Map the frontend category directly to a theme if not already matched
    category_theme_map = {
        "Cleanliness":    "Room Cleanliness",
        "Room Cleanliness": "Room Cleanliness",
        "Service":        "Staff Service",
        "Staff Service":  "Staff Service",
        "Facilities":     "Facilities",
        "Food & Dining":  "Food and Dining",
        "Food Quality":   "Food and Dining",
        "Pricing":        "Pricing",
        "Location":       "Location and Accessibility",
        "Booking Experience": "Booking Experience",
    }
    if category and category in category_theme_map:
        canonical = category_theme_map[category]
        if canonical not in matched:
            matched.insert(0, canonical)

    return matched
