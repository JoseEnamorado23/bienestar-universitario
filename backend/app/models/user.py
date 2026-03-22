from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.constants import UserStatus
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Identificación única (Cédula)
    national_id: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    
    # Nuevos campos para TODOS los usuarios
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Verificación de email
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(nullable=True)

    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.ACTIVE)
    block_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")

    student = relationship("Student", back_populates="user", uselist=False)
    sessions = relationship("Session", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    auth_tokens = relationship("AuthToken", back_populates="user")
    user_permissions = relationship("UserPermission", back_populates="user")

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.email} ({self.first_name} {self.last_name})>"


class UserPermission(Base):
    __tablename__ = "user_permissions"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    enabled: Mapped[bool] = mapped_column(default=True)

    user = relationship("User", back_populates="user_permissions")
    permission = relationship("Permission", back_populates="user_permissions")
    
    # ✅ ELIMINADA la línea de created_at que causaba el error
    
    def __repr__(self):
        return f"<UserPermission user:{self.user_id} perm:{self.permission_id} enabled:{self.enabled}>"