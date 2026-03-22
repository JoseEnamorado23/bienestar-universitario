from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Admin who approved/created
    
    status = Column(String(20), nullable=False, default="SOLICITADO") # SOLICITADO, ACTIVO, VENCIDO, DEVUELTO
    
    start_time = Column(DateTime(timezone=True), nullable=True)
    expected_return_time = Column(DateTime(timezone=True), nullable=True)
    returned_time = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    
    hours_earned = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    item = relationship("Item")
    student = relationship("Student")
    issuer = relationship("User", foreign_keys=[issued_by_id])
