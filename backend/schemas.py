from typing import Optional
from pydantic import BaseModel


class ScheduleIn(BaseModel):
    start: str
    end: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = 'appointment'


class ScheduleOut(BaseModel):
    id: int
    start: str
    end: str
    title: str
    description: Optional[str]
    category: str
    created_at: Optional[str]

    class Config:
        orm_mode = True
