from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.inventory import Item
from app.schemas.inventory import ItemCreate, ItemUpdate

class InventoryService:
    @staticmethod
    def create_item(db: Session, item_in: ItemCreate) -> Item:
        db_item = Item(
            name=item_in.name,
            description=item_in.description,
            total_quantity=item_in.total_quantity,
            available_quantity=item_in.total_quantity, # Al inicio, todos están disponibles
            image_url=item_in.image_url,
            status=item_in.status
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def get_items(db: Session, skip: int = 0, limit: int = 100, status_filter: Optional[str] = None) -> List[Item]:
        query = db.query(Item)
        if status_filter:
            query = query.filter(Item.status == status_filter)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_item(db: Session, item_id: int) -> Optional[Item]:
        return db.query(Item).filter(Item.id == item_id).first()

    @staticmethod
    def update_item(db: Session, item_id: int, item_in: ItemUpdate) -> Item:
        db_item = InventoryService.get_item(db, item_id)
        if not db_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El implemento no fue encontrado."
            )

        update_data = item_in.model_dump(exclude_unset=True)
        
        # Lógica especial si cambia total_quantity para ajustar el disponible
        if "total_quantity" in update_data:
            diff = update_data["total_quantity"] - db_item.total_quantity
            new_available = db_item.available_quantity + diff
            
            if new_available < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La nueva cantidad total es menor a la cantidad que está prestada actualmente. Revoque los préstamos primero."
                )
            db_item.available_quantity = new_available

        for field, value in update_data.items():
            setattr(db_item, field, value)

        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def delete_item(db: Session, item_id: int) -> Item:
        db_item = InventoryService.get_item(db, item_id)
        if not db_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El implemento no fue encontrado."
            )
            
        # Soft delete by changing status to INACTIVE.
        db_item.status = "INACTIVE"
        db.commit()
        db.refresh(db_item)
        return db_item
