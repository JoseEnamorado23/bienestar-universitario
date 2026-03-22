import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_verification_email(to_email: str, subject: str, token: str, is_admin: bool = False):
    """
    Envía un correo de verificación usando Ethereal (u otro proveedor SMTP configurado).
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        user_type = "Administrador" if is_admin else "Estudiante"
        
        html_content = f"""
        <html>
            <body>
                <h2>Bienvenido al Sistema de Bienestar Universitario</h2>
                <p>Hola,</p>
                <p>Se ha creado una cuenta de {user_type} para este correo electrónico.</p>
                <p>Para activar tu cuenta y establecer tu contraseña, por favor haz clic en el siguiente enlace de verificación:</p>
                <p><a href="{verify_url}" style="display:inline-block;padding:10px 20px;background-color:#6366f1;color:white;text-decoration:none;border-radius:5px;">Verificar Mi Cuenta</a></p>
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p>{verify_url}</p>
                <br>
                <p>Saludos,<br>El equipo de Bienestar Universitario</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, "html"))

        # Conectar al servidor SMTP y enviar
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            
        print(f"✅ Email enviado exitosamente a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email a {to_email}: {str(e)}")
        return False

def send_admin_role_permission_update_email(to_email: str, first_name: str, new_role_name: str, total_permissions: int):
    """
    Envía un correo de notificación cuando cambian los permisos o el rol de un administrador.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Tus permisos de sistema han sido actualizados"
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        html_content = f"""
        <html>
            <body>
                <h2>Actualización de Permisos</h2>
                <p>Hola {first_name},</p>
                <p>Te informamos que un Super Administrador ha actualizado tus accesos en el Sistema de Bienestar Universitario.</p>
                <p><strong>Tu nuevo rol base es:</strong> {new_role_name}</p>
                <p><strong>Total de permisos efectivos asignados:</strong> {total_permissions}</p>
                <p>Si tienes alguna duda o no reconoces estos cambios, por favor comunícate con el administrador general del sistema.</p>
                <br>
                <p>Saludos,<br>El equipo de Bienestar Universitario</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            
        print(f"✅ Email de actualización de permisos enviado exitosamente a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email de permisos a {to_email}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
