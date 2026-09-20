from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class AIQueryRequest(BaseModel):
    query_text: str
    city_id: Optional[UUID] = None
    ward_id: Optional[UUID] = None
    language: Optional[str] = "hi"
    context_features: Optional[List[UUID]] = None


class AIQueryResponse(BaseModel):
    query_text: str
    interpreted_intent: str
    answer_text: str
    language: str
    referenced_sources: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_map_action: Optional[Dict[str, Any]] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class AITranscriptionResponse(BaseModel):
    raw_transcription: str
    normalized_text: str
    detected_language: str
    suggested_category: Optional[str] = None
    confidence: float = 1.0


class AITranslationRequest(BaseModel):
    text: str
    source_language: str = "hi"
    target_language: str = "en"
    entity_type: Optional[str] = "ui_string"


class AITranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    cached: bool = False
