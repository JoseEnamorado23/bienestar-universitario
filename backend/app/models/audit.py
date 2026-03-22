from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    user = relationship("User", back_populates="audit_logs")

    action: Mapped[str]
    entity_type: Mapped[str]
    entity_id: Mapped[int | None]
    ip_address: Mapped[str | None]

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())