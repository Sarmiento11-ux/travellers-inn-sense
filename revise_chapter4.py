import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import shutil
import os

# We read from the unlocked file (which has identical content)
SRC_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'
DST_DOCX_REV = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DST_DOCX_NEW = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised_NEW.docx'

doc = Document(SRC_DOCX)

# ── 1. CLEAN UP EXISTING CHAPTER IV PARAGRAPHS (INDEX 306+) ──────────
body = doc._body._element
to_remove = [p._p for p in doc.paragraphs[306:]]
for el in to_remove:
    body.remove(el)

print(f"Truncated document back to {len(doc.paragraphs)} paragraphs.")

# ── 2. HELPER FUNCTIONS ──────────────────────────────────────────────
def add_body_para(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.size = Pt(12)
    return p

def add_heading_1(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(12)
    pf.space_after = Pt(6)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.bold = True
    run.font.size = Pt(12)
    return p

def add_heading_2(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(10)
    pf.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.bold = True
    run.font.size = Pt(12)
    return p

def add_heading_3(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(8)
    pf.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.bold = True
    run.font.size = Pt(12)
    return p

def add_image_placeholder(label, route=""):
    """
    Renders a dedicated, centered, highly visible box for pasting/inserting the image.
    Format specified by user: Image/Placeholder FIRST -> Figure Caption -> Description.
    """
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(10)
    pf.space_after = Pt(4)
    
    sub_text = f" ({route})" if route else ""
    run = p.add_run(f"[ INSERT SCREENSHOT HERE: {label}{sub_text} ]")
    run.font.name = 'Courier New'
    run.font.size = Pt(11)
    run.bold = True
    run.italic = True
    run.font.color.rgb = RGBColor(90, 100, 120)
    return p

def add_figure_caption(fig_num, caption_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.line_spacing = Pt(18)
    pf.space_before = Pt(2)
    pf.space_after = Pt(6)
    run = p.add_run(f"Figure {fig_num}. {caption_text}")
    run.font.name = 'Courier New'
    run.font.size = Pt(11)
    run.italic = True
    return p

# ── 3. WRITE REVISED CHAPTER IV ──────────────────────────────────────
doc.add_page_break()

add_heading_1("IV.  RESULTS AND DISCUSSION")

add_body_para(
    "This chapter presents the results of the design, development, and implementation "
    "of Travellers Inn Sense. It showcases the actual system outputs, user interfaces, "
    "and core functionalities across both the customer-facing portal and the "
    "administrative management modules. Furthermore, this section discusses how the "
    "integrated features—including automated NLP sentiment analysis, dynamic pricing "
    "recommendations, front desk operational workflows, and self-service guest capabilities—"
    "address the operational challenges of Travellers Inn and fulfill the functional "
    "and non-functional requirements established in the study."
)

add_heading_2("1.  Presentation of System Output")

add_body_para(
    "This section presents the actual graphical user interface (GUI) outputs and "
    "operational screens of the Travellers Inn Sense system. In accordance with the "
    "prescribed format, each feature is presented with its system screenshot, followed "
    "immediately by its formal figure label and caption, and accompanied by a comprehensive "
    "narrative explaining the visual layout, interactive controls, and backend operational "
    "behavior in direct alignment with the system's functional requirements (FR-C01 to FR-C12 "
    "and FR-A01 to FR-A14)."
)

# ═════════════════════════════════════════════════════════════════════
# A. AUTHENTICATION MODULE
# ═════════════════════════════════════════════════════════════════════
add_heading_2("A.  Authentication Module")

# A.1 Customer Login
add_heading_3("A.1  Customer Authentication Page (FR-C04)")
add_image_placeholder("Customer Login Page", "/login")
add_figure_caption("10", "Customer Login Interface of Travellers Inn Sense")
add_body_para(
    "Figure 10 presents the Customer Login Interface. The page features a minimalist, "
    "centered authentication card adorned with the Travellers Inn brand logo, clear header typography, "
    "input fields for registered email address and password (equipped with a visibility toggle icon), "
    "a direct link to account registration, and a prominent 'Sign in' action button. Functionally, "
    "the interface captures user credentials and submits them via an asynchronous POST request "
    "to the FastAPI backend endpoint (/api/v1/auth/customer/login). Upon verification against "
    "the users table, the backend generates a signed JSON Web Token (JWT) encapsulating the "
    "user's identity and role, which is securely stored in local client state. In case of invalid "
    "credentials, a descriptive inline alert banner is rendered to notify the user, fulfilling FR-C04."
)

# A.2 Customer Registration
add_heading_3("A.2  Customer Account Registration Page (FR-C03)")
add_image_placeholder("Customer Registration Page", "/register")
add_figure_caption("11", "Customer Registration Interface of Travellers Inn Sense")
add_body_para(
    "Figure 11 displays the Customer Account Registration Interface. The screen is designed "
    "to facilitate rapid guest onboarding by presenting a clean input form requesting the guest's "
    "first name, last name, active email address, contact phone number, and account password. "
    "Interactive client-side validation guarantees that all required fields are populated and that "
    "the email syntax complies with standard formats prior to submission. Upon form submission, the data "
    "is processed by the backend (/api/v1/auth/register), where password hashing is executed using the "
    "bcrypt algorithm. If the submitted email already exists in the database, the system halts execution "
    "and presents a duplicate warning. Upon successful registration, the guest record is committed "
    "to the users table with default role privileges ('customer'), satisfying FR-C03."
)

# A.3 Admin Login
add_heading_3("A.3  Administrator Login Page (FR-A01)")
add_image_placeholder("Administrator Login Page", "/admin/login")
add_figure_caption("12", "Administrator Login Interface of Travellers Inn Sense")
add_body_para(
    "Figure 12 illustrates the Administrator Login Interface, located on a dedicated administrative "
    "route (/admin/login) strictly separated from public guest access. The visual styling features "
    "a distinct professional enterprise theme to reinforce administrative context. The page enforces "
    "role-based access control (RBAC): upon credential submission, the backend verifies that the "
    "authenticated user possesses either an 'admin' or 'superadmin' role attribute. Non-administrative "
    "credentials attempting entry via this portal are immediately rejected with an HTTP 403 Forbidden status. "
    "Successful authentication yields an administrative JWT token, unlocking navigation into the "
    "executive suite and satisfying FR-A01."
)

# ═════════════════════════════════════════════════════════════════════
# B. CUSTOMER MODULE
# ═════════════════════════════════════════════════════════════════════
add_heading_2("B.  Customer Module")

# B.1 Home / Landing Page
add_heading_3("B.1  Customer Landing & Home Page (FR-C01)")
add_image_placeholder("Customer Landing Page", "/")
add_figure_caption("13", "Home and Landing Interface of Travellers Inn Sense")
add_body_para(
    "Figure 13 illustrates the public Home and Landing Interface of Travellers Inn Sense. The page "
    "is structured with an immersive hero banner featuring dynamic hotel branding fetched from "
    "global system configuration, a welcoming tagline, and an immediate 'Explore Rooms' call-to-action button. "
    "Directly beneath the hero banner, a 'Featured Rooms' section dynamically queries the room inventory "
    "via the backend API, presenting responsive accommodation cards with authentic imagery, guest capacity, "
    "per-night pricing in the configured currency, and an exploratory 'View Details' link. This landing page "
    "serves as the primary engagement portal for prospective and returning visitors, fulfilling FR-C01."
)

# B.2 Room Catalog & Filter
add_heading_3("B.2  Room Catalog & Dynamic Filter Interface (FR-C01, FR-C02)")
add_image_placeholder("Room Catalog and Filter Interface", "/rooms")
add_figure_caption("14", "Room Catalog with Multi-Filter Interface")
add_body_para(
    "Figure 14 depicts the comprehensive Room Catalog Interface. The interface contains an interactive "
    "search bar and dynamic filtering tools enabling guests to filter accommodations by room category "
    "(Standard, Deluxe, Suite, Family), guest capacity thresholds, price ranges, and real-time availability. "
    "Each room card showcases high-resolution imagery, room title, bed configuration, maximum occupancy, "
    "an 'available' or 'maintenance' status tag, and formatted pricing per night. Users can dynamically "
    "sort listings by price (ascending or descending) or filter exclusively for currently vacant rooms. "
    "Clicking on any card seamlessly transitions the guest to the room reservation workflow, satisfying "
    "FR-C01 (Catalog Browsing) and FR-C02 (Room Filtering and Sorting)."
)

# B.3 Room Details & Booking Modal
add_heading_3("B.3  Room Details & Reservation Booking Interface (FR-C05)")
add_image_placeholder("Room Details Page with Reservation Booking Modal", "/rooms/:id")
add_figure_caption("15", "Room Details Interface and Inline Reservation Modal")
add_body_para(
    "Figure 15 showcases the Room Details Interface and the embedded Reservation Booking Modal. "
    "The main page presents an expanded photographic gallery, detailed description of amenities "
    "(e.g., Wi-Fi, air conditioning, private bath, smart television), occupancy guidelines, and pricing. "
    "Triggering the 'Reserve Now' button activates an interactive booking modal wherein guests select "
    "their intended check-in and check-out dates and declare total guest count. The interface enforces "
    "business constraints in real time, preventing past-date selections and ensuring check-out occurs after "
    "check-in. The system automatically computes total duration and gross booking amount. Payment is formally "
    "designated as 'Pay at Front Desk' upon arrival. Confirming the booking generates an immutable "
    "booking reference (BKG-XXXXXX) persisted in the bookings table, satisfying FR-C05."
)

# B.4 Customer Dashboard Overview
add_heading_3("B.4  Customer Dashboard Overview (FR-C06)")
add_image_placeholder("Customer Dashboard Overview", "/customer/dashboard")
add_figure_caption("16", "Customer Dashboard Overview Interface")
add_body_para(
    "Figure 16 illustrates the Customer Dashboard Overview Interface, serving as the central "
    "management cockpit for registered guests. The interface organizes account operations into clear "
    "navigation tabs: Overview, My Bookings, Browse Rooms, Submit Feedback, and My Profile. The Overview "
    "tab highlights active stay indicators, quick navigation shortcuts, upcoming reservation summaries, "
    "and real-time notifications regarding stay status. Authenticated state is monitored to ensure "
    "guests only access their own reservation records, maintaining strict privacy compliance and satisfying FR-C06."
)

# B.5 Customer Booking History & Self-Service Lifecycle Actions
add_heading_3("B.5  Customer Booking History & Self-Service Lifecycle Actions (FR-C06, FR-C10, FR-C11, FR-C12)")
add_image_placeholder("Customer Booking History with Self-Service Action Controls", "/customer/dashboard (Bookings)")
add_figure_caption("17", "Booking History with Self-Service Stay Extension, Early Checkout, and Cancellation Controls")
add_body_para(
    "Figure 17 presents the Customer Booking History and Self-Service Lifecycle Interface. "
    "The screen displays all historical and current reservations in chronological cards, detailing "
    "the booking reference, room name, date duration, guest count, total cost, and status badges "
    "(confirmed, checked_in, completed, cancelled). Critically, this interface hosts three proprietary "
    "guest self-service controls: (1) Stay Extension (FR-C10), allowing guests in confirmed or active stays "
    "to extend their check-out date subject to room availability; (2) Anytime Early Checkout (FR-C11), "
    "enabling checked-in guests to conclude their stay ahead of schedule directly from the portal; and "
    "(3) Customer-Exclusive Reservation Cancellation (FR-C12), providing a secure, two-step confirmation dialog "
    "that releases room inventory exclusively upon the customer's request. These capabilities guarantee "
    "guest sovereignty over their stay lifecycle."
)

# B.6 Customer Profile Management
add_heading_3("B.6  Customer Profile Management Interface (FR-C09)")
add_image_placeholder("Customer Profile Management Interface", "/customer/dashboard (Profile)")
add_figure_caption("18", "Customer Profile Management Interface")
add_body_para(
    "Figure 18 illustrates the Customer Profile Management Interface. Guests can view their current "
    "account details (registered name, email address, contact number, account creation date) and toggle "
    "an inline editing mode. The form permits updates to personal information and password changes, with "
    "backend cryptographic re-hashing upon submission. Profile modifications are immediately synchronized "
    "across all active session views without requiring account re-login, satisfying FR-C09."
)

# B.7 Feedback Submission & NLP Ingestion
add_heading_3("B.7  Guest Feedback Submission & Rating Interface (FR-C07, FR-C08)")
add_image_placeholder("Guest Feedback Submission Form", "/customer/dashboard (Feedback)")
add_figure_caption("19", "Guest Feedback Submission and Interactive Star Rating Interface")
add_body_para(
    "Figure 19 displays the Guest Feedback Submission Interface. Following a completed stay, guests "
    "are invited to submit qualitative and quantitative reviews. The interface provides an interactive "
    "5-star rating selector, a category dropdown (Room Cleanliness, Staff Service, Amenities, Food & Dining, "
    "or General), and an expansive text area for written comments. Upon clicking 'Submit Review', the "
    "system commits the record to the feedback table (FR-C07) and immediately initiates an automated "
    "pipeline trigger to the backend NLP sentiment analyzer (FR-C08), which scores the text for polarity "
    "(Positive, Neutral, Negative) and thematic concerns without requiring administrator intervention."
)

# ═════════════════════════════════════════════════════════════════════
# C. ADMINISTRATOR MODULE
# ═════════════════════════════════════════════════════════════════════
add_heading_2("C.  Administrator Module")

# C.1 Admin Dashboard
add_heading_3("C.1  Administrator Executive Dashboard (FR-A02, FR-A04)")
add_image_placeholder("Administrator Executive Dashboard", "/admin/dashboard")
add_figure_caption("20", "Administrator Executive Dashboard with KPI Cards and Analytical Visualizations")
add_body_para(
    "Figure 20 depicts the Administrator Executive Dashboard, the primary command center for hotel "
    "management. The top tier features high-level KPI cards displaying Total Feedback count, Positive "
    "Sentiment total, Neutral Sentiment total, and Negative Sentiment total with distinctive chromatic coding. "
    "The middle tier renders an interactive Recharts Pie Chart demonstrating overall sentiment polarity "
    "distribution alongside a Bar Chart itemizing feedback frequency across operational categories "
    "(Cleanliness, Staff, Amenities). The lower tier lists real-time incoming reviews. This consolidated "
    "view empowers management to instantly assess guest satisfaction and operational health, fulfilling "
    "FR-A02 and FR-A04."
)

# C.2 Feedback Management
add_heading_3("C.2  Guest Feedback Management & Review Inspection (FR-A03)")
add_image_placeholder("Guest Feedback Management Table", "/admin/feedback")
add_figure_caption("21", "Guest Feedback Management Interface with Sentiment Annotations")
add_body_para(
    "Figure 21 showcases the Guest Feedback Management Interface. This table presents every submitted "
    "guest review chronologically, detailing the guest name, room occupied, numerical star rating, "
    "operational category, full written comment, submission timestamp, and the AI-computed sentiment badge "
    "(Positive in green, Neutral in amber, Negative in red) along with the model's confidence score. "
    "Administrators can filter feedback by category, rating, or sentiment polarity, enabling focused "
    "investigations into customer grievances or exemplary staff recognition, fulfilling FR-A03."
)

# C.3 AI/NLP Sentiment Analytics
add_heading_3("C.3  AI/NLP Sentiment Analytics & Thematic Service Concern Visualization (FR-A04, FR-A05)")
add_image_placeholder("AI Sentiment Analytics and Thematic Analysis Interface", "/admin/sentiment")
add_figure_caption("22", "AI/NLP Sentiment Analytics and Thematic Service Concern Visualization Interface")
add_body_para(
    "Figure 22 presents the dedicated AI/NLP Sentiment Analytics Interface. Moving beyond summary KPIs, "
    "this screen provides in-depth natural language processing analytics. It displays a prominent "
    "positive-sentiment index percentage, an expanded multi-dimensional sentiment breakdown, and an "
    "automated 'Thematic Service Concerns' matrix (FR-A05) that aggregates common keywords and service "
    "deficiencies extracted from negative and neutral comments (e.g., air conditioning noise, water pressure, "
    "check-in delays). An interactive 'Re-analyze' control allows administrators to batch-reprocess "
    "historical comments through updated NLP model weights, fulfilling FR-A04 and FR-A05."
)

# C.4 Front Desk Booking & Stay Lifecycle
add_heading_3("C.4  Front Desk Booking & Stay Lifecycle Management (FR-A06)")
add_image_placeholder("Front Desk Booking Management Interface", "/admin/bookings")
add_figure_caption("23", "Front Desk Booking and Stay Lifecycle Management Interface")
add_body_para(
    "Figure 23 displays the Front Desk Booking Management Interface. Designed specifically for front desk "
    "personnel, the interface lists all hotel reservations with search and status-filtering tabs (All, "
    "Confirmed, Checked-In, Completed, Cancelled). Front desk clerks execute stay lifecycle transitions "
    "directly from each row: checking in arriving guests ('Check In'), recording in-person cash settlement "
    "('Pay at Front Desk' updating payment_status to 'paid'), and processing guest departures ('Check Out'). "
    "Executing a check-out automatically transitions the booking to 'completed' and triggers downstream "
    "housekeeping sanitation alerts, fulfilling FR-A06."
)

# C.5 Official E-Receipt & Guest Pass
add_heading_3("C.5  Front Desk Official E-Receipt & Guest Pass Generation (FR-A11)")
add_image_placeholder("Official E-Receipt and Guest Pass Print Preview / Modal", "/admin/bookings (Receipt)")
add_figure_caption("24", "Front Desk Official E-Receipt and Hotel Guest Pass Generation Interface")
add_body_para(
    "Figure 24 illustrates the Official E-Receipt and Guest Pass Generation Interface. Upon completion "
    "of a stay or upon guest check-in request, front desk staff can generate an official branded folio. "
    "The rendered document incorporates the Travellers Inn official header, unique booking reference number, "
    "guest name, contact details, assigned room number and category, verified check-in and check-out dates, "
    "itemized pricing breakdown, payment settlement method ('Cash at Front Desk'), and administrative signature "
    "blocks. The document is formatted for direct thermal or standard printer output and can be exported as "
    "a digital PDF, fulfilling FR-A11."
)

# C.6 Room Catalog & Housekeeping
add_heading_3("C.6  Room Catalog & Housekeeping Sanitation Management (FR-A07, FR-A12)")
add_image_placeholder("Room Management & Housekeeping Interface", "/admin/rooms")
add_figure_caption("25", "Room Inventory and Housekeeping Sanitation Management Interface")
add_body_para(
    "Figure 25 presents the Room Catalog and Housekeeping Sanitation Management Interface. Administrators "
    "maintain full CRUD (Create, Read, Update, Delete) control over room records, with capabilities to add "
    "new rooms, edit base pricing, update capacity, and upload room photographs. Furthermore, the interface "
    "integrates the automated Housekeeping Sanitation Clearance Workflow (FR-A12): rooms vacated following "
    "guest check-out are automatically flagged with a yellow 'Under Maintenance / Needs Cleaning' status badge. "
    "Once housekeeping staff complete sanitation protocols, the administrator clicks the 'Linis na' "
    "(Mark as Cleaned) clearance action, safely transitioning the room back to green 'Available' status "
    "for public booking, fulfilling FR-A07 and FR-A12."
)

# C.7 Dynamic AI Pricing Review
add_heading_3("C.7  Dynamic AI Pricing Review & Approval Interface (FR-A08)")
add_image_placeholder("Dynamic AI Pricing Review Interface", "/admin/pricing")
add_figure_caption("26", "Dynamic AI Pricing Review and Human-in-the-Loop Decision Interface")
add_body_para(
    "Figure 26 depicts the Dynamic AI Pricing Review Interface. The system's machine learning model "
    "evaluates real-time room occupancy, historical booking velocity, seasonal demand trends, and feedback "
    "indices to compute recommended room rates. Rather than permitting unchecked automated price fluctuations, "
    "the interface enforces a mandatory human-in-the-loop safeguard: each recommendation is presented on an "
    "evaluative card displaying current price, suggested price, variance percentage, demand rating, and "
    "algorithmic rationale. Administrators evaluate recommendations and make explicit 'Approve' or 'Reject' "
    "decisions. Approved recommendations immediately update the live room catalog, whereas rejected proposals "
    "are logged without modifying customer pricing, fulfilling FR-A08."
)

# C.8 User Account Administration
add_heading_3("C.8  System User Account Administration Interface (FR-A09)")
add_image_placeholder("User Account Administration Interface", "/admin/users")
add_figure_caption("27", "System User Account Administration Interface")
add_body_para(
    "Figure 27 illustrates the System User Account Administration Interface, accessible exclusively to "
    "authorized administrators. The table lists all registered accounts across the system, detailing user ID, "
    "full legal name, email address, contact number, assigned security role (Customer, Administrator, "
    "Superadmin), account activity status, and registration timestamp. Administrators can filter by role, "
    "elevate or revoke staff permissions, deactivate suspicious accounts, and reset credentials. All security "
    "modifications are verified by backend authorization checks before execution, satisfying FR-A09."
)

# C.9 Analytics Dashboard
add_heading_3("C.9  Analytics Dashboard & Operational Trend Analysis (FR-A14)")
add_image_placeholder("Analytics Dashboard Interface", "/admin/analytics")
add_figure_caption("28", "Comprehensive Analytics Dashboard with Historical Trend Visualizations")
add_body_para(
    "Figure 28 showcases the Comprehensive Analytics Dashboard. This module delivers macro-level business "
    "intelligence through interactive analytical charts. Management can inspect multi-period booking volume "
    "curves, room occupancy ratios across accommodation types, monthly revenue trajectories, and long-term "
    "sentiment trajectories. Timeframe filtering (7-day, 30-day, year-to-date) enables strategic pattern "
    "recognition, helping hotel management evaluate promotional success, staff performance, and seasonal "
    "demand shifts, satisfying FR-A14."
)

# C.10 Executive Reporting & Data Export
add_heading_3("C.10  Executive Reporting & CSV Data Export Interface (FR-A10)")
add_image_placeholder("Executive Reporting and Data Export Interface", "/admin/reports")
add_figure_caption("29", "Executive Reporting and Tabular Data Export Interface")
add_body_para(
    "Figure 29 presents the Executive Reporting and Data Export Interface. The module allows hotel management "
    "to generate formal administrative reports on booking ledgers, revenue audits, housekeeping logs, and "
    "guest feedback histories. Users select customized reporting parameters, including date boundaries "
    "and transaction categories. The system generates on-screen tabular summaries and provides one-click "
    "'Export to CSV' functionality, producing standardized spreadsheet files suitable for accounting audits, "
    "executive stakeholder presentations, and archival preservation, fulfilling FR-A10."
)

# C.11 Hotel Settings & Configuration
add_heading_3("C.11  Hotel Settings & Global Configuration Interface (FR-A13)")
add_image_placeholder("Hotel Settings and Global Configuration Interface", "/admin/settings")
add_figure_caption("30", "Hotel Settings and Global System Configuration Interface")
add_body_para(
    "Figure 30 displays the Hotel Settings and Global Configuration Interface. This control panel enables "
    "superadministrators to configure global enterprise attributes without altering underlying source code. "
    "Configurable parameters include the legal hotel name, primary contact email, telephone numbers, "
    "physical address, active operating timezone, default currency selector (Philippine Peso ₱, US Dollar $, "
    "Euro €), and an automated AI pricing algorithm toggle. Changes saved in this interface are committed "
    "to persistent application settings and instantaneously cascade throughout both customer and administrator "
    "interfaces, fulfilling FR-A13."
)

# ── 4. SAVE AND SYNC ──────────────────────────────────────────────────
doc.save(SRC_DOCX)
print(f"Successfully saved revised manuscript to: {SRC_DOCX}")

doc.save(DST_DOCX_NEW)
print(f"Successfully saved safety copy to: {DST_DOCX_NEW}")

try:
    shutil.copy2(SRC_DOCX, DST_DOCX_REV)
    print(f"Successfully synchronized to: {DST_DOCX_REV}")
except Exception as e:
    print(f"Note: {DST_DOCX_REV} is currently open in Word. Close Word to overwrite it with NEW.")
