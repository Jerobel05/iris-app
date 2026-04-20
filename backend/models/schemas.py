from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    regular = "regular"
    admin = "admin"


class PipelineStatus(str, Enum):
    pending = "pending"
    detected = "detected"
    predicted = "predicted"
    completed = "completed"


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class TokenInfo(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class AuthStatus(BaseModel):
    authenticated: bool
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class EmailAddress(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None


class AppointmentInfo(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    subject: Optional[str] = None
    organizer: Optional[str] = None
    attendees: List[str] = []
    description: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    meeting_intent: Optional[str] = None
    timezone: Optional[str] = None
    modality: Optional[str] = None


class ScannedEmail(BaseModel):
    id: str
    subject: str
    sender: EmailAddress
    received_at: str
    preview: str
    body: Optional[str] = None
    is_appointment: bool = False
    appointment: Optional[AppointmentInfo] = None
    calendar_event_created: bool = False
    calendar_event_id: Optional[str] = None
    pipeline_status: PipelineStatus = PipelineStatus.pending


class EmailScanResult(BaseModel):
    total_scanned: int
    appointments_found: int
    emails: List[ScannedEmail]


class RecommendedSlot(BaseModel):
    start: str
    end: str
    score: float = Field(ge=0.0, le=1.0)
    reason: Optional[str] = None


class SlotPredictionResult(BaseModel):
    email_id: str
    slots: List[RecommendedSlot]
    pipeline_status: PipelineStatus


class SuggestionVariant(BaseModel):
    style: str
    subject: str
    body: str


class SuggestionResult(BaseModel):
    email_id: str
    variants: List[SuggestionVariant]
    pipeline_status: PipelineStatus


class CalendarEvent(BaseModel):
    id: str
    subject: str
    start: str
    end: str
    location: Optional[str] = None
    organizer: Optional[str] = None
    body_preview: Optional[str] = None
    is_online_meeting: bool = False
    join_url: Optional[str] = None


class CreateEventRequest(BaseModel):
    email_id: str
    subject: str
    start_datetime: str
    end_datetime: str
    location: Optional[str] = None
    description: Optional[str] = None
    attendees: List[str] = []
    timezone: str = "Europe/Paris"


class CreateEventResponse(BaseModel):
    success: bool
    event_id: Optional[str] = None
    event_url: Optional[str] = None
    message: str


class GmailScanRequest(BaseModel):
    email: str
    app_password: str
    max_emails: int = Field(default=20, ge=1, le=100)


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
