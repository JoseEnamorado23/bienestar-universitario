from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)

    # Info general
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(300), nullable=True)
    event_datetime = Column(DateTime(timezone=True), nullable=True)
    image_url = Column(String(255), nullable=True)

    # Horas sociales que otorga al asistir
    hours_reward = Column(Float, nullable=False, default=1.0)

    # Estado de la publicación
    status = Column(String(20), nullable=False, default="DRAFT")  # DRAFT, PUBLISHED, FINISHED

    # QR
    qr_type = Column(String(20), nullable=False, default="MANUAL")  # STATIC, DYNAMIC, MANUAL
    qr_token = Column(String(100), nullable=True, index=True, unique=True)
    qr_token_expires_at = Column(DateTime(timezone=True), nullable=True)  # Para STATIC y DYNAMIC
    is_active = Column(Boolean, nullable=False, default=True)  # Para activar/cancelar QR manualmente

    # Validación de ubicación
    require_location = Column(Boolean, nullable=False, default=False)

    # Quién creó la actividad
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    attendances = relationship("ActivityAttendance", back_populates="activity", cascade="all, delete-orphan")
