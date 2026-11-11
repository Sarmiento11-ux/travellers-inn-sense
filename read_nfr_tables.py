import docx, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

# Table 9 = Security Requirements (index 9 in doc.tables)
print('=== Table 6: Security Requirements (Table index 9) ===')
for row in doc.tables[9].rows:
    print([c.text.strip().replace('\n', ' ') for c in row.cells])

# Hardware Interface table
print('\n=== Table 4: Hardware Interface (Table index 7) ===')
for row in doc.tables[7].rows:
    print([c.text.strip().replace('\n', ' ') for c in row.cells])

# Software Interface table
print('\n=== Table 5: Software Interface (Table index 8) ===')
for row in doc.tables[8].rows:
    print([c.text.strip().replace('\n', ' ') for c in row.cells])
