from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class BaseSourceAdapter(ABC):
    """
    Abstract contract for all external and authoritative data source adapters.
    Ensures strict adherence to source provenance, attribution, license compliance,
    and clear fallback/credential status without ever fabricating mock data as real government data.
    """

    source_key: str
    provider_name: str
    authority_level: str
    is_authoritative: bool
    requires_credentials: bool

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Verify endpoint connectivity and credential validity."""
        pass

    @abstractmethod
    async def fetch_features(self, city_slug: str, layer_code: str, **kwargs) -> Dict[str, Any]:
        """Fetch vector or tabular dataset from upstream source."""
        pass

    @abstractmethod
    def get_attribution(self, language: str = "en") -> str:
        """Return mandatory legal attribution string."""
        pass
