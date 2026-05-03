from xml.etree.ElementTree import tostring

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Response, Request
from google.oauth2 import id_token
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from starlette.responses import RedirectResponse
from models import User
from database import SessionDep
from utils import hashPassword, verifyPassword, createAccessToken
from google_auth_oauthlib.flow import Flow
from google.auth.transport import requests as google_requests
import os
import uuid

REDIRECT_URL=os.getenv("REDIRECT_URL")
client_config = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

SCOPES = ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email","openid"]
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

router = APIRouter(prefix="/auth", tags=["authentication"])

class SignupUserData(BaseModel):
    username: str = Field(min_length=1, description="Username is required")
    email: str = Field(min_length=1, description="Email is required")
    password: str = Field(min_length=8, description="Password is required and at leat 8 chars long")
    passwordConfirmation: str = Field(min_length=8, description="Password Confirmation is required and at leat 8 chars long")
@field_validator('username', 'email', 'password', 'passwordConfirmation')
@classmethod
@router.post("/signup")
def signup(userData: SignupUserData, session: SessionDep):
    if(userData.password != userData.passwordConfirmation):
        raise HTTPException(status_code=400, detail="Passwords do not match")
    statementUserEmail = select(User).where(User.email == userData.email)
    userEmail = session.exec(statementUserEmail).first()
    if(userEmail):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(username=userData.username, email=userData.email, password=hashPassword(userData.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return "user"

class LoginUserData(BaseModel):
    email: str = Field(min_length=1, description="Email is required")
    password: str = Field(min_length=8, description="Password is required and at leat 8 chars long")


@router.post("/login")
def login(userData: LoginUserData, response: Response, session: SessionDep):
    statementUser = select(User).where(User.email == userData.email)
    user = session.exec(statementUser).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect Email or Password")
    if not verifyPassword(userData.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    jwt = createAccessToken(data={"userId": user.id, "email": user.email, "username": user.username})

    response.set_cookie(
        key="jwt",
        value=jwt,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24
    )

    return {"message": "Login successful", "user_id": user.id, "username": user.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("jwt")
    return {"message": "Logged out successfully"}

@router.get("/google-login")
async def login(request: Request):
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    authorization_url, state = flow.authorization_url(prompt='consent')

    request.session['state'] = state
    request.session['code_verifier'] = flow.code_verifier

    return RedirectResponse(authorization_url)


@router.get("/google/callback")
async def callback(request: Request, response: Response, session: SessionDep):
    state = request.session.get('state')
    code_verifier = request.session.get('code_verifier')
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        state=request.session.get('state'),
        redirect_uri=REDIRECT_URI
    )

    flow.code_verifier = code_verifier

    flow.fetch_token(authorization_response=str(request.url))

    credentials = flow.credentials

    request.session.pop('state', None)
    request.session.pop('code_verifier', None)

    try:
        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )
        user_email = id_info.get("email")
        user_name = id_info.get("name")

        userStmt = select(User).where(User.email == user_email)
        userEmail = session.exec(userStmt).first()

        if(userEmail):
            error = "provider_mismatch"
            return RedirectResponse(url=REDIRECT_URL + f"/auth/login?error={error}")

        userStmt = select(User).where(User.email == user_email)
        user = session.exec(userStmt).first()

        if not user:
            user = User(
                username=f"{user_name}_{str(uuid.uuid4())[:8]}",
                email=user_email,
                password=hashPassword(user_email),
                provider="google"
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        elif user.provider != "google":
            return RedirectResponse(url=f"{REDIRECT_URL}/auth/login?error=provider_mismatch")

        jwt = createAccessToken(data={
            "userId": user.id,
            "email": user.email,
            "username": user.username
        })

        response = RedirectResponse(url=REDIRECT_URL)
        response.set_cookie(
            key="jwt",
            value=jwt,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24
        )
        return response

    except ValueError:
        error = "default"
        return RedirectResponse(url=REDIRECT_URL + f"/auth/login?error={error}")
