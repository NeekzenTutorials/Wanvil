"""adding places and improve tags system

Revision ID: 7fdcde346fcc
Revises: 9cc809c91ec0
Create Date: 2025-08-18 10:25:22.112269

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7fdcde346fcc'
down_revision = '9cc809c91ec0'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) Tables 'places' et 'place_tags' — créer seulement si absentes
    if "places" not in insp.get_table_names():
        op.create_table(
            "places",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("location", sa.String(length=300), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("images", sa.JSON(), nullable=True),
            sa.Column("content", sa.JSON(), nullable=True),
            sa.Column("collection_id", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["collection_id"], ["collections.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if "place_tags" not in insp.get_table_names():
        op.create_table(
            "place_tags",
            sa.Column("place_id", sa.String(), nullable=False),
            sa.Column("tag_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["place_id"], ["places.id"]),
            sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
            sa.PrimaryKeyConstraint("place_id", "tag_id"),
        )

    # 2) Colonne 'scope' sur tags — compatible SQLite
    cols = {c["name"]: c for c in insp.get_columns("tags")}

    if "scope" not in cols:
        # 2.a ajouter nullable avec default serveur
        op.add_column(
            "tags",
            sa.Column("scope", sa.String(32), nullable=True, server_default="character"),
        )
        # 2.b remplir anciennes lignes
        op.execute("UPDATE tags SET scope='character' WHERE scope IS NULL")
        # 2.c retirer le default & passer NOT NULL (batch = recrée proprement en SQLite)
        with op.batch_alter_table("tags") as batch:
            batch.alter_column(
                "scope",
                existing_type=sa.String(32),
                server_default=None,
                nullable=False,
            )
    else:
        # La colonne existe peut-être mais en NULLABLE → verrouiller NOT NULL
        if cols["scope"].get("nullable", True):
            op.execute("UPDATE tags SET scope='character' WHERE scope IS NULL")
            with op.batch_alter_table("tags") as batch:
                batch.alter_column(
                    "scope",
                    existing_type=sa.String(32),
                    nullable=False,
                )

    # (optionnel) index utile pour les listes/tri
    existing_ix = {ix["name"] for ix in insp.get_indexes("tags")}
    if "ix_tags_collection_scope_name" not in existing_ix:
        op.create_index(
            "ix_tags_collection_scope_name",
            "tags",
            ["collection_id", "scope", "name"],
        )


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # supprimer index si présent
    existing_ix = {ix["name"] for ix in insp.get_indexes("tags")}
    if "ix_tags_collection_scope_name" in existing_ix:
        with op.batch_alter_table("tags") as batch:
            batch.drop_index("ix_tags_collection_scope_name")

    # drop colonne 'scope' si présente (batch pour SQLite)
    cols = {c["name"] for c in insp.get_columns("tags")}
    if "scope" in cols:
        with op.batch_alter_table("tags") as batch:
            batch.drop_column("scope")

    # drop tables en respectant les FK
    if "place_tags" in insp.get_table_names():
        op.drop_table("place_tags")
    if "places" in insp.get_table_names():
        op.drop_table("places")