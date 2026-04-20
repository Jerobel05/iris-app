from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models.email_record import EmailRecord, PipelineStatus
from models.schemas import SuggestionResult, SlotPredictionResult
from services.slot_predictor import predict_slots
from services.ai_suggester import generate_suggestions
from services.auth_service import get_current_user
from models.user import User
import json

router = APIRouter(prefix="/suggest", tags=["AI Suggestions"])


class InlineSuggestBody(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None


@router.post("/{email_id}/slots", response_model=SlotPredictionResult)
def predict_meeting_slots(
    email_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EmailRecord).filter(
        EmailRecord.email_uid == email_id,
        EmailRecord.user_id == current_user.id,
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Email introuvable dans la base")
    if not record.is_appointment:
        raise HTTPException(status_code=400, detail="Cet email n'est pas un rendez-vous")

    slots = predict_slots(
        proposed_slots_raw=record.proposed_slots_raw,
        duration_str=str(record.duration_minutes) + "min" if record.duration_minutes else None,
    )

    record.predicted_slots = json.dumps([s.dict() for s in slots])
    record.pipeline_status = PipelineStatus.predicted
    db.commit()

    return SlotPredictionResult(
        email_id=email_id,
        slots=slots,
        pipeline_status=PipelineStatus.predicted,
    )


@router.post("/{email_id}", response_model=SuggestionResult)
def suggest_reply(
    email_id: str,
    inline: InlineSuggestBody = Body(default=InlineSuggestBody()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EmailRecord).filter(
        EmailRecord.email_uid == email_id,
        EmailRecord.user_id == current_user.id,
    ).first()

    best_slot = None

    if record:
        if record.predicted_slots:
            try:
                slots = json.loads(record.predicted_slots)
                if slots:
                    best_slot = f"{slots[0]['start']} → {slots[0]['end']}"
            except Exception:
                pass
        subject = record.subject or inline.subject or "Réunion"
        body_text = record.body_preview or inline.body or ""
    elif inline.subject or inline.body:
        subject = inline.subject or "Réunion"
        body_text = inline.body or ""
    else:
        raise HTTPException(status_code=404, detail="Email introuvable. Veuillez fournir le contenu de l'email.")

    variants = generate_suggestions(
        email_subject=subject,
        email_body=body_text,
        best_slot=best_slot,
    )

    if record:
        record.suggested_reply = json.dumps([v.dict() for v in variants])
        record.pipeline_status = PipelineStatus.completed
        db.commit()

    return SuggestionResult(
        email_id=email_id,
        variants=variants,
        pipeline_status=PipelineStatus.completed,
    )


@router.get("/pipeline/{email_id}")
def get_pipeline_status(
    email_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(EmailRecord).filter(
        EmailRecord.email_uid == email_id,
        EmailRecord.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Email introuvable")
    return {
        "email_id": email_id,
        "pipeline_status": record.pipeline_status,
        "is_appointment": record.is_appointment,
        "confidence_score": record.confidence_score,
        "has_slots": bool(record.predicted_slots),
        "has_suggestion": bool(record.suggested_reply),
    }
