import os
from PIL import Image

# Let's check image dimensions and inspect their content
out_dir = 'c:/Users/Temp/Desktop/extracted_figures'
for fn in sorted(os.listdir(out_dir)):
    if fn.endswith('.png'):
        fp = os.path.join(out_dir, fn)
        im = Image.open(fp)
        print(f"File: {fn}, Dimensions: {im.size}, Format: {im.format}")
