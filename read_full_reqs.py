import docx, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

# Print all paragraphs around the requirements section (P158 to P200)
for i in range(158, 200):
    txt = doc.paragraphs[i].text.strip()
    if txt:
        print(f"P{i}: {txt[:100]}")

print("\n=== All Table first cells ===")
for i, t in enumerate(doc.tables):
    fc = t.cell(0, 0).text.strip() if t.rows else ''
    print(f"Table[{i}]: {fc[:60]}")
