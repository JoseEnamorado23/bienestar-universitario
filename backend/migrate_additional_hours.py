import sys
sys.path.append("c:\\Users\\PC\\Desktop\\bienestarUniversitario\\backend")

from app.core.database import Base, engine
from app.models import additional_hours  # Make sure it's imported for table creation

# Import all other models to ensure they're registered
from app.models.user import User
from app.models.student import Student
from app.models.loan import Loan
from app.models.settings import SystemSetting
from app.models.additional_hours import AdditionalHours

print("Creating missing tables...")
Base.metadata.create_all(engine, checkfirst=True)
print("Done. Table 'horas_adicionales' created if it didn't exist.")
