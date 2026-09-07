#!/usr/bin/env python3
"""A4 landscape one-pager: HAM→SHA latest vessel schedule lead-time."""
from __future__ import annotations

import csv
from collections import defaultdict
from datetime import date, datetime
from math import ceil
from pathlib import Path
from statistics import mean, median

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "ham_sha_latest_schedule_bl.csv"
OUT = Path("/workspace/deliverables/HAM-SHA_latest_schedule_leadtime.pdf")
ASOF = date(2026, 9, 7)

NAVY = HexColor("#0E2744")
RED = HexColor("#C0392B")
GREEN = HexColor("#1F6B4A")
BLUE = HexColor("#1B4F8A")
MUTED = HexColor("#5B6B7C")
LINE = HexColor("#D5DEE6")
INK = HexColor("#24384A")
ORANGE = HexColor("#D35400")
BAR_MID = HexColor("#3D5A73")
BAR_ETA = HexColor("#C5D0D8")
BG = HexColor("#F7F9FB")
BG_BAD = HexColor("#FDECEA")
BG_OK = HexColor("#EAF6EF")
GRID = HexColor("#E6EBF0")

MONTH_ORDER = [
    ("2025-11", "Nov 25"),
    ("2025-12", "Dec 25"),
    ("2026-01", "Jan 26"),
    ("2026-02", "Feb 26"),
    ("2026-03", "Mar 26"),
    ("2026-04", "Apr 26"),
    ("2026-05", "May 26"),
    ("2026-06", "Jun 26"),
    ("2026-07", "Jul 26"),
    ("2026-08", "Aug 26"),
]


def parse_iso(s: str) -> date:
    return datetime.fromisoformat(s).date()


def load_rows():
    rows = []
    with CSV_PATH.open() as f:
        for r in csv.DictReader(f):
            atd = parse_iso(r["ATD"])
            sch = parse_iso(r["Latest Vessel Schedule"])
            days = int(r["Days"])
            assert (sch - atd).days == days, r
            rows.append(
                {
                    "bl": r["B/L No."],
                    "atd": atd,
                    "sch": sch,
                    "days": days,
                    "eta": sch > ASOF,
                }
            )
    return rows


def coverage(days_list, rate: float):
    s = sorted(days_list)
    k = ceil(len(s) * rate)
    return k, s[k - 1]


def build_stats(rows):
    voy = defaultdict(list)
    for r in rows:
        voy[(r["atd"], r["sch"])].append(r)
    voyages = []
    for (atd, sch), items in sorted(voy.items()):
        days = items[0]["days"]
        assert all(x["days"] == days for x in items)
        voyages.append(
            {
                "atd": atd,
                "sch": sch,
                "days": days,
                "n": len(items),
                "eta": sch > ASOF,
                "month": atd.strftime("%Y-%m"),
            }
        )

    by = defaultdict(list)
    for v in voyages:
        by[v["month"]].append(v)

    months = []
    for key, lab in MONTH_ORDER:
        vs = by[key]
        ds = [v["days"] for v in vs]
        tds = []
        for v in vs:
            tds += [v["days"]] * v["n"]
        core = [d for d in ds if not (key == "2026-02" and d == 76)]
        months.append(
            {
                "key": key,
                "lab": lab,
                "mean": mean(ds),
                "min": min(ds),
                "max": max(ds),
                "n": len(ds),
                "tickets": len(tds),
                "tmean": mean(tds),
                "median": median(ds),
                "core": mean(core),
                "eta": any(v["eta"] for v in vs),
            }
        )

    complete = [v for v in voyages if not v["eta"]]
    feb_may = [
        v for v in voyages if v["atd"].year == 2026 and 2 <= v["atd"].month <= 5
    ]
    apr_jun = [
        v
        for v in complete
        if v["atd"].year == 2026 and 4 <= v["atd"].month <= 6
    ]
    nov_jun = complete
    ticket_days = [r["days"] for r in rows]
    voy_days = [v["days"] for v in voyages]

    return {
        "rows": rows,
        "voyages": voyages,
        "months": months,
        "n_tickets": len(rows),
        "n_voyages": len(voyages),
        "n_eta_voy": sum(1 for v in voyages if v["eta"]),
        "ticket": {
            "min": min(ticket_days),
            "max": max(ticket_days),
            "mean": mean(ticket_days),
            "median": median(ticket_days),
        },
        "voyage": {
            "min": min(voy_days),
            "max": max(voy_days),
            "mean": mean(voy_days),
            "median": median(voy_days),
        },
        "cov_feb_may": {r: coverage([v["days"] for v in feb_may], r) for r in (0.8, 0.85, 0.9, 0.95)},
        "cov_apr_jun": {r: coverage([v["days"] for v in apr_jun], r) for r in (0.8, 0.85, 0.9, 0.95)},
        "cov_nov_jun": {r: coverage([v["days"] for v in nov_jun], r) for r in (0.8, 0.85, 0.9, 0.95)},
        "feb_may_n": len(feb_may),
        "apr_jun_n": len(apr_jun),
        "nov_jun_n": len(nov_jun),
        "complete_n": len(complete),
    }


def round_rect(c, x, y, w, h, r, fill=None, stroke=None, sw=0.6):
    c.saveState()
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    c.drawPath(p, fill=1 if fill else 0, stroke=1 if stroke else 0)
    c.restoreState()


def wrap(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_header(c, W, H, m, st):
    y = H - m
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(m, y - 8, "MANKIEWICZ CHINA LOGISTICS  ·  HAMBURG  →  SHANGHAI")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(m, y - 30, "Latest schedule lead-time is ")
    w = c.stringWidth("Latest schedule lead-time is ", "Helvetica-Bold", 20)
    c.setFillColor(RED)
    c.drawString(m + w, y - 30, "getting worse")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    lines = [
        "One-pager  ·  7 Sep 2026  ·  v2",
        "Metric: Latest Vessel Schedule − ATD (calendar days)",
        f"{st['n_tickets']} B/L  ·  {st['n_voyages']} voyages  ·  voyage-equal AVG",
    ]
    for i, t in enumerate(lines):
        c.drawRightString(W - m, y - 8 - i * 11, t)
    c.setStrokeColor(NAVY)
    c.setLineWidth(2.2)
    c.line(m, y - 40, W - m, y - 40)
    return y - 48


def draw_kpis(c, x, y, W, m, st):
    gap = 3.2 * mm
    n = 4
    w = (W - 2 * m - 3 * gap) / n
    h = 28 * mm
    nov = next(mth for mth in st["months"] if mth["key"] == "2025-11")
    jun = next(mth for mth in st["months"] if mth["key"] == "2026-06")
    delta = jun["mean"] - nov["mean"]
    pct = 100 * delta / nov["mean"]
    items = [
        (
            "NOV 2025 AVERAGE",
            f"{nov['mean']:.1f} d",
            f"{nov['n']} sailings  ·  both 47d  ·  {nov['tickets']} B/L",
            BG_OK,
            GREEN,
        ),
        (
            "JUN 2026 AVERAGE",
            f"{jun['mean']:.1f} d",
            f"{jun['n']} sailings  ·  range {jun['min']}–{jun['max']}",
            BG_BAD,
            RED,
        ),
        (
            "CHANGE",
            f"+{delta:.1f} d",
            f"+{pct:.0f}% slower Nov → Jun",
            BG_BAD,
            RED,
        ),
        (
            "THE FLOOR MOVED",
            f"{jun['min']} > {nov['max']}",
            "Every Jun sailing slower than every Nov sailing",
            BG_BAD,
            RED,
        ),
    ]
    for i, (lab, val, sub, bg, accent) in enumerate(items):
        bx = x + i * (w + gap)
        round_rect(c, bx, y - h, w, h, 4, fill=bg, stroke=HexColor("#E2E8EE"))
        c.setFillColor(accent)
        c.rect(bx, y - h, 2.2, h, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(bx + 8, y - 10, lab)
        c.setFillColor(NAVY if accent != RED else RED)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(bx + 8, y - 30, val)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.5)
        for j, line in enumerate(wrap(c, sub, "Helvetica", 7.5, w - 16)):
            c.drawString(bx + 8, y - 42 - j * 10, line)
    return y - h - 4 * mm


def draw_chart(c, x, y, w, h, st):
    months = st["months"]
    round_rect(c, x, y - h, w, h, 4, fill=white, stroke=LINE)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(
        x + 8,
        y - 12,
        "MONTHLY VOYAGE-EQUAL AVERAGE (BARS)  ·  WITHOUT 76d STOW (LINE)  ·  WHISKERS = MIN–MAX",
    )

    pl, pr, pt, pb = 26, 8, 20, 46
    cx0, cy0 = x + pl, y - h + pb
    cw, ch = w - pl - pr, h - pt - pb
    dmin, dmax = 35.0, 80.0

    def py(days):
        return cy0 + (days - dmin) / (dmax - dmin) * ch

    for d in range(35, 81, 5):
        yy = py(d)
        c.setStrokeColor(HexColor("#C9D3DE") if d == 50 else GRID)
        if d != 50:
            c.setDash(1.5, 2.5)
        c.setLineWidth(0.6)
        c.line(cx0, yy, cx0 + cw, yy)
        c.setDash()
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawRightString(cx0 - 4, yy - 2, str(d))
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.saveState()
    c.translate(x + 8, cy0 + ch / 2)
    c.rotate(90)
    c.drawCentredString(0, 0, "days")
    c.restoreState()
    c.setFillColor(HexColor("#7A8A99"))
    c.setFont("Helvetica", 6)
    c.drawRightString(cx0 + cw - 2, py(50) + 3, "50d ref")

    n = len(months)
    slot = cw / n
    bw = 13
    line_pts = []
    for i, mth in enumerate(months):
        mx_c = cx0 + slot * (i + 0.5)
        if mth["eta"]:
            fill = BAR_ETA
        elif mth["key"] == "2026-06":
            fill = RED
        elif mth["key"] == "2025-11":
            fill = GREEN
        elif mth["mean"] >= 54:
            fill = ORANGE
        else:
            fill = BAR_MID
        yb, ym = py(dmin), py(mth["mean"])
        c.setFillColor(fill)
        c.roundRect(mx_c - bw / 2, yb, bw, ym - yb, 1.2, fill=1, stroke=0)
        if mth["eta"]:
            c.setStrokeColor(MUTED)
            c.setDash(1.5, 1.5)
            c.setLineWidth(0.8)
            c.roundRect(mx_c - bw / 2, yb, bw, ym - yb, 1.2, fill=0, stroke=1)
            c.setDash()
        c.setStrokeColor(NAVY)
        c.setLineWidth(1.0)
        c.line(mx_c, py(mth["min"]), mx_c, py(mth["max"]))
        c.line(mx_c - 3.2, py(mth["min"]), mx_c + 3.2, py(mth["min"]))
        c.line(mx_c - 3.2, py(mth["max"]), mx_c + 3.2, py(mth["max"]))
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(mx_c, ym + 2.5, f"{mth['mean']:.1f}")
        accent = RED if mth["key"] == "2026-06" else GREEN if mth["key"] == "2025-11" else MUTED if mth["eta"] else NAVY
        c.setFillColor(accent)
        c.setFont("Helvetica-Bold" if mth["key"] in ("2025-11", "2026-06") else "Helvetica", 6.5)
        c.drawCentredString(mx_c, cy0 - 10, mth["lab"])
        c.setFillColor(HexColor("#7A8A99"))
        c.setFont("Helvetica", 5.8)
        tag = f"n={mth['n']}" + (" ETA" if mth["eta"] else "")
        c.drawCentredString(mx_c, cy0 - 20, tag)
        # line uses complete months only (core = drop Feb 76)
        if not mth["eta"]:
            line_pts.append((mx_c, py(mth["core"])))

    c.setStrokeColor(BLUE)
    c.setLineWidth(1.6)
    p = c.beginPath()
    p.moveTo(line_pts[0][0], line_pts[0][1])
    for px, pyy in line_pts[1:]:
        p.lineTo(px, pyy)
    c.drawPath(p, stroke=1, fill=0)
    for px, pyy in line_pts:
        c.setFillColor(white)
        c.setStrokeColor(BLUE)
        c.setLineWidth(1.2)
        c.circle(px, pyy, 2.3, fill=1, stroke=1)

    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(cx0 + 4, py(66), "Jan 63–64d")
    c.setFillColor(RED)
    c.drawString(cx0 + 4, py(76) - 1, "Feb 76d (1 B/L)")
    jun = next(mth for mth in months if mth["key"] == "2026-06")
    jun_x = cx0 + slot * (7 + 0.5)
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(jun_x, py(jun["max"]) + 8, "Jun 57–71d")

    ly = y - h + 7
    c.setFont("Helvetica", 6.5)
    items = [
        (GREEN, "Nov baseline"),
        (RED, "Jun (slowest complete)"),
        (BLUE, "Excl. 76d stow"),
        (BAR_ETA, "Jul–Aug ETA (sch > 7 Sep)"),
    ]
    lx = x + 8
    for col, lab in items:
        c.setFillColor(col)
        c.rect(lx, ly, 7, 7, fill=1, stroke=0)
        c.setFillColor(INK)
        c.drawString(lx + 10, ly + 1, lab)
        lx += c.stringWidth(lab, "Helvetica", 6.5) + 20


def draw_facts(c, x, y, w, h, st):
    nov = next(m for m in st["months"] if m["key"] == "2025-11")
    may = next(m for m in st["months"] if m["key"] == "2026-05")
    jun = next(m for m in st["months"] if m["key"] == "2026-06")
    l_feb_may = st["cov_feb_may"][0.8][1]
    l_apr_jun = st["cov_apr_jun"][0.8][1]
    l_nov_jun = st["cov_nov_jun"][0.8][1]
    facts = [
        (
            True,
            "Not just one slow ship",
            f"June minimum {jun['min']}d is already above May minimum {may['min']}d and Nov maximum {nov['max']}d. The band moved again after the May 55d step.",
        ),
        (
            False,
            "May still matches the 19 Aug page",
            f"May voyage-equal mean is still {may['mean']:.1f}d (range {may['min']}–{may['max']}, n={may['n']}). April is now complete at {next(m for m in st['months'] if m['key']=='2026-04')['mean']:.1f}d (n=5).",
        ),
        (
            False,
            "80% coverage (factory CEILING rule)",
            f"Feb–May still {l_feb_may}d. Last 3 complete months Apr–Jun: {l_apr_jun}d (n={st['apr_jun_n']}). Nov–Jun complete: {l_nov_jun}d. Do not fold Jul–Aug ETAs into k.",
        ),
        (
            False,
            "Ticket-weighted monthly AVG agrees",
            f"B/L-equal: Nov {nov['tmean']:.0f} → May {may['tmean']:.1f} → Jun {jun['tmean']:.1f}. Same direction as voyage-equal {jun['mean']:.1f}d.",
        ),
    ]
    gap = 2.4 * mm
    fh = (h - 3 * gap) / 4
    for i, (alert, title, body) in enumerate(facts):
        fy = y - i * (fh + gap)
        bg = BG_BAD if alert else BG
        round_rect(c, x, fy - fh, w, fh, 3.5, fill=bg, stroke=LINE)
        c.setFillColor(RED if alert else NAVY)
        c.rect(x, fy - fh, 2.4, fh, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(x + 8, fy - 11, title)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7)
        yy = fy - 22
        for line in wrap(c, body, "Helvetica", 7, w - 14):
            c.drawString(x + 8, yy, line)
            yy -= 9.2


def draw_sowhat(c, x, y, w, h, st):
    round_rect(c, x, y - h, w, h, 4, fill=white, stroke=LINE)
    col_w = (w - 16) / 2
    l_apr_jun = st["cov_apr_jun"][0.8][1]
    l_nov_jun = st["cov_nov_jun"][0.8][1]
    l_feb_may = st["cov_feb_may"][0.8][1]
    blocks = [
        (
            "WHAT THIS MEANS",
            [
                f"If June Latest Schedule is treated as arrived, last-3-complete-months 80% is {l_apr_jun}d (Apr–Jun) — not the Nov 47d average and not {l_feb_may}d from Feb–May only.",
                f"Until ATA is confirmed, keep {l_feb_may}d on the table but do not plan as if 55 still covers June: every June sailing is already ≥57d.",
                "Jul–Aug bars are ETAs (schedule after 7 Sep). Do not read Aug 52.5d as recovery.",
            ],
        ),
        (
            "HOW TO READ THE SPIKES",
            [
                "4 Feb: 4 B/L stay at 49d; B/L 266220960 is 76d. Line drops only that stow.",
                "June splits: 7 Jun 59d vs 69d; 14 Jun 62d vs 65d; 9 Jun 71d; 22 Jun 70d. Floor is 1 Jun 57d.",
                "4 Mar: B/L 264161585 is 36d vs four 48d the same ATD — that 36d still pulls March’s mean to 47.2d.",
            ],
        ),
    ]
    for i, (title, bullets) in enumerate(blocks):
        bx = x + 8 + i * (col_w + 8)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(bx, y - 12, title)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.3)
        yy = y - 24
        for b in bullets:
            c.circle(bx + 2, yy + 2, 1.1, fill=1, stroke=0)
            lines = wrap(c, b, "Helvetica", 7.3, col_w - 12)
            for line in lines:
                c.drawString(bx + 8, yy, line)
                yy -= 9.2
            yy -= 3.2


def draw_footer(c, W, m, st):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(m, 11 * mm, W - m, 11 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.6)
    text = (
        f"Source: user extract 7 Sep 2026 v2, {st['n_tickets']} B/L (ATD 23 Nov 2025–7 Aug 2026). "
        "Days = Latest Vessel Schedule − ATD. Voyage unit = unique (ATD date + schedule date), equal weight. "
        f"Jul–Aug: {st['n_eta_voy']} voyages with schedule after 7 Sep = ETA, excluded from coverage k. "
        "knowledge/06-performance/ham-sha-sailing-lead-time.md"
    )
    lines = wrap(c, text, "Helvetica", 6.6, W - 2 * m)
    yy = 8.0 * mm
    for line in lines[:2]:
        c.drawString(m, yy, line)
        yy -= 8.2


def build():
    st = build_stats(load_rows())
    W, H = landscape(A4)
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HAM→SHA latest schedule lead-time is getting worse (v2)")
    c.setAuthor("Mankiewicz China Logistics")
    m = 10 * mm

    y = draw_header(c, W, H, m, st)
    y = draw_kpis(c, m, y, W, m, st)

    chart_h = 90 * mm
    fact_w = 78 * mm
    gap = 3.5 * mm
    chart_w = W - 2 * m - fact_w - gap
    draw_chart(c, m, y, chart_w, chart_h, st)
    draw_facts(c, m + chart_w + gap, y, fact_w, chart_h, st)

    y2 = y - chart_h - 3.5 * mm
    so_h = 38 * mm
    draw_sowhat(c, m, y2, W - 2 * m, so_h, st)
    draw_footer(c, W, m, st)

    c.showPage()
    c.save()
    print("wrote", OUT)
    print(
        "tickets",
        st["n_tickets"],
        "voyages",
        st["n_voyages"],
        "feb-may 80%",
        st["cov_feb_may"][0.8][1],
        "apr-jun 80%",
        st["cov_apr_jun"][0.8][1],
        "nov-jun 80%",
        st["cov_nov_jun"][0.8][1],
    )
    for mth in st["months"]:
        print(
            mth["lab"],
            f"n={mth['n']}",
            f"{mth['mean']:.2f}",
            f"{mth['min']}-{mth['max']}",
            "ETA" if mth["eta"] else "",
        )


if __name__ == "__main__":
    build()
