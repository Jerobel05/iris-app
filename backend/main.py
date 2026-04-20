import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from config import settings
from database import init_db
from routers import auth, emails, calendar, gmail
from routers import users, suggestions

app = FastAPI(
    title="Iris Backend API",
    description=(
        "Backend pour Iris — extraction intelligente d'emails (Gmail/Outlook), "
        "détection de rendez-vous par NLP, prédiction de créneaux et suggestions de réponses IA."
    ),
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=3600 * 8,
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(gmail.router, prefix="/api")
app.include_router(suggestions.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
@app.get("/api/healthz")
async def health_check():
    return {"status": "ok", "service": "iris-backend", "version": "2.0.0"}


@app.get("/api")
async def root():
    return {
        "message": "Iris Backend API v2",
        "docs": "/api/docs",
        "endpoints": {
            "users": {
                "register": "POST /api/users/register",
                "login": "POST /api/users/login",
                "me": "GET /api/users/me",
            },
            "auth": {
                "login_outlook": "GET /api/auth/login",
                "callback": "GET /api/auth/callback",
                "status": "GET /api/auth/status",
            },
            "gmail": {
                "scan": "POST /api/gmail/scan",
                "appointments": "POST /api/gmail/appointments",
                "setup_guide": "GET /api/gmail/setup-guide",
            },
            "emails": {
                "scan_outlook": "GET /api/emails/scan",
                "appointments_outlook": "GET /api/emails/appointments",
            },
            "suggestions": {
                "predict_slots": "POST /api/suggest/{email_id}/slots",
                "suggest_reply": "POST /api/suggest/{email_id}",
                "pipeline_status": "GET /api/suggest/pipeline/{email_id}",
            },
            "calendar": {
                "events": "GET /api/calendar/events",
                "create": "POST /api/calendar/events",
            },
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=False)
