"""fix_social_hours_schema

Revision ID: 8524e2b1165a
Revises: bd5c2bbc7075
Create Date: 2026-03-06 00:15:35.457361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8524e2b1165a'
down_revision: Union[str, Sequence[str], None] = 'bd5c2bbc7075'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('students', 'social_hours_approved')
    op.alter_column('students', 'social_hours_completed',
               existing_type=sa.Integer(),
               type_=sa.Float(),
               existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('students', 'social_hours_completed',
               existing_type=sa.Float(),
               type_=sa.Integer(),
               existing_nullable=False)
    op.add_column('students', sa.Column('social_hours_approved', sa.INTEGER(), autoincrement=False, nullable=False, server_default=sa.text('0')))
