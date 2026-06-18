"""CareerOS Campus Intelligence — v2 backend.

Multi-role, multi-institution platform with 13 modules.
Auth: bcrypt password login + Emergent Google OAuth + cookie session token.
RBAC: super_admin, institution_admin, tpo, faculty, student, recruiter.
"""
from __future__ import annotations

import os
import io
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Literal

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pydantic import BaseModel, EmailStr

from seed_data import (
    seed_payload, STRIVER_TOPICS, DSA_TOTAL, APTITUDE_SECTIONS, INSTITUTIONS,
    PROGRAMS, KMIT_PLACEMENT_RECORDS, YEAR_AGGREGATES,
)
from notification_service import notify
from auth import hash_password, verify_password, get_session_user, require_roles
from reports import (
    placement_report_pdf, training_report_pdf, department_report_pdf,
    students_csv, applications_csv, placements_csv, build_ics,
)
from ai_service import ai_interview_feedback, ai_ats_score
from ws_manager import manager as ws_manager
from fastapi import WebSocket, WebSocketDisconnect

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("careeros")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_AUTH_URL = os.environ.get("EMERGENT_AUTH_URL", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@careeros.app")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "careeros2026")
DEFAULT_DEMO_PASSWORD = os.environ.get("DEFAULT_DEMO_PASSWORD", "careeros2026")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
gridfs = AsyncIOMotorGridFSBucket(db, bucket_name="mou_files")

app = FastAPI(title="CareerOS")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ============== MODELS ==============
class LoginBody(BaseModel):
    email: EmailStr
    password: str


class SignupBody(BaseModel):
    college_name: str
    short_name: Optional[str] = None
    role: Literal["tpo", "hod", "coordinator"] = "tpo"
    affiliated_university: Optional[str] = None
    partnership_type: Optional[str] = None
    department: Optional[str] = None


# ============== SESSION ==============
async def _create_session(user_id: str, response: Response, token: Optional[str] = None) -> str:
    session_token = token or f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 60 * 60,
    )
    return session_token


def _new_user(*, email: str, name: str, role: str, institution_id: Optional[str], password: Optional[str], approved: bool = True, department: Optional[str] = None) -> dict:
    return {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email.lower(),
        "name": name,
        "role": role,
        "institution_id": institution_id,
        "department": department,
        "approved": approved,
        "password_hash": hash_password(password) if password else None,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# ============== STARTUP — seed + demo users ==============
@app.on_event("startup")
async def _startup():
    await db.users.create_index("email", unique=True)
    n_inst = await db.institutions.count_documents({})
    if n_inst == 0:
        log.info("Seeding institutions, students, recruiters, DSA, aptitude…")
        payload = seed_payload()
        for col, items in payload.items():
            if items:
                await db[col].insert_many(items)
        log.info("Seeded %d institutions, %d students, %d jobs, %d applications, %d DSA rows",
                 len(payload["institutions"]), len(payload["students"]),
                 len(payload["jobs"]), len(payload["applications"]), len(payload["dsa_progress"]))

    # Demo users with password — idempotent
    demo_users = [
        {"email": ADMIN_EMAIL, "name": "Platform Super Admin", "role": "super_admin", "institution_id": None, "department": None},
        {"email": "institution@kmit.in", "name": "KMIT — Institution Admin", "role": "institution_admin", "institution_id": "inst_kmit"},
        {"email": "tpo@kmit.in", "name": "Dr. Neil Gogte", "role": "tpo", "institution_id": "inst_kmit"},
        {"email": "faculty@kmit.in", "name": "Prof. Lavanya Iyer", "role": "faculty", "institution_id": "inst_kmit", "department": "CSE"},
        {"email": "student@kmit.in", "name": "Aarav Reddy", "role": "student", "institution_id": "inst_kmit", "department": "CSE"},
        {"email": "recruiter@amazon.com", "name": "Priya Sharma (Amazon)", "role": "recruiter", "institution_id": None, "department": None},
        # Legacy / approval-flow demo
        {"email": "tpo@vasavi.ac.in", "name": "Dr. Suresh Kumar", "role": "tpo", "institution_id": "inst_vasavi_pending", "approved": False},
    ]
    for d in demo_users:
        existing = await db.users.find_one({"email": d["email"]})
        if existing is None:
            new = _new_user(
                email=d["email"], name=d["name"], role=d["role"],
                institution_id=d.get("institution_id"),
                department=d.get("department"),
                password=DEFAULT_DEMO_PASSWORD if d["role"] != "super_admin" else ADMIN_PASSWORD,
                approved=d.get("approved", True),
            )
            # Bind student demo to a real seeded student row AND patch the student record
            # to match the User's display name so UI stays consistent across views.
            if d["role"] == "student":
                real_stu = await db.students.find_one(
                    {"institution_id": "inst_kmit", "department": "CSE"}, {"_id": 0}
                )
                if real_stu:
                    new["student_id"] = real_stu["student_id"]
                    await db.students.update_one(
                        {"student_id": real_stu["student_id"]},
                        {"$set": {"name": d["name"], "email": d["email"]}},
                    )
            try:
                await db.users.insert_one(new)
            except Exception as e:
                log.warning("Skipping user %s: %s", d["email"], e)
        else:
            # Refresh password if missing or admin-password-changed
            if not existing.get("password_hash"):
                pw = ADMIN_PASSWORD if d["role"] == "super_admin" else DEFAULT_DEMO_PASSWORD
                await db.users.update_one({"email": d["email"]}, {"$set": {"password_hash": hash_password(pw)}})
            # Ensure student↔student_id link is set and student name matches
            if d["role"] == "student" and not existing.get("student_id"):
                real_stu = await db.students.find_one(
                    {"institution_id": "inst_kmit", "department": "CSE"}, {"_id": 0}
                )
                if real_stu:
                    await db.users.update_one(
                        {"email": d["email"]},
                        {"$set": {"student_id": real_stu["student_id"]}},
                    )
                    await db.students.update_one(
                        {"student_id": real_stu["student_id"]},
                        {"$set": {"name": d["name"], "email": d["email"]}},
                    )

    # Pending college doc for approval flow
    if not await db.institutions.find_one({"institution_id": "inst_vasavi_pending"}):
        await db.institutions.insert_one({
            "institution_id": "inst_vasavi_pending",
            "name": "Vasavi College of Engineering",
            "short_name": "VCE",
            "type": "Engineering",
            "city": "Hyderabad", "state": "Telangana",
            "affiliated_university": "Osmania University",
            "departments": ["CSE", "ECE", "IT"],
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


# ============== HEALTH ==============
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "careeros-v2"}


# ============== PUBLIC ==============
@app.get("/api/public/landing-stats")
async def landing_stats():
    years = await db.year_summaries.find({"institution_id": "inst_kmit"}, {"_id": 0}).sort("academic_year", -1).to_list(20)
    pipeline = [
        {"$match": {"institution_id": "inst_kmit"}},
        {"$group": {"_id": "$company", "selects": {"$sum": "$selects"}, "max_ctc": {"$max": "$ctc_lpa"}}},
        {"$sort": {"selects": -1}}, {"$limit": 24},
    ]
    top = await db.placement_records.aggregate(pipeline).to_list(40)
    top = [{"company": r["_id"], "selects": r["selects"], "max_ctc": r["max_ctc"]} for r in top]
    n_students = await db.students.count_documents({})
    n_inst = await db.institutions.count_documents({"approved": True})
    return {"years": years, "top_recruiters": top, "totals": {"students": n_students, "institutions": n_inst}}


# ============== AUTH ==============
@app.post("/api/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    await _create_session(user["user_id"], response)
    user.pop("_id", None); user.pop("password_hash", None)
    return {"user": user}


@app.post("/api/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(400, "session_id required")
    async with httpx.AsyncClient(timeout=15) as hx:
        r = await hx.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
        if r.status_code != 200:
            raise HTTPException(401, "Emergent auth failed")
        data = r.json()
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name", existing["name"]), "picture": data.get("picture")}})
    else:
        is_admin = email == ADMIN_EMAIL
        new = _new_user(email=email, name=data.get("name", email), role="super_admin" if is_admin else "tpo",
                        institution_id=None, password=None, approved=is_admin)
        new["picture"] = data.get("picture")
        await db.users.insert_one(new)
        user_id = new["user_id"]
    await _create_session(user_id, response, token=data.get("session_token"))
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc}


@app.get("/api/auth/me")
async def auth_me(user=Depends(get_session_user)):
    return user


@app.post("/api/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ============== SIGNUP / ONBOARDING ==============
@app.post("/api/signup")
async def signup(payload: SignupBody, user=Depends(get_session_user)):
    if user.get("approved") and user.get("institution_id"):
        return {"status": "already-onboarded"}
    short = payload.short_name or "".join(w[0] for w in payload.college_name.split()).upper()[:6]
    inst_id = f"inst_{uuid.uuid4().hex[:10]}"
    await db.institutions.insert_one({
        "institution_id": inst_id,
        "name": payload.college_name, "short_name": short, "type": "Engineering",
        "affiliated_university": payload.affiliated_university,
        "departments": ["CSE", "IT", "CSE-AIML", "CSE-DS"],
        "partnership_types": [payload.partnership_type or "CRT"],
        "approved": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {
        "role": payload.role, "institution_id": inst_id,
        "department": payload.department, "approved": False,
    }})
    await notify(db, event="signup_requested", to_email=ADMIN_EMAIL,
                 subject=f"New TPO signup — {payload.college_name}",
                 title="New partner signup",
                 body_html=f"<p>{user['name']} ({user['email']}) requested onboarding for <b>{payload.college_name}</b>.</p>",
                 telegram_text=f"🆕 TPO signup · {payload.college_name}")
    return {"status": "pending_approval", "institution_id": inst_id}


# ============== INSTITUTIONS ==============
@app.get("/api/institutions")
async def list_institutions(user=Depends(get_session_user)):
    if user["role"] == "super_admin":
        items = await db.institutions.find({}, {"_id": 0}).to_list(500)
    elif user.get("institution_id"):
        items = await db.institutions.find({"institution_id": user["institution_id"]}, {"_id": 0}).to_list(10)
    else:
        items = []
    return {"items": items}


@app.get("/api/institutions/{institution_id}")
async def get_institution(institution_id: str, user=Depends(get_session_user)):
    if user["role"] != "super_admin" and user.get("institution_id") != institution_id:
        raise HTTPException(403, "Cross-institution access denied")
    inst = await db.institutions.find_one({"institution_id": institution_id}, {"_id": 0})
    if not inst:
        raise HTTPException(404, "not found")
    return inst


@app.patch("/api/institutions/{institution_id}")
async def update_institution(institution_id: str, body: dict, user=Depends(require_roles("super_admin", "institution_admin", "tpo"))):
    if user["role"] != "super_admin" and user.get("institution_id") != institution_id:
        raise HTTPException(403, "forbidden")
    allowed = {"name", "short_name", "city", "state", "affiliated_university", "departments", "tagline", "website"}
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        return {"updated": 0}
    r = await db.institutions.update_one({"institution_id": institution_id}, {"$set": update})
    return {"updated": r.modified_count}


@app.get("/api/institutions/{institution_id}/departments")
async def list_departments(institution_id: str, user=Depends(get_session_user)):
    if user["role"] != "super_admin" and user.get("institution_id") != institution_id:
        raise HTTPException(403, "forbidden")
    items = await db.departments.find({"institution_id": institution_id}, {"_id": 0}).to_list(50)
    return {"items": items}


# ============== STUDENTS ==============
@app.get("/api/students")
async def list_students(
    department: Optional[str] = None, placed: Optional[bool] = None,
    q: Optional[str] = None, limit: int = 200,
    user=Depends(get_session_user),
):
    query: dict = {}
    if user["role"] != "super_admin":
        if not user.get("institution_id"):
            return {"items": [], "count": 0}
        query["institution_id"] = user["institution_id"]
    if user["role"] == "faculty" and user.get("department"):
        query["department"] = user["department"]
    if department:
        query["department"] = department
    if placed is not None:
        query["placement.placed"] = placed
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"roll_number": {"$regex": q, "$options": "i"}}]
    items = await db.students.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return {"items": items, "count": len(items)}


@app.post("/api/students")
async def add_student(body: dict, user=Depends(require_roles("super_admin", "tpo", "institution_admin", "faculty"))):
    body["student_id"] = body.get("student_id") or f"stu_{uuid.uuid4().hex[:10]}"
    body["institution_id"] = user.get("institution_id") if user["role"] != "super_admin" else body.get("institution_id")
    body.setdefault("placement", {"placed": False})
    body.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    await db.students.insert_one(body)
    return {"student_id": body["student_id"]}


@app.get("/api/students/{student_id}")
async def get_student(student_id: str, user=Depends(get_session_user)):
    s = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "not found")
    if user["role"] not in ("super_admin",) and s["institution_id"] != user.get("institution_id"):
        raise HTTPException(403, "forbidden")
    enrolls = await db.enrollments.find({"student_id": student_id}, {"_id": 0}).to_list(20)
    apps = await db.applications.find({"student_id": student_id}, {"_id": 0}).to_list(20)
    return {"student": s, "enrollments": enrolls, "applications": apps}


# ============== STUDENT PERSONAL (logged-in student) ==============
@app.get("/api/me/dashboard")
async def my_dashboard(user=Depends(require_roles("student"))):
    sid = user.get("student_id")
    if not sid:
        s = await db.students.find_one({"institution_id": user.get("institution_id")}, {"_id": 0})
        if s:
            sid = s["student_id"]
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"student_id": sid}})
    s = await db.students.find_one({"student_id": sid}, {"_id": 0}) if sid else None
    if not s:
        raise HTTPException(404, "no student record bound")
    dsa = await db.dsa_progress.find({"student_id": sid}, {"_id": 0}).to_list(50)
    apt = await db.aptitude_scores.find({"student_id": sid}, {"_id": 0}).to_list(20)
    ats = await db.ats_reports.find({"student_id": sid}, {"_id": 0}).sort("created_at", -1).limit(1).to_list(1)
    interviews = await db.interview_reports.find({"student_id": sid}, {"_id": 0}).sort("conducted_at", -1).limit(10).to_list(10)
    apps = await db.applications.find({"student_id": sid}, {"_id": 0}).sort("applied_at", -1).limit(20).to_list(20)
    # Recommendations: open jobs for this student's institution + stream
    inst_id = s["institution_id"]
    recs = await db.jobs.find({"institutions": inst_id, "status": "open"}, {"_id": 0}).limit(6).to_list(6)
    return {
        "student": s, "dsa": dsa, "aptitude": apt,
        "ats": ats[0] if ats else None, "interviews": interviews,
        "applications": apps, "recommended_jobs": recs,
        "topics": STRIVER_TOPICS, "aptitude_sections": APTITUDE_SECTIONS,
        "dsa_total": DSA_TOTAL,
    }


# ============== DSA INTELLIGENCE ==============
@app.get("/api/dsa/topics")
async def dsa_topics():
    return {"topics": STRIVER_TOPICS, "total": DSA_TOTAL}


@app.get("/api/dsa/intelligence")
async def dsa_intelligence(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    if not iid:
        return {"by_topic": [], "leaderboard": []}
    # Faculty narrows to their department
    student_match = {"institution_id": iid}
    if user["role"] == "faculty" and user.get("department"):
        student_match["department"] = user["department"]
    dept_students = await db.students.find(student_match, {"_id": 0, "student_id": 1}).to_list(1000)
    dept_sids = [s["student_id"] for s in dept_students] if user["role"] == "faculty" else None

    match = {"institution_id": iid}
    if dept_sids is not None:
        match["student_id"] = {"$in": dept_sids}
    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$topic_code", "topic_name": {"$first": "$topic_name"},
                    "total": {"$first": "$total"}, "solved": {"$sum": "$solved"},
                    "students": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    by_topic = await db.dsa_progress.aggregate(pipeline).to_list(30)

    leaderboard_pipe = [
        {"$match": match},
        {"$group": {"_id": "$student_id", "solved": {"$sum": "$solved"}}},
        {"$sort": {"solved": -1}},
        {"$limit": 20},
    ]
    lb = await db.dsa_progress.aggregate(leaderboard_pipe).to_list(30)
    sids = [r["_id"] for r in lb]
    students = await db.students.find({"student_id": {"$in": sids}}, {"_id": 0}).to_list(30)
    smap = {s["student_id"]: s for s in students}
    leaderboard = []
    for r in lb:
        s = smap.get(r["_id"], {})
        leaderboard.append({
            "student_id": r["_id"], "name": s.get("name", "—"),
            "roll_number": s.get("roll_number", "—"), "department": s.get("department", "—"),
            "solved": r["solved"], "readiness": min(100, round(r["solved"] / DSA_TOTAL * 100, 1)),
        })
    return {
        "by_topic": by_topic, "leaderboard": leaderboard, "total_problems": DSA_TOTAL,
        "scope": ("department:" + user["department"]) if user["role"] == "faculty" and user.get("department") else "institution",
    }


@app.post("/api/me/dsa/toggle")
async def dsa_toggle(body: dict, user=Depends(require_roles("student"))):
    """Increment/decrement solved count for a topic for the logged-in student."""
    sid = user.get("student_id")
    topic = body.get("topic_code")
    delta = int(body.get("delta", 1))
    if not (sid and topic):
        raise HTTPException(400, "topic_code required")
    row = await db.dsa_progress.find_one({"student_id": sid, "topic_code": topic})
    if not row:
        raise HTTPException(404, "topic not found")
    new_solved = max(0, min(row["total"], row["solved"] + delta))
    await db.dsa_progress.update_one({"progress_id": row["progress_id"]},
                                     {"$set": {"solved": new_solved, "last_solved_at": datetime.now(timezone.utc).isoformat()}})
    return {"solved": new_solved, "total": row["total"]}


# ============== APTITUDE INTELLIGENCE ==============
@app.get("/api/aptitude/intelligence")
async def aptitude_intelligence(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    if not iid:
        return {"by_section": []}
    pipeline = [
        {"$match": {"institution_id": iid}},
        {"$group": {"_id": "$section_code", "section_name": {"$first": "$section_name"},
                    "avg_score": {"$avg": "$score_pct"},
                    "avg_accuracy": {"$avg": "$accuracy_pct"},
                    "tests": {"$sum": "$tests_taken"},
                    "students": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    sections = await db.aptitude_scores.aggregate(pipeline).to_list(20)
    for s in sections:
        s["avg_score"] = round(s["avg_score"] or 0, 1)
        s["avg_accuracy"] = round(s["avg_accuracy"] or 0, 1)
    return {"by_section": sections, "sections": APTITUDE_SECTIONS}


# ============== RESUME ATS ==============
@app.get("/api/ats/intelligence")
async def ats_intelligence(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    if not iid:
        return {"avg_score": 0, "rows": []}
    pipeline = [{"$match": {"institution_id": iid}},
                {"$group": {"_id": None, "avg": {"$avg": "$score"}, "count": {"$sum": 1}}}]
    agg = await db.ats_reports.aggregate(pipeline).to_list(1)
    rows = await db.ats_reports.find({"institution_id": iid}, {"_id": 0}).sort("created_at", -1).limit(40).to_list(40)
    sids = list({r["student_id"] for r in rows})
    students = await db.students.find({"student_id": {"$in": sids}}, {"_id": 0}).to_list(80)
    smap = {s["student_id"]: s for s in students}
    for r in rows:
        s = smap.get(r["student_id"], {})
        r["student_name"] = s.get("name", "—")
        r["roll_number"] = s.get("roll_number", "—")
        r["department"] = s.get("department", "—")
    return {"avg_score": round(agg[0]["avg"], 1) if agg else 0, "count": agg[0]["count"] if agg else 0, "rows": rows}


# ============== INTERVIEW REPORTS ==============
@app.get("/api/interviews/intelligence")
async def interviews_intelligence(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    if not iid:
        return {"rows": []}
    rows = await db.interview_reports.find({"institution_id": iid}, {"_id": 0}).sort("conducted_at", -1).limit(60).to_list(60)
    sids = list({r["student_id"] for r in rows})
    students = await db.students.find({"student_id": {"$in": sids}}, {"_id": 0}).to_list(120)
    smap = {s["student_id"]: s for s in students}
    for r in rows:
        s = smap.get(r["student_id"], {})
        r["student_name"] = s.get("name", "—")
        r["roll_number"] = s.get("roll_number", "—")
    avg_conf = round(sum(r["confidence_score"] for r in rows) / max(1, len(rows)), 1)
    avg_tech = round(sum(r["technical_score"] for r in rows) / max(1, len(rows)), 1)
    return {"rows": rows, "avg_confidence": avg_conf, "avg_technical": avg_tech}


# ============== PLACEMENT INTELLIGENCE ==============
@app.get("/api/placements/overview")
async def placements_overview(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    if user["role"] == "super_admin":
        iid = "inst_kmit"
    years = await db.year_summaries.find({"institution_id": iid}, {"_id": 0}).sort("academic_year", -1).to_list(20)
    records = await db.placement_records.find({"institution_id": iid}, {"_id": 0}).to_list(500)
    placed = await db.students.count_documents({"institution_id": iid, "placement.placed": True})
    total = await db.students.count_documents({"institution_id": iid})
    pipeline = [{"$match": {"institution_id": iid}},
                {"$group": {"_id": "$company", "selects": {"$sum": "$selects"}, "max_ctc": {"$max": "$ctc_lpa"}}},
                {"$sort": {"selects": -1}}, {"$limit": 12}]
    top = await db.placement_records.aggregate(pipeline).to_list(20)
    top = [{"company": r["_id"], "selects": r["selects"], "max_ctc": r["max_ctc"]} for r in top]
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0})
    dept_breakdown = []
    for d in (inst["departments"] if inst else []):
        p = await db.students.count_documents({"institution_id": iid, "department": d, "placement.placed": True})
        t = await db.students.count_documents({"institution_id": iid, "department": d})
        dept_breakdown.append({"department": d, "placed": p, "total": t})
    return {
        "year_summaries": years, "records": records, "top_recruiters": top,
        "department_breakdown": dept_breakdown,
        "students_placed": placed, "students_total": total,
    }


# ============== TRAINING ==============
@app.get("/api/cohorts")
async def list_cohorts(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    query = {} if user["role"] == "super_admin" else {"institution_id": iid}
    items = await db.training_programs.find(query, {"_id": 0}).to_list(200)
    return {"items": items, "programs": PROGRAMS}


@app.get("/api/training/completion")
async def training_completion(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    pipeline = [{"$match": {"institution_id": iid}},
                {"$group": {"_id": "$program_code",
                            "avg_completion": {"$avg": "$completion_pct"},
                            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
                            "in_progress": {"$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}},
                            "enrolled": {"$sum": 1}}}]
    by_program = await db.enrollments.aggregate(pipeline).to_list(20)
    prog_map = {p["code"]: p for p in PROGRAMS}
    for r in by_program:
        meta = prog_map.get(r["_id"], {})
        r["program_code"] = r["_id"]; r["program_name"] = meta.get("name", r["_id"])
        r["modules"] = meta.get("modules"); r["avg_completion"] = round(r["avg_completion"] or 0, 1)
    enroll_rows = await db.enrollments.find({"institution_id": iid}, {"_id": 0}).sort("completion_pct", -1).limit(80).to_list(80)
    sids = list({e["student_id"] for e in enroll_rows})
    students = await db.students.find({"student_id": {"$in": sids}}, {"_id": 0}).to_list(200)
    smap = {s["student_id"]: s for s in students}
    for e in enroll_rows:
        s = smap.get(e["student_id"], {})
        e["student_name"] = s.get("name", "—")
        e["roll_number"] = s.get("roll_number", "—")
        e["department"] = s.get("department", "—")
    return {"by_program": by_program, "rows": enroll_rows}


# ============== APPLICATIONS / JOBS ==============
@app.get("/api/jobs")
async def list_jobs(status: Optional[str] = "open", user=Depends(get_session_user)):
    query = {}
    if status and status != "all":
        query["status"] = status
    if user["role"] == "recruiter":
        query["recruiter_id"] = {"$exists": True}  # all recruiter jobs visible to recruiter; future: scope to recruiter_id
    items = await db.jobs.find(query, {"_id": 0}).sort("drive_date", -1).limit(80).to_list(80)
    return {"items": items}


@app.post("/api/jobs")
async def create_job(body: dict, user=Depends(require_roles("recruiter", "super_admin", "tpo", "institution_admin"))):
    body["job_id"] = f"job_{uuid.uuid4().hex[:10]}"
    body.setdefault("status", "open")
    body.setdefault("applied_count", 0)
    body.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    await db.jobs.insert_one(body)
    return {"job_id": body["job_id"]}


@app.get("/api/applications")
async def list_applications(stage: Optional[str] = None, company: Optional[str] = None, user=Depends(get_session_user)):
    query = {}
    if user["role"] not in ("super_admin", "recruiter"):
        if user.get("institution_id"):
            query["institution_id"] = user["institution_id"]
    if user["role"] == "faculty" and user.get("department"):
        query["department"] = user["department"]
    if stage:
        query["stage"] = stage
    if company:
        query["company"] = company
    items = await db.applications.find(query, {"_id": 0}).sort("applied_at", -1).limit(200).to_list(200)
    # Pipeline counts (same filter without stage)
    pipe_query = {k: v for k, v in query.items() if k != "stage"}
    pipeline = [{"$match": pipe_query},
                {"$group": {"_id": "$stage", "n": {"$sum": 1}}}]
    counts = await db.applications.aggregate(pipeline).to_list(20)
    return {"items": items, "pipeline": {c["_id"]: c["n"] for c in counts}}


@app.patch("/api/applications/{application_id}")
async def update_application(application_id: str, body: dict, user=Depends(require_roles("super_admin", "tpo", "recruiter", "institution_admin"))):
    allowed = {"stage", "next_step_at"}
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        return {"updated": 0}
    r = await db.applications.update_one({"application_id": application_id}, {"$set": update})
    # Broadcast live update
    app_doc = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if app_doc:
        await ws_manager.broadcast(app_doc["institution_id"], {
            "type": "application.updated",
            "application_id": application_id,
            "stage": app_doc.get("stage"),
            "student_name": app_doc.get("student_name"),
            "company": app_doc.get("company"),
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    return {"updated": r.modified_count}


# ============== RECRUITER INTELLIGENCE ==============
@app.get("/api/recruiters")
async def list_recruiters(user=Depends(get_session_user)):
    items = await db.recruiters.find({}, {"_id": 0}).sort("hires_total", -1).limit(60).to_list(60)
    return {"items": items}


@app.get("/api/recruiters/{recruiter_id}/talent-pool")
async def talent_pool(recruiter_id: str, min_cgpa: float = 6.5, user=Depends(require_roles("recruiter", "super_admin"))):
    # All students above cgpa, ordered by readiness
    students = await db.students.find({"cgpa": {"$gte": min_cgpa}}, {"_id": 0}).sort("readiness_score", -1).limit(60).to_list(60)
    return {"items": students, "count": len(students)}


# ============== ANNOUNCEMENTS ==============
@app.get("/api/announcements")
async def list_announcements(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    items = await db.announcements.find({"institution_id": iid}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"items": items}


@app.post("/api/announcements")
async def create_announcement(body: dict, user=Depends(require_roles("tpo", "institution_admin", "faculty", "super_admin"))):
    body["announcement_id"] = f"ann_{uuid.uuid4().hex[:10]}"
    body["institution_id"] = user.get("institution_id") or "inst_kmit"
    body["by_role"] = user["role"]
    body["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.announcements.insert_one(body)
    await notify(db, event="announcement_posted",
                 to_email=ADMIN_EMAIL, subject=f"Announcement: {body.get('title')}",
                 title=body.get("title", "Announcement"),
                 body_html=f"<p>{body.get('body', '')}</p>",
                 telegram_text=f"📣 {body.get('title')}")
    return {"announcement_id": body["announcement_id"]}


# ============== MOU ==============
@app.get("/api/mou")
async def get_mou(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    if user["role"] == "super_admin":
        iid = "inst_kmit"
    mou = await db.mous.find_one({"institution_id": iid}, {"_id": 0})
    if not mou:
        raise HTTPException(404, "no MOU")
    exp = datetime.fromisoformat(mou["expires_on"])
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    mou["days_until_renewal"] = (exp - datetime.now(timezone.utc)).days
    return mou


@app.post("/api/mou/upload")
async def upload_mou(file: UploadFile = File(...), expires_on: str = Form(...), partnership_type: str = Form("CRT"),
                    user=Depends(require_roles("super_admin", "tpo", "institution_admin"))):
    iid = user.get("institution_id") or "inst_kmit"
    content = await file.read()
    size_kb = round(len(content) / 1024, 1)
    # Persist actual bytes in GridFS
    gridfs_id = await gridfs.upload_from_stream(
        f"{iid}__{file.filename}",
        content,
        metadata={"institution_id": iid, "uploader_user_id": user["user_id"],
                  "content_type": file.content_type, "uploaded_at": datetime.now(timezone.utc).isoformat()},
    )
    await db.mous.update_one({"institution_id": iid}, {"$set": {
        "institution_id": iid, "document_name": file.filename,
        "document_size_kb": size_kb, "partnership_type": partnership_type,
        "expires_on": expires_on, "signed_on": datetime.now(timezone.utc).isoformat(),
        "status": "active",
        "gridfs_id": str(gridfs_id),
        "content_type": file.content_type or "application/pdf",
    }}, upsert=True)
    await notify(db, event="mou_uploaded", to_email=ADMIN_EMAIL,
                 subject=f"MOU uploaded — {iid}", title="MOU received",
                 body_html=f"<p>{file.filename} ({size_kb} KB) uploaded.</p>",
                 telegram_text=f"📄 MOU · {iid}")
    return {"ok": True, "document_name": file.filename, "size_kb": size_kb, "gridfs_id": str(gridfs_id)}


@app.get("/api/mou/download")
async def download_mou(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    if user["role"] == "super_admin":
        iid = "inst_kmit"
    mou = await db.mous.find_one({"institution_id": iid}, {"_id": 0})
    if not mou or not mou.get("gridfs_id"):
        raise HTTPException(404, "No file on record")
    from bson import ObjectId
    stream = await gridfs.open_download_stream(ObjectId(mou["gridfs_id"]))
    data = await stream.read()

    def gen():
        yield data

    return StreamingResponse(
        gen(),
        media_type=mou.get("content_type", "application/pdf"),
        headers={"Content-Disposition": f"attachment; filename=\"{mou['document_name']}\""},
    )


# ============== ADMIN PANEL ==============
@app.get("/api/admin/pending-signups")
async def pending_signups(admin=Depends(require_roles("super_admin"))):
    pending = await db.users.find({"approved": False}, {"_id": 0, "password_hash": 0}).to_list(200)
    ids = list({u["institution_id"] for u in pending if u.get("institution_id")})
    insts = await db.institutions.find({"institution_id": {"$in": ids}}, {"_id": 0}).to_list(200)
    imap = {i["institution_id"]: i for i in insts}
    for u in pending:
        u["institution"] = imap.get(u.get("institution_id"))
    return {"items": pending}


@app.post("/api/admin/approve/{user_id}")
async def approve_user(user_id: str, admin=Depends(require_roles("super_admin"))):
    t = await db.users.find_one({"user_id": user_id})
    if not t:
        raise HTTPException(404, "not found")
    await db.users.update_one({"user_id": user_id}, {"$set": {"approved": True}})
    if t.get("institution_id"):
        await db.institutions.update_one({"institution_id": t["institution_id"]},
                                         {"$set": {"approved": True, "approved_at": datetime.now(timezone.utc).isoformat()}})
    await notify(db, event="account_approved", to_email=t["email"],
                 subject="Your CareerOS access is live",
                 title="Welcome aboard",
                 body_html=f"<p>Hi {t['name']}, your CareerOS access is now active.</p>",
                 telegram_text=f"✅ Approved · {t['email']}")
    return {"ok": True}


@app.post("/api/admin/reject/{user_id}")
async def reject_user(user_id: str, admin=Depends(require_roles("super_admin"))):
    t = await db.users.find_one({"user_id": user_id})
    if not t:
        raise HTTPException(404, "not found")
    await db.users.delete_one({"user_id": user_id})
    if t.get("institution_id"):
        await db.institutions.delete_one({"institution_id": t["institution_id"], "approved": False})
    return {"ok": True}


@app.get("/api/admin/notifications")
async def admin_notifications(admin=Depends(require_roles("super_admin"))):
    items = await db.notification_log.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return {"items": items}


@app.post("/api/admin/test-notification")
async def test_notification(admin=Depends(require_roles("super_admin"))):
    await notify(db, event="admin_test", to_email=ADMIN_EMAIL,
                 subject="CareerOS · Test notification",
                 title="Heartbeat",
                 body_html="<p>Test fan-out triggered.</p>",
                 telegram_text="🔔 CareerOS test")
    return {"ok": True}


@app.get("/api/admin/platform-stats")
async def platform_stats(admin=Depends(require_roles("super_admin"))):
    n_inst = await db.institutions.count_documents({"approved": True})
    n_pending = await db.users.count_documents({"approved": False})
    n_students = await db.students.count_documents({})
    n_apps = await db.applications.count_documents({})
    n_jobs_open = await db.jobs.count_documents({"status": "open"})
    n_recruiters = await db.recruiters.count_documents({})
    # MRR-style proxy: 18% rev share × placed offer count × avg LPA × ₹/lpa-share
    placed = await db.students.count_documents({"placement.placed": True})
    estimated_mrr = round(placed * 0.18 * 6 * 1000 / 12, 0)  # rough proxy
    by_type_pipeline = [{"$group": {"_id": "$type", "n": {"$sum": 1}}}]
    by_type = await db.institutions.aggregate(by_type_pipeline).to_list(20)
    return {
        "institutions": n_inst, "pending_signups": n_pending,
        "students": n_students, "applications": n_apps,
        "jobs_open": n_jobs_open, "recruiters": n_recruiters,
        "estimated_mrr_inr": estimated_mrr,
        "by_type": [{"type": b["_id"], "count": b["n"]} for b in by_type],
    }


@app.get("/api/admin/colleges")
async def admin_colleges(admin=Depends(require_roles("super_admin"))):
    items = await db.institutions.find({}, {"_id": 0}).to_list(500)
    return {"items": items}


# ============== REPORTS (PDF + CSV) ==============
def _stream(content: io.BytesIO, filename: str, media_type: str):
    content.seek(0)
    return StreamingResponse(
        iter([content.read()]),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _institution_overview_for_reports(iid: str) -> dict:
    """Lightweight version of placements_overview that doesn't require auth coupling."""
    years = await db.year_summaries.find({"institution_id": iid}, {"_id": 0}).sort("academic_year", -1).to_list(20)
    records = await db.placement_records.find({"institution_id": iid}, {"_id": 0}).to_list(500)
    placed = await db.students.count_documents({"institution_id": iid, "placement.placed": True})
    total = await db.students.count_documents({"institution_id": iid})
    pipeline = [{"$match": {"institution_id": iid}},
                {"$group": {"_id": "$company", "selects": {"$sum": "$selects"}, "max_ctc": {"$max": "$ctc_lpa"}}},
                {"$sort": {"selects": -1}}, {"$limit": 15}]
    top = await db.placement_records.aggregate(pipeline).to_list(20)
    top = [{"company": r["_id"], "selects": r["selects"], "max_ctc": r["max_ctc"]} for r in top]
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0})
    dept = []
    for d in (inst["departments"] if inst else []):
        p = await db.students.count_documents({"institution_id": iid, "department": d, "placement.placed": True})
        t = await db.students.count_documents({"institution_id": iid, "department": d})
        dept.append({"department": d, "placed": p, "total": t})
    return {"year_summaries": years, "records": records, "top_recruiters": top,
            "department_breakdown": dept, "students_placed": placed, "students_total": total}


@app.get("/api/reports/placement.pdf")
async def report_placement_pdf(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0}) or {}
    overview = await _institution_overview_for_reports(iid)
    pdf = placement_report_pdf(inst, overview)
    return _stream(pdf, f"placement-report-{inst.get('short_name', 'institution')}.pdf", "application/pdf")


@app.get("/api/reports/training.pdf")
async def report_training_pdf(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0}) or {}
    pipeline = [{"$match": {"institution_id": iid}},
                {"$group": {"_id": "$program_code",
                            "avg_completion": {"$avg": "$completion_pct"},
                            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
                            "in_progress": {"$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}},
                            "enrolled": {"$sum": 1}}}]
    by_program = await db.enrollments.aggregate(pipeline).to_list(20)
    prog_map = {p["code"]: p for p in PROGRAMS}
    for r in by_program:
        meta = prog_map.get(r["_id"], {})
        r["program_code"] = r["_id"]; r["program_name"] = meta.get("name", r["_id"])
        r["avg_completion"] = round(r["avg_completion"] or 0, 1)
    enroll = await db.enrollments.find({"institution_id": iid}, {"_id": 0}).sort("completion_pct", -1).limit(60).to_list(60)
    sids = list({e["student_id"] for e in enroll})
    students = await db.students.find({"student_id": {"$in": sids}}, {"_id": 0}).to_list(200)
    smap = {s["student_id"]: s for s in students}
    for e in enroll:
        s = smap.get(e["student_id"], {})
        e["student_name"] = s.get("name", "—"); e["roll_number"] = s.get("roll_number", "—"); e["department"] = s.get("department", "—")
    pdf = training_report_pdf(inst, {"by_program": by_program, "rows": enroll})
    return _stream(pdf, f"training-report-{inst.get('short_name', 'institution')}.pdf", "application/pdf")


@app.get("/api/reports/department.pdf")
async def report_department_pdf(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0}) or {}
    overview = await _institution_overview_for_reports(iid)
    students = await db.students.find({"institution_id": iid}, {"_id": 0}).to_list(1000)
    pdf = department_report_pdf(inst, overview, students)
    return _stream(pdf, f"department-report-{inst.get('short_name', 'institution')}.pdf", "application/pdf")


@app.get("/api/reports/students.csv")
async def report_students_csv(department: Optional[str] = None, user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    if user["role"] == "super_admin":
        iid = "inst_kmit"
    q = {"institution_id": iid}
    if department:
        q["department"] = department
    items = await db.students.find(q, {"_id": 0}).to_list(2000)
    buf = students_csv(items)
    return _stream(buf, "students.csv", "text/csv")


@app.get("/api/reports/applications.csv")
async def report_applications_csv(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    items = await db.applications.find({"institution_id": iid}, {"_id": 0}).to_list(2000)
    buf = applications_csv(items)
    return _stream(buf, "applications.csv", "text/csv")


@app.get("/api/reports/placements.csv")
async def report_placements_csv(user=Depends(get_session_user)):
    iid = user.get("institution_id") or "inst_kmit"
    records = await db.placement_records.find({"institution_id": iid}, {"_id": 0}).to_list(2000)
    buf = placements_csv(records)
    return _stream(buf, "placements.csv", "text/csv")


# ============== INTERVIEW SCHEDULING ==============
class InterviewScheduleBody(BaseModel):
    student_id: str
    job_id: Optional[str] = None
    company: str
    role: str
    type: Literal["Technical", "HR", "System Design", "Behavioral", "Final"] = "Technical"
    starts_at: str  # ISO datetime
    duration_min: int = 45
    location: str = "Online · Zoom"
    notes: Optional[str] = None


@app.get("/api/interviews/schedule")
async def list_scheduled_interviews(user=Depends(get_session_user)):
    iid = user.get("institution_id")
    if user["role"] == "student":
        items = await db.interview_schedule.find({"student_id": user.get("student_id")}, {"_id": 0}).sort("starts_at", 1).to_list(60)
    elif iid:
        items = await db.interview_schedule.find({"institution_id": iid}, {"_id": 0}).sort("starts_at", 1).to_list(120)
    else:
        items = []
    return {"items": items}


@app.post("/api/interviews/schedule")
async def schedule_interview(body: InterviewScheduleBody, user=Depends(require_roles("tpo", "institution_admin", "recruiter", "super_admin"))):
    student = await db.students.find_one({"student_id": body.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "student not found")
    start_dt = datetime.fromisoformat(body.starts_at.replace("Z", "+00:00"))
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(minutes=body.duration_min)
    interview_id = f"isch_{uuid.uuid4().hex[:10]}"
    record = {
        "interview_id": interview_id,
        "student_id": body.student_id,
        "student_name": student["name"],
        "student_email": student["email"],
        "roll_number": student["roll_number"],
        "department": student["department"],
        "institution_id": student["institution_id"],
        "company": body.company,
        "role": body.role,
        "type": body.type,
        "starts_at": start_dt.isoformat(),
        "ends_at": end_dt.isoformat(),
        "duration_min": body.duration_min,
        "location": body.location,
        "notes": body.notes,
        "status": "scheduled",
        "scheduled_by": user["user_id"],
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "job_id": body.job_id,
    }
    await db.interview_schedule.insert_one(record)

    # Build .ics + send notification with attachment
    ics_bytes = build_ics(
        uid=f"{interview_id}@careeros.app",
        summary=f"{body.company} · {body.role} interview",
        description=f"{body.type} interview with {body.company}.\nLocation: {body.location}\n{(body.notes or '')}",
        location=body.location,
        start_utc=start_dt,
        end_utc=end_dt,
        organizer_email=os.environ.get("SENDER_EMAIL", "careeros.notify@careeros.app"),
        attendee_emails=[student["email"]],
    )
    await notify(
        db,
        event="interview_scheduled",
        to_email=student["email"],
        subject=f"Interview scheduled — {body.company}",
        title=f"You have an interview with {body.company}",
        body_html=(f"<p>Hi {student['name'].split()[0]},</p>"
                   f"<p>Your <b>{body.type}</b> interview for the <b>{body.role}</b> role at <b>{body.company}</b> is scheduled.</p>"
                   f"<p><b>When:</b> {start_dt.strftime('%A, %d %B %Y · %H:%M UTC')}<br/>"
                   f"<b>Duration:</b> {body.duration_min} min<br/>"
                   f"<b>Where:</b> {body.location}</p>"
                   f"<p>The calendar invite is attached. Good luck.</p>"),
        telegram_text=f"📅 Interview · {student['name']} · {body.company} · {start_dt.strftime('%d %b %H:%M UTC')}",
        attachments=[{"content": ics_bytes, "filename": "careeros-interview.ics", "mime_type": "text/calendar"}],
    )

    # Update related application to Interview stage if a job_id is provided
    if body.job_id:
        await db.applications.update_one(
            {"student_id": body.student_id, "job_id": body.job_id},
            {"$set": {"stage": "Interview", "next_step_at": start_dt.isoformat()}},
        )

    # Broadcast live update to anyone watching this institution
    await ws_manager.broadcast(student["institution_id"], {
        "type": "interview.scheduled",
        "interview_id": interview_id,
        "student_name": student["name"],
        "company": body.company,
        "starts_at": record["starts_at"],
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return {"interview_id": interview_id, "starts_at": record["starts_at"]}


@app.delete("/api/interviews/schedule/{interview_id}")
async def cancel_interview(interview_id: str, user=Depends(require_roles("tpo", "institution_admin", "recruiter", "super_admin"))):
    await db.interview_schedule.update_one({"interview_id": interview_id},
                                           {"$set": {"status": "cancelled"}})
    sched = await db.interview_schedule.find_one({"interview_id": interview_id}, {"_id": 0})
    if sched:
        await ws_manager.broadcast(sched["institution_id"], {
            "type": "interview.cancelled",
            "interview_id": interview_id,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    return {"ok": True}


# ============== AI: INTERVIEW FEEDBACK ==============
@app.post("/api/interviews/{interview_id}/ai-feedback")
async def regenerate_ai_feedback(interview_id: str, user=Depends(get_session_user)):
    report = await db.interview_reports.find_one({"interview_id": interview_id}, {"_id": 0})
    if not report:
        raise HTTPException(404, "interview report not found")
    if user["role"] not in ("super_admin", "tpo", "institution_admin", "faculty") and \
       user.get("student_id") != report["student_id"]:
        raise HTTPException(403, "forbidden")
    # Hydrate names if not present
    if not report.get("student_name"):
        s = await db.students.find_one({"student_id": report["student_id"]}, {"_id": 0})
        if s:
            report["student_name"] = s.get("name")
            report["roll_number"] = s.get("roll_number")
            report["department"] = s.get("department")
    result = await ai_interview_feedback(report)
    await db.interview_reports.update_one(
        {"interview_id": interview_id},
        {"$set": {"ai_feedback": result["feedback"], "ai_source": result["source"],
                  "ai_model": result.get("model"), "ai_generated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return result


# ============== AI: REAL RESUME ATS ==============
def _extract_pdf_text(content: bytes) -> str:
    try:
        from pypdf import PdfReader
        from io import BytesIO
        reader = PdfReader(BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as exc:  # noqa: BLE001
        log.warning("PDF parse failed: %s", exc)
        return ""


@app.post("/api/ats/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    user=Depends(get_session_user),
):
    """Student (or staff on behalf of) uploads a PDF resume; we extract text and score it."""
    content = await file.read()
    size_kb = round(len(content) / 1024, 1)
    text = _extract_pdf_text(content)
    if not text and file.content_type and "text" in file.content_type:
        text = content.decode("utf-8", errors="ignore")
    scoring = await ai_ats_score(text, job_description)

    # Persist to GridFS for download
    gridfs_id = await gridfs.upload_from_stream(
        f"resume_{user['user_id']}_{file.filename}",
        content,
        metadata={"user_id": user["user_id"], "kind": "resume",
                  "uploaded_at": datetime.now(timezone.utc).isoformat()},
    )
    student_id = user.get("student_id")
    if not student_id and user["role"] != "student":
        # Allow TPO/Faculty to score on a target student via query param
        student_id = None
    record = {
        "ats_id": f"ats_{uuid.uuid4().hex[:10]}",
        "student_id": student_id,
        "user_id": user["user_id"],
        "institution_id": user.get("institution_id"),
        "score": scoring.get("ats_score"),
        "keyword_match_pct": scoring.get("keyword_match_pct"),
        "format_score": scoring.get("format_score"),
        "missing_keywords": scoring.get("missing_keywords", []),
        "strengths": scoring.get("strengths", []),
        "weaknesses": scoring.get("weaknesses", []),
        "verdict": scoring.get("verdict"),
        "ai_source": scoring.get("source", "fallback"),
        "ai_model": scoring.get("model"),
        "uploaded_filename": file.filename,
        "file_size_kb": size_kb,
        "gridfs_id": str(gridfs_id),
        "extracted_chars": len(text),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ats_reports.insert_one(record)
    record.pop("_id", None)
    return record


@app.get("/api/ats/me/latest")
async def my_latest_ats(user=Depends(get_session_user)):
    sid = user.get("student_id")
    if not sid:
        return {"item": None}
    item = await db.ats_reports.find_one({"student_id": sid}, {"_id": 0}, sort=[("created_at", -1)])
    return {"item": item}


# ============== WEBSOCKET: LIVE UPDATES ==============
@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket, institution_id: Optional[str] = None, token: Optional[str] = None):
    # Auth: verify session token (cookies aren't readable cross-domain by browser WS in many cases,
    # so we accept ?token= as query param too).
    if not token:
        token = websocket.cookies.get("session_token")
    if not token:
        await websocket.close(code=4401); return
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        await websocket.close(code=4401); return
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        await websocket.close(code=4401); return
    room = institution_id or user.get("institution_id") or "global"
    # super_admin can subscribe to any room they ask for; others scoped to their own institution
    if user["role"] != "super_admin" and room != user.get("institution_id"):
        await websocket.close(code=4403); return
    await ws_manager.connect(room, websocket)
    try:
        # Send a welcome packet so the client knows it's live
        await websocket.send_json({"type": "hello", "room": room,
                                   "user": user.get("name"), "role": user["role"],
                                   "ts": datetime.now(timezone.utc).isoformat()})
        while True:
            msg = await websocket.receive_text()
            # Echo keep-alives if needed
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(room, websocket)


# ============== MULTI-USER INVITES ==============
class InviteBody(BaseModel):
    email: EmailStr
    name: str
    role: Literal["tpo", "institution_admin", "faculty", "coordinator"] = "faculty"
    department: Optional[str] = None
    institution_id: Optional[str] = None  # super_admin can override


@app.post("/api/invite")
async def invite_user(body: InviteBody, user=Depends(require_roles("super_admin", "tpo", "institution_admin"))):
    iid = body.institution_id if user["role"] == "super_admin" else user.get("institution_id")
    if not iid:
        raise HTTPException(400, "institution_id required")
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(409, "User already exists")
    pw = DEFAULT_DEMO_PASSWORD  # auto-set; user changes after first login (out of scope)
    new = _new_user(email=body.email, name=body.name, role=body.role,
                    institution_id=iid, password=pw, approved=True, department=body.department)
    await db.users.insert_one(new)
    inst = await db.institutions.find_one({"institution_id": iid}, {"_id": 0}) or {}
    await notify(
        db, event="user_invited",
        to_email=body.email,
        subject=f"Welcome to CareerOS — {inst.get('name', 'your institution')}",
        title="You've been invited to CareerOS",
        body_html=(f"<p>Hi {body.name},</p>"
                   f"<p>{user['name']} has invited you to <b>{inst.get('name')}</b>'s placement command center as a <b>{body.role.replace('_', ' ')}</b>.</p>"
                   f"<p>Sign in at <a href='https://career-os-nexus.preview.emergentagent.com/login'>CareerOS</a> using:</p>"
                   f"<p><b>Email:</b> {body.email}<br/><b>Temporary password:</b> {pw}</p>"
                   f"<p>Please change your password after first login.</p>"),
        telegram_text=f"👥 New invite · {body.email} → {inst.get('short_name', iid)} · {body.role}",
    )
    return {"user_id": new["user_id"], "email": body.email, "temp_password": pw}


@app.get("/api/institution/users")
async def list_institution_users(user=Depends(require_roles("tpo", "institution_admin", "super_admin"))):
    iid = user.get("institution_id")
    if user["role"] == "super_admin":
        iid = iid or "inst_kmit"
    items = await db.users.find({"institution_id": iid}, {"_id": 0, "password_hash": 0}).to_list(200)
    return {"items": items}


@app.delete("/api/institution/users/{user_id}")
async def remove_institution_user(user_id: str, user=Depends(require_roles("tpo", "institution_admin", "super_admin"))):
    if user_id == user["user_id"]:
        raise HTTPException(400, "Cannot remove yourself")
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(404, "not found")
    if user["role"] != "super_admin" and target.get("institution_id") != user.get("institution_id"):
        raise HTTPException(403, "forbidden")
    await db.users.delete_one({"user_id": user_id})
    return {"ok": True}
