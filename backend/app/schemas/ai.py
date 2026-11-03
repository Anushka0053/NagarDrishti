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


class AITextToSpeechRequest(BaseModel):
    text: str
    language_code: Optional[str] = "hi-IN"
    speaker: Optional[str] = "meera"


class AITextToSpeechResponse(BaseModel):
    audio_base64: str
    format: str = "wav"
    configured: bool = False
    message: Optional[str] = None


class AITriageRequest(BaseModel):
    text: str
    category_hint: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AITriageResponse(BaseModel):
    predicted_category: str
    confidence: float
    urgency: str
    sentiment: str
    detected_language: str
    assigned_department_name: str
    is_ai_prediction: bool = True
    is_insufficient_information: Optional[bool] = False
    triage_summary: str
    executive_summary_en: Optional[str] = None
    executive_summary_hi: Optional[str] = None
    extracted_hazard: Optional[str] = None
    recommended_action: Optional[str] = None
    target_sla_hours: Optional[int] = 48
