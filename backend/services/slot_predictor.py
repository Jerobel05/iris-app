from datetime import datetime, timedelta
import re
from typing import List, Optional
from models.schemas import RecommendedSlot

WORK_START = 9
WORK_END = 18
LOOK_AHEAD_DAYS = 14
SLOT_DURATION_DEFAULT = 60


def parse_duration_minutes(duration_str: Optional[str]) -> int:
    if not duration_str:
        return SLOT_DURATION_DEFAULT
    m = re.search(r'(\d+)\s*h', duration_str, re.IGNORECASE)
    if m:
        return int(m.group(1)) * 60
    m = re.search(r'(\d+)\s*min', duration_str, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return SLOT_DURATION_DEFAULT


def extract_preferred_times(proposed_slots_raw: Optional[str]) -> List[int]:
    if not proposed_slots_raw:
        return []
    hours = []
    for match in re.finditer(r'\b(\d{1,2})h?:?(\d{0,2})\b', proposed_slots_raw):
        hour = int(match.group(1))
        if WORK_START <= hour < WORK_END:
            hours.append(hour)
    return list(set(hours))


def generate_candidate_slots(
    duration_minutes: int = SLOT_DURATION_DEFAULT,
    preferred_hours: List[int] = None,
    timezone_str: str = "Europe/Paris",
    busy_slots: List[dict] = None,
) -> List[RecommendedSlot]:
    preferred_hours = preferred_hours or []
    busy_slots = busy_slots or []
    candidates = []
    base = datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

    for day_offset in range(1, LOOK_AHEAD_DAYS + 1):
        day = base + timedelta(days=day_offset)
        if day.weekday() >= 5:
            continue
        for hour in range(WORK_START, WORK_END):
            slot_start = day.replace(hour=hour)
            slot_end = slot_start + timedelta(minutes=duration_minutes)
            if slot_end.hour > WORK_END:
                continue
            is_busy = any(
                s.get("start") <= slot_start.isoformat() < s.get("end", "")
                for s in busy_slots
            )
            if is_busy:
                continue
            score = 0.5
            if hour in preferred_hours:
                score += 0.4
            if 10 <= hour <= 11 or 14 <= hour <= 16:
                score += 0.1
            score = min(score, 1.0)
            candidates.append(RecommendedSlot(
                start=slot_start.isoformat(),
                end=slot_end.isoformat(),
                score=round(score, 2),
                reason="Créneau proposé dans l'email" if hour in preferred_hours else "Horaire de travail standard",
            ))

    candidates.sort(key=lambda s: s.score, reverse=True)
    return candidates[:10]


def predict_slots(
    proposed_slots_raw: Optional[str] = None,
    duration_str: Optional[str] = None,
    busy_slots: List[dict] = None,
) -> List[RecommendedSlot]:
    duration = parse_duration_minutes(duration_str)
    preferred = extract_preferred_times(proposed_slots_raw)
    return generate_candidate_slots(
        duration_minutes=duration,
        preferred_hours=preferred,
        busy_slots=busy_slots or [],
    )
