import urllib.request
import json
import time
import sys

def run_integration_test():
    print("--- starting end-to-end integration test ---", flush=True)
    
    # 1. Send /analyze request
    url = "http://127.0.0.1:8000/analyze"
    payload = {
        "content": "A major cyberattack has hit the central rail dispatch system of a large logistics provider, freezing all freight movement across the Midwest. The provider must reroute deliveries and notify affected clients.",
        "domain": "logistics"
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    print("Sending POST request to /analyze...", flush=True)
    try:
        response = urllib.request.urlopen(req)
        resp_data = json.loads(response.read().decode('utf-8'))
        print(f"Response: {resp_data}", flush=True)
        job_id = resp_data["job_id"]
    except Exception as e:
        print(f"Failed to post request: {e}", flush=True)
        if hasattr(e, 'read'):
            print(e.read().decode(), flush=True)
        return

    # 2. Subscribe to the SSE stream and print logs in real-time
    stream_url = f"http://127.0.0.1:8000/jobs/{job_id}/stream"
    print(f"\nSubscribing to real-time updates at: {stream_url}\n", flush=True)
    
    try:
        response = urllib.request.urlopen(stream_url)
        print("[SSE Stream] Successfully connected to live feed. Waiting for agents...", flush=True)
        while True:
            line = response.readline()
            if not line:
                break
            line_str = line.decode('utf-8').strip()
            if line_str.startswith("data:"):
                data_json = line_str[5:].strip()
                data = json.loads(data_json)
                event = data.get("event")
                
                if event == "CONNECTED":
                    print("[SSE Stream] CONNECTED event received.", flush=True)
                elif event == "STATUS_CHANGE":
                    print(f"[SSE Stream] Status transitioned to: {data.get('status')}", flush=True)
                elif event == "STEP_COMPLETE":
                    print(f"\n----------------------------------------")
                    print(f"🤖 [Agent Complete] {data.get('agent')} (Progress: {data.get('progress')}%)\n", flush=True)
                    print(f"📝 Summary:\n   {data.get('output_summary')}\n", flush=True)
                    print(f"🤔 Reasoning:\n   {data.get('reasoning')}\n", flush=True)
                    print(f"🎯 Key Decisions:\n   {', '.join(data.get('key_decisions', []))}", flush=True)
                    print(f"----------------------------------------", flush=True)
                elif event == "AWAITING_APPROVAL":
                    print(f"\n🌟 [Awaiting Approval] Recommended Action:\n   {data.get('recommended_action')}\n", flush=True)
                    print("✅ Completed processing. Result payload received!", flush=True)
                    break
                elif event == "FAILED":
                    print(f"❌ Worker pipeline failed: {data.get('error')}", flush=True)
                    break
    except Exception as e:
        print(f"Failed to read stream: {e}", flush=True)

if __name__ == "__main__":
    run_integration_test()
