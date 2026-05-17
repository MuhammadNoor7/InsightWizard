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

class SystemState(BaseModel):
    efficiency_rate: Optional[str] = Field(None, description="System efficiency or operational rate (e.g., '78%')")
    cost_leakage: Optional[str] = Field(None, description="Current margin leakage or cost overhead (e.g., '$12,400')")
    sla_compliance: Optional[str] = Field(None, description="SLA adherence rate (e.g., '92%')")
    active_risk_alerts: Optional[str] = Field(None, description="Number of active system alerts (e.g., '14 active')")
    margin_percentage: Optional[str] = Field(None, description="Operational profit margin (e.g., '18.4%')")

class MockApiCall(BaseModel):
    method: str = Field(description="HTTP method (e.g., 'POST', 'PATCH')")
    url: str = Field(description="Mock API endpoint URL (e.g., '/api/v1/logistics/routes')")
    headers: Dict[str, str] = Field(description="HTTP request headers including content types and auth keys")
    body: Dict[str, str] = Field(description="API request payload containing the adjusted configuration values")

class SimulationObject(BaseModel):
    action_taken: str
    mock_api_call: MockApiCall = Field(description="Mock REST API payload details")
    notification_draft: str = Field(description="Drafted notification (SMS, Email, Slack)")
    before_state: SystemState = Field(description="System state metrics prior to action execution")
    after_state: SystemState = Field(description="Expected system state metrics after execution")
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
