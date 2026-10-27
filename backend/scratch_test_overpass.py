import requests

q = """
[out:json][timeout:25];
(
  nwr["amenity"="hospital"](26.14,78.10,26.30,78.26);
);
out geom center;
"""

r = requests.post(
    "https://overpass-api.de/api/interpreter",
    data={"data": q},
    headers={"User-Agent": "NagarDrishti/1.0"}
)
print("Status:", r.status_code)
data = r.json()
elements = data.get("elements", [])
print("Count:", len(elements))
for e in elements:
    if e.get("type") in ("way", "relation"):
        print(f"[{e.get('type')}] id={e.get('id')}, name={e.get('tags', {}).get('name')}, has_geom={'geometry' in e}, has_center={'center' in e}")
