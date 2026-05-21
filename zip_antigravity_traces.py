import os
import json
import shutil
import re

brain_dir = r"C:\Users\Muhammad Noor\.gemini\antigravity\brain"
output_zip = r"d:\innovista\InsightWizard-main (1)\antigravity_traces.zip"
temp_dir = r"d:\innovista\InsightWizard-main (1)\antigravity_traces_temp"
project_keywords = [
    "InsightWizard",
    "Insight Wizard",
    "InsightWizard-main",
    "Insight Wizard app",
    "InsightWizard app",
]

def is_project_relevant(text):
    if not text:
        return False
    lower_text = text.lower()
    return any(keyword.lower() in lower_text for keyword in project_keywords)

if not os.path.exists(brain_dir):
    print(f"Error: Antigravity local data directory not found at {brain_dir}")
    exit(1)

if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir)

print("🔍 Scanning Antigravity local folders for histories, plans, task lists, and walkthroughs...")

# Helper to clean up filenames
def clean_filename(text):
    # Remove user tags and HTML markers
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('\n', ' ').strip()
    # Remove invalid filename characters
    text = re.sub(r'[^a-zA-Z0-9\s_-]', '', text)
    text = " ".join(text.split())
    return text[:45].strip()

copied_count = 0
conversations_processed = 0
skipped_sessions = 0

for conv_id in os.listdir(brain_dir):
    conv_path = os.path.join(brain_dir, conv_id)
    if not os.path.isdir(conv_path):
        continue
    
    # Locate the overview.txt history log
    overview_path = os.path.join(conv_path, ".system_generated", "logs", "overview.txt")
    if not os.path.exists(overview_path):
        overview_path = os.path.join(conv_path, "overview.txt")
        
    title = conv_id
    relevant = False
    
    # Try parsing the first prompt to name the directory descriptively and filter by project relevance
    if os.path.exists(overview_path):
        try:
            with open(overview_path, 'r', encoding='utf-8') as f:
                first_line = f.readline()
                if first_line:
                    data = json.loads(first_line)
                    content = data.get("content", "")
                    if is_project_relevant(content):
                        relevant = True
                    if "<USER_REQUEST>" in content:
                        req = content.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0]
                        clean_req = clean_filename(req)
                        if clean_req:
                            title = f"{clean_req}_{conv_id[:8]}"
        except Exception:
            pass

    if not relevant:
        skipped_sessions += 1
        print(f"⏭ Skipping unrelated session: {conv_id}")
        continue

    # Target directory inside the zip structure
    target_conv_dir = os.path.join(temp_dir, title)
    os.makedirs(target_conv_dir, exist_ok=True)
    
    # Copy conversation history log
    has_files = False
    if os.path.exists(overview_path):
        shutil.copy(overview_path, os.path.join(target_conv_dir, "conversation_log.json"))
        copied_count += 1
        has_files = True
        
    # Copy any walkthroughs, plans, task files (*.md)
    for root, dirs, files in os.walk(conv_path):
        for file in files:
            if file.endswith('.md'):
                src_file = os.path.join(root, file)
                shutil.copy(src_file, os.path.join(target_conv_dir, file))
                copied_count += 1
                has_files = True
                
    if has_files:
        conversations_processed += 1

if copied_count == 0:
    print("❌ No traces, logs, or plans were found to archive.")
    shutil.rmtree(temp_dir)
    exit(1)

# Package into ZIP format
print(f"📦 Compressing into ZIP file: {output_zip}...")
shutil.make_archive(output_zip.replace('.zip', ''), 'zip', temp_dir)

# Clean up temp folders
shutil.rmtree(temp_dir)

print("\n✨ Done! Archiving completed successfully!")
print(f"✅ Processed {conversations_processed} unique development sessions/conversations.")
print(f"⏳ Skipped {skipped_sessions} unrelated session(s).")
print(f"📁 Zip file saved to: {output_zip}")
