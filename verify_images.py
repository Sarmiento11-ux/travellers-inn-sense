import sys
sys.stdout.reconfigure(encoding='utf-8')

import docx

SRC_DOCX = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'

doc = docx.Document(SRC_DOCX)

print(f"Total inline shapes: {len(doc.inline_shapes)}")

# Check the blob size for each image rel
print("\nImage relationships:")
for rel_id, rel in doc.part.rels.items():
    try:
        target = rel.target_ref
        if 'image' in target.lower():
            blob_size = len(rel.target_part._blob)
            print(f"  {rel_id}: {target} -> {blob_size:,} bytes")
    except:
        pass
