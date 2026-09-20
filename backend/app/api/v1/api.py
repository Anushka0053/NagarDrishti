from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    admin_units,
    cities,
    layers,
    features,
    sources,
    spatial,
    feedback,
    intelligence,
    ai,
    admin,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="", tags=["System"])
api_router.include_router(admin_units.router, prefix="/admin-units", tags=["Admin Units"])
api_router.include_router(cities.router, prefix="/cities", tags=["Cities"])
api_router.include_router(layers.router, prefix="/layers", tags=["Layers"])
api_router.include_router(features.router, prefix="/features", tags=["Features"])
api_router.include_router(sources.router, prefix="/sources", tags=["Data Sources"])
api_router.include_router(spatial.router, prefix="/spatial", tags=["Spatial Analysis"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Citizen Feedback"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Civic Intelligence"])
api_router.include_router(ai.router, prefix="/ai", tags=["Sarvam AI"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin & ETL"])
