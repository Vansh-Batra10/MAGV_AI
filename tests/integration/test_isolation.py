"""Tenant isolation at the data-access layer (DESIGN.md section 4)."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import delete, func, select, update

from receptionist.config import load_tenants
from receptionist.db import Database, TenantScopeError
from receptionist.db.models import Booking, Conversation, Tenant
from receptionist.db.tenant_sync import sync_tenants
from tests.conftest import CEDAR, JOLLY, TENANTS_DIR

NOW = datetime(2026, 10, 3, 19, 10, tzinfo=UTC)


def _conversation(tenant_id: str | None = None, **kw: object) -> Conversation:
    fields: dict[str, object] = {
        "channel": "text",
        "config_hash": "h",
        "started_at": NOW,
        "real_started_at": NOW,
        **kw,
    }
    if tenant_id is not None:
        fields["tenant_id"] = tenant_id
    return Conversation(**fields)


@pytest.fixture
async def db(db_url: str) -> Database:
    database = Database(db_url)
    await sync_tenants(database, load_tenants(TENANTS_DIR))
    async with database.tenant_session(JOLLY) as s:
        s.add(_conversation(caller_name="Jolly caller"))
        await s.commit()
    async with database.tenant_session(CEDAR) as s:
        s.add(_conversation(caller_name="Cedar caller"))
        await s.commit()
    yield database
    await database.dispose()


async def test_tenant_sync_creates_rows(db: Database) -> None:
    async with db.system_session() as s:
        ids = set((await s.scalars(select(Tenant.id))).all())
    assert ids == {JOLLY, CEDAR}


async def test_select_and_count_are_scoped(db: Database) -> None:
    async with db.tenant_session(JOLLY) as s:
        rows = (await s.scalars(select(Conversation))).all()
        count = await s.scalar(select(func.count()).select_from(Conversation))
    assert [r.caller_name for r in rows] == ["Jolly caller"]
    assert count == 1


async def test_get_by_primary_key_of_other_tenant_returns_none(db: Database) -> None:
    async with db.tenant_session(CEDAR) as s:
        cedar_id = (await s.scalars(select(Conversation.id))).one()
    async with db.tenant_session(JOLLY) as s:
        assert await s.get(Conversation, cedar_id) is None


async def test_bulk_update_and_delete_are_scoped(db: Database) -> None:
    async with db.tenant_session(JOLLY) as s:
        await s.execute(update(Conversation).values(outcome="spam"))
        await s.execute(delete(Conversation).where(Conversation.caller_name == "Cedar caller"))
        await s.commit()
    async with db.system_session() as s:
        rows = {c.caller_name: c.outcome for c in (await s.scalars(select(Conversation))).all()}
    assert rows == {"Jolly caller": "spam", "Cedar caller": None}


async def test_joins_are_scoped(db: Database) -> None:
    async with db.tenant_session(JOLLY) as s:
        stmt = select(Conversation.caller_name).join(
            Booking, Booking.conversation_id == Conversation.id, isouter=True
        )
        assert (await s.scalars(stmt)).all() == ["Jolly caller"]


async def test_cannot_insert_for_another_tenant(db: Database) -> None:
    async with db.tenant_session(JOLLY) as s:
        s.add(_conversation(tenant_id=CEDAR))
        with pytest.raises(TenantScopeError, match="belongs to tenant"):
            await s.flush()


async def test_insert_without_tenant_id_is_stamped(db: Database) -> None:
    async with db.tenant_session(CEDAR) as s:
        conv = _conversation()
        s.add(conv)
        await s.commit()
        assert conv.tenant_id == CEDAR


async def test_unscoped_session_cannot_touch_tenant_tables(db: Database) -> None:
    async with db.unscoped_session() as s:
        with pytest.raises(TenantScopeError, match="unscoped"):
            await s.scalars(select(Conversation))
        s.add(_conversation(tenant_id=JOLLY))
        with pytest.raises(TenantScopeError, match="unscoped"):
            await s.flush()


async def test_unscoped_session_can_read_system_tables(db: Database) -> None:
    async with db.unscoped_session() as s:
        assert len((await s.scalars(select(Tenant))).all()) == 2


async def test_datetimes_round_trip_as_aware_utc(db: Database) -> None:
    local = datetime(2026, 10, 3, 14, 10, tzinfo=UTC) + timedelta(hours=5)
    async with db.tenant_session(JOLLY) as s:
        conv = _conversation(started_at=local)
        s.add(conv)
        await s.commit()
        cid = conv.id
    async with db.tenant_session(JOLLY) as s:
        loaded = await s.get(Conversation, cid)
    assert loaded is not None
    assert loaded.started_at == local
    assert loaded.started_at.tzinfo is not None
    assert loaded.created_at.tzinfo is not None


async def test_naive_datetime_rejected(db: Database) -> None:
    from sqlalchemy.exc import StatementError

    async with db.tenant_session(JOLLY) as s:
        s.add(_conversation(started_at=datetime(2026, 10, 3, 14, 10)))
        with pytest.raises(StatementError, match="naive datetime"):
            await s.flush()


async def test_one_active_booking_per_conversation(db: Database) -> None:
    from sqlalchemy.exc import IntegrityError

    async with db.tenant_session(JOLLY) as s:
        conv = (await s.scalars(select(Conversation))).one()

        def booking(key: str) -> Booking:
            return Booking(
                conversation_id=conv.id,
                provider="fake",
                idempotency_key=key,
                active_guard=conv.id,
                status="pending",
                start_utc=NOW,
                end_utc=NOW + timedelta(hours=2),
                attendee_name="x",
                attendee_phone_e164="+15125550198",
                service_address="y",
            )

        s.add(booking("k1"))
        await s.commit()
        s.add(booking("k2"))
        with pytest.raises(IntegrityError):
            await s.commit()
