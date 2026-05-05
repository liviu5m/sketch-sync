from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select
from datetime import datetime
from sqlalchemy import Column, DateTime, func
from utils import generate_room_code

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, nullable=False)
    email: str = Field(index=True, unique=True, nullable=False)
    password: str = Field(nullable=False, min_length=8)
    provider: str = Field(default="credentials")
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.current_timestamp())
    )

class Room(SQLModel, table=True):
    __tablename__ = "rooms"
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(
        default_factory=generate_room_code,
        unique=True,
        index=True,
        nullable=False
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.current_timestamp())
    )
