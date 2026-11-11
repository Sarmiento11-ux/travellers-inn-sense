import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy, shutil

DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DST  = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'

doc = Document(DOCX)

# ─── STYLE HELPER ────────────────────────────────────────────────────────────
def styled_para(text, bold=False, italic=False, font_size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, color=None):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(0)
    pf.space_after  = Pt(0)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.size = Pt(font_size)
    run.bold   = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)
    return p

def heading_para(text, level=1):
    """Level 1 = Chapter heading, Level 2 = section, Level 3 = subsection"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(6)
    pf.space_after  = Pt(6)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.bold = True
    run.font.size = Pt(12)
    return p

def placeholder_para(label):
    """Gray placeholder paragraph for screenshot insertion."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(6)
    pf.space_after  = Pt(6)
    run = p.add_run(f'[INSERT SCREENSHOT: {label}]')
    run.font.name = 'Courier New'
    run.font.size = Pt(10)
    run.italic = True
    run.font.color.rgb = RGBColor(150, 150, 150)
    return p

def figure_caption(fig_num, caption_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(3)
    pf.space_after  = Pt(10)
    run = p.add_run(f'Figure {fig_num}. {caption_text}')
    run.font.name = 'Courier New'
    run.font.size = Pt(11)
    run.italic = True
    return p

def blank():
    return styled_para('')

# ─────────────────────────────────────────────────────────────────────────────
# BEGIN INSERTING SECTION
# ─────────────────────────────────────────────────────────────────────────────

doc.add_page_break()

# IV. RESULTS AND DISCUSSION
heading_para('IV.  RESULTS AND DISCUSSION')
blank()

# 1. Presentation of System Output
heading_para('1.  Presentation of System Output')
blank()

styled_para(
    'This section presents the actual graphical user interface (GUI) outputs '
    'of the Travellers Inn Sense system. Each module is illustrated through '
    'annotated screenshots that correspond directly to the functional '
    'requirements (FR-C01 to FR-C12 and FR-A01 to FR-A14) defined in the '
    'system specification. The screenshots demonstrate how the system fulfills '
    'each identified requirement in practice.',
)
blank()

# ─── A. AUTHENTICATION MODULE ────────────────────────────────────────────────
heading_para('A.  Authentication Module')
blank()

# A.1 Customer Login
heading_para('A.1  Customer Login Page (FR-C04)')
blank()
styled_para(
    'Figure 10 shows the Customer Login Page of Travellers Inn Sense. The '
    'interface presents a centered card layout bearing the hotel logo icon, '
    'an email address field, and a password field with a show/hide toggle. '
    'Upon submission of valid credentials, the system authenticates the '
    'customer via a JSON Web Token (JWT) issued by the FastAPI backend and '
    'redirects the user to the Customer Dashboard. An inline error banner '
    'is displayed if the credentials are incorrect, preventing unauthorized '
    'access and satisfying FR-C04.'
)
blank()
placeholder_para('Customer Login Page — /login')
figure_caption(10, 'Customer Login Page of Travellers Inn Sense')
blank()

# A.2 Customer Registration
heading_para('A.2  Customer Registration Page (FR-C03)')
blank()
styled_para(
    'Figure 11 illustrates the Customer Registration Page. New guests are '
    'required to provide their first name, last name, a valid email address, '
    'and a password to create an account. The backend validates that the '
    'email is unique before persisting the record to the users table. '
    'Upon successful registration, the system redirects the user to the '
    'login page, addressing FR-C03.'
)
blank()
placeholder_para('Customer Registration Page — /register')
figure_caption(11, 'Customer Registration Page of Travellers Inn Sense')
blank()

# A.3 Admin Login
heading_para('A.3  Administrator Login Page (FR-A01)')
blank()
styled_para(
    'Figure 12 presents the Administrator Login Page, which is accessed '
    'through a separate protected route (/admin/login). The page layout '
    'is visually differentiated from the customer login to clearly indicate '
    'the administrative context. Only accounts with a role of admin or '
    'superadmin are granted access. The system issues a role-scoped JWT '
    'upon successful authentication, fulfilling FR-A01.'
)
blank()
placeholder_para('Admin Login Page — /admin/login')
figure_caption(12, 'Administrator Login Page of Travellers Inn Sense')
blank()

# ─── B. CUSTOMER MODULE ───────────────────────────────────────────────────────
heading_para('B.  Customer Module')
blank()

# B.1 Home / Landing Page
heading_para('B.1  Home / Landing Page (FR-C01)')
blank()
styled_para(
    'Figure 13 displays the Home Page that serves as the entry point for '
    'guest users. The page features a full-viewport hero section with a '
    'high-quality hotel image background, the hotel name rendered dynamically '
    'from system settings, and an Explore Rooms call-to-action button. '
    'Below the hero, three featured rooms are loaded from the backend and '
    'presented in a responsive card grid, each displaying the room name, '
    'description, maximum capacity, price per night, and a View Details link. '
    'This module satisfies FR-C01 (Browse Room Catalog).'
)
blank()
placeholder_para('Home / Landing Page — /')
figure_caption(13, 'Home Landing Page of Travellers Inn Sense')
blank()

# B.2 Rooms Catalog
heading_para('B.2  Room Catalog & Filter Page (FR-C01, FR-C02)')
blank()
styled_para(
    'Figure 14 shows the Room Catalog Page, which lists all available hotel '
    'rooms retrieved from the backend API. Each room card displays the room '
    'image, name, type classification (Standard, Deluxe, Suite), bed '
    'configuration, maximum guest capacity, price per night, and availability '
    'status badge. Guests may apply filters by room type and sort by price, '
    'addressing FR-C02 (Filter and Sort Rooms). Selecting a room card '
    'navigates the user to the Room Details page for reservation.'
)
blank()
placeholder_para('Room Catalog Page — /rooms')
figure_caption(14, 'Room Catalog and Filter Page of Travellers Inn Sense')
blank()

# B.3 Room Details & Booking
heading_para('B.3  Room Details & Booking Modal (FR-C05)')
blank()
styled_para(
    'Figure 15 presents the Room Details Page, which provides a comprehensive '
    'view of an individual room including a high-resolution image, full '
    'description, listed amenities, capacity, and the current dynamic price '
    'per night. A Reserve Now button triggers an inline booking modal that '
    'allows the guest to specify the check-in date, check-out date, and '
    'number of guests. The system validates that the check-out date is after '
    'the check-in date and computes the total booking amount automatically. '
    'Upon confirmation, a unique booking reference (BKG-XXXXXX) is generated '
    'and persisted to the database, satisfying FR-C05 '
    '(Room Reservation / Online Booking). Payment is settled at the front '
    'desk upon check-in.'
)
blank()
placeholder_para('Room Details Page & Booking Modal — /rooms/{id}')
figure_caption(15, 'Room Details Page and Booking Modal of Travellers Inn Sense')
blank()

# B.4 Customer Dashboard
heading_para('B.4  Customer Dashboard (FR-C06, FR-C09, FR-C10, FR-C11, FR-C12)')
blank()
styled_para(
    'Figure 16 illustrates the Customer Dashboard, which is the central hub '
    'for authenticated guests. The dashboard is organized into tabbed '
    'sections: Overview, My Bookings, Browse Rooms, Submit Feedback, and '
    'My Profile. The Overview tab displays a summary of active and past '
    'bookings. The My Bookings tab (Figure 16a) presents the complete '
    'booking history with each record showing the booking reference, room '
    'name, check-in and check-out dates, number of guests, total amount, '
    'and current status badge (confirmed, checked-in, completed, or '
    'cancelled). From this view, customers with confirmed bookings may '
    'request a stay extension (FR-C10), perform an early checkout at any '
    'time (FR-C11), or cancel their reservation exclusively (FR-C12). '
    'These self-service lifecycle actions are managed through dedicated '
    'action buttons on each booking card.'
)
blank()
placeholder_para('Customer Dashboard — Overview Tab')
figure_caption(16, 'Customer Dashboard Overview of Travellers Inn Sense')
blank()
placeholder_para('Customer Dashboard — My Bookings Tab (with Cancel / Extend / Checkout buttons)')
figure_caption('16a', 'Customer Booking History and Self-Service Actions')
blank()

# B.5 Profile Management
heading_para('B.5  Customer Profile Management (FR-C09)')
blank()
styled_para(
    'Figure 17 shows the My Profile tab within the Customer Dashboard. '
    'Guests may update their first name, last name, and change their '
    'password through a dedicated profile edit form. Changes are submitted '
    'to the backend API and reflected immediately across the interface, '
    'satisfying FR-C09 (Customer Profile Management).'
)
blank()
placeholder_para('Customer Profile Management — My Profile Tab')
figure_caption(17, 'Customer Profile Management Page of Travellers Inn Sense')
blank()

# B.6 Feedback Submission
heading_para('B.6  Guest Feedback Submission (FR-C07, FR-C08)')
blank()
styled_para(
    'Figure 18 presents the Submit Feedback tab within the Customer '
    'Dashboard. Authenticated guests may submit a service review by '
    'selecting a star rating (1 to 5), choosing a feedback category '
    '(Room Cleanliness, Staff Service, Amenities, Food and Dining, or '
    'General), and composing a written comment. Upon submission, the '
    'backend automatically routes the feedback text through the NLP '
    'sentiment analysis engine, which classifies the entry as Positive, '
    'Neutral, or Negative without manual intervention, fulfilling '
    'FR-C07 (Guest Feedback Submission) and FR-C08 '
    '(Automated Sentiment Ingestion).'
)
blank()
placeholder_para('Submit Feedback Form — Feedback Tab')
figure_caption(18, 'Guest Feedback Submission Form of Travellers Inn Sense')
blank()

# ─── C. ADMIN MODULE ──────────────────────────────────────────────────────────
heading_para('C.  Administrator Module')
blank()

# C.1 Admin Dashboard
heading_para('C.1  Admin Executive Dashboard (FR-A02, FR-A04)')
blank()
styled_para(
    'Figure 19 displays the Administrator Dashboard, the primary landing '
    'page after a successful admin login. The dashboard presents four '
    'key performance indicator (KPI) cards: Total Feedback received, '
    'Positive Feedback count, Neutral Feedback count, and Negative '
    'Feedback count. A sentiment distribution Pie Chart and a feedback '
    'category Bar Chart provide at-a-glance AI-driven analytics, '
    'satisfying FR-A02 (Executive Dashboard and KPI Overview) and '
    'FR-A04 (AI/NLP Sentiment Analytics Visualization). A list of recent '
    'feedback entries is displayed at the bottom of the dashboard.'
)
blank()
placeholder_para('Admin Dashboard with KPI cards, Pie Chart, and Bar Chart')
figure_caption(19, 'Administrator Executive Dashboard of Travellers Inn Sense')
blank()

# C.2 Feedback Management
heading_para('C.2  Guest Feedback Management (FR-A03)')
blank()
styled_para(
    'Figure 20 shows the Feedback Management page, where administrators '
    'can view all submitted guest reviews in a tabular format. Each entry '
    'displays the guest name, rating, feedback category, written comment, '
    'submission date, and the system-generated sentiment classification '
    '(Positive, Neutral, or Negative) with a corresponding confidence '
    'indicator. Administrators may inspect individual entries in detail '
    'to inform service quality decisions, satisfying FR-A03 '
    '(Guest Feedback Management).'
)
blank()
placeholder_para('Feedback Management Table with Sentiment Labels')
figure_caption(20, 'Guest Feedback Management Page of Travellers Inn Sense')
blank()

# C.3 Sentiment Analytics
heading_para('C.3  AI/NLP Sentiment Analytics (FR-A04, FR-A05)')
blank()
styled_para(
    'Figure 21 presents the dedicated Sentiment Analytics page, which '
    'provides a deeper visualization of the NLP analysis results beyond '
    'the main dashboard. The page features an interactive Pie Chart '
    'breaking down the sentiment distribution across all feedback records, '
    'a positive feedback percentage indicator, and a list of identified '
    'service themes (Room Cleanliness, Staff Service, Amenities, etc.) '
    'extracted from customer reviews. This view satisfies FR-A04 '
    '(AI/NLP Sentiment Analytics Visualization) and FR-A05 '
    '(Thematic Service Concern Analysis).'
)
blank()
placeholder_para('Sentiment Analytics Page — Pie Chart and Themes')
figure_caption(21, 'Sentiment Analytics Visualization Page of Travellers Inn Sense')
blank()

# C.4 Booking Management / Stay Lifecycle
heading_para('C.4  Front Desk Booking & Stay Lifecycle Management (FR-A06, FR-A11)')
blank()
styled_para(
    'Figure 22 illustrates the Booking Management page, which serves as '
    'the primary front desk operational interface. The page lists all '
    'reservation records with filters for status (confirmed, checked-in, '
    'completed, cancelled). Front desk staff may perform check-in and '
    'check-out operations by updating the booking status accordingly '
    '(FR-A06). Upon completing a stay, the system provides the option '
    'to generate an official e-receipt and hotel guest pass in PDF '
    'format for printing, fulfilling FR-A11 '
    '(Front Desk Official E-Receipt and Guest Pass Generation). '
    'Booking amount collection is handled in-person at the front desk.'
)
blank()
placeholder_para('Booking Management Table with Check-in / Check-out / Receipt buttons')
figure_caption(22, 'Front Desk Booking Management Page of Travellers Inn Sense')
blank()

# C.5 Room Management
heading_para('C.5  Room Catalog & Housekeeping Management (FR-A07, FR-A12)')
blank()
styled_para(
    'Figure 23 presents the Room Management page, which enables '
    'administrators to maintain the complete room catalog. The page '
    'displays all rooms in a filterable grid with search functionality. '
    'Each room card shows the room image, name, type, current price, '
    'capacity, and availability status badge. Administrators may add '
    'new rooms, edit existing room details, upload room images, and '
    'toggle the room status between available and maintenance mode '
    '(FR-A07). When a room is marked as checked-out or under maintenance, '
    'the housekeeping sanitation clearance workflow is triggered, '
    'allowing staff to log the room as cleaned and ready for the next '
    'guest (FR-A12).'
)
blank()
placeholder_para('Room Management Grid with Add / Edit / Toggle Status buttons')
figure_caption(23, 'Room Catalog and Housekeeping Management Page of Travellers Inn Sense')
blank()

# C.6 Dynamic Pricing
heading_para('C.6  Dynamic AI Pricing Review (FR-A08)')
blank()
styled_para(
    'Figure 24 shows the AI Pricing Recommendation page. The system '
    'employs a machine learning pricing model that analyzes current '
    'booking demand levels and room availability to generate price '
    'adjustment recommendations. Each recommendation card displays the '
    'room name, the current price, the AI-suggested price, the price '
    'difference, the demand level classification (High, Moderate, or '
    'Low), and the recommendation rationale. Administrators retain full '
    'decision authority — each recommendation must be explicitly approved '
    'or rejected before any price change takes effect in the system, '
    'satisfying FR-A08 (Dynamic AI Pricing Review) with a mandatory '
    'human-in-the-loop safeguard.'
)
blank()
placeholder_para('Pricing Recommendation Cards with Approve / Reject buttons')
figure_caption(24, 'Dynamic AI Pricing Review Page of Travellers Inn Sense')
blank()

# C.7 User Account Admin
heading_para('C.7  System User Account Administration (FR-A09)')
blank()
styled_para(
    'Figure 25 illustrates the User Administration page, accessible '
    'only to accounts with administrator or superadministrator privileges. '
    'The page displays a table of all registered user accounts, showing '
    'full name, email address, contact number, role classification, '
    'account status (active or inactive), and registration date. '
    'Administrators may activate, deactivate, or update user roles '
    'to maintain access control across the system, addressing '
    'FR-A09 (System User Account Administration).'
)
blank()
placeholder_para('User Management Table with Role and Status controls')
figure_caption(25, 'User Account Administration Page of Travellers Inn Sense')
blank()

# C.8 Analytics & Reports
heading_para('C.8  Analytics Dashboard & Executive Reporting (FR-A10, FR-A14)')
blank()
styled_para(
    'Figure 26 presents the Analytics and Executive Reporting pages. '
    'The Analytics module (FR-A14) provides visual summaries of booking '
    'trends, room occupancy rates, revenue performance, and feedback '
    'sentiment over configurable time periods through interactive '
    'charts. The Reports module (FR-A10) enables administrators to '
    'generate and export operational data in CSV format for external '
    'record-keeping, payroll processing, or regulatory compliance purposes.'
)
blank()
placeholder_para('Analytics Dashboard with Charts')
figure_caption(26, 'Analytics Dashboard of Travellers Inn Sense')
blank()
placeholder_para('Executive Reports Page with Export to CSV')
figure_caption('26a', 'Executive Reporting and Data Export Page of Travellers Inn Sense')
blank()

# C.9 Hotel Settings
heading_para('C.9  Hotel Settings & Global Configuration (FR-A13)')
blank()
styled_para(
    'Figure 27 shows the Hotel Settings page, which allows the '
    'administrator to configure global system parameters including '
    'the hotel name, contact email, physical address, display currency, '
    'and timezone. The AI-assisted pricing feature can also be enabled '
    'or disabled from this interface. All configuration values are '
    'persisted and applied system-wide in real time upon saving, '
    'satisfying FR-A13 (Hotel Settings and Global Configuration Management).'
)
blank()
placeholder_para('Hotel Settings Configuration Form')
figure_caption(27, 'Hotel Settings and Global Configuration Page of Travellers Inn Sense')
blank()

# Save
doc.save(DOCX)
print(f'Saved: {DOCX}')

# Sync
try:
    shutil.copy2(DOCX, DST)
    print(f'Synced: {DST}')
except PermissionError:
    print('LOCKED: Close Word first, then run sync_docx.py')
