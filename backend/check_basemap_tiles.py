import requests

urls = {
    "carto_dark": "https://a.basemaps.cartocdn.com/dark_all/12/3067/1638@2x.png",
    "carto_light": "https://a.basemaps.cartocdn.com/light_all/12/3067/1638@2x.png",
    "carto_voyager": "https://a.basemaps.cartocdn.com/rastertiles/voyager/12/3067/1638@2x.png",
    "osm_standard": "https://a.tile.openstreetmap.org/12/3067/1638.png",
    "esri_satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1638/3067",
    "opentopo": "https://a.tile.opentopomap.org/12/3067/1638.png"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print("=================== BASEMAP TILE REQUEST AUDIT ===================")
for name, url in urls.items():
    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"[{name}] Status: {r.status_code} | Content-Type: {r.headers.get('Content-Type')} | Size: {len(r.content)} bytes")
        if r.status_code != 200:
            print(f"   Response text: {r.text[:200]}")
    except Exception as e:
        print(f"[{name}] Error: {e}")
print("==================================================================")
