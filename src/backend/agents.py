import os
import asyncio
import instructor
from models import IngestOutput, InsightOutput, ImpactOutput, ActionOutput

# Lazy initialize client to prevent startup crash if GEMINI_API_KEY is not present at import time
_client = None
MODEL_NAME = "gemini-2.5-flash"

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            # We don't crash on import, but raise an informative runtime error when an agent is actually called
            raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to proceed with the analysis.")
        _client = instructor.from_provider("google/gemini-2.5-flash")
    return _client

async def run_ingest_agent(content: str) -> IngestOutput:
    client = get_client()
    return await asyncio.to_thread(
        client.create,
        model=MODEL_NAME,
        response_model=IngestOutput,
        messages=[
            {"role": "system", "content": "You are a professional Data Ingestion Agent. Extract all facts, signals, and core entities accurately."},
            {"role": "user", "content": f"Parse and ingest the following unstructured content:\n\n{content}"}
        ]
    )

async def run_insight_agent(ingest_data: IngestOutput) -> InsightOutput:
    client = get_client()
    return await asyncio.to_thread(
        client.create,
        model=MODEL_NAME,
        response_model=InsightOutput,
        messages=[
            {"role": "system", "content": "You are a Strategic Insight Agent. Synthesize facts into deep domain-specific insights and assess your analytical confidence."},
            {"role": "user", "content": f"Review these ingested facts and extract core business insights:\n\n{ingest_data.model_dump_json()}"}
        ]
    )

async def run_impact_agent(insight_data: InsightOutput) -> ImpactOutput:
    client = get_client()
    return await asyncio.to_thread(
        client.create,
        model=MODEL_NAME,
        response_model=ImpactOutput,
        messages=[
            {"role": "system", "content": "You are an Impact & Risk Assessment Agent. Identify specific operational consequences and rate their severity (high/medium/low)."},
            {"role": "user", "content": f"Assess the downstream consequences and severities for these insights:\n\n{insight_data.model_dump_json()}"}
        ]
    )

async def run_action_agent(impact_data: ImpactOutput, domain: str) -> ActionOutput:
    client = get_client()
    return await asyncio.to_thread(
        client.create,
        model=MODEL_NAME,
        response_model=ActionOutput,
        messages=[
            {"role": "system", "content": f"You are a Senior Action Simulation Agent operating in the '{domain}' domain. Build action recommendations and a highly detailed execution simulation object including before/after system states and mock REST API calls."},
            {"role": "user", "content": f"Generate recommended actions and a complete simulation based on this impact analysis:\n\n{impact_data.model_dump_json()}"}
        ]
    )
