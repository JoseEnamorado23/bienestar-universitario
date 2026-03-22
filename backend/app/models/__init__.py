from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.models.user import User, UserPermission  # Ambas clases importadas
from app.models.student import Student
from app.models.program import Program
from app.models.token import AuthToken
from app.models.session import Session
from app.models.audit import AuditLog
from app.models.settings import SystemSetting, SocialHoursConfig
from app.models.inventory import Item
from app.models.loan import Loan
from app.models.activity import Activity
from app.models.activity_attendance import ActivityAttendance
from app.models.additional_hours import AdditionalHours

__all__ = [
    'Role',
    'Permission',
    'RolePermission',
    'User',
    'UserPermission',
    'Student',
    'Program',
    'AuthToken',
    'Session',
    'AuditLog',
    'SystemSetting',
    'SocialHoursConfig',
    'Item',
    'Loan',
    'Activity',
    'ActivityAttendance',
]