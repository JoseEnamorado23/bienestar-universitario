from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ItemBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    total_quantity: int = Field(default=0, ge=0)
    image_url: Optional[str] = None
    status: str = Field(default="ACTIVE")

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    total_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    status: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    available_quantity: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
