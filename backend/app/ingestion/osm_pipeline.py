import uuid
import logging
import requests
import time
from shapely.geometry import shape
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.ingestion.base import BaseIngestionPipeline

logger = logging.getLogger("nagardrishti.ingestion.osm")

# Bounding box catalog for Madhya Pradesh municipal areas [min_lat, min_lon, max_lat, max_lon]
MP_CITY_BBOXES: Dict[str, List[float]] = {
    "gwalior": [26.14, 78.10, 26.30, 78.26],
    "indore": [22.65, 75.78, 22.82, 75.96],
    "bhopal": [23.15, 77.30, 23.35, 77.52],
    "jabalpur": [23.10, 79.88, 23.25, 80.02],
    "ujjain": [23.12, 75.72, 23.24, 75.84],
}

# Centralized OSM Category Configuration
# Maps high-level civic categories to Overpass nwr tag filters, geometry types, and sector codes
OSM_CATEGORY_CONFIG: Dict[str, Dict[str, Any]] = {
    "health": {
        "sector_code": "health",
        "default_category": "healthcare",
        "output_mode": "center",
        "osm_filters": [
            'nwr["amenity"="hospital"]',
            'nwr["amenity"="clinic"]',
            'nwr["amenity"="pharmacy"]',
            'nwr["healthcare"="hospital"]',
            'nwr["healthcare"="centre"]',
            'nwr["healthcare"="clinic"]',
        ],
        "layer_candidates": ["healthcare_facilities", "health", "healthcare", "gwalior_hospitals"],
    },
    "education": {
        "sector_code": "education",
        "default_category": "education",
        "output_mode": "center",
        "osm_filters": [
            'nwr["amenity"="school"]',
            'nwr["amenity"="college"]',
            'nwr["amenity"="university"]',
            'nwr["amenity"="kindergarten"]',
        ],
        "layer_candidates": ["education_facilities", "education", "schools_colleges", "gwalior_education"],
    },
    "safety": {
        "sector_code": "public_safety",
        "default_category": "public_safety",
        "output_mode": "center",
        "osm_filters": [
            'nwr["amenity"="police"]',
            'nwr["amenity"="fire_station"]',
            'nwr["emergency"="police"]',
        ],
        "layer_candidates": ["public_safety", "safety", "police_stations", "gwalior_police_stations"],
    },
    "civic": {
        "sector_code": "urban_assets",
        "default_category": "civic",
        "output_mode": "center",
        "osm_filters": [
            'nwr["amenity"="townhall"]',
            'nwr["amenity"="courthouse"]',
            'nwr["office"="government"]',
            'nwr["amenity"="community_centre"]',
            'nwr["historic"]',
            'nwr["tourism"="attraction"]',
            'nwr["tourism"="monument"]',
            'nwr["tourism"="museum"]',
        ],
        "layer_candidates": ["civic_government", "civic_assets", "urban_assets", "gwalior_urban_assets"],
    },
    "parks": {
        "sector_code": "urban_assets",
        "default_category": "parks",
        "output_mode": "center",
        "osm_filters": [
            'nwr["leisure"="park"]',
            'nwr["leisure"="garden"]',
            'nwr["leisure"="playground"]',
        ],
        "layer_candidates": ["parks_public_spaces", "parks", "urban_assets", "gwalior_urban_assets"],
    },
    "transport": {
        "sector_code": "transport",
        "default_category": "transport",
        "output_mode": "center",
        "osm_filters": [
            'nwr["railway"="station"]',
            'nwr["amenity"="bus_station"]',
            'nwr["highway"="bus_stop"]',
            'nwr["amenity"="parking"]',
        ],
        "layer_candidates": ["transport", "transport_terminals", "gwalior_major_roads", "gwalior_urban_assets"],
    },
    "amenities": {
        "sector_code": "urban_assets",
        "default_category": "amenities",
        "output_mode": "center",
        "osm_filters": [
            'nwr["amenity"="bank"]',
            'nwr["amenity"="atm"]',
            'nwr["amenity"="post_office"]',
            'nwr["amenity"="toilets"]',
            'nwr["amenity"="marketplace"]',
        ],
        "layer_candidates": ["public_amenities", "amenities", "urban_assets", "gwalior_urban_assets"],
    },
    "roads": {
        "sector_code": "transport",
        "default_category": "road",
        "output_mode": "geom",
        "osm_filters": [
            'way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]',
        ],
        "layer_candidates": ["road_network", "major_roads", "roads", "gwalior_major_roads"],
    },
}

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

OSM_USER_AGENT = "NagarDrishti/1.0 (Urban Civic Geospatial Analytics Platform for Madhya Pradesh)"

ROAD_CLASSES = {"motorway", "trunk", "primary", "secondary", "tertiary", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "residential", "unclassified", "living_street"}
OSM_CATEGORY_CONFIG["roads"]["osm_filters"] = ['way["highway"~"^(' + '|'.join(sorted(ROAD_CLASSES)) + ')$"]["area"!="yes"][!"building"]']
OSM_CATEGORY_CONFIG["civic"]["osm_filters"] = OSM_CATEGORY_CONFIG["civic"]["osm_filters"][:4]
for key, filters in [
    ("culture", ['nwr["amenity"="place_of_worship"]', 'nwr["amenity"="arts_centre"]']),
    ("heritage", ['nwr["historic"]', 'nwr["tourism"~"^(museum|attraction|gallery)$"]']),
    ("environment", ['nwr["natural"~"^(water|wood|wetland)$"]']),
    ("water", ['nwr["man_made"="water_tower"]', 'nwr["amenity"="drinking_water"]']),
]:
    OSM_CATEGORY_CONFIG[key] = {"sector_code": "urban_assets", "default_category": key, "output_mode": "center", "osm_filters": filters}
for key, config in OSM_CATEGORY_CONFIG.items():
    config["layer_candidates"] = ["osm_" + key]


class OSMOverpassPipeline(BaseIngestionPipeline):
    """
    Generalized, multi-city OpenStreetMap ingestion pipeline.
    Preserves `community_open` provenance, stores stable OSM IDs for deduplication,
    supports node/way/relation (nwr) POIs and road ways, and updates coverage metadata conservatively.
    """

    def __init__(self):
        super().__init__(source_key="osm_community", default_provenance="community_open")

    def get_city_bbox(self, city_slug: str, db_city: Optional[Any] = None) -> List[float]:
        """
        Determines the query bounding box for a given city following strict precedence:
        1. Stored PostGIS boundary geometry on City or Union of Wards (if available).
        2. Known city bbox catalog (MP_CITY_BBOXES).
        3. Documented center coordinates envelope from database.
        4. If unresolvable, fails explicitly (NEVER falls back silently to Gwalior).
        """
        normalized_slug = city_slug.lower().strip() if city_slug else ""

        # 1. Check City object boundary geometry if present
        if db_city:
            configured = (getattr(db_city, "settings", None) or {}).get("osm_bbox")
            if configured:
                return configured
            if hasattr(db_city, "boundary_geometry") and db_city.boundary_geometry:
                try:
                    from geoalchemy2.shape import to_shape
                    geom = to_shape(db_city.boundary_geometry)
                    minx, miny, maxx, maxy = geom.bounds
                    return [miny, minx, maxy, maxx]
                except Exception as e:
                    logger.warning(f"Could not extract bbox from city boundary_geometry: {e}")

            # Check bbox points if stored
            if (
                hasattr(db_city, "bbox_southwest") and db_city.bbox_southwest and
                hasattr(db_city, "bbox_northeast") and db_city.bbox_northeast
            ):
                try:
                    from geoalchemy2.shape import to_shape
                    sw = to_shape(db_city.bbox_southwest)
                    ne = to_shape(db_city.bbox_northeast)
                    return [sw.y, sw.x, ne.y, ne.x]
                except Exception:
                    pass

        # 2. Check catalog
        if normalized_slug in MP_CITY_BBOXES:
            return MP_CITY_BBOXES[normalized_slug]

        # 3. Center coordinate envelope if available from db_city
        if db_city and hasattr(db_city, "center_latitude") and db_city.center_latitude:
            lat = db_city.center_latitude
            lng = db_city.center_longitude
            return [lat - 0.08, lng - 0.08, lat + 0.08, lng + 0.08]

        # 4. Explicit failure - Never silently fall back to Gwalior
        raise ValueError(f"No query boundary configured for city '{city_slug}'. Cannot query OpenStreetMap.")

    def build_query(self, category: str, bbox: Optional[List[float]] = None) -> str:
        """
        Builds an Overpass QL query string for the given category and bounding box using OSM_CATEGORY_CONFIG.
        """
        if category not in OSM_CATEGORY_CONFIG:
            raise ValueError(f"Unsupported OSM ingestion category '{category}'. Supported: {list(OSM_CATEGORY_CONFIG.keys())}")

        config = OSM_CATEGORY_CONFIG[category]
        if not bbox or len(bbox) != 4:
            raise ValueError("An explicit city query envelope is required")
        s, w, n, e = bbox
        timeout = 35

        filter_lines = "\n  ".join(f"{f}({s},{w},{n},{e});" for f in config["osm_filters"])
        out_directive = "out geom;" if config.get("output_mode") == "geom" else "out body center;"

        return f"""
        [out:json][timeout:{timeout}];
        (
          {filter_lines}
        );
        {out_directive}
        """

    def fetch_raw_data(self, query_params: Dict[str, Any]) -> Any:
        """
        Sends query to Overpass API with exponential backoff and failover across endpoints.
        """
        category = query_params.get("category", "health")
        self.category = category
        bbox = query_params.get("bbox")
        if not bbox:
            city_slug = query_params.get("city_slug", "")
            bbox = self.get_city_bbox(city_slug)

        query = self.build_query(category, bbox)

        headers = {
            "User-Agent": OSM_USER_AGENT,
            "Accept": "application/json"
        }

        last_error = None
        for endpoint in OVERPASS_ENDPOINTS:
            for attempt in range(2):
                try:
                    logger.info(f"Querying Overpass endpoint {endpoint} (attempt {attempt+1}) for category '{category}'")
                    resp = requests.post(
                        endpoint,
                        data={"data": query},
                        headers=headers,
                        timeout=40
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("remark"):
                            raise RuntimeError("Incomplete Overpass query: " + data["remark"])
                        elements = data.get("elements", [])
                        logger.info(f"Successfully received {len(elements)} elements from {endpoint}")
                        return data
                    elif resp.status_code == 429:
                        logger.warning(f"Rate limited by {endpoint}, waiting before retry...")
                        time.sleep(2 * (attempt + 1))
                    else:
                        logger.warning(f"Overpass {endpoint} returned status {resp.status_code}")
                except Exception as e:
                    last_error = e
                    logger.warning(f"Overpass connection to {endpoint} failed: {e}")
                    time.sleep(1)

        raise RuntimeError(f"All Overpass API endpoints failed or timed out: {last_error}")

    def transform_to_features(self, raw_data: Any, layer_id: uuid.UUID, city_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Transforms raw Overpass nodes, ways, and relations into standardized NagarDrishti GISFeature dicts.
        Preserves true source names (or None if unnamed), raw tags, provenance, and accurate geometries.
        """
        elements = raw_data.get("elements", [])
        features: List[Dict[str, Any]] = []
        now_dt = datetime.now(timezone.utc)

        for el in elements:
            el_type = el.get("type")
            el_id = el.get("id")
            tags = el.get("tags", {})

            # Official Source Names: Extract verbatim from source tags without manufacturing synthetic strings
            name_en = tags.get("name:en") or tags.get("name") or None
            # Only set Hindi name if genuine source tag exists; do NOT copy English name to imply a translation
            name_hi = tags.get("name:hi") or None

            # 1. Road LineString Ways
            if getattr(self, "category", None) == "roads" or (el_type == "way" and "highway" in tags and "geometry" in el):
                if el_type != "way" or tags.get("highway") not in ROAD_CLASSES or tags.get("area") == "yes" or "building" in tags:
                    continue
                geom_points = el.get("geometry", [])
                if len(geom_points) >= 2:
                    coordinates = [[pt["lon"], pt["lat"]] for pt in geom_points if "lon" in pt and "lat" in pt]
                    if len(coordinates) >= 2:
                        line = shape({"type": "LineString", "coordinates": coordinates})
                        if not line.is_valid or line.is_empty or line.length == 0:
                            continue
                        highway_class = tags.get("highway", "road")

                        # Only capture verified source-provided highway attributes without inference
                        properties = {
                            "osm_id": str(el_id),
                            "osm_type": "way",
                            "source": "OpenStreetMap",
                            "attribution": "© OpenStreetMap contributors under ODbL license",
                            "license": "ODbL 1.0",
                            "highway": highway_class,
                            "raw_tags": tags
                        }
                        for attr in ("surface", "lanes", "oneway", "maxspeed", "bridge", "tunnel", "ref"):
                            if attr in tags:
                                properties[attr] = tags[attr]

                        features.append({
                            "external_id": f"osm-way-{el_id}",
                            "name_en": name_en,
                            "name_hi": name_hi,
                            "category": "road",
                            "subcategory": highway_class,
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coordinates
                            },
                            "properties": properties,
                            "provenance_type": "community_open",
                            "observed_at": now_dt
                        })
                continue

            # 2. Point Nodes
            lat = None
            lon = None
            if el_type == "node" and "lat" in el and "lon" in el:
                lat = el.get("lat")
                lon = el.get("lon")

            # 3. POI Ways (Building polygons / facility boundaries)
            elif el_type == "way":
                if "center" in el and "lat" in el["center"] and "lon" in el["center"]:
                    lat = el["center"]["lat"]
                    lon = el["center"]["lon"]
                elif "geometry" in el and len(el["geometry"]) > 0:
                    pts = el["geometry"]
                    lat = sum(p["lat"] for p in pts) / len(pts)
                    lon = sum(p["lon"] for p in pts) / len(pts)

            # 4. POI Relations (Multipolygon compounds / campuses)
            elif el_type == "relation":
                if "center" in el and "lat" in el["center"] and "lon" in el["center"]:
                    lat = el["center"]["lat"]
                    lon = el["center"]["lon"]

            # If valid coordinates were extracted for this POI
            if lat is not None and lon is not None:
                category = (
                    tags.get("amenity") or
                    tags.get("healthcare") or
                    tags.get("leisure") or
                    tags.get("tourism") or
                    tags.get("office") or
                    tags.get("historic") or
                    tags.get("railway") or
                    tags.get("natural") or
                    tags.get("man_made") or
                    tags.get("highway") or
                    "civic"
                )
                subcategory = (
                    tags.get("healthcare") or
                    tags.get("school:type") or
                    tags.get("religion") or
                    tags.get("highway") or
                    tags.get("office") or
                    tags.get("leisure")
                )

                properties = {
                    "osm_id": str(el_id),
                    "osm_type": el_type,
                    "source": "OpenStreetMap",
                    "attribution": "© OpenStreetMap contributors under ODbL license",
                    "license": "ODbL 1.0",
                    "amenity": category,
                    "operator": tags.get("operator"),
                    "contact_phone": tags.get("phone") or tags.get("contact:phone"),
                    "website": tags.get("website"),
                    "opening_hours": tags.get("opening_hours"),
                    "wheelchair": tags.get("wheelchair"),
                    "raw_tags": tags
                }

                features.append({
                    "external_id": f"osm-{el_type}-{el_id}",
                    "name_en": name_en,
                    "name_hi": name_hi,
                    "category": category,
                    "subcategory": subcategory,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": properties,
                    "provenance_type": "community_open",
                    "observed_at": now_dt
                })

        return features
