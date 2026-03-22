import sys
import os

# Ajustar path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.settings import SystemSetting

def seed_settings():
    db = SessionLocal()
    try:
        settings = [
            {"key": "MAX_LOAN_HOURS", "value": "2", "description": "Tiempo máximo de un préstamo en horas"},
            {"key": "MIN_LOAN_MINUTES_TO_COUNT", "value": "15", "description": "Minutos mínimos para contar horas sociales"}
        ]
        
        for s in settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == s["key"]).first()
            if not existing:
                new_setting = SystemSetting(
                    key=s["key"],
                    value=s["value"],
                    description=s["description"],
                    is_public=True
                )
                db.add(new_setting)
                print(f"Propiedad '{s['key']}' añadida.")
            else:
                print(f"Propiedad '{s['key']}' ya existe.")
                
        db.commit()
    except Exception as e:
        print(f"Error seeding settings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_settings()
