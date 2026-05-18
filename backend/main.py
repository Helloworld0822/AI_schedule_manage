from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Schedule Manage - Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic request/response model
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    priority: int = 0

# Simple in-memory store for demonstration
_db: dict[int, Item] = {}
_next_id = 1

# Dependency example
def common_query_params(q: Optional[str] = None, limit: int = 10):
    return {"q": q, "limit": limit}

# Background task example
def write_log(message: str) -> None:
    with open("app.log", "a") as f:
        f.write(message + "\n")

@app.on_event("startup")
async def on_startup():
    # startup tasks like DB connection would go here
    write_log("startup")

@app.on_event("shutdown")
async def on_shutdown():
    write_log("shutdown")

@app.get("/", tags=["health"])
async def read_root():
            return {"status": "ok", "service": "AI Schedule Manage"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)