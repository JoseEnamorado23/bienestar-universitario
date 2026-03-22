import os
import shutil
import uuid
from typing import Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.api.dependencies import get_current_user
from fastapi import Depends
from app.models.user import User
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = "uploads"

@router.post("/image", response_model=Dict[str, Any])
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Subir una imagen local. Solo para usuarios con roles administrativos o estudiantes subiendo evidencias.
    """
    # Allowed formats
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WEBP)."
        )
        
    # Generate random unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al guardar el archivo."
        )
        
    # Generate public URL (assumes the server hosts it under /uploads mount)
    # the frontend must prepend the backend base URL or relative root
    public_url = f"/uploads/{filename}"
    
    return {
        "message": "Imagen subida exitosamente.",
        "url": public_url,
        "filename": filename
    }
