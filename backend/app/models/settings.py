from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True)  # Ej: "SOCIAL_HOURS_REQUIRED"
    value: Mapped[str] = mapped_column(String(255))  # Almacenamos como string, convertimos según necesidad
    description: Mapped[str | None]
    is_public: Mapped[bool] = mapped_column(default=False)  # Si puede ser visto por estudiantes

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Setting {self.key}={self.value}>"

class SocialHoursConfig(Base):
    __tablename__ = "social_hours_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    required_hours: Mapped[int] = mapped_column(default=120)  # Horas requeridas para todos
    description: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(default=True)  # Para poder tener configuraciones históricas

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<SocialHoursConfig {self.required_hours} hours>"