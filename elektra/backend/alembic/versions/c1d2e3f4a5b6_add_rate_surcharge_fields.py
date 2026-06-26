"""Add rate and surcharge fields to bills

Revision ID: c1d2e3f4a5b6
Revises: b7d1a2f3c4e5
Create Date: 2026-04-29 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'c1d2e3f4a5b6'
down_revision = 'b7d1a2f3c4e5'
branch_labels = None
depends_on = None

NEW_COLS = [
    'gen_charge_rate',
    'transdel_charge_rate',
    'system_loss_rate',
    'distsys_charge_rate',
    'supplysys_charge_rate',
    'mtrngsys_charge_rate',
    'cb_surcharge',
    'cb_vat_surcharge',
    'total_amt_after_due',
]


def upgrade() -> None:
    for col in NEW_COLS:
        op.add_column(
            'bills',
            sa.Column(col, sa.Float(), nullable=True)
        )


def downgrade() -> None:
    for col in reversed(NEW_COLS):
        op.drop_column('bills', col)
