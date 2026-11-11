import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import shutil
import os

DOCX_SRC = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised_NEW.docx'
DOCX_REV = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DOCX_ORIG = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'

doc = Document(DOCX_SRC)

# ── 1. UPDATE TABLE 5 (Customer Functional Requirements) ─────────────
t5 = doc.tables[5]
for row in t5.rows:
    cells = row.cells
    if len(cells) >= 3 and cells[0].text.strip() == 'FR-C09':
        cells[1].text = 'Customer Profile & Security Management'
        cells[2].text = (
            'Guests can view and update their personal profile information (first name, last name, email) '
            'and securely modify their account password with interactive confirmation, show/hide visibility '
            'toggle, minimum 6-character length validation, and backend bcrypt re-hashing.'
        )
        print("Updated FR-C09 in Table 5")

# ── 2. UPDATE TABLE 10 (Non-Functional Requirements) ─────────────────
t10 = doc.tables[10]
for row in t10.rows:
    cells = row.cells
    if len(cells) >= 4 and cells[0].text.strip() == 'NFR-01':
        cells[3].text = (
            'End-to-end test cases (TC-C01–TC-C15, TC-A01–TC-A16) validate functional completeness. '
            'Verified against PostgreSQL-persisted transactions.'
        )
        print("Updated NFR-01 in Table 10")

# ── 3. UPDATE TABLE 21 (Customer Test Cases) ──────────────────────────
t21 = doc.tables[21]

# Helper to format a table cell
def set_cell_props(cell, text, bold=False):
    cell.text = text
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing = Pt(14)
    pf.space_before = Pt(2)
    pf.space_after = Pt(2)
    run = p.runs[0]
    run.font.name = 'Courier New'
    run.font.size = Pt(9.5)
    run.bold = bold

# Check if TC-C14 already exists
existing_ids = [r.cells[0].text.strip() for r in t21.rows]

if 'TC-C14' not in existing_ids:
    row14 = t21.add_row()
    set_cell_props(row14.cells[0], 'TC-C14', bold=True)
    set_cell_props(row14.cells[1], 'Customer Account Password Modification')
    set_cell_props(row14.cells[2], 'Guest enters new password with matching confirmation in profile; system validates criteria, re-hashes password with bcrypt, and commits update')
    set_cell_props(row14.cells[3], 'Pass')
    print("Added TC-C14 to Table 21")

if 'TC-C15' not in existing_ids:
    row15 = t21.add_row()
    set_cell_props(row15.cells[0], 'TC-C15', bold=True)
    set_cell_props(row15.cells[1], 'Password Validation on Mismatch / Insufficient Length')
    set_cell_props(row15.cells[2], 'System halts submission and displays inline warning if new password is under 6 characters or confirmation does not match')
    set_cell_props(row15.cells[3], 'Pass')
    print("Added TC-C15 to Table 21")

# ── 4. UPDATE PARAGRAPH 217 (Use Case Narrative) ─────────────────────
for p in doc.paragraphs:
    if 'Figure 4' in p.text and 'Guest actor interfaces with' in p.text:
        # Update paragraph text
        old_text = p.text
        if '(12) Manage Customer Profile' in old_text and 'Password Security' not in old_text:
            p.text = old_text.replace(
                '(12) Manage Customer Profile.',
                '(12) Manage Customer Profile & Password Security.'
            )
            print("Updated Use Case narrative in Chapter 3")

# ── 5. UPDATE FIGURE 18 NARRATIVE (Chapter 4) ─────────────────────────
for i, p in enumerate(doc.paragraphs):
    if 'Figure 18 illustrates the Customer Profile Management Interface' in p.text:
        p.text = (
            "Figure 18 illustrates the Customer Profile Management Interface. In default viewing mode, "
            "guests can review their registered personal details (first name, last name, email address) "
            "alongside a protected, masked password field indicated by a security badge. Upon clicking 'Edit Profile', "
            "the interface transitions into interactive editing mode, allowing modifications to personal attributes "
            "and introducing a dedicated 'Account Security & Password' section. Guests can enter a new password "
            "and confirm it through dedicated input fields equipped with show/hide password visibility toggles "
            "(Eye / EyeOff). Real-time client validation ensures that the new password meets the 6-character length "
            "threshold and matches the confirmation entry before dispatching an asynchronous request to the "
            "backend (/api/users/me). The backend re-hashes the new password using bcrypt and commits the update, "
            "after which the client displays a success banner and refreshes the active session without requiring "
            "re-authentication, fulfilling FR-C09 and NFR-06."
        )
        pf = p.paragraph_format
        pf.line_spacing = Pt(18)
        pf.space_before = Pt(0)
        pf.space_after = Pt(6)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for r in p.runs:
            r.font.name = 'Courier New'
            r.font.size = Pt(12)
        print(f"Updated Figure 18 narrative at paragraph {i}")
        break

# ── 6. SAVE TO REVISED AND REVISED_NEW ─────────────────────────────────
doc.save(DOCX_SRC)
print(f"Saved: {DOCX_SRC}")

doc.save(DOCX_REV)
print(f"Saved: {DOCX_REV}")

# Also try syncing to DOCX_ORIG if not locked
try:
    shutil.copy2(DOCX_REV, DOCX_ORIG)
    print(f"Synced: {DOCX_ORIG}")
except Exception as e:
    print(f"DOCX_ORIG is locked in Word: {e}")
