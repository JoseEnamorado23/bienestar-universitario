from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ActivityAttendance(Base):
    __tablename__ = "activity_attendances"

    id = Column(Integer, primary_key=True, index=True)

    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    hours_earned = Column(Float, nullable=False, default=0.0)

    # Coordenadas del escaneo (para auditoría)
    scan_latitude = Column(Float, nullable=True)
    scan_longitude = Column(Float, nullable=True)

    scanned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    activity = relationship("Activity", back_populates="attendances")
    student = relationship("Student")

    # Cada estudiante solo puede registrar asistencia una vez por actividad
    __table_args__ = (
        UniqueConstraint("activity_id", "student_id", name="uq_activity_student"),
    )
