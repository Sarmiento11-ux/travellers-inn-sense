import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx
import shutil
import os

SRC_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DST_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'
NEW_IMG   = r'c:\Users\Temp\Desktop\extracted_figures\usecase_updated.png'

# Load the new image bytes
with open(NEW_IMG, 'rb') as f:
    new_blob = f.read()
print(f"New image size: {len(new_blob):,} bytes")

doc = docx.Document(SRC_DOCX)

# List all image relationships
replaced = False
for rel_id, rel in doc.part.rels.items():
    target = rel.target_ref if hasattr(rel, 'target_ref') else ''
    print(f"  rel: {rel_id} -> {target}")
    if 'image4' in target.lower() or 'image4' in str(rel.target_part if hasattr(rel,'target_part') else '').lower():
        rel.target_part._blob = new_blob
        print(f"  >> REPLACED: {target}")
        replaced = True
        break

if not replaced:
    # Try by iterating shapes
    print("Trying via inline shapes...")
    for shape in doc.inline_shapes:
        rId = shape._inline.graphic.graphicData.pic.blipFill.blip.get(
            '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed'
        )
        if rId:
            rel = doc.part.rels[rId]
            target = rel.target_ref
            print(f"  shape rId={rId} -> {target}")
            if 'image4' in target.lower():
                rel.target_part._blob = new_blob
                print(f"  >> REPLACED via shape: {target}")
                replaced = True
                break

if replaced:
    doc.save(SRC_DOCX)
    print(f"Saved: {SRC_DOCX}")
    shutil.copy2(SRC_DOCX, DST_DOCX)
    print(f"Synced to: {DST_DOCX}")
else:
    print("ERROR: image4 not found in document relationships!")
    # Dump all rels for debugging
    for rel_id, rel in doc.part.rels.items():
        try:
            print(f"  {rel_id}: {rel.target_ref}")
        except:
            print(f"  {rel_id}: (no target_ref)")
