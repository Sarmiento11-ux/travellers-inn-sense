import docx

doc = docx.Document('c:/Users/Temp/Desktop/Travellers_Inn_Methodology_Revised.docx')

for i, p in enumerate(doc.paragraphs):
    if 'graphic' in p._p.xml:
        prev_p = doc.paragraphs[i-1].text.strip() if i > 0 else ''
        curr_p = p.text.strip()
        next_p = doc.paragraphs[i+1].text.strip() if i+1 < len(doc.paragraphs) else ''
        print(f"P{i}: prev='{prev_p[:50]}' | next='{next_p[:60]}'")
