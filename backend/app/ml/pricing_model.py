"""
Dynamic Pricing Model
======================
Implementation: Rule-based demand-supply pricing (decision-support only).

Algorithm:
  1. Demand Level is determined by the 30-day booking count for the room:
     - >= 5 bookings in 30 days  → High demand
     - 2-4 bookings in 30 days  → Moderate demand
     - < 2 bookings in 30 days  → Low demand

  2. Availability Level is based on how many rooms of the same type
     are currently available (status = 'available'):
     - 0-1 rooms available → Limited
     - 2-3 rooms available → Normal
     - >= 4 rooms available → High

  3. Price adjustment rules (applied to current_price):
     High demand  + Limited availability  → +15% to +20%
     High demand  + Normal availability   → +5%  to +10%
     High demand  + High availability     → 0%   (no change)
     Moderate demand + Limited            → +5%
     Moderate demand + Normal/High        → 0%
     Low demand   + Limited               → 0%
     Low demand   + Normal                → -5%  to -10%
     Low demand   + High                  → -10% to -15%

  4. A human-readable reason is generated for every recommendation.

  5. The recommended price is NEVER automatically applied to rooms.
     This is a decision-support tool; admins must explicitly approve changes.

This is clearly documented as rule-based (v1).
A trained regression/RL model can replace generate_recommendation()
without changing the router or service layer.
"""

from typing import Tuple

MODEL_VERSION = "rule-based-pricing-v1"


def _clamp_price(price: float) -> float:
    """Round to nearest 50 for clean hotel pricing."""
    return round(price / 50) * 50


def generate_recommendation(
    current_price: float,
    booking_count_30d: int,
    available_rooms_same_type: int,
) -> Tuple[float, str, str, str]:
    """
    Generate a pricing recommendation.

    Args:
        current_price: the room's current price (₱)
        booking_count_30d: number of bookings for this room in the last 30 days
        available_rooms_same_type: number of rooms of the same type currently available

    Returns:
        (recommended_price, demand_level, availability_level, reason)
    """
    # ── Demand level ───────────────────────────────────────────────────────
    if booking_count_30d >= 5:
        demand = "High"
    elif booking_count_30d >= 2:
        demand = "Moderate"
    else:
        demand = "Low"

    # ── Availability level ─────────────────────────────────────────────────
    if available_rooms_same_type <= 1:
        avail = "Limited"
    elif available_rooms_same_type <= 3:
        avail = "Normal"
    else:
        avail = "High"

    # ── Adjustment table ───────────────────────────────────────────────────
    adjustment_pct = {
        ("High",     "Limited"): 0.18,
        ("High",     "Normal"):  0.08,
        ("High",     "High"):    0.00,
        ("Moderate", "Limited"): 0.05,
        ("Moderate", "Normal"):  0.00,
        ("Moderate", "High"):    0.00,
        ("Low",      "Limited"): 0.00,
        ("Low",      "Normal"):  -0.07,
        ("Low",      "High"):    -0.12,
    }.get((demand, avail), 0.00)

    recommended_price = _clamp_price(current_price * (1 + adjustment_pct))

    # ── Human-readable reason ──────────────────────────────────────────────
    if adjustment_pct > 0.10:
        reason = (
            f"Recommended price increased by {adjustment_pct*100:.0f}% because booking demand "
            f"is {demand.lower()} while room availability is {avail.lower()}. "
            f"({booking_count_30d} bookings in the last 30 days, {available_rooms_same_type} room(s) available.)"
        )
    elif adjustment_pct > 0:
        reason = (
            f"Slight price increase recommended ({adjustment_pct*100:.0f}%) due to {demand.lower()} "
            f"demand and {avail.lower()} availability."
        )
    elif adjustment_pct < -0.08:
        reason = (
            f"Recommended price decreased by {abs(adjustment_pct)*100:.0f}% to stimulate bookings. "
            f"Demand is {demand.lower()} with {avail.lower()} availability. "
            f"({booking_count_30d} bookings in the last 30 days.)"
        )
    elif adjustment_pct < 0:
        reason = (
            f"Slight price decrease recommended ({abs(adjustment_pct)*100:.0f}%) "
            f"due to {demand.lower()} demand."
        )
    else:
        reason = (
            f"Current price is appropriate. Demand is {demand.lower()} with {avail.lower()} availability."
        )

    return recommended_price, demand, avail, reason
