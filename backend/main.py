from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes.auth import router as authRouter
from routes.user import router as userRouter
from routes.room import router as roomRouter, getRoom
from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' # REMOVE IN PRODUCTION -----------------------------------------------------------------------------------
load_dotenv()
app = FastAPI(title="SketchSync API")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("APP_SECRET_KEY"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(authRouter)
app.include_router(userRouter)
app.include_router(roomRouter)

@app.get("/")
def get():
    return {"Hello": "World"}

