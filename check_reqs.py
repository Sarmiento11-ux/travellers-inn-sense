import docx

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

for i in range(156, 195):
    txt = doc.paragraphs[i].text.strip()
    if txt:
        print(f"P{i}: {txt[:80]}")
