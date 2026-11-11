import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx
import shutil
import os

SRC_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DST_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'
NEW_GANTT = r'c:\Users\Temp\Desktop\extracted_figures\gantt_updated.png'

with open(NEW_GANTT, 'rb') as f:
    new_blob = f.read()
print(f"New Gantt image size: {len(new_blob):,} bytes")

doc = docx.Document(SRC_DOCX)

replaced = False
for rel_id, rel in doc.part.rels.items():
    try:
        target = rel.target_ref
        if 'image2' in target.lower():
            old_size = len(rel.target_part._blob)
            rel.target_part._blob = new_blob
            print(f"  >> REPLACED {target} (was {old_size:,} bytes -> now {len(new_blob):,} bytes)")
            replaced = True
            break
    except Exception as e:
        pass

if replaced:
    doc.save(SRC_DOCX)
    print(f"Saved: {SRC_DOCX}")
    
    # Try to sync
    if os.path.exists(DST_DOCX):
        try:
            shutil.copy2(SRC_DOCX, DST_DOCX)
            print(f"Synced to: {DST_DOCX}")
        except PermissionError:
            print(f"LOCKED: {DST_DOCX} is open. Please close Word and copy manually.")
    else:
        shutil.copy2(SRC_DOCX, DST_DOCX)
        print(f"Created: {DST_DOCX}")
else:
    print("ERROR: image2 not found!")
    for rel_id, rel in doc.part.rels.items():
        try:
            print(f"  {rel_id}: {rel.target_ref}")
        except:
            pass
