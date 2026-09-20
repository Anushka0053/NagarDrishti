from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings
from app.core.logging import logger


class SarvamAIAdapter:
    """
    Adapter for Sarvam AI (Indian Language Speech-to-Text, Translation, TTS & Grounded Reasoning)
    Documentation: https://docs.sarvam.ai/
    CRITICAL ARCHITECTURAL RULE: Sarvam AI is an AI/language layer and reasoning engine.
    It is NOT the source of civic facts. All factual claims must be supplied via retrieved evidence bundles.
    """

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.base_url = settings.SARVAM_BASE_URL

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your-"))

    async def transcribe_audio(self, audio_bytes: bytes, language_code: str = "hi-IN") -> Dict[str, Any]:
        """Transcribe citizen voice report audio via Sarvam STT."""
        if not self.is_configured:
            return {
                "configured": False,
                "raw_transcription": "सड़क पर गहरा गड्ढा है (Development Simulation - Add SARVAM_API_KEY for live model)",
                "normalized_text": "सड़क पर गहरा गड्ढा है",
                "detected_language": "hi",
                "suggested_category": "road_pothole",
                "confidence": 1.0
            }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
                headers = {"api-subscription-key": self.api_key}
                data = {"language_code": language_code, "model": "saarika:v1"}
                response = await client.post(
                    f"{self.base_url}/speech-to-text",
                    files=files,
                    headers=headers,
                    data=data
                )
                if response.status_code == 200:
                    res_json = response.json()
                    transcript = res_json.get("transcript", "")
                    return {
                        "configured": True,
                        "raw_transcription": transcript,
                        "normalized_text": transcript.strip(),
                        "detected_language": res_json.get("language_code", "hi"),
                        "confidence": 0.95
                    }
                else:
                    logger.error(f"Sarvam STT error: {response.status_code} - {response.text}")
                    return {
                        "configured": True,
                        "error": response.text,
                        "raw_transcription": "",
                        "normalized_text": ""
                    }
        except Exception as e:
            logger.error(f"Failed to call Sarvam STT: {e}")
            return {"configured": True, "error": str(e), "raw_transcription": "", "normalized_text": ""}

    async def translate_text(self, text: str, source_lang: str = "hi-IN", target_lang: str = "en-IN") -> Dict[str, Any]:
        """Translate civic text or report details via Sarvam Translate."""
        if not self.is_configured:
            return {
                "configured": False,
                "original_text": text,
                "translated_text": f"[Translated to {target_lang}]: {text}",
                "source_language": source_lang,
                "target_language": target_lang
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "input": text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "speaker_gender": "Female",
                    "mode": "formal"
                }
                response = await client.post(
                    f"{self.base_url}/translate",
                    json=payload,
                    headers=headers
                )
                if response.status_code == 200:
                    res_json = response.json()
                    return {
                        "configured": True,
                        "original_text": text,
                        "translated_text": res_json.get("translated_text", text),
                        "source_language": source_lang,
                        "target_language": target_lang
                    }
                else:
                    return {"configured": True, "error": response.text, "translated_text": text}
        except Exception as e:
            return {"configured": True, "error": str(e), "translated_text": text}

    async def generate_grounded_summary(self, entity_name: str, evidence_bundle: Dict[str, Any], language: str = "hi") -> str:
        """
        Generates an evidence-grounded civic summary using Sarvam LLM.
        Passes explicit source IDs and records in the prompt.
        """
        if not self.is_configured:
            if language == "hi":
                return f"{entity_name} के संबंध में नागरिक शिकायतों और आधिकारिक आंकड़ों के आधार पर स्थिति की समीक्षा की गई है। (लाइव सारांश के लिए SARVAM_API_KEY कॉन्फ़िगर करें)"
            return f"Civic intelligence review for {entity_name} based on verified municipal and citizen telemetry records. (Configure SARVAM_API_KEY for live AI summaries)."

        # When configured, Sarvam chat completion with strict system prompt
        system_prompt = (
            "You are NagarDrishti AI, a Madhya Pradesh civic intelligence assistant. "
            "You MUST ONLY use facts provided in the EVIDENCE BUNDLE. "
            "Never invent contract values, dates, or unverified claims. "
            "Always state if certain details are not available in public records."
        )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "sarvam-2b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Entity: {entity_name}\nLanguage: {language}\nEvidence: {evidence_bundle}"}
                    ]
                }
                response = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
                if response.status_code == 200:
                    res_json = response.json()
                    return res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                return "AI civic summary temporarily unavailable."
        except Exception as e:
            logger.error(f"Sarvam LLM call failed: {e}")
            return "AI civic summary temporarily unavailable."
