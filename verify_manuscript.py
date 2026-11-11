import docx, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

print("=== VERIFICATION ===")
print(f"Total paragraphs: {len(doc.paragraphs)}")
print(f"Total tables: {len(doc.tables)}")

print("\n=== ALL TABLES ===")
for i, t in enumerate(doc.tables):
    fc = t.cell(0,0).text.strip() if t.rows else ''
    nr = len(t.rows)
    print(f"  Table[{i}]: {nr} rows | First cell: {fc[:50]}")

print("\n=== LIST OF TABLES (Table[2]) ===")
for row in doc.tables[2].rows:
    print(f"  {[c.text.strip() for c in row.cells]}")

print("\n=== CUSTOMER FR (Table[5]) ===")
for row in doc.tables[5].rows:
    print(f"  {row.cells[0].text.strip()} | {row.cells[1].text.strip()}")

print("\n=== ADMIN FR (Table[6]) ===")
for row in doc.tables[6].rows:
    print(f"  {row.cells[0].text.strip()} | {row.cells[1].text.strip()}")

# Find NFR table
for i, t in enumerate(doc.tables):
    if t.cell(0,0).text.strip() == 'ID' and len(t.rows) > 10 and 'Quality Attribute' in t.cell(0,1).text:
        print(f"\n=== NON-FUNCTIONAL REQUIREMENTS (Table[{i}]) ===")
        for row in t.rows:
            print(f"  {row.cells[0].text.strip()} | {row.cells[1].text.strip()}")
        break

print("\n=== BOOKINGS DATA DICTIONARY ===")
for i, t in enumerate(doc.tables):
    if 'payment_status' in ' '.join([c.text for c in t.rows[0].cells if t.rows]) or \
       any('payment_status' in ' '.join([c.text for c in row.cells]) for row in t.rows):
        print(f"  Found in Table[{i}]:")
        for row in t.rows:
            print(f"    {row.cells[0].text.strip()} | {row.cells[3].text.strip()[:60] if len(row.cells) > 3 else ''}")
        break

print("\n=== CUSTOMER TEST CASES (Table[20]) ===")
if len(doc.tables) > 20:
    for row in doc.tables[20].rows:
        print(f"  {row.cells[0].text.strip()} | {row.cells[1].text.strip()}")

print("\n=== ADMIN TEST CASES (Table[21]) ===")
if len(doc.tables) > 21:
    for row in doc.tables[21].rows:
        print(f"  {row.cells[0].text.strip()} | {row.cells[1].text.strip()}")
