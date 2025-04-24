from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
import os

app = FastAPI(title="Throne Wars RTS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the absolute path to the frontend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(os.path.dirname(current_dir), "frontend")

# Mount static directories
app.mount("/game", StaticFiles(directory=os.path.join(frontend_path, "game"), html=True), name="game")
app.mount("/menu/assets", StaticFiles(directory=os.path.join(frontend_path, "menu", "assets")), name="menu_assets")
app.mount("/menu/css", StaticFiles(directory=os.path.join(frontend_path, "menu", "css")), name="menu_css")
app.mount("/menu/js", StaticFiles(directory=os.path.join(frontend_path, "menu", "js")), name="menu_js")
app.mount("/menu", StaticFiles(directory=os.path.join(frontend_path, "menu"), html=True), name="menu")

# Setup templates
templates = Jinja2Templates(directory=os.path.join(frontend_path))

@app.get("/")
async def root():
    # Redirect to the menu page
    return RedirectResponse(url="/menu/menu.html")

@app.get("/api")
async def api_root():
    return {"message": "Welcome to Throne Wars RTS API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
