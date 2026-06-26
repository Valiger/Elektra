"""add budget_goal and kwh_limit to users

Revision ID: a1b2c3d4e5f6
Revises: 0937318016e8
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0937318016e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('budget_goal', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('kwh_limit', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'kwh_limit')
    op.drop_column('users', 'budget_goal')
