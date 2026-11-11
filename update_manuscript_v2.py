import docx, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def fmt_run(run, size_pt=12, bold=False, italic=False):
    run.font.name = 'Courier New'
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic

def fmt_para(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing_pt=18, space_after_pt=6):
    p.alignment = align
    p.paragraph_format.line_spacing = Pt(line_spacing_pt)
    p.paragraph_format.space_after = Pt(space_after_pt)

def set_para_text(p, text, size_pt=12, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p.text = ''
    r = p.add_run(text)
    fmt_run(r, size_pt=size_pt, bold=bold, italic=italic)
    fmt_para(p, align=align)

def set_cell(cell, text, bold=False, italic=False, size_pt=10, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.line_spacing = Pt(13)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    fmt_run(r, size_pt=size_pt, bold=bold)

def add_row(table, cols, size_pt=10):
    row = table.add_row()
    for i, txt in enumerate(cols):
        set_cell(row.cells[i], txt, size_pt=size_pt)
    return row

def shade_row(row, hex_color='D9E1F2'):
    for cell in row.cells:
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), hex_color)
        tcPr.append(shd)

def insert_para_before(anchor_para, text, style_name='Normal', size_pt=12, bold=False,
                        align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing_pt=18, space_after_pt=6):
    new_p = anchor_para.insert_paragraph_before()
    new_p.style = anchor_para._element.getparent().getparent().get_element(
        './/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body'
    )
    set_para_text(new_p, text, size_pt=size_pt, bold=bold, align=align)
    fmt_para(new_p, align=align, line_spacing_pt=line_spacing_pt, space_after_pt=space_after_pt)
    return new_p

# ─────────────────────────────────────────
# STEP 1: UPDATE TABLE 2 — Customer FR (Table[5])
# ─────────────────────────────────────────
print("=== STEP 1: Updating Customer Functional Requirements ===")
t_cust = doc.tables[5]

# Header row shading
shade_row(t_cust.rows[0], 'D9E1F2')

# Update existing rows with complete, accurate descriptions
updates_cust = {
    1: ('FR-C01', 'Browse Room Catalog',
        'Guests can view all available rooms with photos, room type, capacity, amenities list, and dynamic pricing displayed in the configured hotel currency (PHP ₱, USD $, EUR €).'),
    2: ('FR-C02', 'Filter & Sort Rooms',
        'Guests can filter room listings by room type (Standard, Deluxe, Suite), guest capacity, price sort order (ascending/descending), and availability status in real time.'),
    3: ('FR-C03', 'Customer Registration',
        'New guests can self-register accounts providing full name, email address, and password. Credentials are validated and passwords are bcrypt-hashed before storage.'),
    4: ('FR-C04', 'Customer Authentication',
        'Registered guests can log in via secure JWT-authenticated sessions (HS256, 60-minute expiry). Authenticated state is maintained across tabs and page refreshes.'),
    5: ('FR-C05', 'Room Reservation / Online Booking',
        'Authenticated guests can book available rooms by selecting check-in date, check-out date, and guest count. Total stay cost is computed automatically (nights × room rate). Booking is recorded with default "Pay at Front Desk" payment method and "confirmed" status.'),
    6: ('FR-C06', 'Booking History & Status Tracking',
        'Guests can review all personal bookings with real-time lifecycle status display: Confirmed, Checked-In (In-House), Completed, and Cancelled; along with check-in/out dates and payment status (Unpaid / Paid).'),
    7: ('FR-C07', 'Guest Feedback Submission',
        'Checked-out guests can submit stay reviews using a star rating (1–5 stars), service category selection (Cleanliness, Staff, Facilities, Food, etc.), and free-text written comments.'),
    8: ('FR-C08', 'Automated Sentiment Ingestion',
        'Upon feedback submission, the FastAPI NLP service automatically classifies the review as Positive, Neutral, or Negative with a confidence score percentage, and persists the result to the database for admin visualization.'),
    9: ('FR-C09', 'Customer Profile Management',
        'Guests can view and update their personal information (name, email) and change their account password within the customer dashboard profile tab.'),
    10: ('FR-C10', 'Customer Self-Service Stay Extension',
         'Active in-house guests can extend their stay by selecting a new check-out date beyond their current scheduled date. The system recalculates extra nights and additional cost and updates the booking record accordingly.'),
    11: ('FR-C11', 'Anytime Early Checkout',
         'Active in-house guests can initiate an early check-out at any time before their scheduled check-out date through the customer portal. The booking transitions to "completed" status and the system automatically flags the room for housekeeping.'),
    12: ('FR-C12', 'Customer-Exclusive Reservation Cancellation',
         'Guests hold exclusive authority to cancel their own "confirmed" reservations prior to front-desk arrival. Administrators are prohibited from unilaterally cancelling active guest bookings, preserving customer booking rights.'),
}

# Rebuild existing rows (1–9 already exist, 10–12 were added by prior script)
for row_idx, (fid, fname, fdesc) in updates_cust.items():
    if row_idx < len(t_cust.rows):
        row = t_cust.rows[row_idx]
        set_cell(row.cells[0], fid, bold=True, size_pt=10)
        set_cell(row.cells[1], fname, bold=False, size_pt=10)
        set_cell(row.cells[2], fdesc, bold=False, size_pt=10)

print(f"  Customer FR table has {len(t_cust.rows)} rows (header + {len(t_cust.rows)-1} features)")

# ─────────────────────────────────────────
# STEP 2: UPDATE TABLE 3 — Admin FR (Table[6])
# ─────────────────────────────────────────
print("=== STEP 2: Updating Admin Functional Requirements ===")
t_admin = doc.tables[6]
shade_row(t_admin.rows[0], 'D9E1F2')

updates_admin = {
    1:  ('FR-A01', 'Admin Authentication & Session Management',
         'Administrators log in via secure JWT-authenticated credentials distinct from the customer portal. Admin sessions enforce role-based access guards blocking customer accounts from admin routes.'),
    2:  ('FR-A02', 'Executive Dashboard & KPI Overview',
         'Displays real-time KPI cards (total bookings, total revenue, in-house guests, sentiment distribution), feedback sentiment donut chart, booking status bar chart, recent feedback list, and occupancy summary.'),
    3:  ('FR-A03', 'Guest Feedback Management',
         'Enables full-text search, sentiment filter, category filter, and detailed inspection of all guest reviews with TextBlob confidence scores, star ratings, and service category tags.'),
    4:  ('FR-A04', 'AI/NLP Sentiment Analytics Visualization',
         'Interactive charts presenting positive, neutral, and negative sentiment proportions across total feedback, with negative review alert highlighting and temporal trend analysis.'),
    5:  ('FR-A05', 'Thematic Service Concern Analysis',
         'Visualizes extracted service themes (Cleanliness, Staff Service, Facilities, Food & Beverage, Room Comfort, Check-in Process, Pricing & Value, and General Experience) across reviewed categories.'),
    6:  ('FR-A06', 'Front Desk Stay Lifecycle Management',
         'Provides full booking lifecycle control: arrival check-in (confirmed → checked_in), cash payment recording (unpaid → paid), early/scheduled checkout completion (checked_in → completed). Customer cancellations are customer-initiated only; admins cannot cancel active customer bookings.'),
    7:  ('FR-A07', 'Room Catalog & Housekeeping Management',
         'Full CRUD management of room records including name, type, base price, current price, capacity, amenities, status image, and description. Supports three operational statuses: available, needs_cleaning (blocked until housekeeping clears), and maintenance.'),
    8:  ('FR-A08', 'Dynamic AI Pricing Review',
         'Generates AI-driven room pricing recommendations with supporting demand-supply rationale; allows Admin to Approve (status → approved) or Reject (status → rejected) each recommendation. Approved recommendations record managerial assent but do not auto-update room base rates.'),
    9:  ('FR-A09', 'System User Account Administration',
         'Enables full CRUD management of admin and customer user accounts including role assignment, bcrypt password enforcement, and account deactivation. Supports search and listing across all registered users.'),
    10: ('FR-A10', 'Executive Reporting & Data Export',
         'Generates live, filterable summary reports across four modules (Bookings, Feedback Sentiment, Dynamic Pricing, Room Performance) with date-range presets, status filters, KPI summary cards, data tables, CSV export, and printable formal management reports with GM signature blocks.'),
    11: ('FR-A11', 'Front Desk Official E-Receipt & Guest Pass Generation',
         'Generates formatted, printable official front-desk e-receipts and hotel pass vouchers displaying guest name, booking reference, room details, stay dates, total amount, payment status, and dynamic hotel branding (name, address, contact) from Settings.'),
    12: ('FR-A12', 'Automated Housekeeping & Room Sanitation Lifecycle',
         'Upon any guest checkout (scheduled or early departure), the system automatically transitions the room status to "needs_cleaning", preventing new reservations until authorized housekeeping staff executes the "Linis na (Mark Cleaned)" action to restore "available" status.'),
    13: ('FR-A13', 'Hotel Settings & Global Configuration Management',
         'Administrators can configure hotel branding (Hotel Name, Contact Email, Address), operational preferences (Timezone, Currency: PHP ₱ / USD $ / EUR €), and AI Pricing toggle. Changes persist to localStorage and propagate reactively across all application views without page reload.'),
    14: ('FR-A14', 'Analytics Dashboard',
         'Provides total bookings count, total revenue, room-level booking frequency rankings, room availability status distribution, and revenue trends. Data is sourced live from PostgreSQL aggregation queries via the analytics API.'),
}

for row_idx, (fid, fname, fdesc) in updates_admin.items():
    if row_idx < len(t_admin.rows):
        row = t_admin.rows[row_idx]
        set_cell(row.cells[0], fid, bold=True, size_pt=10)
        set_cell(row.cells[1], fname, bold=False, size_pt=10)
        set_cell(row.cells[2], fdesc, bold=False, size_pt=10)

print(f"  Admin FR table has {len(t_admin.rows)} rows (header + {len(t_admin.rows)-1} features)")

# ─────────────────────────────────────────
# STEP 3: ADD NON-FUNCTIONAL REQUIREMENTS TABLE after Security Requirements
# ─────────────────────────────────────────
print("=== STEP 3: Finding insertion point for Non-Functional Requirements ===")

# Find P183: Security Requirements heading paragraph
sec_req_idx = -1
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'Security Requirements':
        sec_req_idx = i
        break

print(f"  Security Requirements at P{sec_req_idx}")

# Find P186: Technical Background — insert NFR BEFORE Technical Background
tech_bg_idx = -1
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'Technical Background':
        tech_bg_idx = i
        break

print(f"  Technical Background at P{tech_bg_idx}")

# We'll insert the NFR section just after the Security Requirements table (P184-P185)
# and before Technical Background (P186)
tech_bg_para = doc.paragraphs[tech_bg_idx]

# Insert heading + intro + table caption before Technical Background
nfr_intro_text = (
    "Non-Functional Requirements\n"
)
nfr_heading_para = tech_bg_para.insert_paragraph_before()
set_para_text(nfr_heading_para, 'Non-Functional Requirements', size_pt=12, bold=False,
              align=WD_ALIGN_PARAGRAPH.LEFT)
fmt_para(nfr_heading_para, align=WD_ALIGN_PARAGRAPH.LEFT, line_spacing_pt=18, space_after_pt=6)

nfr_intro_para = tech_bg_para.insert_paragraph_before()
set_para_text(nfr_intro_para,
    "The non-functional requirements of Travellers Inn Sense define the quality, performance, "
    "security, and operational constraints that govern the system's behavior beyond its functional capabilities. "
    "These requirements are grounded in the ISO/IEC 25010 software product quality model and are traceable "
    "across the system's architecture, security design, interface specifications, and evaluation framework.",
    size_pt=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
fmt_para(nfr_intro_para, align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing_pt=18, space_after_pt=6)

nfr_caption_para = tech_bg_para.insert_paragraph_before()
set_para_text(nfr_caption_para, 'Table 7. Non-Functional Requirements', size_pt=12, bold=False,
              align=WD_ALIGN_PARAGRAPH.CENTER)
fmt_para(nfr_caption_para, align=WD_ALIGN_PARAGRAPH.CENTER, line_spacing_pt=18, space_after_pt=4)

# NOW build the NFR table — insert it via docx XML manipulation
# We'll add a table to the doc body at the position just before tech_bg_para
from docx.oxml import OxmlElement
from lxml import etree

# Create the table using python-docx
nfr_table = doc.add_table(rows=1, cols=4)
nfr_table.style = 'Table Grid'

# Set headers
hdr_cells = nfr_table.rows[0].cells
headers = ['ID', 'Quality Attribute (ISO 25010)', 'Requirement', 'Design Realization']
for i, hdr in enumerate(headers):
    set_cell(hdr_cells[i], hdr, bold=True, size_pt=10)
shade_row(nfr_table.rows[0], 'D9E1F2')

# Add all NFR rows
nfr_data = [
    ('NFR-01', 'Functional Suitability',
     'The system shall accurately execute all 12 customer functions and 14 administrative functions as specified in the Functional Requirements.',
     'End-to-end test cases (TC-C01–TC-C13, TC-A01–TC-A16) validate functional completeness. Verified against PostgreSQL-persisted transactions.'),
    ('NFR-02', 'Performance Efficiency\n– Response Time',
     'API responses for standard list queries (rooms, bookings, feedback) shall be returned within 2 seconds under normal load. Dashboard analytics shall render within 3 seconds.',
     'FastAPI with asynchronous Uvicorn ASGI server; SQLAlchemy ORM with indexed primary/foreign keys on PostgreSQL 18; auto-polling every 10 seconds with silent delta refresh.'),
    ('NFR-03', 'Performance Efficiency\n– Throughput',
     'The system shall support concurrent sessions from multiple admin and customer users without data corruption or race conditions.',
     'PostgreSQL ACID-compliant transactional engine with connection pooling via psycopg driver. Uvicorn multi-worker deployment supports concurrent HTTP request handling.'),
    ('NFR-04', 'Security – Authentication',
     'All user sessions shall be protected via HS256 JSON Web Tokens with 60-minute expiration. Tokens must be validated on every protected API endpoint.',
     'python-jose JWT generation and validation in FastAPI dependencies (get_current_user, admin_only guards). Bearer token transmitted in Authorization header.'),
    ('NFR-05', 'Security – Authorization',
     'Role-based access control shall enforce that customer accounts cannot invoke admin-privileged API endpoints, and vice versa.',
     'FastAPI Depends injection of admin_only and customer_only guards. React Router v6 route protection components redirect unauthenticated and unauthorized users.'),
    ('NFR-06', 'Security – Password Protection',
     'All stored user passwords shall be salted and cryptographically hashed. Plaintext passwords shall never be stored or transmitted in system responses.',
     'bcrypt library with automatic salting applied at registration and password update endpoints. Passwords excluded from all API response schemas.'),
    ('NFR-07', 'Security – Data Privacy',
     'All personal guest data shall be processed in compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012). Guest identities and contact information shall be protected from unauthorized disclosure.',
     'JWT session isolation ensures each user sees only their own bookings and profile data. Admin data access is role-restricted. No third-party analytics tracking.'),
    ('NFR-08', 'Reliability – Data Integrity',
     'All booking, feedback, and room transactions shall be atomic; partial writes shall not corrupt the database state.',
     'PostgreSQL ACID transactions with foreign key constraints prevent orphaned records. SQLAlchemy session rollback on exception. Booking and room status transitions are guarded server-side.'),
    ('NFR-09', 'Reliability – Reservation Integrity',
     'Customer-exclusive cancellation protection: the system shall reject any admin-initiated cancellation attempt on an active customer reservation.',
     'Backend cancellation endpoint validates that the requesting user matches the booking owner. Admin booking status update endpoint explicitly excludes the "cancelled" transition.'),
    ('NFR-10', 'Usability – Responsive Interface',
     'The user interface shall be fully functional and visually appropriate on desktop monitors (1920×1080), laptops (1366×768), tablets (768px), and mobile devices (375px minimum viewport width).',
     'Tailwind CSS responsive breakpoint system (sm:, md:, lg:) applied throughout React component layouts. Tested in Chrome DevTools device emulation modes.'),
    ('NFR-11', 'Usability – Feedback Clarity',
     'All user actions producing state changes (booking, extension, checkout, cancellation, payment update, room sanitation) shall provide immediate visual feedback (success toast or modal confirmation).',
     'React state-driven toast notifications, modal confirmations, loading spinners, and inline error messages implemented for all critical user interactions across customer and admin portals.'),
    ('NFR-12', 'Maintainability – Modular Architecture',
     'The system shall follow a decoupled, modular software architecture separating presentation, business logic, and data persistence layers to facilitate independent maintenance and extension.',
     'Three-tier architecture: React SPA frontend ↔ FastAPI REST API ↔ PostgreSQL. Code organized into routers, schemas, models, services, and ML layers. Frontend organized into pages, components, context, and services.'),
    ('NFR-13', 'Portability – Browser Compatibility',
     'The system shall function correctly on major modern web browsers without browser-specific plugins or extensions.',
     'React/Vite SPA built with ES2022+ target. Tested on Google Chrome 110+, Mozilla Firefox 110+, and Microsoft Edge 110+. CSS rendered via PostCSS/Autoprefixer in Vite build pipeline.'),
    ('NFR-14', 'Accuracy – NLP Sentiment Classification',
     'The TextBlob sentiment analysis engine shall correctly classify English-language guest feedback with measurable accuracy. Variable accuracy is expected for mixed vernacular (Taglish) reviews and is formally documented as a system limitation.',
     'TextBlob polarity thresholding (> 0.1 = Positive, < –0.1 = Negative, else Neutral). Confidence score computed from |polarity| normalized to percentage. Classification validated against a labeled feedback set.'),
    ('NFR-15', 'Human-in-the-Loop Safeguard\n– Pricing Integrity',
     'Dynamic pricing recommendations shall never automatically modify active room base prices. All price adjustments shall require explicit administrator approval through the Pricing Review interface.',
     'Backend Approve endpoint updates recommendation status to "approved" and records the pricing decision in pricing_recommendations; the rooms.current_price column is not altered unless explicitly updated through the Room CRUD endpoint.'),
]

for row_data in nfr_data:
    r = add_row(nfr_table, row_data, size_pt=10)

# Move the table XML to just before Technical Background paragraph
tech_bg_elem = tech_bg_para._element
body = tech_bg_elem.getparent()
tbl_elem = nfr_table._element

# Remove from current position (end of doc) and re-insert before tech_bg
body.remove(tbl_elem)
body.insert(list(body).index(tech_bg_elem), tbl_elem)

# Insert an empty spacer paragraph between table and Technical Background
spacer = tech_bg_para.insert_paragraph_before()
spacer.text = ''

print(f"  Non-Functional Requirements table inserted ({len(nfr_data)} requirements)")

# ─────────────────────────────────────────
# STEP 4: UPDATE TABLE NUMBERING
# We inserted Table 7 (NFR). Existing Table 7+ need renumbering.
# Old: Table 7=Dev HW, Table 8=Client HW, Table 9=Software Specs
# New: Table 7=NFR, Table 8=Dev HW, Table 9=Client HW, Table 10=Software Specs
# And all subsequent data dictionaries and test tables shift by 1.
# ─────────────────────────────────────────
print("=== STEP 4: Renumbering table captions and List of Tables ===")

# Table caption renaming map (old caption -> new caption)
table_caption_renames = {
    'Table 7. Development Environment Hardware Specifications': 'Table 8. Development Environment Hardware Specifications',
    'Table 8. End-User Client Hardware Specifications': 'Table 9. End-User Client Hardware Specifications',
    'Table 9. Software Specifications and Tool Versions': 'Table 10. Software Specifications and Tool Versions',
    'Table 10. Data Dictionary: users Table': 'Table 11. Data Dictionary: users Table',
    'Table 11. Data Dictionary: rooms Table': 'Table 12. Data Dictionary: rooms Table',
    'Table 12. Data Dictionary: bookings Table': 'Table 13. Data Dictionary: bookings Table',
    'Table 13. Data Dictionary: feedback Table': 'Table 14. Data Dictionary: feedback Table',
    'Table 14. Data Dictionary: sentiment_results Table': 'Table 15. Data Dictionary: sentiment_results Table',
    'Table 15. Data Dictionary: feedback_themes Table': 'Table 16. Data Dictionary: feedback_themes Table',
    'Table 16. Data Dictionary: pricing_recommendations Table': 'Table 17. Data Dictionary: pricing_recommendations Table',
    'Table 17. Customer Module Test Cases and Outcomes': 'Table 18. Customer Module Test Cases and Outcomes',
    'Table 18. Admin Module Test Cases and Outcomes': 'Table 19. Admin Module Test Cases and Outcomes',
}

# Scan all paragraphs and rename
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt in table_caption_renames:
        new_txt = table_caption_renames[txt]
        set_para_text(p, new_txt, size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER)
        fmt_para(p, align=WD_ALIGN_PARAGRAPH.CENTER, line_spacing_pt=18, space_after_pt=4)
        print(f"  Renamed: '{txt}' -> '{new_txt}'")

# Also update "Table 7" references INSIDE body paragraphs  
body_text_renames = {
    'Table 7': 'Table 8',
    'Table 8': 'Table 9',
    'Table 9': 'Table 10',
    'Table 10': 'Table 11',
    'Table 11': 'Table 12',
    'Table 12': 'Table 13',
    'Table 13': 'Table 14',
    'Table 14': 'Table 15',
    'Table 15': 'Table 16',
    'Table 16': 'Table 17',
    'Table 17': 'Table 18',
    'Table 18': 'Table 19',
}

# ─────────────────────────────────────────
# STEP 5: UPDATE LIST OF TABLES (Table[2])
# ─────────────────────────────────────────
print("=== STEP 5: Updating List of Tables ===")
lot = doc.tables[2]

new_lot_data = [
    ('Table 1', 'Agile Development Lifecycle Phases', '28'),
    ('Table 2', 'Functional Requirements – Customer Module', '31'),
    ('Table 3', 'Functional Requirements – Admin Module', '32'),
    ('Table 4', 'Hardware Interface Specifications', '34'),
    ('Table 5', 'Software Interface Specifications', '35'),
    ('Table 6', 'Security Requirements', '36'),
    ('Table 7', 'Non-Functional Requirements', '37'),
    ('Table 8', 'Development Environment Hardware Specifications', '39'),
    ('Table 9', 'End-User Client Hardware Specifications', '40'),
    ('Table 10', 'Software Specifications and Tool Versions', '40'),
    ('Table 11', 'Data Dictionary: users Table', '55'),
    ('Table 12', 'Data Dictionary: rooms Table', '55'),
    ('Table 13', 'Data Dictionary: bookings Table', '56'),
    ('Table 14', 'Data Dictionary: feedback Table', '57'),
    ('Table 15', 'Data Dictionary: sentiment_results Table', '57'),
    ('Table 16', 'Data Dictionary: feedback_themes Table', '58'),
    ('Table 17', 'Data Dictionary: pricing_recommendations Table', '58'),
    ('Table 18', 'Customer Module Test Cases and Outcomes', '60'),
    ('Table 19', 'Admin Module Test Cases and Outcomes', '62'),
]

# Rebuild all rows except header
while len(lot.rows) > 1:
    tr = lot.rows[-1]._tr
    lot._tbl.remove(tr)

for no, title, page in new_lot_data:
    row = lot.add_row()
    set_cell(row.cells[0], no, size_pt=10)
    set_cell(row.cells[1], title, size_pt=10)
    set_cell(row.cells[2], page, size_pt=10, align=WD_ALIGN_PARAGRAPH.CENTER)

print(f"  List of Tables updated: {len(new_lot_data)} entries")

# ─────────────────────────────────────────
# STEP 6: UPDATE TABLE OF CONTENTS (Table[0]) — partial reference update
# ─────────────────────────────────────────
print("=== STEP 6: Updating Table of Contents references to Security and NFR ===")
toc = doc.tables[0]
for row in toc.rows:
    cell0 = row.cells[0].text.strip()
    cell1 = row.cells[1].text.strip() if len(row.cells) > 1 else ''

    # Update the Non-Functional entry if it exists, else we keep going
    if 'Non-Functional' in cell0:
        set_cell(row.cells[1], '37', size_pt=10, align=WD_ALIGN_PARAGRAPH.CENTER)
        print(f"  TOC: Updated page for Non-Functional Requirements")

print("  TOC scan complete")

# ─────────────────────────────────────────
# STEP 7: UPDATE DIAGRAM NARRATIVES
# ─────────────────────────────────────────
print("=== STEP 7: Updating diagram narratives ===")

# System Architecture Diagram narrative (P197-P205 area)
for i, p in enumerate(doc.paragraphs):
    if 'Travellers Inn Sense is a web-based hotel management' in p.text:
        set_para_text(p,
            "Travellers Inn Sense is a web-based hotel management and decision-support information system "
            "engineered on a modern four-tier decoupled architecture. The system delivers two portals — "
            "a Customer Portal for guest self-service and a full-featured Admin Portal for hotel operations management — "
            "each protected by role-based JWT authentication.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated System Architecture narrative at P{i}")
        break

for i, p in enumerate(doc.paragraphs):
    if 'The application enforces a decoupled client-server architecture' in p.text:
        set_para_text(p,
            "The application enforces a strict decoupled client-server architecture. "
            "The Presentation Tier (React 18 + Vite + Tailwind CSS) renders the customer portal and admin dashboard "
            "as a Single-Page Application with reactive global settings (currency, hotel branding) managed via SettingsContext. "
            "The Application & Logic Tier (FastAPI + Uvicorn ASGI) processes all business rules: "
            "JWT authentication, role-based authorization, booking lifecycle transitions, housekeeping automation, "
            "stay extension/early checkout, and the NLP sentiment and dynamic pricing AI services. "
            "The Data Storage Tier (PostgreSQL 18) persists all relational entities across eight normalized tables. "
            "The Infrastructure Tier (Node.js dev server, Uvicorn worker, psycopg adapter) "
            "supports the runtime communication bridge between frontend and backend.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated Architecture description at P{i}")
        break

# Use Case Diagram narrative
for i, p in enumerate(doc.paragraphs):
    if 'As depicted, the Guest actor interacts with thirteen core use cases' in p.text or \
       'As depicted, the Guest actor interacts with ten core use cases' in p.text:
        set_para_text(p,
            "As depicted, the Guest actor interfaces with twelve core use cases: "
            "(1) Account Registration, (2) Customer Login/Authentication, (3) Browse Room Catalog with Dynamic Multi-Currency Display, "
            "(4) Filter & Sort Rooms, (5) Reserve / Book a Room (Pay at Front Desk), (6) View Booking History & Status, "
            "(7) Extend Stay (Customer Self-Service), (8) Early Checkout Anytime, "
            "(9) Cancel Reservation (Customer-Exclusive), (10) Submit Guest Feedback & Rating, "
            "(11) View Personal Feedback History, and (12) Manage Customer Profile. "
            "The Administrator actor interfaces with fourteen use cases: "
            "(1) Admin Login/Authentication, (2) Executive Dashboard & KPI View, (3) Manage Guest Feedback & AI Analytics, "
            "(4) Sentiment & Thematic Analysis Visualization, (5) Front-Desk Check-in Arrival Processing, "
            "(6) Cash Payment Recording (unpaid → paid), (7) Stay Completion & Regular/Early Checkout, "
            "(8) Generate Official E-Receipt & Hotel Guest Pass, (9) Room Catalog CRUD, "
            "(10) Housekeeping Sanitation Clearance ('Linis na'), (11) Dynamic Pricing AI Review (Approve/Reject), "
            "(12) User Account Administration, (13) Hotel Settings & Multi-Currency Configuration, "
            "and (14) Executive Reporting & CSV Data Export.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated Use Case narrative at P{i}")
        break

# DFD Level 1 narrative
for i, p in enumerate(doc.paragraphs):
    if 'The subprocesses include: 1.0 Customer Authentication' in p.text:
        set_para_text(p,
            "The subprocesses include: 1.0 Customer Authentication & Profile Management, "
            "2.0 Room Catalog Browsing & Dynamic Multi-Currency Display, "
            "3.0 Room Reservation & Booking (Pay at Front Desk), "
            "4.0 Stay Lifecycle Management (Extension, Early Checkout, Customer Cancellation), "
            "5.0 Front-Desk Arrival Processing & Payment Tracking, "
            "6.0 Housekeeping & Room Sanitation Workflow (needs_cleaning → available), "
            "7.0 Guest Feedback Ingestion & NLP Sentiment Analysis, "
            "8.0 Administrative Auth & System Management (Room CRUD, User Admin), "
            "9.0 Dynamic Pricing AI Engine (Demand-Supply Analysis & Recommendation), "
            "10.0 Hotel Settings Configuration & Global Currency Management, "
            "and 11.0 Analytics, Reporting & Data Export. "
            "Data flows link these processes to eight relational data stores: "
            "users, rooms, bookings, feedback, sentiment_results, feedback_themes, pricing_recommendations, and the settings persistence layer.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated DFD Level 1 narrative at P{i}")
        break

# Context Diagram narrative
for i, p in enumerate(doc.paragraphs):
    if 'The Guest transmits credentials, reservation requests' in p.text:
        set_para_text(p,
            "The Guest external entity transmits: login credentials, registration data, room reservation requests, "
            "stay extension requests, early checkout requests, reservation cancellation requests, and guest feedback submissions. "
            "The system returns: booking confirmations, stay status updates, room listings with dynamic currency pricing, "
            "NLP-analyzed feedback acknowledgements, and personal profile data. "
            "The Administrator external entity transmits: login credentials, room data (CRUD), booking status updates "
            "(check-in, payment, completion), housekeeping clearance actions, pricing approval/rejection decisions, "
            "hotel settings configurations, user account actions, and report generation requests. "
            "The system returns: live analytics, aggregated sentiment metrics, booking management views, "
            "executive reports (CSV & printable), and official e-receipts. "
            "All data is persisted to and retrieved from the PostgreSQL relational database.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated Context Diagram narrative at P{i}")
        break

# Guest Feedback Flow narrative
for i, p in enumerate(doc.paragraphs):
    if 'The guest navigates to the Feedback tab on their dashboard' in p.text:
        set_para_text(p,
            "The guest navigates to the Feedback tab on their customer dashboard, where the submission form is "
            "available for completed stays. The guest inputs a star rating (1–5), selects a service category "
            "(Cleanliness, Staff Service, Facilities, Food, Room Comfort, Check-in Process, Pricing & Value, or General), "
            "and enters written comments. Upon submission, the FastAPI NLP service preprocesses the text via NLTK tokenization, "
            "computes TextBlob sentiment polarity, classifies as Positive (polarity > 0.1), "
            "Negative (polarity < –0.1), or Neutral, calculates a confidence percentage from |polarity|, "
            "scans for relevant service themes via keyword matching, and records all results "
            "in both the feedback and sentiment_results tables for immediate visualization on the admin analytics dashboard.",
            size_pt=12)
        fmt_para(p, line_spacing_pt=18, space_after_pt=6)
        print(f"  Updated Feedback Flow narrative at P{i}")
        break

# ─────────────────────────────────────────
# STEP 8: ADD ACTIVITY DIAGRAM 3 REFERENCE (Housekeeping & Stay Extension)
# between Feedback Flow and DFD section
# ─────────────────────────────────────────
print("=== STEP 8: Adding supplementary diagram narrative for Housekeeping & Stay Lifecycle ===")

# Find DFD section heading
dfd_section_idx = -1
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'Data Flow Diagram (DFD)':
        dfd_section_idx = i
        break

print(f"  DFD section at P{dfd_section_idx}")

if dfd_section_idx > -1:
    dfd_para = doc.paragraphs[dfd_section_idx]

    # Insert Housekeeping/Stay Lifecycle narrative before DFD
    supp_title = dfd_para.insert_paragraph_before()
    set_para_text(supp_title, 'Front-Desk Stay Lifecycle & Housekeeping Workflow',
                  size_pt=12, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT)
    fmt_para(supp_title, align=WD_ALIGN_PARAGRAPH.LEFT, line_spacing_pt=18, space_after_pt=6)

    supp_body = dfd_para.insert_paragraph_before()
    set_para_text(supp_body,
        "The stay lifecycle and housekeeping workflow in Travellers Inn Sense enforces a structured "
        "sequence of role-separated state transitions. Upon front-desk guest arrival, the Administrator transitions "
        "the reservation from 'confirmed' to 'checked_in' and records cash payment (unpaid → paid). "
        "During the in-house stay, the Customer has self-service access to two actions: Stay Extension "
        "(selecting a new check-out date beyond the current one, with automatic extra-night cost recalculation) "
        "and Anytime Early Checkout (initiating departure before scheduled checkout date). "
        "Upon checkout — whether scheduled (on check-out date), early (customer-initiated), "
        "or staff-completed (admin-triggered) — the system automatically transitions the associated room "
        "availability status from its current state to 'needs_cleaning', locking the room from new reservations. "
        "An authorized housekeeping staff member then executes the 'Linis na (Mark Cleaned)' action "
        "through the Rooms Management panel, which restores the room to 'available', re-enabling it for customer bookings. "
        "This enforced sanitation cycle prevents any double-booking of uncleaned rooms and ensures "
        "facility hygiene compliance between guest stays.",
        size_pt=12)
    fmt_para(supp_body, line_spacing_pt=18, space_after_pt=6)

    print("  Housekeeping workflow narrative inserted before DFD section")

# ─────────────────────────────────────────
# STEP 9: UPDATE NON-FUNCTIONAL REQUIREMENTS in paragraph body (Scope reference)
# ─────────────────────────────────────────
print("=== STEP 9: Ensuring Security Requirements table still intact ===")
sr_table = doc.tables[9]
print(f"  Security Requirements table: {len(sr_table.rows)} rows")

# ─────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────
OUTPUT = 'c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx'
doc.save(OUTPUT)
print(f"\n✓ DONE — Saved to {OUTPUT}")
print(f"  Total paragraphs: {len(doc.paragraphs)}")
print(f"  Total tables: {len(doc.tables)}")
