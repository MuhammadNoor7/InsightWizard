import io
import uuid
import json
import asyncio
from redis_provider import get_redis_client, check_redis_connection
from PyPDF2 import PdfReader
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import AnalyzeRequest
from worker import run_agent_pipeline_worker

app = FastAPI(title="Nexus API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RedisProxy:
    def __getattr__(self, name):
        return getattr(get_redis_client(), name)

redis_client = RedisProxy()

@app.on_event("startup")
async def startup_event():
    await check_redis_connection()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    await redis_client.set(f"job:{job_id}:status", "PENDING")
    
    # Enqueue background task immediately
    background_tasks.add_task(
        run_agent_pipeline_worker, job_id, request.content, request.domain
    )
    return {"job_id": job_id, "status": "PENDING"}

@app.post("/analyze-file", status_code=status.HTTP_202_ACCEPTED)
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    domain: str = Form(...)
):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files supported")
    
    content = ""
    file_bytes = await file.read()
    
    if file.filename.endswith('.pdf'):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
    else:
        content = file_bytes.decode('utf-8')
        
    if not content.strip():
        raise HTTPException(status_code=400, detail="Document contains no readable text")
        
    job_id = str(uuid.uuid4())
    await redis_client.set(f"job:{job_id}:status", "PENDING")
    
    # Delegate to worker background task
    background_tasks.add_task(
        run_agent_pipeline_worker, job_id, content, domain
    )
    return {"job_id": job_id, "status": "PENDING"}

@app.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str):
    async def event_generator():
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"channel:{job_id}")
        
        try:
            # First, yield the initial subscription acknowledgement
            yield f"data: {json.dumps({'event': 'CONNECTED'})}\n\n"
            
            # Prevent race conditions by checking current status immediately on connect
            status_bytes = await redis_client.get(f"job:{job_id}:status")
            if status_bytes:
                current_status = status_bytes.decode('utf-8')
                if current_status == "AWAITING_APPROVAL":
                    result_bytes = await redis_client.get(f"job:{job_id}:result")
                    if result_bytes:
                        result_data = json.loads(result_bytes.decode('utf-8'))
                        action_out = result_data.get("action", {})
                        rec_actions = action_out.get("recommended_actions", [])
                        rec_action = rec_actions[0].get("action") if rec_actions else "No action recommended"
                        
                        yield f"data: {json.dumps({'event': 'AWAITING_APPROVAL', 'recommended_action': rec_action, 'result': result_data})}\n\n"
                        return
                elif current_status in ["COMPLETED", "FAILED"]:
                    yield f"data: {json.dumps({'event': current_status})}\n\n"
                    return
            
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message:
                    data = message['data'].decode('utf-8')
                    yield f"data: {data}\n\n"
                    
                    # Terminate streaming on terminal statuses
                    if "COMPLETED" in data or "FAILED" in data:
                        break
                await asyncio.sleep(0.3)
        finally:
            await pubsub.unsubscribe(f"channel:{job_id}")
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/jobs/{job_id}/approve")
async def approve_job(job_id: str):
    status_bytes = await redis_client.get(f"job:{job_id}:status")
    if not status_bytes or status_bytes.decode('utf-8') != "AWAITING_APPROVAL":
        raise HTTPException(status_code=400, detail="Job is not in AWAITING_APPROVAL status")
        
    # Update job state
    await redis_client.set(f"job:{job_id}:status", "COMPLETED")
    
    # Broadcast simulated execution logs
    await redis_client.publish(
        f"channel:{job_id}",
        json.dumps({
            "event": "COMPLETED",
            "execution_status": "SUCCESS",
            "message": "Action executed successfully by simulated execution gate."
        })
    )
    return {"status": "COMPLETED"}
