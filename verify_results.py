import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document

doc = Document(r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx')
print(f'Total paragraphs: {len(doc.paragraphs)}')

# Find Results section
for i, p in enumerate(doc.paragraphs):
    if 'RESULTS' in p.text or 'Presentation of System' in p.text or 'Authentication Module' in p.text:
        print(f'  P{i}: {p.text[:80]}')
