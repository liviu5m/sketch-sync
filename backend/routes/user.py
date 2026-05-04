from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from database import SessionDep
from models import User
from utils import decodeToken

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/jwt")
def getAuthUser(request: Request, session: SessionDep):
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

class UserUpdate(BaseModel):
    username: str

@router.put("/{userId}")
def updateUser(userId, data: UserUpdate, session: SessionDep):
    print(data.username)
    user = session.get(User, userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.username = data.username
    session.add(user)
    session.commit()
    session.refresh(user)
    return "Successfully updated profile"