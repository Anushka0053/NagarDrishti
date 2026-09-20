from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AITranslationRequest, AITranslationResponse, AITranscriptionResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/query", response_model=AIQueryResponse, tags=["Sarvam AI"])
async def civic_ai_query(request: AIQueryRequest, db: Session = Depends(get_db)):
    """Grounded natural-language civic query via Sarvam AI."""
    return await ai_service.answer_civic_query(db, request)


@router.post("/translate", response_model=AITranslationResponse, tags=["Sarvam AI"])
async def translate_text(request: AITranslationRequest, db: Session = Depends(get_db)):
    """Cached multilingual translation service."""
    return await ai_service.translate_with_cache(db, request)


@router.post("/transcribe", response_model=AITranscriptionResponse, tags=["Sarvam AI"])
async def transcribe_voice(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN")
):
    """Server-side Sarvam Indian language speech-to-text."""
    audio_content = await file.read()
    res = await ai_service.sarvam.transcribe_audio(audio_content, language_code=language_code)
    return AITranscriptionResponse(
        raw_transcription=res.get("raw_transcription", ""),
        normalized_text=res.get("normalized_text", ""),
        detected_language=res.get("detected_language", "hi"),
        suggested_category=res.get("suggested_category", "road_pothole"),
        confidence=res.get("confidence", 1.0)
    )
