"""adding chapter annotations

Revision ID: 3fe7df0ee67b
Revises: 7f0d2b4cf9f9
Create Date: 2025-08-20 14:40:47.238064
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3fe7df0ee67b'
down_revision = '7f0d2b4cf9f9'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite-friendly: JSON portable
    with op.batch_alter_table('chapters') as batch_op:
        batch_op.add_column(sa.Column('annotations', sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table('chapters') as batch_op:
        batch_op.drop_column('annotations')
