import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
doc = docx.Document(DOCX_PATH)

def format_run(run, font_name="Courier New", size_pt=12, bold=False, italic=False, color=None):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color

def set_cell_text(cell, text, bold=False, italic=False, size_pt=10, font_name="Courier New", align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.line_spacing = Pt(13)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    format_run(run, font_name=font_name, size_pt=size_pt, bold=bold, italic=italic)

def add_table_row(table, col_texts, bold_first=False, size_pt=10):
    row = table.add_row()
    for i, txt in enumerate(col_texts):
        b = bold_first if i == 0 else False
        set_cell_text(row.cells[i], txt, bold=b, size_pt=size_pt)
    return row

print("--- Updating Specific Objectives (Paragraphs 82-88) ---")
# Keep specific objectives sharp, academic, and covering all 7 pillars
objectives = [
    "To design and develop a feedback management module that collects, stores, and organizes guest comments and ratings of Travellers Inn Hotel & Restaurant in a centralized PostgreSQL database.",
    "To develop an AI/NLP sentiment analysis component that classifies guest feedback as positive, neutral, or negative, and to measure its classification accuracy against a validation set of guest comments.",
    "To develop a theme-extraction feature that identifies common concerns, positive observations, and recurring service-related themes across eight hospitality categories from classified guest feedback.",
    "To organize and analyze room availability, booking records, and historical occupancy patterns of Travellers Inn Hotel & Restaurant to identify demand and pricing-related trends.",
    "To develop a guest self-service booking and stay management module supporting dynamic multi-currency display (PHP, USD, EUR), 'Pay at Front Desk' payment coordination, customer-exclusive reservation cancellation, anytime early checkout, and self-service stay extension with automated date and rate recalculation.",
    "To engineer administrative front-desk operations and facility management modules featuring check-in arrival processing (confirmed to checked_in to completed), front-desk cash payment tracking, printable official guest passes and e-receipts, automated housekeeping room transitions (needs_cleaning upon checkout to available upon sanitation), dynamic hotel configuration settings, and exportable executive reporting.",
    "To develop a decision-support component that generates room-pricing recommendations presented together with supporting booking, availability, and demand factors for management review without automated price tampering.",
    "To evaluate the developed system in terms of functional suitability, usability, performance efficiency, and reliability, as rated by resort management personnel and IT evaluators using an ISO/IEC 25010-based evaluation instrument."
]

# Paragraph 82 is "Specific Objectives:"
# Let's see how many objective paragraphs exist (83 to 88 currently = 6 paragraphs)
# We can update 83 to 88, and insert the extra ones
for idx, obj_text in enumerate(objectives[:6]):
    p = doc.paragraphs[83 + idx]
    p.text = ""
    r = p.add_run(obj_text)
    format_run(r, font_name="Courier New", size_pt=12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = Pt(18)
    p.paragraph_format.space_after = Pt(6)

# Insert the remaining 2 objectives right after paragraph 88
target_p = doc.paragraphs[88]
for obj_text in objectives[6:]:
    new_p = target_p.insert_paragraph_before()
    r = new_p.add_run(obj_text)
    format_run(r, font_name="Courier New", size_pt=12)
    new_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    new_p.paragraph_format.line_spacing = Pt(18)
    new_p.paragraph_format.space_after = Pt(6)
    new_p.style = target_p.style

print("Specific objectives updated successfully!")

# Let's find "Scope and Limitation of the Study" paragraph
scope_idx = -1
for i, p in enumerate(doc.paragraphs):
    if "Scope and Limitation of the Study" in p.text:
        scope_idx = i
        break

print(f"Scope and Limitation found at paragraph index: {scope_idx}")

p90_text = (
    "This study focuses on the design and development of Travellers Inn Sense, a comprehensive web-based "
    "decision-support and guest experience management system intended for Travellers Inn Hotel & Restaurant. "
    "The system is organized into three primary operational modules: guest feedback analytics, room-pricing decision support, "
    "and full-lifecycle reservation and front-desk stay management. The feedback analytics module enables guests to submit stay reviews "
    "and ratings through their customer portal, while authorized management personnel review aggregated feedback through the administrative dashboard. "
    "Feedback text is processed using an AI/NLP component that assigns positive, neutral, or negative sentiment labels along with confidence scores, "
    "accompanied by theme extraction identifying recurring service concerns across operational hospitality categories."
)

p91_text = (
    "The reservation and front-desk stay management module handles room and booking data with fine-grained role authorization. "
    "The customer portal enables guests to view real-time room availability with dynamic multi-currency display (supporting Philippine Peso ₱, "
    "US Dollar $, and Euro €), book rooms using a 'Pay at Front Desk' cash settlement workflow, and manage active reservations. "
    "To preserve guest sovereignty and prevent accidental booking disruption, reservation cancellation is strictly restricted to the customer; "
    "administrators cannot unilaterally cancel an active customer reservation. Furthermore, customers possess self-service stay controls, "
    "including anytime early checkout for urgent departures and self-service stay extensions with custom day selection and automated fee recalculation. "
    "On the administrative side, front-desk personnel process guest arrivals (transitioning status from confirmed to checked_in), confirm front-desk payments, "
    "generate printable official hotel passes and e-receipts, and record stay completions. Upon checkout (regular or early departure), "
    "the system automatically transitions room availability to 'needs_cleaning', preventing re-booking until staff verifies room sanitation and marks the room cleaned. "
    "Additionally, administrators can customize global hotel configuration settings (hotel branding, contact information, timezone, currency, and AI pricing toggles) "
    "and generate formal executive reports (Bookings, Feedback, Dynamic Pricing, Rooms) with CSV export and printable formal vouchers with General Manager signature lines."
)

p92_text = (
    "The dynamic pricing module manages room rate attributes, capacity, booking frequencies, and seasonal demand. "
    "These records are queried by a rule-based dynamic pricing algorithm that analyzes 30-day booking frequencies and available room supply "
    "to propose adjusted room rates with transparent rationales. The pricing module serves exclusively as a decision-support system: approving a "
    "recommendation updates the managerial approval state in the database while leaving active room base prices unaltered unless deliberately modified by management, "
    "strictly avoiding automated price tampering. The application architecture features a decoupled web architecture: a Single-Page Application (SPA) "
    "frontend built with React, Vite, and Tailwind CSS, communicating over a RESTful JSON API with a backend powered by FastAPI (Python 3.12+) and a PostgreSQL relational database. "
    "Data persistence is fully managed in PostgreSQL, guaranteeing multi-session reliability and transactional integrity across all operational workflows."
)

p93_text = (
    "The study is bounded by operational data accessible for Travellers Inn Hotel & Restaurant during the Academic Year 2026–2027. "
    "The system is tailored specifically to boutique hospitality operations: third-party online payment gateway aggregators (e.g., credit card merchant APIs) "
    "are intentionally excluded in favor of a realistic 'Pay at Front Desk' cash settlement workflow with official front-desk receipting, reflecting the establishment's "
    "actual front-office operations. Enterprise enterprise property-management functions such as back-office financial accounting, employee payroll processing, "
    "and food and beverage inventory auditing lie outside the research scope."
)

for offset, text in enumerate([p90_text, p91_text, p92_text, p93_text], start=1):
    p = doc.paragraphs[scope_idx + offset]
    p.text = ""
    r = p.add_run(text)
    format_run(r, font_name="Courier New", size_pt=12)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = Pt(18)
    p.paragraph_format.space_after = Pt(6)

print("Scope and Limitation updated successfully!")

print("--- Updating Table 2: Functional Requirements - Customer Module (Table 5) ---")
t_cust_fr = doc.tables[5]
# Update FR-C01: multi-currency
set_cell_text(t_cust_fr.rows[1].cells[2], "Guests can view available rooms complete with photos, capacity, amenities, and dynamic multi-currency pricing display (₱, $, €).")
# Update FR-C05: pay at front desk
set_cell_text(t_cust_fr.rows[5].cells[2], "Guests can reserve rooms by selecting check-in and check-out dates, calculating total stay cost by night, with 'Pay at Front Desk' payment coordination.")
# Update FR-C06: booking history tracking
set_cell_text(t_cust_fr.rows[6].cells[2], "Guests can review all past and upcoming reservations with real-time status tracking (Confirmed, Checked-In In-House, Completed, Cancelled).")

# Add FR-C10, FR-C11, FR-C12
add_table_row(t_cust_fr, [
    "FR-C10", "Customer Self-Service Stay Extension",
    "Enables staying guests to extend their check-out date by selecting additional days, automatically recalculating stay totals, and updating reservation schedules."
], bold_first=False)

add_table_row(t_cust_fr, [
    "FR-C11", "Anytime Early Checkout",
    "Allows active in-house guests to initiate early departure and checkout at any time directly from the customer portal, immediately updating stay status and freeing room for housekeeping."
], bold_first=False)

add_table_row(t_cust_fr, [
    "FR-C12", "Customer-Exclusive Cancellation",
    "Grants guests exclusive authority to cancel their own active reservation prior to front-desk check-in, preventing unauthorized administrative cancellation of valid bookings."
], bold_first=False)

print("Table 2 (Customer FR) updated!")

print("--- Updating Table 3: Functional Requirements - Admin Module (Table 6) ---")
t_adm_fr = doc.tables[6]
# Update FR-A06: Front desk check-in & stay management
set_cell_text(t_adm_fr.rows[6].cells[1], "Front Desk & Stay Lifecycle Management")
set_cell_text(t_adm_fr.rows[6].cells[2], "Enables front-desk check-in arrival processing (confirmed to checked_in), front-desk cash payment tracking (unpaid to paid), and post-checkout stay completion.")

# Update FR-A07: Room catalog management with housekeeping
set_cell_text(t_adm_fr.rows[7].cells[2], "Full CRUD management for room offerings, capacity, base price, amenities, and room status including available, needs_cleaning, and maintenance.")

# Add FR-A11, FR-A12, FR-A13, FR-A14
add_table_row(t_adm_fr, [
    "FR-A11", "Front Desk Official Receipt & Guest Pass",
    "Generates formatted, printable official front-desk e-receipts and hotel pass vouchers containing guest details, stay dates, dynamic hotel branding, and payment verification."
], bold_first=False)

add_table_row(t_adm_fr, [
    "FR-A12", "Housekeeping & Room Sanitation Lifecycle",
    "Automatically transitions room status to 'needs_cleaning' upon guest checkout (scheduled or early), locking the room from new bookings until staff executes the 'Mark Cleaned' action."
], bold_first=False)

add_table_row(t_adm_fr, [
    "FR-A13", "Hotel Settings & Multi-Currency Preferences",
    "Configures hotel branding (Hotel Name, Email, Address), timezone, AI pricing toggles, and active currency selection (PHP ₱, USD $, EUR €) with instantaneous app-wide reactivity and persistence."
], bold_first=False)

add_table_row(t_adm_fr, [
    "FR-A14", "Executive Reporting & Data Export",
    "Generates detailed tabular and metric reports for Bookings, Feedback, Pricing Recommendations, and Room Performance with CSV file download and printable formal management reports with GM sign-off blocks."
], bold_first=False)

print("Table 3 (Admin FR) updated!")

print("--- Updating Data Dictionaries: rooms (Table 14) and bookings (Table 15) ---")
t_rooms = doc.tables[14]
# availability_status is row 8
set_cell_text(t_rooms.rows[8].cells[3], "Room operational status: available, needs_cleaning (post-checkout housekeeping required), or maintenance.")

t_bookings = doc.tables[15]
# status is row 9
set_cell_text(t_bookings.rows[9].cells[3], "Reservation lifecycle status: confirmed, checked_in (in-house guest), completed, or cancelled.")

# Add payment_status and payment_method to bookings table
add_table_row(t_bookings, [
    "payment_status", "VARCHAR(20)", "DEFAULT 'unpaid'", "Settlement status of the reservation: unpaid or paid."
], bold_first=False)

add_table_row(t_bookings, [
    "payment_method", "VARCHAR(50)", "DEFAULT 'Pay at Front Desk'", "Designated payment mechanism (Pay at Front Desk cash settlement)."
], bold_first=False)

print("Data dictionaries updated!")

print("--- Updating Test Cases: Customer (Table 20) and Admin (Table 21) ---")
t_tc_c = doc.tables[20]
add_table_row(t_tc_c, [
    "TC-C11", "Customer Stay Extension Request", "Guest inputs additional days; system recalculates amount and extends check-out date", "Pass"
], bold_first=False)
add_table_row(t_tc_c, [
    "TC-C12", "Anytime Early Checkout Execution", "Guest clicks early checkout; booking transitions and room flags for cleaning", "Pass"
], bold_first=False)
add_table_row(t_tc_c, [
    "TC-C13", "Customer Self-Service Cancellation", "Customer cancels pending booking; status changes to Cancelled", "Pass"
], bold_first=False)

t_tc_a = doc.tables[21]
add_table_row(t_tc_a, [
    "TC-A12", "Front Desk Check-in & Payment Processing", "Staff marks guest as checked_in and toggles payment status to paid", "Pass"
], bold_first=False)
add_table_row(t_tc_a, [
    "TC-A13", "Automated Housekeeping Status Transition", "Room automatically switches to needs_cleaning on guest checkout", "Pass"
], bold_first=False)
add_table_row(t_tc_a, [
    "TC-A14", "Housekeeping Sanitation Clearance ('Linis na')", "Staff marks room cleaned; room availability status returns to available", "Pass"
], bold_first=False)
add_table_row(t_tc_a, [
    "TC-A15", "Hotel Settings & Multi-Currency Update", "Admin updates Hotel Name and Currency to USD/EUR; changes reflect app-wide", "Pass"
], bold_first=False)
add_table_row(t_tc_a, [
    "TC-A16", "Executive Report CSV & Print Generation", "Filtered reports exported to formatted CSV and rendered in print layout with GM sign-off", "Pass"
], bold_first=False)

print("Test cases updated!")

print("--- Updating Use Case & Activity Diagram narratives in Chapter III ---")
# Find paragraphs for Use Case, Activity Diagram, DFD, and Implementation Plan
for i, p in enumerate(doc.paragraphs):
    if "As depicted, the Guest actor interacts with ten core use cases" in p.text:
        p.text = ""
        r = p.add_run(
            "As depicted, the Guest actor interacts with thirteen core use cases including account registration, "
            "authentication, dynamic multi-currency room browsing, online booking with 'Pay at Front Desk' coordination, "
            "customer-exclusive reservation cancellation, self-service stay extension, anytime early checkout, feedback submission, "
            "and profile management. The Administrator actor accesses fourteen administrative use cases including executive dashboard monitoring, "
            "room CRUD, front-desk check-in arrival processing, payment tracking, housekeeping cleaning verification ('Linis na'), "
            "front-desk official receipt generation, sentiment analysis, thematic review, dynamic pricing decision review, "
            "hotel settings customization, and formal executive reporting."
        )
        format_run(r, font_name="Courier New", size_pt=12)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        print(f"Updated Use Case narrative at P{i}")

    if "The workflow initiates when the guest visits the room catalog" in p.text:
        p.text = ""
        r = p.add_run(
            "The reservation and stay workflow initiates when the guest visits the room catalog, filters room offerings, "
            "and selects an available room with prices formatted in their preferred currency (₱, $, €). The system prompts for check-in/out dates "
            "and guest count. If unauthenticated, the user is redirected to sign in or register. Once validated, FastAPI computes the total amount "
            "(nights × price), commits the reservation record with 'Pay at Front Desk' as default payment, and sets status to 'confirmed'. "
            "Upon guest arrival, front-desk staff transitions status to 'checked_in' and records cash payment. During the stay, the guest can independently "
            "extend stay duration with automated fee recalculation or trigger anytime early checkout. Upon departure, the reservation transitions to 'completed', "
            "which automatically flags the associated room as 'needs_cleaning' to initiate the housekeeping sanitation cycle."
        )
        format_run(r, font_name="Courier New", size_pt=12)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        print(f"Updated Activity Diagram narrative at P{i}")

    if "The subprocesses include: 1.0 Customer Authentication" in p.text:
        p.text = ""
        r = p.add_run(
            "The subprocesses include: 1.0 Customer Authentication & Profile, 2.0 Room Catalog & Dynamic Multi-Currency Display, "
            "3.0 Reservation, Stay Extension & Front-Desk Stay Lifecycle, 4.0 Housekeeping & Room Sanitation Workflow, "
            "5.0 Feedback Ingestion & NLP Sentiment Analysis, 6.0 Administrative Auth & Management, 7.0 Dynamic Pricing Engine, "
            "and 8.0 Hotel Settings & Executive Reporting. Data flows link these processes to dedicated relational entities: "
            "users, rooms, bookings, feedback, sentiment_results, feedback_themes, pricing_recommendations, and system configuration stores."
        )
        format_run(r, font_name="Courier New", size_pt=12)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        print(f"Updated DFD Diagram 0 narrative at P{i}")

# Save updated document
OUTPUT_PATH = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
doc.save(OUTPUT_PATH)
print(f"\nSUCCESS! Updated manuscript saved to: {OUTPUT_PATH}")
