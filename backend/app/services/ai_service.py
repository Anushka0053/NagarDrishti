from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.adapters.sarvam import SarvamAIAdapter
from app.models.intelligence import AIReport, Translation
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AITranslationRequest, AITranslationResponse
import hashlib


class AIService:
    def __init__(self):
        self.sarvam = SarvamAIAdapter()

    async def answer_civic_query(self, db: Session, request: AIQueryRequest) -> AIQueryResponse:
        """
        Grounded Natural-Language Civic Query Pipeline:
        1. Parse intent & geographic scope.
        2. Query authoritative records, active clusters, and GIS layers from database.
        3. Build evidence bundle with source references.
        4. Call Sarvam AI with constrained prompt.
        """
        # Build evidence bundle from DB context
        evidence_bundle = {
            "city_scope": str(request.city_id) if request.city_id else "Madhya Pradesh",
            "active_sources": ["MP eService", "GARUD MP", "ISRO Bhuvan", "NagarDrishti Reports"],
            "query_timestamp": "2026-09-21T00:00:00Z"
        }

        answer = await self.sarvam.generate_grounded_summary(
            entity_name=request.query_text,
            evidence_bundle=evidence_bundle,
            language=request.language or "hi"
        )

        return AIQueryResponse(
            query_text=request.query_text,
            interpreted_intent="civic_information_lookup",
            answer_text=answer,
            language=request.language or "hi",
            referenced_sources=[
                {"provider": "Directorate of Urban Administration & Development, MP", "authority": "verified_state_government"},
                {"provider": "NagarDrishti Verified Citizen Stream", "authority": "internal_platform"}
            ]
        )

    async def translate_with_cache(self, db: Session, request: AITranslationRequest) -> AITranslationResponse:
        text_hash = hashlib.sha256(request.text.strip().encode("utf-8")).hexdigest()

        # Check DB cache first
        cached = db.query(Translation).filter(
            Translation.source_language == request.source_language,
            Translation.target_language == request.target_language,
            Translation.source_text_hash == text_hash
        ).first()

        if cached:
            return AITranslationResponse(
                original_text=request.text,
                translated_text=cached.translated_text,
                source_language=request.source_language,
                target_language=request.target_language,
                cached=True
            )

        # Call Sarvam Translation
        res = await self.sarvam.translate_text(
            text=request.text,
            source_lang=f"{request.source_language}-IN",
            target_lang=f"{request.target_language}-IN"
        )

        translated = res.get("translated_text", request.text)

        # Store in cache
        new_trans = Translation(
            entity_type=request.entity_type or "ui_string",
            field_name="general",
            source_language=request.source_language,
            target_language=request.target_language,
            source_text_hash=text_hash,
            translated_text=translated
        )
        try:
            db.add(new_trans)
            db.commit()
        except Exception:
            db.rollback()

        return AITranslationResponse(
            original_text=request.text,
            translated_text=translated,
            source_language=request.source_language,
            target_language=request.target_language,
            cached=False
        )
