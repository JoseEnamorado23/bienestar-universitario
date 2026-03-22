from sqlalchemy import String, Integer, Float, ForeignKey, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime, date


class AdditionalHours(Base):
    __tablename__ = "horas_adicionales"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE")
    )
    student = relationship("Student", back_populates="additional_hours")

    hours: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    date_granted: Mapped[date] = mapped_column(Date, nullable=False)

    granted_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    granted_by = relationship("User", foreign_keys=[granted_by_id])

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def __repr__(self):
        return f"<AdditionalHours student={self.student_id} hours={self.hours}>"
