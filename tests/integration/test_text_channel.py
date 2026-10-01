"""Text channel E2E through HTTP, with the scripted LLM and the fake calendar."""

from fastapi.testclient import TestClient

from receptionist.adapters.llm.scripted import ScriptedLLM, call, say
from receptionist.main import create_app
from tests.conftest import ROOT, make_settings


def _app(db_url: str, steps: list) -> TestClient:  # type: ignore[type-arg]
    settings = make_settings(
        app_env="demo",
        database_url=db_url,
        demo_now="2026-10-03T14:10",
        demo_clock_mode="frozen",
        locales_dir=ROOT / "locales",
    )
    return TestClient(create_app(settings, llm=ScriptedLLM(steps, model="claude-haiku-4-5")))


def test_chat_round_trip_and_debug(db_url: str) -> None:
    steps = [
        call("classify_urgency", urgency="urgent", reason="AC out"),
        say("Oh no. Let's get that fixed. What's your name?"),
    ]
    with _app(db_url, steps) as client:
        r = client.post("/v1/chat/jolly-brothers-round-rock", json={})
        assert r.status_code == 200
        body = r.json()
        sid = body["session_id"]
        assert body["messages"][0]["text"].startswith("Hi, thanks for calling Jolly Brothers")

        r = client.post(
            "/v1/chat/jolly-brothers-round-rock",
            json={"session_id": sid, "message": "my AC is dead"},
        )
        assert r.status_code == 200
        assert r.json()["messages"][-1]["text"] == "Oh no. Let's get that fixed. What's your name?"

        d = client.get(f"/v1/chat/jolly-brothers-round-rock/sessions/{sid}/debug").json()
        assert d["clock"] == {
            "source": "demo",
            "local_now": "Sat Oct 03, 02:10 PM CDT",
            "open_now": False,
        }
        assert d["state"]["phase"] == "COLLECT"
        assert [t["name"] for t in d["tools"]] == ["classify_urgency"]
        assert d["turns"][0]["first_audible_ms"] is not None
        assert [m["role"] for m in d["transcript"]] == ["agent", "user", "agent"]

        page = client.get("/chat/jolly-brothers-round-rock")
        assert page.status_code == 200 and "Tool timeline" in page.text
        assert "Demo clock: Sat Oct 03, 02:10 PM CDT" in page.text


def test_errors(db_url: str) -> None:
    with _app(db_url, [call("end_conversation", reason="completed")]) as client:
        assert client.post("/v1/chat/nope", json={}).status_code == 404
        r = client.post(
            "/v1/chat/jolly-brothers-round-rock", json={"session_id": "missing", "message": "hi"}
        )
        assert r.status_code == 404
        sid = client.post("/v1/chat/jolly-brothers-round-rock", json={}).json()["session_id"]
        assert (
            client.post(
                "/v1/chat/jolly-brothers-round-rock", json={"session_id": sid, "message": "bye"}
            ).json()["ended"]
            is True
        )
        again = client.post(
            "/v1/chat/jolly-brothers-round-rock", json={"session_id": sid, "message": "hello?"}
        )
        assert again.status_code == 409


def test_tenant_isolation_over_http(db_url: str) -> None:
    with _app(db_url, []) as client:
        sid = client.post("/v1/chat/jolly-brothers-round-rock", json={}).json()["session_id"]
        assert client.get(f"/v1/chat/cedar-ridge-denver/sessions/{sid}/debug").status_code == 404
        r = client.post("/v1/chat/cedar-ridge-denver", json={"session_id": sid, "message": "hi"})
        assert r.status_code == 404


def test_debug_hidden_in_production(db_url: str) -> None:
    settings = make_settings(
        app_env="production", database_url=db_url, log_hash_salt="x", locales_dir=ROOT / "locales"
    )
    with TestClient(create_app(settings, llm=ScriptedLLM([]))) as client:
        sid = client.post("/v1/chat/jolly-brothers-round-rock", json={}).json()["session_id"]
        assert (
            client.get(f"/v1/chat/jolly-brothers-round-rock/sessions/{sid}/debug").status_code
            == 404
        )
        assert "Tool timeline" not in client.get("/chat/jolly-brothers-round-rock").text
