"""Remove personal data from students table

Revision ID: xxxxxx
Revises: b32c2a172de1
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

revision = 'xxxxxx'
down_revision = 'b32c2a172de1'
branch_labels = None
depends_on = None

def upgrade():
    # Primero, asegurar que los datos existen en users
    op.execute("""
        UPDATE users 
        SET first_name = students.first_name,
            last_name = students.last_name,
            phone = students.phone
        FROM students 
        WHERE users.id = students.user_id 
        AND (users.first_name IS NULL OR users.first_name = '')
    """)
    
    # Luego eliminar columnas de students
    op.drop_column('students', 'first_name')
    op.drop_column('students', 'last_name')
    op.drop_column('students', 'phone')

def downgrade():
    # En caso de revertir, agregar las columnas de nuevo
    op.add_column('students', sa.Column('first_name', sa.String(100), nullable=True))
    op.add_column('students', sa.Column('last_name', sa.String(100), nullable=True))
    op.add_column('students', sa.Column('phone', sa.String(20), nullable=True))