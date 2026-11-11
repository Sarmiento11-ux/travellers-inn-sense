# Travellers Inn Sense — Backend

**FastAPI + PostgreSQL + NLP/AI backend for Travellers Inn Sense: Machine Learning-Based Guest Experience Analytics and Dynamic Room Pricing**

---

## Requirements

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| PostgreSQL | 14+ |
| Node.js | 18+ (frontend) |

---

## Quick Setup

### 1. Install PostgreSQL

Download and install PostgreSQL from https://www.postgresql.org/download/windows/

During installation, set the postgres user password to `postgres` (or edit `.env` later).

After install, create the database:
```sql
-- In psql or pgAdmin:
CREATE DATABASE travellers_inn;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Configure `.env`

```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/travellers_inn
SECRET_KEY=your_long_random_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123
```

### 4. Create Tables & Seed Data

```bash
cd backend
python seed.py
```

This will:
- Create all database tables
- Create the admin account
- Seed demo rooms, customers, bookings, feedback, sentiment results, and themes

### 5. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`

### 6. Start the Frontend

```bash
cd ..   # back to project root
npm install
npm run dev
```

Frontend will be at: `http://localhost:5173`

---

## API Documentation

After starting the backend:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Demo Accounts

> ⚠️ Development only — never use in production

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | admin123 |
| Customer | alice@example.com | password123 |
| Customer | bob@example.com | password123 |
| Customer | charlie@example.com | password123 |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/customer/register` | Customer registration |
| POST | `/api/auth/customer/login` | Customer login |
| POST | `/api/auth/admin/login` | Admin login |

### Rooms
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/rooms` | Public |
| GET | `/api/rooms/{id}` | Public |
| POST | `/api/admin/rooms` | Admin |
| PUT | `/api/admin/rooms/{id}` | Admin |
| DELETE | `/api/admin/rooms/{id}` | Admin |

### Bookings
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/my` | Customer |
| GET | `/api/admin/bookings` | Admin |
| PUT | `/api/admin/bookings/{id}/status` | Admin |
| DELETE | `/api/admin/bookings/{id}` | Admin |

### Feedback
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/feedback` | Customer |
| GET | `/api/feedback/my` | Customer |
| GET | `/api/admin/feedback` | Admin |
| DELETE | `/api/admin/feedback/{id}` | Admin |

### Pricing
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/admin/pricing` | Admin |
| POST | `/api/admin/pricing/generate` | Admin |
| PUT | `/api/admin/pricing/{id}/approve` | Admin |
| PUT | `/api/admin/pricing/{id}/reject` | Admin |

### Analytics & Reports
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/admin/dashboard` | Admin |
| GET | `/api/admin/analytics/sentiment` | Admin |
| GET | `/api/admin/analytics/feedback` | Admin |
| GET | `/api/admin/analytics/themes` | Admin |
| GET | `/api/admin/analytics/bookings` | Admin |
| GET | `/api/admin/analytics/rooms` | Admin |
| GET | `/api/admin/reports/feedback` | Admin |
| GET | `/api/admin/reports/bookings` | Admin |
| GET | `/api/admin/reports/pricing` | Admin |

---

## AI/ML Implementation

### Sentiment Analysis (`ml/sentiment_model.py`)

**Algorithm**: Rule-based v1 using star-rating + TextBlob polarity

| Input | Processing |
|-------|------------|
| Star rating (1-5) | Primary classification signal |
| Review text | TextBlob polarity for confidence adjustment |
| Category | Theme extraction seed |

**Output**: Positive / Neutral / Negative + confidence score (0–1)

```
Rating 4-5 → Positive  (base confidence: 0.82–0.97)
Rating 3   → Neutral   (base confidence: 0.75)
Rating 1-2 → Negative  (base confidence: 0.85–0.96)
TextBlob polarity adjusts confidence by ±0.05
```

**Theme Extraction**: Keyword scanning across 8 predefined categories:
- Room Cleanliness, Staff Service, Room Comfort, Facilities
- Food and Dining, Pricing, Booking Experience, Location

> A trained ML model (BERT/RoBERTa) can replace `classify_sentiment()` without changing any API surface.

### Dynamic Pricing (`ml/pricing_model.py`)

**Algorithm**: Rule-based demand-supply analysis v1

| Input | Source |
|-------|--------|
| Current room price | Database |
| Bookings last 30 days | Database query |
| Available rooms same type | Database query |

**Decision table**:

| Demand | Availability | Adjustment |
|--------|-------------|------------|
| High | Limited | +18% |
| High | Normal | +8% |
| High | High | 0% |
| Moderate | Limited | +5% |
| Moderate | Normal/High | 0% |
| Low | Normal | -7% |
| Low | High | -12% |

> **IMPORTANT**: Approval NEVER auto-changes `rooms.current_price`. Admin must explicitly update the price as a separate action.

---

## Database Schema

```
users
 ├── id, first_name, last_name, email, password_hash
 ├── role (customer/admin/superadmin), is_active
 └── created_at, updated_at

rooms
 ├── id, name, type, description
 ├── base_price, current_price, capacity
 ├── availability_status, amenities, image_url
 └── created_at, updated_at

bookings
 ├── id, booking_reference, user_id → users, room_id → rooms
 ├── check_in, check_out, number_of_guests
 ├── booking_amount, status
 └── created_at, updated_at

feedback
 ├── id, user_id → users, booking_id → bookings
 ├── rating, feedback_text, category
 └── created_at → triggers → sentiment_results + feedback_themes

sentiment_results
 ├── id, feedback_id → feedback (1:1)
 ├── sentiment, confidence_score, model_version
 └── analyzed_at

feedback_themes
 ├── id, feedback_id → feedback (many)
 └── theme

pricing_recommendations
 ├── id, room_id → rooms
 ├── current_price, recommended_price, price_difference
 ├── demand_level, availability_level, recommendation_reason
 ├── status (pending/approved/rejected)
 ├── generated_at, reviewed_at, reviewed_by_id → users
```

---

## Known Limitations

1. **Sentiment Model**: Rule-based v1. Not a trained ML model. Accuracy is limited. A fine-tuned BERT model can replace it by updating `ml/sentiment_model.py` only.

2. **Pricing Model**: Rule-based v1 based on a demand-supply heuristic. No historical training data. Appropriate for the available dataset size.

3. **No Email Verification**: Registration is immediate without email confirmation.

4. **No Real-time Updates**: Polling or manual refresh required to see new data.

5. **PostgreSQL Required**: Must be installed locally. No fallback to SQLite.

6. **Frontend Integration Pending**: Frontend still uses localStorage. Connect using the `src/services/api/` files after backend is confirmed working.
