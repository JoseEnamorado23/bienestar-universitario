import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.settings import SystemSetting

db = SessionLocal()
settings = db.query(SystemSetting).all()
for s in settings:
    print(f"Key: {s.key}, Value: {s.value}")
