from fastapi import APIRouter
from app.api.v1 import auth
from app.api.v1 import admin
from app.api.v1 import inventory
from app.api.v1 import upload
from app.api.v1 import loans
from app.api.v1 import settings
from app.api.v1 import programs
from app.api.v1 import activities
from app.api.v1 import audit

# Router principal de la API v1
api_router = APIRouter(prefix="/api/v1")

# Incluir routers de cada módulo
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(loans.router, prefix="/loans", tags=["loans"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(audit.router)