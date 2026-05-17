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
