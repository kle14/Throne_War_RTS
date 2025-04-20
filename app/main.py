from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="RTS Game API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the absolute path to the frontend directory
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

# Mount the frontend directory to serve static files
app.mount("/game", StaticFiles(directory=os.path.join(frontend_path, "game"), html=True), name="game")
app.mount("/", StaticFiles(directory=os.path.join(frontend_path, "menu"), html=True), name="menu")

@app.get("/api")
async def root():
    return {"message": "Welcome to RTS Game API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
