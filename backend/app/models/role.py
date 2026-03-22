from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None]
    is_system_role: Mapped[bool] = mapped_column(default=False)

    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role")

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())