# SketchSync
SketchSync is a full-stack, room-based collaborative whiteboard application.
It combines a FastAPI backend (authentication, room lifecycle, realtime socket orchestration) with a React + Vite frontend (canvas UI, routing, auth flows, and live collaboration presence).

## What the project does
- Lets authenticated users create or join whiteboard rooms by code.
- Synchronizes drawing actions between connected users in real time via WebSockets.
- Shows live remote cursors and connected users per room.
- Supports sign-up/login (email + password), logout, and Google OAuth login.
- Provides a profile page for username updates.
- Exposes a lightweight monitor socket used on the home page for active room/user counters.

## Core features
### Authentication
- Credential signup and login with password hashing.
- JWT stored in an HTTP-only cookie for session auth.
- Google OAuth login flow with callback handling.
- Protected routes for authenticated-only pages.

### Collaboration and rooms
- Create room endpoint that generates unique room codes.
- Join existing room by entering a code.
- Live drawing sync with multiple shape/tool types:
  - Pen
  - Eraser
  - Rectangle
  - Circle
- Realtime operations:
  - Draw/update stroke
  - Undo last user stroke
  - Redo
  - Clear board
- Presence indicators:
  - Connected users list
  - Realtime cursor movement
  - Home page global counters (active rooms / active users)

### UI/UX
- Styled landing page and auth pages.
- Canvas sidebar for tool selection, color palette, and brush size.
- Header with account dropdown (profile/logout).
- Toast notifications for mutation and auth feedback.

## Tech stack
### Frontend
- React 19 + TypeScript
- Vite
- React Router
- TanStack React Query
- Axios
- React Konva / Konva (canvas drawing)
- Tailwind CSS (v4), shadcn/radix-ui components, lucide icons

### Backend
- FastAPI
- SQLModel + SQLAlchemy
- WebSockets (Starlette/FastAPI)
- Passlib for password hashing
- python-jose for JWT
- Google OAuth libraries (`google-auth`, `google-auth-oauthlib`)

## Project structure
```text
sketch-sync/
├── backend/
│   ├── main.py                # FastAPI app setup, middleware, router mounting
│   ├── run.py                 # Local uvicorn launcher
│   ├── database.py            # Engine/session initialization
│   ├── models.py              # User and Room SQLModel tables
│   ├── utils.py               # JWT, password hashing, room code, color helpers
│   └── routes/
│       ├── auth.py            # Signup/login/logout + Google OAuth routes
│       ├── user.py            # Current user + profile update routes
│       ├── room.py            # Room creation/fetch + basic websocket endpoint
│       └── socket_handler.py  # Main realtime collaboration websocket logic
├── frontend/
│   ├── src/
│   │   ├── components/pages/  # Home, Login, Signup, Profile, Room screens
│   │   ├── components/elements/ # Header, sidebar, loader, remote cursor
│   │   ├── api/               # Axios API wrappers
│   │   ├── lib/               # App context + shared types
│   │   └── App.tsx            # Router/app composition
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## How realtime sync works
1. A user creates or joins a room from the home page.
2. The Room page opens a socket connection to `ws://localhost:8000/ws/{roomId}/{userId}`.
3. Drawing/cursor events are sent as typed socket messages.
4. Backend broadcasts updates to every user in the same room.
5. New users receive current room lines via `REFRESH_LINE`.
6. A monitor socket (`/ws/data`) broadcasts global room/user counts.

## API and websocket surface
### HTTP endpoints
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/google-login`
- `GET /auth/google/callback`
- `GET /api/user/jwt`
- `PUT /api/user/{userId}`
- `POST /api/room/`
- `GET /api/room/{code}`

### WebSocket endpoints
- `GET ws://localhost:8000/ws/data` (monitor: active users/rooms)
- `GET ws://localhost:8000/ws/{roomId}/{userId}` (room collaboration)
- `GET ws://localhost:8000/api/room/ws` (basic echo websocket in room router)

## Environment variables
Create local `.env` files and avoid committing secrets.

### `backend/.env`
Required/used by backend code:
- `DATABASE_URL` (SQLAlchemy-compatible URL, used by SQLModel engine)
- `SECRET_KEY` (JWT signing secret)
- `APP_SECRET_KEY` (session middleware secret)
- `GOOGLE_CLIENT_ID` (for Google OAuth)
- `GOOGLE_CLIENT_SECRET` (for Google OAuth)
- `REDIRECT_URL` (frontend redirect base after OAuth callback)

Example:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
SECRET_KEY=<strong-random-secret>
APP_SECRET_KEY=<strong-random-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
REDIRECT_URL=http://localhost:5173
```

### `frontend/.env`
- `VITE_API_URL` (backend base URL)

Example:
```env
VITE_API_URL=http://localhost:8000
```

## How to run locally
## 1) Backend setup
From `backend/`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlmodel sqlalchemy python-dotenv passlib python-jose google-auth google-auth-oauthlib psycopg2-binary
python run.py
```

Backend runs on `http://localhost:8000`.

## 2) Frontend setup
From `frontend/`:
```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 3) Open and use
- Visit `http://localhost:5173`
- Sign up/login (or use Google login)
- Create a room or join by room code
- Draw collaboratively and watch live updates

## Frontend scripts
From `frontend/`:
- `npm run dev` – start dev server
- `npm run build` – type-check and build
- `npm run lint` – run ESLint
- `npm run preview` – preview production build

## Usage walkthrough
1. Land on home page and authenticate if needed.
2. Create a room or enter an existing code.
3. In the room:
   - Pick drawing tool and color
   - Adjust brush size
   - Draw and collaborate live
   - Use undo/redo/clear controls
   - Open connected users panel
4. Use profile page to update username.

## Data model summary
- `User`
  - `id`, `username`, `email`, `password`, `provider`, `created_at`
- `Room`
  - `id`, `code`, `created_at`

## Notes for contributors
- Realtime line state is maintained in-memory in the websocket manager; restarting backend clears active in-memory room line buffers.
- Room cleanup includes background deletion of empty rooms.
- OAuth dev mode currently enables insecure transport for localhost.
- Some generated/local artifacts are currently tracked in the repository (such as `__pycache__` files and an empty local DB file).
