# quick_test.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, verify_token
)

def test_config():
    """Prueba que la configuración cargue correctamente"""
    print("✅ Configuración cargada:")
    print(f"  - DATABASE_URL: {settings.DATABASE_URL[:20]}...")
    print(f"  - ACCESS_TOKEN_EXPIRE_MINUTES: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    print(f"  - FRONTEND_URL: {settings.FRONTEND_URL}")

def test_password_hashing():
    """Prueba el hashing de contraseñas"""
    password = "MiContraseñaSegura123!"
    
    # Hash
    hashed = get_password_hash(password)
    print(f"\n✅ Hash generado: {hashed[:50]}...")
    
    # Verificación correcta
    assert verify_password(password, hashed) == True
    print("✅ Verificación de contraseña correcta")
    
    # Verificación incorrecta
    assert verify_password("wrong_password", hashed) == False
    print("✅ Verificación de contraseña incorrecta funciona")

def test_jwt_tokens():
    """Prueba la creación y verificación de tokens"""
    user_data = {"sub": "test@example.com", "user_id": 1}
    
    # Access token
    access_token = create_access_token(user_data)
    print(f"\n✅ Access token: {access_token[:50]}...")
    
    # Verificar access token
    payload = verify_token(access_token, "access")
    assert payload is not None
    assert payload["sub"] == "test@example.com"
    assert payload["user_id"] == 1
    print("✅ Access token verificado correctamente")
    
    # Refresh token
    refresh_token = create_refresh_token(user_data)
    print(f"✅ Refresh token: {refresh_token[:50]}...")
    
    # Verificar refresh token
    payload = verify_token(refresh_token, "refresh")
    assert payload is not None
    assert payload["sub"] == "test@example.com"
    print("✅ Refresh token verificado correctamente")
    
    # Magic link
    magic_token = create_magic_link_token("test@example.com")
    print(f"✅ Magic link token: {magic_token[:50]}...")
    
    payload = verify_token(magic_token, "magic_link")
    assert payload is not None
    assert payload["sub"] == "test@example.com"
    print("✅ Magic link token verificado correctamente")

if __name__ == "__main__":
    print("🔧 Probando configuración del sistema...\n")
    
    try:
        test_config()
        test_password_hashing()
        test_jwt_tokens()
        print("\n🎉 ¡Todas las pruebas pasaron correctamente!")
    except Exception as e:
        print(f"\n❌ Error en pruebas: {e}")
        raise