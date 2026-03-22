"""Add activities and activity_attendances tables

Revision ID: a1b2c3d4e5f6
Revises: 8524e2b1165a
Create Date: 2026-03-18 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3ba51d36d89d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Tabla de actividades
    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=300), nullable=True),
        sa.Column('event_datetime', sa.DateTime(timezone=True), nullable=True),
        sa.Column('image_url', sa.String(length=255), nullable=True),
        sa.Column('hours_reward', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),
        sa.Column('qr_type', sa.String(length=20), nullable=False, server_default='MANUAL'),
        sa.Column('qr_token', sa.String(length=100), nullable=True),
        sa.Column('qr_token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('require_location', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activities_id'), 'activities', ['id'], unique=False)
    op.create_index(op.f('ix_activities_qr_token'), 'activities', ['qr_token'], unique=True)

    # Tabla de asistencias
    op.create_table(
        'activity_attendances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('hours_earned', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('scan_latitude', sa.Float(), nullable=True),
        sa.Column('scan_longitude', sa.Float(), nullable=True),
        sa.Column('scanned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('activity_id', 'student_id', name='uq_activity_student'),
    )
    op.create_index(op.f('ix_activity_attendances_id'), 'activity_attendances', ['id'], unique=False)

    # Insertar configuración de ubicación universitaria (valores por defecto vacíos)
    op.execute("""
        INSERT INTO system_settings (key, value, description, is_public)
        VALUES
            ('UNIVERSITY_LATITUDE',  '', 'Latitud de la sede universitaria para validación de ubicación en actividades', false),
            ('UNIVERSITY_LONGITUDE', '', 'Longitud de la sede universitaria', false),
            ('UNIVERSITY_RADIUS_METERS', '300', 'Radio en metros dentro del cual se aceptan escaneos de QR con validación de ubicación', false)
        ON CONFLICT (key) DO NOTHING;
    """)

    # Insertar permiso activity:manage si no existe
    op.execute("""
        INSERT INTO permissions (code, description)
        VALUES ('activity:manage', 'Gestionar actividades: crear, editar, eliminar y ver asistencias')
        ON CONFLICT (code) DO NOTHING;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_activity_attendances_id'), table_name='activity_attendances')
    op.drop_table('activity_attendances')
    op.drop_index(op.f('ix_activities_qr_token'), table_name='activities')
    op.drop_index(op.f('ix_activities_id'), table_name='activities')
    op.drop_table('activities')
