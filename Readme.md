# InsightWizard

AI-powered insights platform for extracting, summarizing, and delivering actionable insights from structured and unstructured data.

Repository: MuhammadNoor7/InsightWizard

Languages: TypeScript (core web & API), Python (agents / ML / data processing), JavaScript (misc)

---

Table of contents
- Overview
- Key features
- High-level architecture
- Services & code layout
- Agents (what they do)
- APIs (mock + real examples)
- Data model (examples)
- Local development
- Docker Compose (quick start)
- Production deployment (Docker / Kubernetes / GitHub Actions)
- Environment variables reference
- Observability, monitoring & security
- Troubleshooting
- Contributing
- License

---

Overview
========
InsightWizard is designed to ingest data from multiple sources, run specialized "insight agents" that analyze and summarize the data, and expose the results via a clean web UI and programmatic APIs. It is split between a TypeScript-based web/API tier and Python-based agents for ML/processing workloads. This README gives a deployment-ready explanation and step-by-step instructions.

Goals
- Provide reliable automated insights from data feeds (documents, databases, webhooks).
- Support synchronous REST queries and real-time WebSocket updates.
- Scale agents independently from the API/web tier.
- Simple local developer experience and production-ready deployment guides.

Key features
============
- Multi-source ingestion (API, file upload, webhooks)
- Natural-language summarization and categorization (via Python agents)
- Search / retrieval (vector store-friendly output)
- REST + WebSocket endpoints for UI and integrations
- Extensible agent architecture for adding new analytics or models
- Container-first for reproducible deployments

High-level architecture
=======================
Components
- Web UI (TypeScript): Single Page App (React/Next.js or similar) for exploring insights.
- API Server (TypeScript, Node): Auth, CRUD, orchestration, REST & WebSocket interfaces.
- Agents (Python): Worker processes that perform ML inference, ingestion, and enrichment.
- Database: PostgreSQL (recommended) for transactional storage.
- Cache / broker: Redis for caching and task queue (RQ/Celery) or as a pub/sub for events.
- Vector DB (optional): Pinecone / Milvus / Faiss / Weaviate for semantic search.
- Object storage: S3-compatible for large file artifacts.
- CI/CD: GitHub Actions for automated tests and image builds.
- Deployment: Docker Compose for dev and Docker/Kubernetes/Helm for production.

ASCII diagram
-------------
Web UI (TS) <---> API (TS) <---> DB (Postgres)
                        |
                        +--> Redis (cache/queue)
                        |
                        +--> Agent workers (Python) --> Vector DB / S3 / External APIs
                        |
                        +--> 3rd-party integrations (OpenAI, analytics, webhooks)

Services & code layout (recommended)
===================================
- /web                - TypeScript SPA (React/Next.js)
- /api                - TypeScript API server (Express/Nest/Fastify)
- /agents             - Python agents & worker code
- /infra              - Docker / k8s / helm / terraform manifests
- /scripts            - helper scripts (migrations, local tooling)
- /docs               - additional documentation & OpenAPI specs

Agents — design & responsibilities
=================================
"Insight Agents" are independent Python services (or processes) responsible for domain-specific processing. Example agents:

- Ingestion Agent
  - Watches data sources (S3, webhooks, scheduled pulls)
  - Normalizes and stores raw data
  - Pushes tasks to the processing queue

- NLP Agent (Summarizer)
  - Performs extraction, summarization, keyphrase extraction
  - Can use local models or external APIs (OpenAI/Anthropic/etc.)
  - Produces structured insight objects saved to DB and vector store

- Retriever / Indexer
  - Embeds contents and stores vectors in the chosen vector DB
  - Maintains/upserts indexes for low-latency similarity search

- Orchestration Agent
  - Runs periodic jobs, invokes pipelines, handles retries and error handling

Communication patterns
- REST job submission + queue: API enqueues jobs to Redis; agents consume.
- WebSocket/Server-Sent Events: push real-time status/updates to web UI.
- Direct worker-to-API calls (internal) for updates if needed.

APIs — overview & examples
==========================
The API aims to be RESTful and documented via OpenAPI/Swagger. Example endpoints:

Authentication
POST /api/v1/auth/login
Request:
{
  "email": "alice@example.com",
  "password": "••••••"
}
Response:
{
  "accessToken": "ey...",
  "refreshToken": "ey..."
}

Insights
GET /api/v1/insights
Query params: ?q=budget&limit=20
Response: list of insight objects (id, title, summary, sources, score, created_at)

GET /api/v1/insights/{id}
Response: full insight, embeddings metadata, references

Create ingestion job (example)
POST /api/v1/ingest
{
  "source": "s3://bucket/path/file.pdf",
  "metadata": { "project": "Q2-budget" }
}
Response:
{
  "jobId": "job_abc123",
  "status": "queued"
}

Agent control / status
GET /api/v1/agents
Response: list of agent workers and statuses

WebSocket (real-time update example)
- URL: ws://HOST/ws/updates?token=...
- Events:
  - job.started { jobId, startedAt }
  - job.progress { jobId, progress, message }
  - job.finished { jobId, resultRef }

OpenAPI
- Generate and expose at /api/docs (Swagger UI)
- Use TypeScript decorators/DSL or generate from annotations

Data model (examples)
=====================
Insight (simplified)
{
  id: uuid,
  title: string,
  summary: string,
  score: float,
  sources: [{ type, uri }],
  embeddings_meta: { vector_id, index_name },
  created_at: timestamp,
  updated_at: timestamp,
  tags: [string]
}

Job
{
  id: uuid,
  type: string,
  payload: object,
  status: enum [queued, running, failed, done],
  started_at, finished_at, logs_url
}

Local development
=================
Prerequisites
- Node.js 18+ (for TypeScript parts)
- Python 3.10+ (for agents)
- Docker & Docker Compose (recommended)
- PostgreSQL (local or via Docker)
- Redis (local or via Docker)
- Optional: an account/keys for any external APIs you will use (OpenAI, Pinecone, S3)

Quick start (developer flow)
1. Clone the repo
   git clone https://github.com/MuhammadNoor7/InsightWizard.git
   cd InsightWizard

2. Copy environment templates
   cp .env.example .env
   cp agents/.env.example agents/.env

3. Start deps with Docker Compose (recommended)
   docker compose up -d

   This should start: postgres, redis, (optional) minio, vector-db (if included).

4. Install & run API
   cd api
   npm install
   npm run migrate   # run DB migrations
   npm run dev

5. Install & run web
   cd ../web
   npm install
   npm run dev

6. Install & run agents (in a separate terminal)
   cd ../agents
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python -m agents.worker   # starts worker that consumes Redis queue

7. Open browser
   - Web UI: http://localhost:3000 (example)
   - API docs: http://localhost:4000/api/docs

Docker Compose (example)
------------------------
Use the following compose as a starting point (adjust image names and ports to your repo):

```yaml name=docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: insightwizard
      POSTGRES_USER: iw_user
      POSTGRES_PASSWORD: iw_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  api:
    build: ./api
    env_file:
      - .env
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis

  web:
    build: ./web
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      - api

  agents:
    build: ./agents
    env_file:
      - agents/.env
    depends_on:
      - redis
      - postgres

volumes:
  postgres-data:
