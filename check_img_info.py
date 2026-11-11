import os
from PIL import Image

out_dir = 'c:/Users/Temp/Desktop/extracted_figures'
for fn in sorted(os.listdir(out_dir)):
    if fn.endswith('.png'):
        fp = os.path.join(out_dir, fn)
        im = Image.open(fp)
        print(f"{fn}: size={im.size}, mode={im.mode}, filesize={os.path.getsize(fp)} bytes")
