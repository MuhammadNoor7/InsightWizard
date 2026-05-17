# Nexus (InsightWizard) — Parallel Implementation Plan

This document serves as the master work division blueprint to develop the **Nexus — Autonomous Content-to-Action Agent** in one go. The project is split into **6 isolated, modular tasks** that can be assigned to different agents or executed sequentially.

> [!IMPORTANT]
> **Gemini Transition:** The agent reasoning engine has been updated from Claude 3.5 Sonnet to **Gemini 2.5 Flash** using the official `google-genai` provider wrapped in `instructor` for schema validation.

---

## 🗺️ Workspace Directory Structure

Ensure your workspace follows this directory layout:

```
InsightWizard/
├── ARCHITECTURE.md          # System architectural specification
├── IMPLEMENTATION_PLAN.md   # Copy of this plan
├── docker-compose.yml       # Infrastructure (Redis)
└── src/
    ├── backend/
    │   ├── requirements.txt # Python package list
    │   ├── main.py          # FastAPI gateway, routers, CORS
    │   ├── models.py        # Shared Pydantic request/response schemas
    │   ├── agents.py        # Instructor-wrapped Gemini 2.5 Flash pipeline
    │   └── worker.py        # Async pipeline worker (BackgroundTasks)
    └── mobile/
        ├── App.tsx          # Navigation entry and app state provider
        ├── package.json     # Mobile dependencies
        ├── .env             # Mobile environment variables
        ├── src/
        │   ├── components/  # Reusable UI cards and primitives
        │   ├── hooks/       # Custom hooks (useSSEStream, useAnalysis)
        │   ├── screens/     # HomeScreen, ProcessingScreen, ResultScreen, etc.
        │   ├── services/    # api.ts, sseService.ts, storageService.ts
        │   └── store/       # Zustand store (useAnalysisStore)
```

---

## 🛠️ Work Division Matrix

| Task Name | Target Files | Tech Stack | Primary Responsibility |
|---|---|---|---|
| **Agent 1: Infrastructure & Models** | `docker-compose.yml`, `src/backend/requirements.txt`, `src/backend/models.py` | Docker, Python, Pydantic | Spin up Redis; define unified Pydantic schemas for the backend request, worker updates, and agent steps. |
| **Agent 2: Gemini Agent Pipeline** | `src/backend/agents.py` | Gemini 2.5 Flash, Instructor, Pydantic | Build the 4-stage sequential reasoning pipeline (Ingest → Insight → Impact → Action) using Instructor with Gemini JSON schema validation. |
| **Agent 3: Worker & Broker Integration** | `src/backend/worker.py` | Redis pub/sub, asyncio | Implement `run_agent_pipeline_worker()`. Run agents sequentially, publish json progress events to Redis, handle state transitions. |
| **Agent 4: FastAPI Gateway & SSE** | `src/backend/main.py` | FastAPI, StreamingResponse | Create routes: `POST /analyze`, `/analyze-file` (with PDF parse), `POST /jobs/{id}/approve`, and `GET /jobs/{id}/stream` (SSE channel reader). |
| **Agent 5: Mobile Services & State** | `mobile/src/store/useAnalysisStore.ts`, `mobile/src/services/`, `mobile/src/hooks/useSSEStream.ts` | Zustand, Axios, EventSource | Configure the global Zustand store, write Axios services, and code the custom `useSSEStream` hook to digest real-time backend updates. |
| **Agent 6: Mobile Screens & UI** | `mobile/src/screens/`, `mobile/src/components/` | React Native, Expo, TypeScript | Build the premium 7-screen mobile interface (`HomeScreen`, `ProcessingScreen`, `ResultScreen` with scrollable cards, `TraceScreen`, `ApprovalScreen`). |

---

## 📋 Detailed Task Specifications & Code Blueprints

### Task 1: Infrastructure & Data Models
* **Agent Focus:** Infrastructure, Typing, and Schema Contracts.
* **Goal:** Ensure all other agents have a shared type safety layer to prevent integration drift.

#### 1. File: `docker-compose.yml`
```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    container_name: nexus-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always
volumes:
  redis_data:
```

#### 2. File: `src/backend/requirements.txt`
```text
fastapi>=0.100.0
uvicorn>=0.22.0
redis>=5.0.0
instructor[google-genai]>=1.7.0
pydantic>=2.0.0
pypdf2>=3.0.0
python-multipart>=0.0.6
```

#### 3. File: `src/backend/models.py`
```python
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Optional

class AnalyzeRequest(BaseModel):
    content: str
    domain: Literal["business", "policy", "logistics", "finance", "news"]

# Pydantic Schemas for Agent Outputs (Passed sequentially)
class IngestOutput(BaseModel):
    facts: List[str] = Field(description="Core extracted factual points from the raw content")
    entities: List[str] = Field(description="Key organizations, locations, people, or metrics")
    signals: List[str] = Field(description="Important external variables or trends detected")
    summary: str = Field(description="A concise summary of the ingestion results")
    reasoning: str = Field(description="The agent's internal analysis chain of thoughts")
    key_decisions: List[str] = Field(description="Critical filtering choices made during parsing")

class InsightOutput(BaseModel):
    insights: List[str] = Field(description="High-value interpretations derived from the facts")
    confidence: Literal["high", "medium", "low"]
    summary: str
    reasoning: str
    key_decisions: List[str]

class ImpactItem(BaseModel):
    insight: str
    consequence: str = Field(description="Specific downstream operational or business outcome")
    severity: Literal["high", "medium", "low"]

class ImpactOutput(BaseModel):
    impacts: List[ImpactItem]
    summary: str
    reasoning: str
    key_decisions: List[str]

class ActionItem(BaseModel):
    action: str = Field(description="Specific actionable operational step recommended")
    rationale: str = Field(description="Why this specific action is justified")
    priority: Literal["high", "medium", "low"]

class SimulationObject(BaseModel):
    action_taken: str
    mock_api_call: Dict = Field(description="Mock REST API payload (e.g. POST headers, body)")
    notification_draft: str = Field(description="Drafted notification (SMS, Email, Slack)")
    before_state: Dict = Field(description="System state prior to action")
    after_state: Dict = Field(description="Expected system state after action execution")
    execution_log: List[str] = Field(description="Simulated execution steps and outputs")

class ActionOutput(BaseModel):
    recommended_actions: List[ActionItem] = Field(description="List of actions sorted by priority")
    simulation: SimulationObject
    summary: str
    reasoning: str
    key_decisions: List[str]

# Combined Final Analysis Result
class AnalysisResult(BaseModel):
    job_id: str
    domain: str
    ingest: IngestOutput
    insight: InsightOutput
    impact: ImpactOutput
    action: ActionOutput
```

---

### Task 2: Gemini Agent Pipeline
* **Agent Focus:** Generative AI & Pydantic-enforced LLM orchestration.
* **Goal:** Implement the Gemini 2.5 Flash reasoning pipeline. Use Instructor to auto-retry on schema mismatch.

#### File: `src/backend/agents.py`
```python
import os
import instructor
from models import IngestOutput, InsightOutput, ImpactOutput, ActionOutput

# Initialize the Instructor client using the official Google Gemini provider
# Expects GEMINI_API_KEY environment variable to be set
client = instructor.from_provider("google/gemini-2.5-flash")
MODEL_NAME = "gemini-2.5-flash"

async def run_ingest_agent(content: str) -> IngestOutput:
    return client.create(
        model=MODEL_NAME,
        response_model=IngestOutput,
        messages=[
            {"role": "system", "content": "You are a professional Data Ingestion Agent. Extract all facts, signals, and core entities accurately."},
            {"role": "user", "content": f"Parse and ingest the following unstructured content:\n\n{content}"}
        ]
    )

async def run_insight_agent(ingest_data: IngestOutput) -> InsightOutput:
    return client.create(
        model=MODEL_NAME,
        response_model=InsightOutput,
        messages=[
            {"role": "system", "content": "You are a Strategic Insight Agent. Synthesize facts into deep domain-specific insights and assess your analytical confidence."},
            {"role": "user", "content": f"Review these ingested facts and extract core business insights:\n\n{ingest_data.model_dump_json()}"}
        ]
    )

async def run_impact_agent(insight_data: InsightOutput) -> ImpactOutput:
    return client.create(
        model=MODEL_NAME,
        response_model=ImpactOutput,
        messages=[
            {"role": "system", "content": "You are an Impact & Risk Assessment Agent. Identify specific operational consequences and rate their severity (high/medium/low)."},
            {"role": "user", "content": f"Assess the downstream consequences and severities for these insights:\n\n{insight_data.model_dump_json()}"}
        ]
    )

async def run_action_agent(impact_data: ImpactOutput, domain: str) -> ActionOutput:
    return client.create(
        model=MODEL_NAME,
        response_model=ActionOutput,
        messages=[
            {"role": "system", "content": f"You are a Senior Action Simulation Agent operating in the '{domain}' domain. Build action recommendations and a highly detailed execution simulation object including before/after system states and mock REST API calls."},
            {"role": "user", "content": f"Generate recommended actions and a complete simulation based on this impact analysis:\n\n{impact_data.model_dump_json()}"}
        ]
    )
```

---

### Task 3: Worker & Broker Integration
* **Agent Focus:** Distributed concurrency, Pub/Sub, and job state caching.
* **Goal:** Implement the async orchestration worker that updates job states and streams updates live via Redis channels.

#### File: `src/backend/worker.py`
```python
import json
import redis.asyncio as aioredis
from agents import run_ingest_agent, run_insight_agent, run_impact_agent, run_action_agent

REDIS_URL = "redis://localhost:6379"

async def run_agent_pipeline_worker(job_id: str, content: str, domain: str):
    redis_client = aioredis.from_url(REDIS_URL)
    
    try:
        # Step 0: Set Status to RUNNING
        await redis_client.set(f"job:{job_id}:status", "RUNNING")
        await publish_event(redis_client, job_id, "STATUS_CHANGE", {"status": "RUNNING"})
        
        # Step 1: Ingestion
        ingest_out = await run_ingest_agent(content)
        await publish_step(redis_client, job_id, "Ingest agent", ingest_out, progress=25)
        
        # Step 2: Insights
        insight_out = await run_insight_agent(ingest_out)
        await publish_step(redis_client, job_id, "Insight agent", insight_out, progress=50)
        
        # Step 3: Impacts
        impact_out = await run_impact_agent(insight_out)
        await publish_step(redis_client, job_id, "Impact agent", impact_out, progress=75)
        
        # Step 4: Actions & Simulation
        action_out = await run_action_agent(impact_out, domain)
        await publish_step(redis_client, job_id, "Action agent", action_out, progress=95)
        
        # Assemble complete analysis result object
        final_result = {
            "job_id": job_id,
            "domain": domain,
            "ingest": ingest_out.model_dump(),
            "insight": insight_out.model_dump(),
            "impact": impact_out.model_dump(),
            "action": action_out.model_dump()
        }
        
        # Write final result to cache
        await redis_client.set(f"job:{job_id}:result", json.dumps(final_result))
        
        # Pause for human-in-the-loop approval
        await redis_client.set(f"job:{job_id}:status", "AWAITING_APPROVAL")
        await redis_client.publish(
            f"channel:{job_id}",
            json.dumps({
                "event": "AWAITING_APPROVAL",
                "recommended_action": action_out.recommended_actions[0].action if action_out.recommended_actions else "No action recommended",
                "result": final_result
            })
        )
        
    except Exception as e:
        await redis_client.set(f"job:{job_id}:status", "FAILED")
        await redis_client.publish(
            f"channel:{job_id}",
            json.dumps({
                "event": "FAILED",
                "error": str(e)
            })
        )
    finally:
        await redis_client.close()

async def publish_step(redis_client, job_id: str, agent_name: str, output, progress: int):
    event_data = {
        "event": "STEP_COMPLETE",
        "agent": agent_name,
        "output_summary": output.summary,
        "reasoning": output.reasoning,
        "key_decisions": output.key_decisions,
        "progress": progress
    }
    await redis_client.publish(f"channel:{job_id}", json.dumps(event_data))

async def publish_event(redis_client, job_id: str, event_name: str, payload: dict):
    payload["event"] = event_name
    await redis_client.publish(f"channel:{job_id}", json.dumps(payload))
```

---

### Task 4: FastAPI Gateway & SSE Stream
* **Agent Focus:** REST API routing, streaming protocols, and asynchronous networking.
* **Goal:** Code the public API gateway with endpoints for job submission, text extraction, SSE streaming, and action approvals.

#### File: `src/backend/main.py`
```python
import io
import uuid
import json
import asyncio
import redis.asyncio as aioredis
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

redis_client = aioredis.from_url("redis://localhost:6379")

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
```

---

### Task 5: Mobile Services & State
* **Agent Focus:** State management, Network abstractions, custom React hooks.
* **Goal:** Wire the app storage, services, and live EventSource listeners together to manage reactive application states.

#### 1. File: `mobile/src/store/useAnalysisStore.ts`
```typescript
import { create } from 'zustand';

export interface TraceStep {
  agent: string;
  output_summary: string;
  reasoning: string;
  key_decisions: string[];
  progress: number;
}

export interface AnalysisResult {
  job_id: string;
  domain: string;
  ingest: any;
  insight: any;
  impact: any;
  action: any;
}

interface AnalysisState {
  currentJobId: string | null;
  jobStatus: 'IDLE' | 'PENDING' | 'RUNNING' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  logs: string[];
  trace: TraceStep[];
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
  
  setCurrentJobId: (jobId: string | null) => void;
  setJobStatus: (status: AnalysisState['jobStatus']) => void;
  addLog: (log: string) => void;
  addTrace: (step: TraceStep) => void;
  setProgress: (val: number) => void;
  setResult: (res: AnalysisResult) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentJobId: null,
  jobStatus: 'IDLE',
  logs: [],
  trace: [],
  progress: 0,
  result: null,
  error: null,
  
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
  setJobStatus: (status) => set({ jobStatus: status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  addTrace: (step) => set((state) => ({ trace: [...state.trace, step] })),
  setProgress: (val) => set({ progress: val }),
  setResult: (res) => set({ result: res, jobStatus: 'COMPLETED', progress: 100 }),
  setError: (err) => set({ error: err, jobStatus: 'FAILED' }),
  reset: () => set({ currentJobId: null, jobStatus: 'IDLE', logs: [], trace: [], progress: 0, result: null, error: null })
}));
```

#### 2. File: `mobile/src/hooks/useSSEStream.ts`
```typescript
import { useEffect, useRef } from 'react';
import { useAnalysisStore } from '../store/useAnalysisStore';

export const useSSEStream = (apiUrl: string) => {
  const { currentJobId, setJobStatus, addLog, addTrace, setProgress, setResult, setError } = useAnalysisStore();
  const eventSourceRef = useRef<any>(null);

  useEffect(() => {
    if (!currentJobId) return;

    const sseUrl = `${apiUrl}/jobs/${currentJobId}/stream`;
    
    // Polyfilled or native EventSource depending on environment
    const eventSource = new (window as any).EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'CONNECTED':
            addLog('Connected to analysis streaming server...');
            break;
            
          case 'STATUS_CHANGE':
            setJobStatus(data.status);
            addLog(`Job Status changed: ${data.status}`);
            break;
            
          case 'STEP_COMPLETE':
            addLog(`[${data.agent}] Completed step...`);
            addTrace({
              agent: data.agent,
              output_summary: data.output_summary,
              reasoning: data.reasoning,
              key_decisions: data.key_decisions,
              progress: data.progress
            });
            setProgress(data.progress);
            break;
            
          case 'AWAITING_APPROVAL':
            setJobStatus('AWAITING_APPROVAL');
            setResult(data.result);
            addLog('Pipeline analysis complete. Awaiting human execution approval.');
            eventSource.close();
            break;
            
          case 'FAILED':
            setError(data.error);
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection interrupted. Please verify your API status.');
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [currentJobId, apiUrl]);
};
```

---

### Task 6: Mobile Screens & UI
* **Agent Focus:** Premium layout, animations, components and style hierarchies.
* **Goal:** Implement the visual presentation of cards, traces, dynamic progress logs, and responsive interfaces.

*A detailed template checklist for this screen builder agent:*
- Create `HomeScreen.tsx` containing prompt text input, a styled row of **Domain Chips**, a document picker interface wrapper for `expo-document-picker`, and a loading transition trigger.
- Develop `ProcessingScreen.tsx` rendering a sleek, glowing circular progress spinner, progress percent banner, and a console-like real-time **Log Reader** box populated by `store.logs` updates.
- Code `ResultScreen.tsx` displaying scrollable components:
  - **InsightCard:** Key points highlighted with custom confidence badges.
  - **ImpactCard:** High/Medium/Low colored severity bars showing system impact.
  - **SimulationCard:** Interactive diff container rendering JSON side-by-side states (`before_state` vs `after_state`).
- Implement `ApprovalScreen.tsx` displaying the recommended corporate action and a physical slider/button that triggers `POST /jobs/{id}/approve`.
- Develop `TraceScreen.tsx` that maps `store.trace[]` into expand/collapse panels explaining the internal logic model of each agent with raw output JSON export controls.

---

## ⚡ Agent Manager Parallel Orchestration Strategy

To build this complete application **in one go**, instruct your Agent Manager to spin up four specialized sub-agent workers to collaborate. Give each agent the exact prompts below.

### Prompt for Agent A (Backend Foundation & AI Pipelines)
> Assign: **Task 1** and **Task 2**
>
> "Generate `docker-compose.yml`, `src/backend/requirements.txt`, and `src/backend/models.py` based on the blueprints in [IMPLEMENTATION_PLAN.md](file:///c:/Users/shaho/OneDrive%20-%20FAST%20National%20University/Attachments/Work/InsightWizard/IMPLEMENTATION_PLAN.md). Once complete, implement `src/backend/agents.py` using standard Gemini 2.5 Flash models wrapped in Pydantic models via `instructor.from_provider('google/gemini-2.5-flash')`. Run a test compile to verify that all schemas validate."

### Prompt for Agent B (API Server & Redis Concurrency)
> Assign: **Task 3** and **Task 4**
>
> "Review `src/backend/models.py`. Implement the background worker task logic in `src/backend/worker.py` ensuring pipeline status outputs stream through the Redis pub/sub channels. Then, create the FastAPI gateway server in `src/backend/main.py` with PDF support, immediate response job submission, and the core Server-Sent Events (SSE) router. Verify by running the server local check: `uvicorn main:app --reload`."

### Prompt for Agent C (Mobile Application Core Services)
> Assign: **Task 5**
>
> "Initialize the React Native Expo template inside `/src/mobile`. Install Zustand, Axios, TanStack Query, and native Expo SDK libraries. Implement the global Zustand store at `src/mobile/src/store/useAnalysisStore.ts` and construct the `useSSEStream.ts` hook based on the blueprints in [IMPLEMENTATION_PLAN.md](file:///c:/Users/shaho/OneDrive%20-%20FAST%20National%20University/Attachments/Work/InsightWizard/IMPLEMENTATION_PLAN.md). Ensure the SSE hook correctly handles the EventSource protocol streams."

### Prompt for Agent D (Mobile User Interface & Visuals)
> Assign: **Task 6**
>
> "Design a dark, premium UI for the mobile application inside `src/mobile/src/screens/` and `components/`. Read values directly from the Zustand store. Build the HomeScreen, ProcessingScreen (with real-time scrolling console feeds), ResultScreen (with customized analytical Cards and Before/After Diff panels), ApprovalScreen (to execute simulated steps), and TraceScreen (expandable panels). Maintain a stunning, editorial layout."

---

## 🏁 Final Integration Verification Checklist

1. Run **Agent A & B's** checks first:
   ```bash
   # Spin up Redis
   docker-compose up -d redis
   # Launch FastAPI Server
   cd src/backend
   uvicorn main:app --reload --port 8000
   ```
2. Run an isolated CLI test of the worker/agent pipeline (checks Instructor schemas + Redis pub/sub loop).
3. Start **Agent C & D's** mobile compiler:
   ```bash
   cd src/mobile
   npx expo start
   ```
4. Scan the console QR code using your physical device or launch in a simulator to test end-to-end.
