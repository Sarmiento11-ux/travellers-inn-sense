import sys
sys.stdout.reconfigure(encoding='utf-8')
import shutil, time, os

SRC = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology_Revised.docx'
DST = r'c:\Users\Temp\Desktop\Travellers_Inn_Methodology.docx'

# Check if file is locked
def is_locked(filepath):
    try:
        with open(filepath, 'a'):
            return False
    except IOError:
        return True

if is_locked(DST):
    print("LOCKED: Travellers_Inn_Methodology.docx is open in Word.")
    print("Please close it in Word, then run this script again.")
    print(f"(or just copy {SRC} manually to {DST})")
else:
    shutil.copy2(SRC, DST)
    print(f"SUCCESS: Synced to {DST}")
    print(f"  File size: {os.path.getsize(DST):,} bytes")
