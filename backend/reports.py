"""PDF + CSV report generators using reportlab + csv.

All generators return BytesIO so they can be streamed from FastAPI.
"""
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT


# --- Reportlab style — editorial monochrome to match the brand ---
INK = colors.HexColor("#0a0a0a")
INK_MUTE = colors.HexColor("#555555")
LINE = colors.HexColor("#dedbd1")
ACCENT = colors.HexColor("#ff3b00")
BONE = colors.HexColor("#f5f3ee")


def _styles():
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle("eyebrow", parent=base["BodyText"], fontName="Courier-Bold",
                                  textColor=INK_MUTE, fontSize=8, leading=12, spaceAfter=2),
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Helvetica-Bold",
                                fontSize=28, leading=30, textColor=INK, spaceAfter=8),
        "sub": ParagraphStyle("sub", parent=base["BodyText"], fontName="Helvetica",
                              fontSize=11, leading=15, textColor=INK_MUTE, spaceAfter=14),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold",
                             fontSize=14, leading=18, textColor=INK, spaceBefore=12, spaceAfter=6),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica",
                               fontSize=10, leading=14, textColor=INK),
        "footer": ParagraphStyle("footer", parent=base["BodyText"], fontName="Courier",
                                 fontSize=7, leading=10, textColor=INK_MUTE, alignment=TA_RIGHT),
    }


def _header_band(title: str, eyebrow: str, S):
    return [
        Paragraph(eyebrow.upper(), S["eyebrow"]),
        Paragraph(title, S["title"]),
        Spacer(1, 6),
    ]


def _table(rows, header, col_widths=None, accent_first=False):
    data = [header] + rows
    t = Table(data, colWidths=col_widths, hAlign="LEFT", repeatRows=1)
    style = [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
        ("BACKGROUND", (0, 0), (-1, 0), BONE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, INK),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, LINE),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if accent_first:
        style.append(("TEXTCOLOR", (0, 1), (0, -1), ACCENT))
    t.setStyle(TableStyle(style))
    return t


def _build_doc(stream, story):
    doc = SimpleDocTemplate(
        stream, pagesize=A4,
        leftMargin=16 * mm, rightMargin=16 * mm,
        topMargin=18 * mm, bottomMargin=14 * mm,
        title="CareerOS Report", author="CareerOS Campus Intelligence",
    )
    S = _styles()

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Courier", 7)
        canvas.setFillColor(INK_MUTE)
        canvas.drawString(16 * mm, 10 * mm, f"CareerOS · Campus Intelligence · generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
        canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, f"Page {doc_.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return stream


# ============== PDF REPORTS ==============
def placement_report_pdf(institution: dict, overview: dict) -> io.BytesIO:
    S = _styles()
    story = _header_band(
        title=f"Placement Report — {institution.get('name', '')}",
        eyebrow=f"§ INSTITUTIONAL · AY {overview.get('year_summaries', [{}])[0].get('academic_year', '')}",
        S=S,
    )
    story.append(Paragraph(
        f"Verified placement record across all academic years on file. "
        f"<b>{overview.get('students_placed', 0)}</b> of "
        f"<b>{overview.get('students_total', 0)}</b> eligible students placed.", S["sub"]))

    # KPI mini-row
    latest = (overview.get("year_summaries") or [{}])[0]
    kpi_rows = [[
        Paragraph(f"<b>{latest.get('offers', '-')}</b><br/><font size=7 color='#555'>OFFERS</font>", S["body"]),
        Paragraph(f"<b>{latest.get('companies', '-')}</b><br/><font size=7 color='#555'>RECRUITERS</font>", S["body"]),
        Paragraph(f"<b>₹{latest.get('avg_lpa', 0):.2f}L</b><br/><font size=7 color='#555'>AVG CTC</font>", S["body"]),
        Paragraph(f"<b>₹{latest.get('top_offer_lpa', 0):.1f}L</b><br/><font size=7 color='#555'>TOP · {latest.get('top_company', '-')}</font>", S["body"]),
    ]]
    t = Table(kpi_rows, colWidths=[42 * mm] * 4)
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Year summaries table
    story.append(Paragraph("Year over year", S["h2"]))
    year_rows = [[y.get("academic_year"), y.get("companies"), y.get("offers"),
                  f"₹{y.get('avg_lpa', 0):.2f}L", f"₹{y.get('top_offer_lpa', 0):.1f}L",
                  y.get("top_company", "—")] for y in overview.get("year_summaries", [])]
    story.append(_table(year_rows, ["AY", "Recruiters", "Offers", "Avg CTC", "Top CTC", "Top recruiter"]))
    story.append(Spacer(1, 14))

    # Top recruiters
    story.append(Paragraph("Top recruiters — all time", S["h2"]))
    rec_rows = [[r.get("company"), r.get("selects"), f"₹{r.get('max_ctc', 0):.1f}L"]
                for r in (overview.get("top_recruiters") or [])[:15]]
    story.append(_table(rec_rows, ["Company", "Selects", "Max CTC"], col_widths=[100 * mm, 30 * mm, 30 * mm]))
    story.append(Spacer(1, 14))

    # Department breakdown
    story.append(Paragraph("Department breakdown", S["h2"]))
    dept_rows = []
    for d in overview.get("department_breakdown", []):
        pct = round(d.get("placed", 0) / max(1, d.get("total", 0)) * 100)
        dept_rows.append([d.get("department"), d.get("placed"), d.get("total"), f"{pct}%"])
    story.append(_table(dept_rows, ["Department", "Placed", "Total", "Rate"]))

    out = io.BytesIO(); _build_doc(out, story); out.seek(0); return out


def training_report_pdf(institution: dict, training: dict) -> io.BytesIO:
    S = _styles()
    story = _header_band(
        title=f"Training Report — {institution.get('name', '')}",
        eyebrow="§ TRAINING · COMPLETION",
        S=S,
    )
    story.append(Paragraph("Module-level training completion across every active program.", S["sub"]))

    prog_rows = [[p.get("program_name"), p.get("program_code"), p.get("enrolled"),
                  p.get("completed"), p.get("in_progress"), f"{p.get('avg_completion', 0)}%"]
                 for p in training.get("by_program", [])]
    story.append(_table(prog_rows, ["Program", "Code", "Enrolled", "Completed", "Active", "Avg %"]))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Top 30 students by completion", S["h2"]))
    rows = [[r.get("student_name"), r.get("roll_number"), r.get("department"),
             r.get("program_code"), f"{r.get('completion_pct', 0)}%", r.get("status", "—").upper()]
            for r in (training.get("rows") or [])[:30]]
    story.append(_table(rows, ["Student", "Roll", "Dept", "Program", "Completion", "Status"]))

    out = io.BytesIO(); _build_doc(out, story); out.seek(0); return out


def department_report_pdf(institution: dict, overview: dict, students: list) -> io.BytesIO:
    S = _styles()
    story = _header_band(
        title=f"Department Performance — {institution.get('name', '')}",
        eyebrow="§ DEPARTMENT · ANALYSIS",
        S=S,
    )
    story.append(Paragraph("Department-level placement performance summary.", S["sub"]))

    dept_rows = []
    for d in overview.get("department_breakdown", []):
        pct = round(d.get("placed", 0) / max(1, d.get("total", 0)) * 100)
        # Compute avg CGPA per dept from students roster
        cgpas = [s.get("cgpa", 0) for s in students if s.get("department") == d["department"]]
        avg_cgpa = round(sum(cgpas) / len(cgpas), 2) if cgpas else 0
        dept_rows.append([d.get("department"), d.get("total"), d.get("placed"),
                          f"{pct}%", f"{avg_cgpa}"])
    story.append(_table(dept_rows, ["Department", "Students", "Placed", "Rate", "Avg CGPA"], accent_first=False))

    out = io.BytesIO(); _build_doc(out, story); out.seek(0); return out


# ============== CSV EXPORTS ==============
def students_csv(items: list) -> io.BytesIO:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["roll_number", "name", "department", "email", "phone", "cgpa",
                "skills", "ats_score", "readiness_score", "placed", "placement_company", "placement_ctc"])
    for s in items:
        p = s.get("placement", {}) or {}
        w.writerow([s.get("roll_number"), s.get("name"), s.get("department"),
                    s.get("email"), s.get("phone"), s.get("cgpa"),
                    "; ".join(s.get("skills") or []), s.get("ats_score"),
                    s.get("readiness_score"), bool(p.get("placed")),
                    p.get("company", ""), p.get("ctc_lpa", "")])
    return io.BytesIO(buf.getvalue().encode("utf-8"))


def applications_csv(items: list) -> io.BytesIO:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["student_name", "roll_number", "department", "company", "job_title",
                "ctc_lpa", "stage", "applied_at", "next_step_at"])
    for a in items:
        w.writerow([a.get("student_name"), a.get("roll_number"), a.get("department"),
                    a.get("company"), a.get("job_title"), a.get("ctc_lpa"),
                    a.get("stage"), a.get("applied_at"), a.get("next_step_at", "")])
    return io.BytesIO(buf.getvalue().encode("utf-8"))


def placements_csv(records: list) -> io.BytesIO:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["academic_year", "company", "selects", "ctc_lpa"])
    for r in records:
        w.writerow([r.get("academic_year"), r.get("company"), r.get("selects"), r.get("ctc_lpa")])
    return io.BytesIO(buf.getvalue().encode("utf-8"))


# ============== ICS CALENDAR INVITE ==============
def build_ics(*, uid: str, summary: str, description: str, location: str,
              start_utc: datetime, end_utc: datetime, organizer_email: str,
              attendee_emails: list) -> bytes:
    """Return a minimal RFC 5545 .ics calendar invite for the interview."""
    def fmt(dt: datetime) -> str:
        return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    attendees = "\r\n".join([f"ATTENDEE;RSVP=TRUE:mailto:{e}" for e in attendee_emails])
    body = "\r\n".join([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CareerOS//Interview Scheduler//EN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{fmt(datetime.now(timezone.utc))}",
        f"DTSTART:{fmt(start_utc)}",
        f"DTEND:{fmt(end_utc)}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description.replace(chr(10), chr(92) + 'n')}",
        f"LOCATION:{location}",
        f"ORGANIZER;CN=CareerOS:mailto:{organizer_email}",
        attendees,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR",
    ])
    return body.encode("utf-8")
