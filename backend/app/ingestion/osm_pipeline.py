import uuid
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.ingestion.base import BaseIngestionPipeline

logger = logging.getLogger("nagardrishti.ingestion.osm")

# Default bounding box for Gwalior urban area [min_lat, min_lon, max_lat, max_lon]
GWALIOR_BBOX = [26.14, 78.10, 26.30, 78.26]

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


class OSMOverpassPipeline(BaseIngestionPipeline):
    """
    Ingestion pipeline for querying OpenStreetMap via Overpass API.
    Tagging all features explicitly with `community_open` provenance and OSM attribution.
    """

    def __init__(self):
        super().__init__(source_key="openstreetmap_mp", default_provenance="community_open")

    def build_query(self, category: str, bbox: List[float] = GWALIOR_BBOX) -> str:
        s, w, n, e = bbox
        if category == "health":
            return f"""
            [out:json][timeout:25];
            (
              node["amenity"="hospital"]({s},{w},{n},{e});
              node["amenity"="clinic"]({s},{w},{n},{e});
              node["amenity"="pharmacy"]({s},{w},{n},{e});
            );
            out body;
            """
        elif category == "education":
            return f"""
            [out:json][timeout:25];
            (
              node["amenity"="school"]({s},{w},{n},{e});
              node["amenity"="college"]({s},{w},{n},{e});
              node["amenity"="university"]({s},{w},{n},{e});
            );
            out body;
            """
        elif category == "safety":
            return f"""
            [out:json][timeout:25];
            (
              node["amenity"="police"]({s},{w},{n},{e});
              node["amenity"="fire_station"]({s},{w},{n},{e});
            );
            out body;
            """
        elif category == "heritage":
            return f"""
            [out:json][timeout:25];
            (
              node["historic"]({s},{w},{n},{e});
              node["tourism"="attraction"]({s},{w},{n},{e});
              node["tourism"="monument"]({s},{w},{n},{e});
            );
            out body;
            """
        else:
            # General civic amenities
            return f"""
            [out:json][timeout:25];
            (
              node["amenity"="townhall"]({s},{w},{n},{e});
              node["amenity"="courthouse"]({s},{w},{n},{e});
              node["amenity"="bus_station"]({s},{w},{n},{e});
            );
            out body;
            """

    def fetch_raw_data(self, query_params: Dict[str, Any]) -> Any:
        category = query_params.get("category", "health")
        bbox = query_params.get("bbox", GWALIOR_BBOX)
        query = self.build_query(category, bbox)

        for endpoint in OVERPASS_ENDPOINTS:
            try:
                resp = requests.post(endpoint, data={"data": query}, timeout=30)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning(f"Overpass endpoint {endpoint} failed: {e}")

        raise RuntimeError("All Overpass API endpoints failed or timed out.")

    def transform_to_features(self, raw_data: Any, layer_id: uuid.UUID, city_id: uuid.UUID) -> List[Dict[str, Any]]:
        elements = raw_data.get("elements", [])
        features = []

        for el in elements:
            if el.get("type") == "node":
                tags = el.get("tags", {})
                lat = el.get("lat")
                lon = el.get("lon")
                name_en = tags.get("name:en") or tags.get("name") or "Unnamed Facility"
                name_hi = tags.get("name:hi") or name_en
                amenity = tags.get("amenity") or tags.get("historic") or tags.get("tourism") or "civic"

                properties = {
                    "osm_id": el.get("id"),
                    "source": "OpenStreetMap",
                    "attribution": "© OpenStreetMap contributors",
                    "license": "ODbL 1.0",
                    "amenity": amenity,
                    "operator": tags.get("operator", "Unknown"),
                    "contact_phone": tags.get("phone", tags.get("contact:phone")),
                    "wheelchair": tags.get("wheelchair", "unknown"),
                    "raw_tags": tags
                }

                features.append({
                    "external_id": f"osm-{el.get('id')}",
                    "name_en": name_en,
                    "name_hi": name_hi,
                    "category": amenity,
                    "subcategory": tags.get("healthcare") or tags.get("school:type"),
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": properties,
                    "provenance_type": "community_open",
                    "observed_at": datetime.utcnow()
                })

        return features
