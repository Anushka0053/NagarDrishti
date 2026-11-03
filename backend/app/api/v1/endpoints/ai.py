from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.ai import (
    AIQueryRequest, AIQueryResponse,
    AITranslationRequest, AITranslationResponse,
    AITranscriptionResponse,
    AITextToSpeechRequest, AITextToSpeechResponse,
    AITriageRequest, AITriageResponse
)
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/query", response_model=AIQueryResponse, tags=["Sarvam AI"])
async def civic_ai_query(request: AIQueryRequest, db: Session = Depends(get_db)):
    """Grounded natural-language civic query via Sarvam AI."""
    return await ai_service.answer_civic_query(db, request)


@router.post("/translate", response_model=AITranslationResponse, tags=["Sarvam AI"])
async def translate_text(request: AITranslationRequest, db: Session = Depends(get_db)):
    """Cached multilingual translation service (Hindi, English, regional languages)."""
    return await ai_service.translate_with_cache(db, request)


@router.post("/transcribe", response_model=AITranscriptionResponse, tags=["Sarvam AI"])
async def transcribe_voice(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN")
):
    """Server-side Sarvam Indian language speech-to-text (Saarika)."""
    audio_content = await file.read()
    res = await ai_service.sarvam.transcribe_audio(audio_content, language_code=language_code)
    return AITranscriptionResponse(
        raw_transcription=res.get("raw_transcription", ""),
        normalized_text=res.get("normalized_text", ""),
        detected_language=res.get("detected_language", "hi"),
        suggested_category=res.get("suggested_category", "road_pothole"),
        confidence=res.get("confidence", 1.0)
    )


@router.post("/tts", response_model=AITextToSpeechResponse, tags=["Sarvam AI"])
async def text_to_speech(request: AITextToSpeechRequest):
    """Server-side Sarvam Indian language text-to-speech (Bulbul)."""
    res = await ai_service.sarvam.text_to_speech(
        text=request.text,
        target_language_code=request.language_code or "hi-IN",
        speaker=request.speaker or "meera"
    )
    return AITextToSpeechResponse(
        audio_base64=res.get("audio_base64", ""),
        format=res.get("format", "wav"),
        configured=res.get("configured", False),
        message=res.get("message")
    )


@router.post("/triage", response_model=AITriageResponse, tags=["Sarvam AI"])
def triage_civic_report(request: AITriageRequest):
    """
    Automated AI analysis: category inference, urgency rating, sentiment, and department assignment.
    """
    triage = ai_service.sarvam.triage_civic_text(request.text, category_hint=request.category_hint)
    return AITriageResponse(
        predicted_category=triage["predicted_category"],
        confidence=triage["confidence"],
        urgency=triage["urgency"],
        sentiment=triage["sentiment"],
        detected_language=triage["detected_language"],
        assigned_department_name=triage["assigned_department_name"],
        is_ai_prediction=True,
        triage_summary=triage["triage_summary"],
        executive_summary_en=triage.get("executive_summary_en"),
        executive_summary_hi=triage.get("executive_summary_hi"),
        extracted_hazard=triage.get("extracted_hazard"),
        recommended_action=triage.get("recommended_action"),
        target_sla_hours=triage.get("target_sla_hours", 48)
    )
