from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from typing import List

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True
    )
    user = relationship("User", back_populates="student")

    # ❌ ELIMINAR estos campos (ya están en User)
    # first_name: Mapped[str] = mapped_column(String(100))  ← QUITAR
    # last_name: Mapped[str] = mapped_column(String(100))   ← QUITAR
    # phone: Mapped[str | None]                              ← QUITAR
    
    # ✅ Solo datos específicos de estudiante
    national_id: Mapped[str] = mapped_column(String(20), unique=True)
    program_id: Mapped[int | None] = mapped_column(ForeignKey("programs.id"))
    program = relationship("Program", back_populates="students")

    @property
    def first_name(self):
        return self.user.first_name if self.user else ""

    @property
    def last_name(self):
        return self.user.last_name if self.user else ""

    @property
    def document_id(self):
        return self.national_id

    @property
    def program_name(self):
        return self.program.name if self.program else "Sin Programa"

    @property
    def email(self):
        return self.user.email if self.user else ""

    @property
    def phone(self):
        return self.user.phone if self.user else ""

    social_hours_completed: Mapped[float] = mapped_column(default=0.0)

    additional_hours = relationship("AdditionalHours", back_populates="student", cascade="all, delete-orphan")

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
