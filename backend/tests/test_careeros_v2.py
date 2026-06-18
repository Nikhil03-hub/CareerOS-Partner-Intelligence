"""CareerOS v2 backend tests.
Covers auth (6 demo roles + pending account), role isolation, public stats,
institutions, DSA/aptitude/ATS/interviews, placements, applications,
jobs/recruiters/talent-pool, announcements, MOU, admin panel + approvals.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://career-os-nexus.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
PWD = "careeros2026"

DEMO = {
    "admin": "admin@careeros.app",
    "institution": "institution@kmit.in",
    "tpo": "tpo@kmit.in",
    "faculty": "faculty@kmit.in",
    "student": "student@kmit.in",
    "recruiter": "recruiter@amazon.com",
    "pending": "tpo@vasavi.ac.in",
}

# ---------- helpers ----------
def _login(email, password=PWD):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    return s, r


@pytest.fixture(scope="module")
def admin_session():
    s, r = _login(DEMO["admin"])
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def tpo_session():
    s, r = _login(DEMO["tpo"])
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def student_session():
    s, r = _login(DEMO["student"])
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def recruiter_session():
    s, r = _login(DEMO["recruiter"])
    assert r.status_code == 200, r.text
    return s


# ---------- health & public ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_public_landing_stats():
    r = requests.get(f"{API}/public/landing-stats")
    assert r.status_code == 200
    data = r.json()
    years = data["years"]
    yset = {y["academic_year"] for y in years}
    assert "2025-26" in yset
    assert "2017-18" in yset
    y25 = next(y for y in years if y["academic_year"] == "2025-26")
    assert y25["offers"] >= 700  # ~702
    assert y25["companies"] >= 140  # ~148
    assert isinstance(data["top_recruiters"], list) and len(data["top_recruiters"]) > 0
    assert data["totals"]["institutions"] >= 6
    assert data["totals"]["students"] >= 400


# ---------- auth: all 6 roles + pending ----------
@pytest.mark.parametrize("role,email,expected_role", [
    ("admin", DEMO["admin"], "super_admin"),
    ("institution", DEMO["institution"], "institution_admin"),
    ("tpo", DEMO["tpo"], "tpo"),
    ("faculty", DEMO["faculty"], "faculty"),
    ("student", DEMO["student"], "student"),
    ("recruiter", DEMO["recruiter"], "recruiter"),
])
def test_login_each_role(role, email, expected_role):
    s, r = _login(email)
    assert r.status_code == 200, f"{role} login failed: {r.text}"
    body = r.json()
    assert body["user"]["email"] == email
    assert body["user"]["role"] == expected_role
    # cookie set
    assert "session_token" in s.cookies
    # /auth/me with cookie
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json()["role"] == expected_role


def test_login_pending_account():
    s, r = _login(DEMO["pending"])
    assert r.status_code == 200
    assert r.json()["user"]["approved"] is False


def test_login_wrong_password():
    s, r = _login(DEMO["tpo"], password="wrong-pw")
    assert r.status_code == 401


# ---------- RBAC isolation ----------
def test_tpo_cannot_access_admin(tpo_session):
    r = tpo_session.get(f"{API}/admin/platform-stats")
    assert r.status_code == 403


def test_admin_can_access_admin(admin_session):
    r = admin_session.get(f"{API}/admin/platform-stats")
    assert r.status_code == 200
    data = r.json()
    for key in ("institutions", "students", "applications", "jobs_open", "recruiters", "estimated_mrr_inr", "by_type"):
        assert key in data


# ---------- institutions ----------
def test_institutions_admin_sees_all(admin_session):
    r = admin_session.get(f"{API}/institutions")
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 6


def test_institutions_tpo_only_own(tpo_session):
    r = tpo_session.get(f"{API}/institutions")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["institution_id"] == "inst_kmit"


# ---------- DSA ----------
def test_dsa_topics():
    r = requests.get(f"{API}/dsa/topics")
    assert r.status_code == 200
    topics = r.json()["topics"]
    assert len(topics) == 19
    codes = {t["code"] for t in topics}
    expected = {"BASICS", "SORTING", "ARRAYS", "BIN_SEARCH", "STR_BASIC", "LL", "RECURSION",
                "BIT_MANIP", "STACK", "SLIDING", "HEAP", "GREEDY", "TREE", "BST", "GRAPH",
                "DP", "TRIES", "STR_ADV", "MATHS"}
    assert expected.issubset(codes)
    assert r.json()["total"] == 455


def test_dsa_intelligence_tpo(tpo_session):
    r = tpo_session.get(f"{API}/dsa/intelligence")
    assert r.status_code == 200
    data = r.json()
    assert len(data["by_topic"]) == 19
    assert data["total_problems"] == 455
    assert len(data["leaderboard"]) == 20


# ---------- student personal dashboard + DSA toggle ----------
def test_student_dashboard(student_session):
    r = student_session.get(f"{API}/me/dashboard")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["student"]["name"]
    assert len(d["dsa"]) == 19
    assert d["dsa_total"] == 455
    assert isinstance(d["aptitude"], list)
    assert isinstance(d["interviews"], list)
    assert isinstance(d["applications"], list)
    assert isinstance(d["recommended_jobs"], list)
    assert isinstance(d["topics"], list)


def test_student_dsa_toggle(student_session):
    before = student_session.get(f"{API}/me/dashboard").json()
    arr_before = next(r for r in before["dsa"] if r["topic_code"] == "ARRAYS")
    r = student_session.post(f"{API}/me/dsa/toggle", json={"topic_code": "ARRAYS", "delta": 1})
    assert r.status_code == 200
    assert r.json()["solved"] >= arr_before["solved"]


# ---------- aptitude / ATS / interviews ----------
def test_aptitude_intelligence(tpo_session):
    r = tpo_session.get(f"{API}/aptitude/intelligence")
    assert r.status_code == 200
    sections = r.json()["by_section"]
    codes = {s["_id"] for s in sections}
    assert {"QUANT", "REASON", "VERBAL", "DI"}.issubset(codes)


def test_ats_intelligence(tpo_session):
    r = tpo_session.get(f"{API}/ats/intelligence")
    assert r.status_code == 200
    d = r.json()
    assert d["avg_score"] > 0
    assert isinstance(d["rows"], list)


def test_interviews_intelligence(tpo_session):
    r = tpo_session.get(f"{API}/interviews/intelligence")
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["rows"], list)
    assert "avg_confidence" in d and "avg_technical" in d


# ---------- placements ----------
def test_placements_overview(tpo_session):
    r = tpo_session.get(f"{API}/placements/overview")
    assert r.status_code == 200
    d = r.json()
    assert len(d["year_summaries"]) >= 9
    assert len(d["records"]) > 0
    assert isinstance(d["top_recruiters"], list)
    dept_names = {x["department"] for x in d["department_breakdown"]}
    expected_some = {"CSE", "IT", "ECE"}
    assert expected_some.issubset(dept_names) or len(dept_names) >= 3


# ---------- applications ----------
def test_applications_list_and_pipeline(tpo_session):
    r = tpo_session.get(f"{API}/applications")
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["items"], list) and len(d["items"]) > 0
    pipeline = d["pipeline"]
    # Stages should include at least some of the standard ones
    expected_stages = {"Applied", "Shortlisted", "Interview", "Selected", "Rejected"}
    assert expected_stages.intersection(set(pipeline.keys()))


def test_application_stage_update(tpo_session):
    r = tpo_session.get(f"{API}/applications")
    item = r.json()["items"][0]
    aid = item["application_id"]
    upd = tpo_session.patch(f"{API}/applications/{aid}", json={"stage": "Selected"})
    assert upd.status_code == 200
    assert upd.json()["updated"] >= 0  # may be 0 if already Selected
    # Verify persistence
    verify = tpo_session.get(f"{API}/applications", params={"stage": "Selected"})
    assert any(x["application_id"] == aid for x in verify.json()["items"])


# ---------- jobs / recruiters ----------
def test_jobs_open(tpo_session):
    r = tpo_session.get(f"{API}/jobs", params={"status": "open"})
    assert r.status_code == 200
    assert len(r.json()["items"]) > 1


def test_recruiters_list(tpo_session):
    r = tpo_session.get(f"{API}/recruiters")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 20


def test_talent_pool_recruiter(recruiter_session):
    r = recruiter_session.get(f"{API}/recruiters/rec_amazon/talent-pool", params={"min_cgpa": 7.0})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) > 0
    # Sorted by readiness_score desc
    scores = [s.get("readiness_score", 0) for s in items]
    assert scores == sorted(scores, reverse=True)


def test_talent_pool_forbidden_for_tpo(tpo_session):
    r = tpo_session.get(f"{API}/recruiters/rec_amazon/talent-pool")
    assert r.status_code == 403


# ---------- announcements ----------
def test_announcements_get_and_post(tpo_session, admin_session):
    r = tpo_session.get(f"{API}/announcements")
    assert r.status_code == 200
    assert isinstance(r.json()["items"], list)
    create = tpo_session.post(f"{API}/announcements", json={
        "title": f"TEST_ann_{uuid.uuid4().hex[:6]}",
        "body": "Automated test announcement",
        "audience": "students",
    })
    assert create.status_code == 200
    aid = create.json()["announcement_id"]
    # Verify in list
    after = tpo_session.get(f"{API}/announcements").json()["items"]
    assert any(x["announcement_id"] == aid for x in after)
    # Fan-out to notification log
    notif = admin_session.get(f"{API}/admin/notifications").json()["items"]
    assert any(n.get("event") == "announcement_posted" for n in notif)


# ---------- MOU ----------
def test_mou_tpo(tpo_session):
    r = tpo_session.get(f"{API}/mou")
    assert r.status_code == 200
    mou = r.json()
    assert mou["institution_id"] == "inst_kmit"
    assert "days_until_renewal" in mou
    assert isinstance(mou["days_until_renewal"], int)


# ---------- admin: approval flow ----------
def test_admin_pending_and_approve(admin_session):
    pending = admin_session.get(f"{API}/admin/pending-signups")
    assert pending.status_code == 200
    items = pending.json()["items"]
    vasavi = next((u for u in items if u["email"] == DEMO["pending"]), None)
    assert vasavi is not None, "Vasavi pending account not found"
    uid = vasavi["user_id"]
    ap = admin_session.post(f"{API}/admin/approve/{uid}")
    assert ap.status_code == 200
    # Re-login as Vasavi and check approved=true
    s, r = _login(DEMO["pending"])
    assert r.status_code == 200
    me = s.get(f"{API}/auth/me").json()
    assert me["approved"] is True


# ---------- notification test ----------
def test_admin_test_notification(admin_session):
    r = admin_session.post(f"{API}/admin/test-notification")
    assert r.status_code == 200
    log = admin_session.get(f"{API}/admin/notifications").json()["items"]
    assert any(n.get("event") == "admin_test" for n in log)
