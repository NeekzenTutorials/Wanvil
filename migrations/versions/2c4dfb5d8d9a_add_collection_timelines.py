"""add collection timelines

Revision ID: 2c4dfb5d8d9a
Revises: 0b5373afb684
Create Date: 2025-12-22 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2c4dfb5d8d9a'
down_revision = '0b5373afb684'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'collection_timelines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('collection_id', sa.String(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('collection_id', name='uq_collection_timelines_collection_id'),
    )


def downgrade():
    op.drop_table('collection_timelines')
