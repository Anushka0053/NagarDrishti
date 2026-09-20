from typing import Dict, Any, Optional
import httpx
from app.adapters.base import BaseSourceAdapter
from app.core.config import settings
from app.core.logging import logger


class GarudMPAdapter(BaseSourceAdapter):
    """
    Adapter for GARUD MP / Directorate of Urban Administration & Development (UADD)
    Portal: https://www.urbangis.mp.gov.in/
    Coverage: Madhya Pradesh Urban Local Bodies (ULBs)
    """

    source_key = "garud_mp_uadd"
    provider_name = "Directorate of Urban Administration & Development, MP"
    authority_level = "conditional_official"
    is_authoritative = True
    requires_credentials = True

    def __init__(self):
        super().__init__(
            api_key=None,
            base_url=settings.GARUD_PORTAL_URL
        )

    async def check_health(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(self.base_url)
                is_reachable = res.status_code in [200, 301, 302]
                return {
                    "source_key": self.source_key,
                    "status": "healthy" if is_reachable else "degraded",
                    "status_code": res.status_code,
                    "note": "GARUD MP portal reachable. Official WFS/API endpoints require departmental integration agreement."
                }
        except Exception as e:
            return {
                "source_key": self.source_key,
                "status": "pending_credentials",
                "error": str(e),
                "note": "Direct automated access pending official MP UADD data sharing clearance."
            }

    async def fetch_features(self, city_slug: str, layer_code: str, **kwargs) -> Dict[str, Any]:
        # Contract boundary: Since live WFS requires departmental credentials,
        # return structured contract state and document requirement.
        return {
            "source_key": self.source_key,
            "status": "requires_access_agreement",
            "message": f"Fetching '{layer_code}' for '{city_slug}' requires active UADD GARUD API token/WFS credentials.",
            "data": None
        }

    def get_attribution(self, language: str = "en") -> str:
        if language == "hi":
            return "स्रोत: नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़ जीआईएस)"
        return "Source: Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)"
