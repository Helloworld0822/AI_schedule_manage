import os
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi import status
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .auth import get_db
from sqlalchemy.orm import Session

router = APIRouter()

# Scopes for read-only calendar access
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# You must create OAuth 2.0 Client IDs in Google Cloud Console and set these env vars
CLIENT_SECRETS_FILE = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "/secrets/client_secret.json")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/google/callback")


@router.get("/google/login")
def google_login(request: Request):
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=REDIRECT_URI)
    auth_url, _ = flow.authorization_url(access_type="offline", include_granted_scopes="true")
    return RedirectResponse(auth_url)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    # exchange code for credentials
    state = request.query_params.get("state")
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code in callback")
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=REDIRECT_URI)
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Use Calendar API to list calendars
    service = build("calendar", "v3", credentials=creds)
    calendars = service.calendarList().list().execute()

    # return a simple JSON of calendars
    items = calendars.get("items", [])
    simplified = [{"id": c.get("id"), "summary": c.get("summary")} for c in items]
    return {"calendars": simplified}


@router.get("/google/events")
async def google_events(calendarId: str, db: Session = Depends(get_db)):
    # In a full app, credentials would be stored per-user; for demo, read from env path
    creds_path = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if not creds_path or not os.path.exists(creds_path):
        raise HTTPException(status_code=400, detail="No service credentials available")
    creds = Credentials.from_authorized_user_file(creds_path, SCOPES)
    service = build("calendar", "v3", credentials=creds)
    events = service.events().list(calendarId=calendarId, maxResults=50).execute()
    return {"events": events.get("items", [])}
