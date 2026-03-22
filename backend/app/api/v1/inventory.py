from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user, require_permissions
from app.models.user import User
from app.schemas.inventory import ItemCreate, ItemUpdate, ItemResponse
from app.services.inventory_service import InventoryService

router = APIRouter()

@router.get("/", response_model=List[ItemResponse])
def read_items(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve inventory items. Anyone logged in can see the catalog (for now), but admins will manage it.
    """
    items = InventoryService.get_items(db, skip=skip, limit=limit, status_filter=status)
    return items

@router.post("/", response_model=ItemResponse)
def create_item(
    *,
    db: Session = Depends(get_db),
    item_in: ItemCreate,
    current_user: User = Depends(require_permissions(["inventory:manage"]))
) -> Any:
    """
    Create new inventory item. Require INVENTORY_MANAGE permission.
    """
    item = InventoryService.create_item(db=db, item_in=item_in)
    return item

@router.put("/{id}", response_model=ItemResponse)
def update_item(
    *,
    db: Session = Depends(get_db),
    id: int,
    item_in: ItemUpdate,
    current_user: User = Depends(require_permissions(["inventory:manage"]))
) -> Any:
    """
    Update an inventory item. Require INVENTORY_MANAGE permission.
    """
    item = InventoryService.update_item(db=db, item_id=id, item_in=item_in)
    return item

@router.delete("/{id}", response_model=ItemResponse)
def delete_item(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(require_permissions(["inventory:manage"]))
) -> Any:
    """
    Delete (soft) an inventory item. Require INVENTORY_MANAGE permission.
    """
    item = InventoryService.delete_item(db=db, item_id=id)
    return item
