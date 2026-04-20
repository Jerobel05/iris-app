from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class PipelineStatus(str, enum.Enum):
    pending = "pending"
    detected = "detected"
    predicted = "predicted"
    completed = "completed"


class EmailRecord(Base):
    __tablename__ = "email_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email_uid = Column(String, index=True)
    subject = Column(String)
    sender = Column(String)
    received_at = Column(String)
    body_preview = Column(Text)
    source = Column(String, default="gmail")

    pipeline_status = Column(Enum(PipelineStatus), default=PipelineStatus.pending)

    is_appointment = Column(Boolean, default=False)
    confidence_score = Column(Float, default=0.0)
    meeting_intent = Column(String, nullable=True)
    proposed_slots_raw = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    timezone = Column(String, nullable=True)
    modality = Column(String, nullable=True)
    participants = Column(Text, nullable=True)
    organizer = Column(String, nullable=True)

    predicted_slots = Column(Text, nullable=True)
    suggested_reply = Column(Text, nullable=True)
    calendar_event_id = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="email_records")
