import json
from redis_provider import get_redis_client
from agents import run_ingest_agent, run_insight_agent, run_impact_agent, run_action_agent

async def run_agent_pipeline_worker(job_id: str, content: str, domain: str):
    redis_client = get_redis_client()
    print(f"\n[Worker] Starting background task for job: {job_id} in domain: {domain}")
    
    try:
        # Step 0: Set Status to RUNNING
        await redis_client.set(f"job:{job_id}:status", "RUNNING")
        await publish_event(redis_client, job_id, "STATUS_CHANGE", {"status": "RUNNING"})
        print(f"[Worker] Job {job_id} transitioned to RUNNING")
        
        # Step 1: Ingestion
        print(f"[Worker] Job {job_id} Calling Ingest Agent...")
        ingest_out = await run_ingest_agent(content)
        await publish_step(redis_client, job_id, "Ingest agent", ingest_out, progress=25)
        print(f"[Worker] Job {job_id} Ingest Agent completed successfully.")
        
        # Step 2: Insights
        print(f"[Worker] Job {job_id} Calling Insight Agent...")
        insight_out = await run_insight_agent(ingest_out)
        await publish_step(redis_client, job_id, "Insight agent", insight_out, progress=50)
        print(f"[Worker] Job {job_id} Insight Agent completed successfully.")
        
        # Step 3: Impacts
        print(f"[Worker] Job {job_id} Calling Impact Agent...")
        impact_out = await run_impact_agent(insight_out)
        await publish_step(redis_client, job_id, "Impact agent", impact_out, progress=75)
        print(f"[Worker] Job {job_id} Impact Agent completed successfully.")
        
        # Step 4: Actions & Simulation
        print(f"[Worker] Job {job_id} Calling Action Agent...")
        action_out = await run_action_agent(impact_out, domain)
        await publish_step(redis_client, job_id, "Action agent", action_out, progress=95)
        print(f"[Worker] Job {job_id} Action Agent completed successfully.")
        
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
        print(f"[Worker] Job {job_id} transitioned to AWAITING_APPROVAL. Completed worker execution.\n")
        
    except Exception as e:
        print(f"\n[Worker ERROR] Job {job_id} failed with exception: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            await redis_client.set(f"job:{job_id}:status", "FAILED")
            await redis_client.publish(
                f"channel:{job_id}",
                json.dumps({
                    "event": "FAILED",
                    "error": f"{type(e).__name__}: {str(e)}"
                })
            )
            print(f"[Worker] Published FAILED event to channel:{job_id}\n")
        except Exception as publish_error:
            print(f"[Worker CRITICAL ERROR] Failed to publish FAILED status to Redis: {str(publish_error)}\n")
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
