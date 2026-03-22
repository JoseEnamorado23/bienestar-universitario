"""Add name fields and verification to users

Revision ID: b32c2a172de1
Revises: 847926dccc84
Create Date: 2026-03-04 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Boolean, DateTime

# revision identifiers, used by Alembic.
revision = 'b32c2a172de1'
down_revision = '847926dccc84'
branch_labels = None
depends_on = None

def upgrade():
    # === PASO 1: Agregar columnas como NULLABLE primero ===
    op.add_column('users', sa.Column('first_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('users', sa.Column('verified_at', sa.DateTime(), nullable=True))
    
    # === PASO 2: Actualizar registros existentes con valores por defecto ===
    # Crear una tabla temporal para la actualización
    users_table = table('users',
        column('first_name', String),
        column('last_name', String)
    )
    
    # Actualizar todos los registros existentes con valores vacíos
    op.execute(
        users_table.update().values(
            first_name='',
            last_name=''
        )
    )
    
    # Para is_verified, establecer a false en todos los registros existentes
    op.execute("UPDATE users SET is_verified = false WHERE is_verified IS NULL")
    
    # === PASO 3: Cambiar columnas a NOT NULL ===
    op.alter_column('users', 'first_name',
                    existing_type=sa.String(100),
                    nullable=False)
    op.alter_column('users', 'last_name',
                    existing_type=sa.String(100),
                    nullable=False)
    op.alter_column('users', 'is_verified',
                    existing_type=sa.Boolean(),
                    nullable=False,
                    server_default='false')
    
    # Nota: phone y verified_at pueden seguir siendo NULL


def downgrade():
    # Eliminar las columnas agregadas
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'verified_at')