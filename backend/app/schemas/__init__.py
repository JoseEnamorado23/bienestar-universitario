from app.schemas.auth import *
from app.schemas.users import *
from app.schemas.roles import *
from app.schemas.programs import *
from app.schemas.settings import *
from app.schemas.admin import *  # Nuevo

__all__ = [
    # Auth
    'LoginRequest',
    'RegisterRequest',
    'RefreshTokenRequest',
    'VerifyEmailRequest',
    'ForgotPasswordRequest',
    'ResetPasswordRequest',
    'ResendVerificationRequest',
    'TokenResponse',
    'LoginResponse',
    'MessageResponse',
    'MagicLinkResponse',
    
    # Users
    'UserBase',
    'UserCreate',
    'UserUpdate',
    'UserInDB',
    'UserResponse',
    'StudentBase',
    'StudentCreate',
    'StudentUpdate',
    'StudentInDB',
    'StudentResponse',
    'StudentWithUserResponse',
    
    # Roles & Permissions
    'PermissionBase',
    'PermissionCreate',
    'PermissionResponse',
    'RoleBase',
    'RoleCreate',
    'RoleUpdate',
    'RoleResponse',
    'RoleWithUsers',
    'RolePermissionAssignment',
    'UserPermissionAssignment',
    
    # Programs
    'ProgramBase',
    'ProgramCreate',
    'ProgramUpdate',
    'ProgramResponse',
    'ProgramWithStudents',
    
    # Settings
    'SystemSettingBase',
    'SystemSettingCreate',
    'SystemSettingUpdate',
    'SystemSettingResponse',
    'SocialHoursConfigBase',
    'SocialHoursConfigCreate',
    'SocialHoursConfigResponse',
    
    # Admin - Nuevos
    'AdminCreateRequest',
    'AdminUpdateRequest',
    'AdminChangeRoleRequest',
    'AdminPermissionsUpdateRequest',
    'AdminStatusUpdateRequest',
    'AdminPermissionResponse',
    'AdminResponse',
    'AdminListResponse',
    'RolePermissionDetailResponse',
]