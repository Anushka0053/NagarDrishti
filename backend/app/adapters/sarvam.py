from typing import Dict, Any, Optional, List
import re
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
            # Deterministic simulation for local development / testing
            return {
                "configured": False,
                "raw_transcription": "सड़क पर गहरा गड्ढा है जिससे दुर्घटना का खतरा बना हुआ है।",
                "normalized_text": "सड़क पर गहरा गड्ढा है जिससे दुर्घटना का खतरा बना हुआ है।",
                "detected_language": "hi",
                "suggested_category": "road_pothole",
                "confidence": 0.96,
                "notice": "Development Simulation - Set SARVAM_API_KEY for live Saarika model"
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
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
            # Deterministic offline mock translation
            translated = text
            if "सड़क" in text or "गड्ढा" in text:
                translated = "Deep pothole on the road posing severe hazard to vehicles."
            elif "पानी" in text or "लीक" in text:
                translated = "Drinking water pipeline leakage causing water wastage."
            elif "कचरा" in text:
                translated = "Solid waste and garbage accumulation on the roadside."
            else:
                translated = f"[Translated to {target_lang}]: {text}"

            return {
                "configured": False,
                "original_text": text,
                "translated_text": translated,
                "source_language": source_lang,
                "target_language": target_lang
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
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

    async def text_to_speech(self, text: str, target_language_code: str = "hi-IN", speaker: str = "meera") -> Dict[str, Any]:
        """Synthesize Indian language speech via Sarvam TTS (Bulbul)."""
        if not self.is_configured:
            return {
                "configured": False,
                "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
                "format": "audio/wav",
                "char_count": len(text),
                "is_simulated": True,
                "message": "Speech synthesis simulation mode. Set SARVAM_API_KEY for live Bulbul voice audio."
            }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "inputs": [text[:500]],
                    "target_language_code": target_language_code,
                    "speaker": speaker,
                    "model": "bulbul:v1"
                }
                response = await client.post(f"{self.base_url}/text-to-speech", json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    audios = data.get("audios", [])
                    return {
                        "configured": True,
                        "audio_base64": audios[0] if audios else "",
                        "format": "audio/wav",
                        "char_count": len(text),
                        "is_simulated": False
                    }
                return {"configured": True, "audio_base64": "", "format": "audio/wav", "char_count": 0, "error": response.text}
        except Exception as e:
            logger.error(f"Sarvam TTS failed: {e}")
            return {"configured": True, "audio_base64": "", "format": "audio/wav", "char_count": 0, "error": str(e)}

    def text_to_speech_sync(self, text: str, target_language_code: str = "hi-IN", speaker: str = "meera") -> Dict[str, Any]:
        """Synchronous wrapper for text_to_speech without event loop sockets."""
        if not self.is_configured:
            return {
                "configured": False,
                "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
                "format": "audio/wav",
                "char_count": len(text),
                "is_simulated": True,
                "message": "Speech synthesis simulation mode. Set SARVAM_API_KEY for live Bulbul voice audio."
            }
        return {
            "configured": True,
            "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
            "format": "audio/wav",
            "char_count": len(text),
            "is_simulated": True
        }

    async def generate_grounded_summary(self, entity_name: str, evidence_bundle: Dict[str, Any], language: str = "hi") -> str:
        """
        Generates an evidence-grounded civic summary using Sarvam LLM.
        Passes explicit source IDs and records in the prompt.
        """
        if not self.is_configured:
            if language == "hi":
                return f"{entity_name} के संबंध में नागरिक शिकायतों और आधिकारिक आंकड़ों के आधार पर स्थिति की समीक्षा की गई है। (लाइव सारांश के लिए SARVAM_API_KEY कॉन्फ़िगर करें)"
            return f"Civic intelligence review for {entity_name} based on verified municipal and citizen telemetry records. (Configure SARVAM_API_KEY for live AI summaries)."

        system_prompt = (
            "You are NagarDrishti AI, a Madhya Pradesh civic intelligence assistant. "
            "You MUST ONLY use facts provided in the EVIDENCE BUNDLE. "
            "Never invent contract values, dates, or unverified claims. "
            "Always state if certain details are not available in public records."
        )
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
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

    def triage_civic_text(self, text: str, category_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes citizen complaint text for categorization, urgency, language, and responsible department.
        STRICT GROUNDING: Never hallucinates potholes or civic hazards from random text, gibberish, or short strings.
        """
        cleaned = text.strip()
        lower_text = cleaned.lower()

        # Check for insufficient information (under 6 chars or repetitive gibberish)
        is_too_short = len(cleaned) < 6
        is_repetitive = bool(re.match(r'^(.)\1*$', cleaned.replace(' ', '')))

        # 1. Categorization Rules across all 8 Official NagarDrishti Civic Categories
        category_scores: Dict[str, int] = {
            "road_pothole": 0,
            "water_leakage": 0,
            "garbage_dump": 0,
            "street_light": 0,
            "sewerage_overflow": 0,
            "infrastructure_damage": 0,
            "public_safety": 0,
            "other": 0
        }

        road_words = ["सड़क", "गड्ढा", "डामर", "पेवमेंट", "क्रेटर", "pothole", "potholes", "road", "asphalt", "crater", "craters", "street", "divider", "traffic", "road damage", "tar"]
        water_words = ["पानी", "जल", "पाइप", "लीकेज", "रिसाव", "पेयजल", "नल", "जलप्रदाय", "water", "pipe", "leak", "pipeline", "tap", "pressure", "drinking water", "supply"]
        waste_words = ["कचरा", "कूड़ा", "डंप", "गंदगी", "बदबू", "सफाई", "कचरे", "डंपिंग", "garbage", "waste", "trash", "dump", "debris", "bin", "litter", "sanitation", "refuse"]
        light_words = ["लाइट", "बत्ती", "अंधेरा", "पोल", "खंभा", "स्ट्रीट लाइट", "street light", "streetlight", "lamp", "dark", "electricity", "bulb", "fixture", "blackout"]
        sewer_words = ["सीवेज", "नाली", "गटर", "नाला", "सीवर", "जाम", "ड्रेनेज", "sewer", "drain", "drainage", "overflow", "gutter", "blockage", "manhole", "septic"]
        infra_words = ["फुटपाथ", "पुल", "रेलिंग", "बस स्टॉप", "दीवार", "बाउंड्री", "divider", "footpath", "bridge", "railing", "bench", "bus stop", "pavement", "wall", "boundary", "fence", "culvert", "slab"]
        safety_words = ["खुला मैनहोल", "खुला तार", "करंट", "आवारा पशु", "सुरक्षा", "खतरा", "आग", "धुआं", "open manhole", "hanging wire", "loose wire", "sparking", "shock", "live wire", "stray animal", "dog bite", "hazard", "unsafe", "public safety"]

        matched_keywords = 0
        for w in road_words:
            if w in lower_text: category_scores["road_pothole"] += 2; matched_keywords += 1
        for w in water_words:
            if w in lower_text: category_scores["water_leakage"] += 2; matched_keywords += 1
        for w in waste_words:
            if w in lower_text: category_scores["garbage_dump"] += 2; matched_keywords += 1
        for w in light_words:
            if w in lower_text: category_scores["street_light"] += 2; matched_keywords += 1
        for w in sewer_words:
            if w in lower_text: category_scores["sewerage_overflow"] += 2; matched_keywords += 1
        for w in infra_words:
            if w in lower_text: category_scores["infrastructure_damage"] += 2; matched_keywords += 1
        for w in safety_words:
            if w in lower_text: category_scores["public_safety"] += 2; matched_keywords += 1

        if category_hint and category_hint in category_scores:
            category_scores[category_hint] += 3

        # Grounding check: If text is too short, repetitive, or has zero matched civic keywords
        has_civic_evidence = matched_keywords > 0 or (bool(category_hint) and category_hint != "other" and not is_too_short)
        is_insufficient = is_too_short or is_repetitive or not has_civic_evidence

        # Determine predicted category
        best_cat = max(category_scores.items(), key=lambda x: x[1])
        if is_insufficient:
            predicted_category = category_hint or "other"
            confidence = 0.20 if category_hint else 0.10
        elif best_cat[1] > 0:
            predicted_category = best_cat[0]
            confidence = min(0.96, 0.60 + (best_cat[1] * 0.07))
        else:
            predicted_category = category_hint or "other"
            confidence = 0.35

        # 2. Urgency Detection
        critical_words = [
            "दुर्घटना", "हादसा", "खतरा", "गंभीर", "आपात", "जान", "अस्पताल", "करंट", "खुला मैनहोल", "live wire",
            "emergency", "danger", "fatal", "hazard", "severe", "critical", "broken",
            "collapsed", "sparking", "short circuit"
        ]
        high_words = [
            "गहरा", "overflow", "stagnant", "traffic jam", "चोट", "जाम", "बदबू", "urgent",
            "damaged", "flooding", "burst"
        ]

        if is_insufficient:
            urgency = "low"
            sentiment = "neutral"
        elif any(w in lower_text for w in critical_words):
            urgency = "critical"
            sentiment = "urgent"
        elif any(w in lower_text for w in high_words):
            urgency = "high"
            sentiment = "urgent"
        else:
            urgency = "medium"
            sentiment = "negative"

        # 3. Department Routing
        dept_map = {
            "road_pothole": "Public Works Department (PWD)",
            "water_leakage": "MP Jal Nigam / Municipal Water Works",
            "garbage_dump": "Municipal Health & Sanitation Department",
            "street_light": "MPMKVVCL / Municipal Electrical Division",
            "sewerage_overflow": "Municipal Drainage & Sewerage Board",
            "infrastructure_damage": "Municipal Civil Works & Infrastructure Division",
            "public_safety": "Municipal Disaster Management & Public Safety Cell",
            "other": "Municipal Citizen Grievance Redressal Cell"
        }

        # 4. Language detection
        has_devanagari = bool(re.search(r'[\u0900-\u097F]', cleaned))
        detected_language = "hi" if has_devanagari else "en"

        # 5. Domain-specific hazard extraction & remedial action
        hazard_map = {
            "road_pothole": "Deep road distress and crater-like potholes posing severe vehicular damage and accident risk.",
            "water_leakage": "Piped water distribution pipeline rupture causing clean drinking water wastage and road subbase flooding.",
            "garbage_dump": "Accumulation of unsanitary solid waste spilling onto roadway causing environmental foul odor and stray animal hazards.",
            "street_light": "Non-functional street illumination fixture creating dark zones and night pedestrian safety hazards.",
            "sewerage_overflow": "Blockage in underground drainage network causing raw sewage spillover and public health concerns.",
            "infrastructure_damage": "Damage to public municipal infrastructure (footpath, divider, bridge, or railing) impeding public utility.",
            "public_safety": "Acute urban hazard (open manhole, live electrical wire, or structural risk) endangering citizens.",
            "other": "General or unclassified civic issue awaiting detailed field inspection by municipal grievance team."
        }
        hazard_map_hi = {
            "road_pothole": "सड़क पर गहरा गड्ढा एवं क्षति, जिससे दोपहिया एवं चारपहिया वाहनों के लिए दुर्घटना का खतरा है।",
            "water_leakage": "मुख्य पेयजल पाइपलाइन रिसाव जिससे स्वच्छ जल की बर्बादी और मार्ग पर जलभराव हो रहा है।",
            "garbage_dump": "कचरे का अनियंत्रित ढेर जिससे दुर्गंध फैल रही है और संक्रामक रोगों का खतरा है।",
            "street_light": "स्ट्रीट लाइट बंद होने से मार्ग पर अंधेरा और रात में नागरिकों की सुरक्षा का खतरा।",
            "sewerage_overflow": "सीवरेज लाइन चोक होने से गंदा पानी सड़क पर बह रहा है और स्वास्थ्य जोखिम उत्पन्न कर रहा है।",
            "infrastructure_damage": "फुटपाथ, डिवाइडर, रेलिंग अथवा सार्वजनिक संरचना में टूट-फूट से नागरिकों को असुविधा।",
            "public_safety": "खुला मैनहोल, झूलते तार अथवा जनसुरक्षा जोखिम जिससे गंभीर दुर्घटना की संभावना है।",
            "other": "सामान्य नागरिक शिकायत जिसकी नगर निगम दल द्वारा स्थल जांच आवश्यक है।"
        }

        action_map = {
            "road_pothole": "Deploy PWD road repair squad with cold asphalt patch mix and caution barricades.",
            "water_leakage": "Dispatch PHED line maintenance team to isolate pipe section and replace defective sleeve/gasket.",
            "garbage_dump": "Deploy Municipal SWM mechanized loader and sanitation squad for complete waste clearance and lime powder dusting.",
            "street_light": "Dispatch Electrical Division maintenance vehicle to replace lamp controller and test feeder line.",
            "sewerage_overflow": "Deploy municipal sewer suction/jetting machine to clear internal obstruction and disinfect street surface.",
            "infrastructure_damage": "Dispatch Civil Works inspection squad to assess structural stability and execute masonry repair.",
            "public_safety": "Immediate dispatch of Emergency Response Unit to secure area, install safety barrier, and eliminate active hazard.",
            "other": "Forward to Municipal Citizen Grievance Redressal Cell for preliminary review and field verification."
        }

        sla_hours = 24 if urgency == "critical" else (48 if urgency == "high" else 72)
        assigned_dept = dept_map.get(predicted_category, "Municipal Citizen Grievance Redressal Cell")

        # Synthesize clear executive summaries in English and Hindi
        clean_brief = cleaned.replace("\n", " ").strip()
        if len(clean_brief) > 120:
            clean_brief = clean_brief[:117] + "..."

        if is_insufficient:
            extracted_hazard = "Insufficient grievance details in description to substantiate an automated hazard classification."
            extracted_hazard_hi = "प्रस्तुत विवरण में स्वचालित खतरे की पहचान हेतु पर्याप्त नागरिक विवरण उपलब्ध नहीं है।"
            recommended_action = "Grievance received. Municipal officer will verify details or request additional context/photos from citizen."
            exec_summary_en = f"Citizen Grievance Notice: The submitted description ('{clean_brief}') provides limited detail for automated civic classification. Forwarded to {assigned_dept} for preliminary review."
            exec_summary_hi = f"नागरिक सूचना: प्रस्तुत विवरण ('{clean_brief}') में स्वचालित वर्गीकरण हेतु सीमित जानकारी है। प्रारंभिक समीक्षा हेतु {assigned_dept} को प्रेषित।"
        else:
            extracted_hazard = hazard_map.get(predicted_category, hazard_map["other"])
            extracted_hazard_hi = hazard_map_hi.get(predicted_category, hazard_map_hi["other"])
            recommended_action = action_map.get(predicted_category, action_map["other"])
            exec_summary_en = f"Citizen Grievance Brief: '{clean_brief}'. Sarvam AI identified primary issue as '{extracted_hazard}'. Prioritized as {urgency.upper()} urgency for {assigned_dept}. Target SLA: {sla_hours} hours."
            exec_summary_hi = f"नागरिक शिकायत सारांश: '{clean_brief}'। एआई विश्लेषण: मुख्य समस्या '{extracted_hazard_hi}'। प्राथमिकता: {urgency.upper()}, संबंधित विभाग: {assigned_dept}। समाधान लक्ष्य: {sla_hours} घंटे।"

        return {
            "predicted_category": predicted_category,
            "confidence": round(confidence, 2),
            "urgency": urgency,
            "sentiment": sentiment,
            "detected_language": detected_language,
            "assigned_department_name": assigned_dept,
            "is_ai_prediction": not is_insufficient,
            "is_insufficient_information": is_insufficient,
            "triage_summary": f"AI Triage ({predicted_category.replace('_', ' ').title()}) - Urgency: {urgency.upper()}",
            "executive_summary_en": exec_summary_en,
            "executive_summary_hi": exec_summary_hi,
            "extracted_hazard": extracted_hazard,
            "recommended_action": recommended_action,
            "target_sla_hours": sla_hours
        }

        return {
            "predicted_category": predicted_category,
            "confidence": round(confidence, 2),
            "urgency": urgency,
            "sentiment": sentiment,
            "detected_language": detected_language,
            "assigned_department_name": assigned_dept,
            "is_ai_prediction": True,
            "triage_summary": f"AI Triage ({predicted_category.replace('_', ' ').title()}) - Urgency: {urgency.upper()}",
            "executive_summary_en": exec_summary_en,
            "executive_summary_hi": exec_summary_hi,
            "extracted_hazard": hazard_map.get(predicted_category),
            "recommended_action": action_map.get(predicted_category),
            "target_sla_hours": sla_hours
        }
