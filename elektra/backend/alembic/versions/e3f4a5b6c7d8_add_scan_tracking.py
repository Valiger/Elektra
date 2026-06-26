"""add_scan_tracking

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-06-16 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # add last_tip_date to users
    op.add_column(
        'users',
        sa.Column('last_tip_date', sa.Date(), nullable=True)
    )

    # create scan_usages table
    op.create_table(
        'scan_usages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('scanned_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_scan_usages_id'),
        'scan_usages',
        ['id'],
        unique=False
    )
    op.create_index(
        op.f('ix_scan_usages_scanned_at'),
        'scan_usages',
        ['scanned_at'],
        unique=False
    )
    op.create_index(
        op.f('ix_scan_usages_user_id'),
        'scan_usages',
        ['user_id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_scan_usages_user_id'), table_name='scan_usages')
    op.drop_index(op.f('ix_scan_usages_scanned_at'), table_name='scan_usages')
    op.drop_index(op.f('ix_scan_usages_id'), table_name='scan_usages')
    op.drop_table('scan_usages')
    op.drop_column('users', 'last_tip_date')
