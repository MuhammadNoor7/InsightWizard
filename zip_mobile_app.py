import os
import zipfile

# Source mobile directory and output zip location
source_dir = r"d:\innovista\InsightWizard-main (1)\InsightWizard-main\src\mobile"
output_zip = r"d:\innovista\InsightWizard-main (1)\mobile_app_source.zip"

# Directories/files to strictly ignore to keep the file size extremely small (under 1MB!)
EXCLUDE_DIRS = {'node_modules', '.expo', '.git', '.claude', 'tempmediaStorage'}
EXCLUDE_FILES = {'package-lock.json'}

print("⚡ Starting ultra-fast zip of mobile app...")
print("ℹ️ Excluding 'node_modules' and cache to keep upload instant.")

if not os.path.exists(source_dir):
    # Fallback to general workspace mobile check
    source_dir = r"d:\innovista\InsightWizard-main (1)\src\mobile"
    if not os.path.exists(source_dir):
        print(f"❌ Error: Mobile directory not found at {source_dir}")
        exit(1)

zip_count = 0
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        # Exclude directories on the fly
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            
            file_path = os.path.join(root, file)
            # Create a relative path inside the zip
            arcname = os.path.relpath(file_path, os.path.dirname(source_dir))
            zipf.write(file_path, arcname)
            zip_count += 1

print(f"\n✨ Success! Zipped {zip_count} source files.")
print(f"📁 Zip file saved to: {output_zip}")
print("🚀 This file is extremely small and will upload to Google Drive instantly!")
