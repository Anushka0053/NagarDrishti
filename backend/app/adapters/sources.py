from typing import Dict, Any, Optional
import httpx
from app.adapters.base import BaseSourceAdapter
from app.core.config import settings
from app.core.logging import logger


class BhuvanAdapter(BaseSourceAdapter):
    """
    Adapter for ISRO Bhuvan / National Remote Sensing Centre (NRSC)
    API & Thematic Products: https://bhuvan-app1.nrsc.gov.in/api/
    Products: LULC, Urban Land Use (NUIS/AMRUT), Geomorphology, Proximity, Flood History
    """

    source_key = "isro_bhuvan_wms"
    provider_name = "National Remote Sensing Centre (NRSC), ISRO"
    authority_level = "verified_central_government"
    is_authoritative = True
    requires_credentials = False

    def __init__(self):
        super().__init__(
            api_key=settings.BHUVAN_API_KEY,
            base_url=settings.BHUVAN_BASE_URL
        )

    async def check_health(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://bhuvan-app1.nrsc.gov.in/")
                return {
                    "source_key": self.source_key,
                    "status": "healthy" if res.status_code == 200 else "degraded",
                    "status_code": res.status_code,
                    "wms_endpoint": "https://bhuvan-app1.nrsc.gov.in/thematic/thematic/wms"
                }
        except Exception as e:
            return {
                "source_key": self.source_key,
                "status": "unavailable",
                "error": str(e)
            }

    async def fetch_features(self, city_slug: str, layer_code: str, **kwargs) -> Dict[str, Any]:
        # Bhuvan is primarily consumed via WMS GetMap / GetFeatureInfo or Proximity APIs
        return {
            "source_key": self.source_key,
            "layer_code": layer_code,
            "service_type": "wms",
            "wms_url": "https://bhuvan-app1.nrsc.gov.in/thematic/thematic/wms",
            "attribution": self.get_attribution("en")
        }

    def get_attribution(self, language: str = "en") -> str:
        if language == "hi":
            return "भू-स्थानिक सेवाएं: इसरो भुवन / एनआरएससी (भारत सरकार)"
        return "Geospatial services provided by ISRO Bhuvan / NRSC (Govt of India)"


class MPEserviceAdapter(BaseSourceAdapter):
    """
    Adapter for MP eService Open API
    Portal: https://www.services.mp.gov.in/eservice/openAPI
    Capabilities: MP Administrative Hierarchy (Divisions, Districts, Tehsils, Blocks, Panchayats, Villages with coordinates)
    """

    source_key = "mp_eservice_api"
    provider_name = "MP State Electronic Development Corporation (MPSEDC)"
    authority_level = "verified_state_government"
    is_authoritative = True
    requires_credentials = False

    def __init__(self):
        super().__init__(
            api_key=None,
            base_url=settings.MP_ESERVICE_API_URL
        )

    async def check_health(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(self.base_url)
                return {
                    "source_key": self.source_key,
                    "status": "healthy" if res.status_code in [200, 301, 302] else "degraded",
                    "status_code": res.status_code
                }
        except Exception as e:
            return {
                "source_key": self.source_key,
                "status": "unavailable",
                "error": str(e)
            }

    async def fetch_features(self, city_slug: str, layer_code: str, **kwargs) -> Dict[str, Any]:
        return {
            "source_key": self.source_key,
            "endpoint": self.base_url,
            "status": "available"
        }

    def get_attribution(self, language: str = "en") -> str:
        if language == "hi":
            return "स्रोत: म.प्र. ई-सर्विस ओपन डायरेक्टरी एपीआई, मध्य प्रदेश शासन"
        return "Source: MP eServices Open Directory API, Govt of Madhya Pradesh"


class OpenStreetMapAdapter(BaseSourceAdapter):
    """
    Adapter for OpenStreetMap Supplementary Community Data (Overpass API)
    """

    source_key = "osm_community"
    provider_name = "OpenStreetMap Community"
    authority_level = "community_open"
    is_authoritative = False
    requires_credentials = False

    async def check_health(self) -> Dict[str, Any]:
        return {
            "source_key": self.source_key,
            "status": "healthy",
            "license": "ODbL (Open Database License)"
        }

    async def fetch_features(self, city_slug: str, layer_code: str, **kwargs) -> Dict[str, Any]:
        return {
            "source_key": self.source_key,
            "status": "available",
            "note": "Supplementary community spatial geometry."
        }

    def get_attribution(self, language: str = "en") -> str:
        if language == "hi":
            return "© ओपनस्ट्रीटमैप योगदानकर्ता (ODbL लाइसेंस)"
        return "© OpenStreetMap contributors under ODbL license"
