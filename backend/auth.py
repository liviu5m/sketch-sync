
from fastapi import APIRouter, HTTPException ,Request, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from models import User
from database import SessionDep
from utils import hashPassword, verifyPassword, createAccessToken, decodeToken

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

@router.get("/me")
def get_current_user(request: Request, session: SessionDep):
    token = request.cookies.get("jwt")
    print(token)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decodeToken(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    userId = payload.get("userId")
    if not userId:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = session.get(User, userId)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email
    }