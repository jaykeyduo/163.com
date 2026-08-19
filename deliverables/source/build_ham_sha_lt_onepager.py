#!/usr/bin/env python3
"""A4 landscape one-pager PDF: HAM→SHA arrival lead-time is getting worse."""
from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

OUT = Path("/workspace/deliverables/HAM-SHA_arrival_leadtime_getting_worse.pdf")

NAVY = HexColor("#0E2744")
RED = HexColor("#C0392B")
GREEN = HexColor("#1F6B4A")
BLUE = HexColor("#1B4F8A")
MUTED = HexColor("#5B6B7C")
LINE = HexColor("#D5DEE6")
INK = HexColor("#24384A")
ORANGE = HexColor("#D35400")
BAR_MID = HexColor("#3D5A73")
BG = HexColor("#F7F9FB")
BG_BAD = HexColor("#FDECEA")
BG_OK = HexColor("#EAF6EF")
GRID = HexColor("#E6EBF0")

MONTHS = [
    # label, all_mean, min, max, n, direct_mean
    ("Oct 25", 47.33, 45, 49, 3, 45.0),
    ("Nov 25", 46.4, 45, 47, 5, 46.4),
    ("Dec 25", 48.6, 45, 55, 5, 47.0),
    ("Jan 26", 54.0, 41, 64, 4, 54.0),
    ("Feb 26", 55.4, 48, 76, 5, 50.25),
    ("Mar 26", 50.0, 46, 55, 6, 50.0),
    ("Apr 26", 52.8, 48, 58, 5, 51.5),
    ("May 26", 55.0, 53, 58, 4, 55.0),
]


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


def draw_header(c, W, H, m):
    y = H - m
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(m, y - 8, "MANKIEWICZ CHINA LOGISTICS  ·  HAMBURG  →  SHANGHAI")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(m, y - 30, "Arrival lead-time is ")
    w = c.stringWidth("Arrival lead-time is ", "Helvetica-Bold", 20)
    c.setFillColor(RED)
    c.drawString(m + w, y - 30, "getting worse")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    lines = [
        "One-pager  ·  19 Aug 2026",
        "Metric: NEW ETA − ATD (calendar days)",
        "Arrived sailings only  ·  voyage-equal AVG",
    ]
    for i, t in enumerate(lines):
        c.drawRightString(W - m, y - 8 - i * 11, t)
    c.setStrokeColor(NAVY)
    c.setLineWidth(2.2)
    c.line(m, y - 40, W - m, y - 40)
    return y - 48


def draw_kpis(c, x, y, W, m):
    gap = 3.2 * mm
    n = 4
    w = (W - 2 * m - 3 * gap) / n
    h = 28 * mm
    items = [
        ("NOV 2025 AVERAGE", "46.4 d", "5 HAM–SHA sailings  ·  range 45–47", BG_OK, GREEN),
        ("MAY 2026 AVERAGE", "55.0 d", "4 HAM–SHA sailings  ·  range 53–58", BG_BAD, RED),
        ("CHANGE", "+8.6 d", "+19% slower in six months", BG_BAD, RED),
        ("THE FLOOR MOVED", "53 > 47", "Every May sailing slower than every Nov sailing", BG_BAD, RED),
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


def draw_chart(c, x, y, w, h):
    """Bottom-left origin chart. y is top of chart panel."""
    round_rect(c, x, y - h, w, h, 4, fill=white, stroke=LINE)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 8, y - 12, "MONTHLY VOYAGE-EQUAL AVERAGE (BARS)  ·  HAM–SHA DIRECT (LINE)  ·  WHISKERS = MIN–MAX")

    pl, pr, pt, pb = 28, 10, 22, 46
    cx0, cy0 = x + pl, y - h + pb
    cw, ch = w - pl - pr, h - pt - pb
    dmin, dmax = 40.0, 80.0

    def py(days):
        return cy0 + (days - dmin) / (dmax - dmin) * ch

    for d in range(40, 81, 5):
        yy = py(d)
        c.setStrokeColor(HexColor("#C9D3DE") if d == 50 else GRID)
        c.setDash(2, 3) if d != 50 else c.setDash()
        if d == 50:
            c.setDash()
        else:
            c.setDash(1.5, 2.5)
        c.setLineWidth(0.6)
        c.line(cx0, yy, cx0 + cw, yy)
        c.setDash()
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawRightString(cx0 - 4, yy - 2, str(d))
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.saveState()
    c.translate(x + 9, cy0 + ch / 2)
    c.rotate(90)
    c.drawCentredString(0, 0, "days")
    c.restoreState()
    c.setFillColor(HexColor("#7A8A99"))
    c.setFont("Helvetica", 6.5)
    c.drawRightString(cx0 + cw - 2, py(50) + 3, "50d ref")

    n = len(MONTHS)
    slot = cw / n
    bw = 16
    line_pts = []
    for i, (lab, mean, mn, mx, nv, direct) in enumerate(MONTHS):
        mx_c = cx0 + slot * (i + 0.5)
        is_nov = lab.startswith("Nov")
        is_may = lab.startswith("May")
        if is_may:
            fill = RED
        elif is_nov:
            fill = GREEN
        elif mean >= 54:
            fill = ORANGE
        else:
            fill = BAR_MID
        yb, ym = py(dmin), py(mean)
        c.setFillColor(fill)
        c.roundRect(mx_c - bw / 2, yb, bw, ym - yb, 1.5, fill=1, stroke=0)
        c.setStrokeColor(NAVY)
        c.setLineWidth(1.1)
        c.line(mx_c, py(mn), mx_c, py(mx))
        c.line(mx_c - 4, py(mn), mx_c + 4, py(mn))
        c.line(mx_c - 4, py(mx), mx_c + 4, py(mx))
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(mx_c, ym + 3, f"{mean:.1f}")
        c.setFillColor(RED if is_may else GREEN if is_nov else NAVY)
        c.setFont("Helvetica-Bold" if is_nov or is_may else "Helvetica", 7.5)
        c.drawCentredString(mx_c, cy0 - 11, lab)
        c.setFillColor(HexColor("#7A8A99"))
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(mx_c, cy0 - 21, f"n={nv}")
        line_pts.append((mx_c, py(direct)))

    c.setStrokeColor(BLUE)
    c.setLineWidth(1.7)
    c.setLineJoin(1)
    p = c.beginPath()
    p.moveTo(line_pts[0][0], line_pts[0][1])
    for px, pyy in line_pts[1:]:
        p.lineTo(px, pyy)
    c.drawPath(p, stroke=1, fill=0)
    for px, pyy in line_pts:
        c.setFillColor(white)
        c.setStrokeColor(BLUE)
        c.setLineWidth(1.3)
        c.circle(px, pyy, 2.6, fill=1, stroke=1)

    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(cx0 + 4, py(76), "Jan: two sailings 63–64d")
    c.setFillColor(RED)
    c.drawString(cx0 + 4, py(73.5), "Feb whisker: GBLON 76d")

    ly = y - h + 8
    c.setFont("Helvetica", 7)
    items = [
        (GREEN, "Nov baseline"),
        (RED, "May (latest full arrived month)"),
        (BLUE, "HAM–SHA direct only"),
    ]
    lx = x + 10
    for col, lab in items:
        c.setFillColor(col)
        c.rect(lx, ly, 7, 7, fill=1, stroke=0)
        c.setFillColor(INK)
        c.drawString(lx + 10, ly + 1, lab)
        lx += c.stringWidth(lab, "Helvetica", 7) + 22
    c.setFillColor(MUTED)
    c.drawString(lx, ly + 1, "Jun–Aug 2026 mostly Not Arrived — excluded (ETA is not actual)")


def draw_facts(c, x, y, w, h):
    facts = [
        (
            True,
            "Not just one slow ship",
            "May minimum 53d is already above Nov maximum 47d. The whole band shifted — this is not a single GBLON outlier.",
        ),
        (
            False,
            "Winter vs spring (3-month blocks)",
            "Oct–Dec 2025 mean 47.5d (n=13). Mar–May 2026 mean 52.3d (n=15). Direct HAM–SHA: 46.5 → 51.9.",
        ),
        (
            False,
            "80% coverage (factory CEILING rule)",
            "Oct–Dec: 49d. Feb–May / Mar–May: 55d. A ~47d planning LT no longer covers 8 in 10 arrived sailings.",
        ),
        (
            False,
            "Ticket-weighted monthly AVG agrees",
            "Pivot SUM (40' weighted): Nov 46 → May 55. Same direction. Do not use 51 (all-sample AVG) as the parameter.",
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
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 8, fy - 11, title)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.5)
        yy = fy - 22
        for line in wrap(c, body, "Helvetica", 7.5, w - 14):
            c.drawString(x + 8, yy, line)
            yy -= 9.5


def draw_sowhat(c, x, y, w, h):
    round_rect(c, x, y - h, w, h, 4, fill=white, stroke=LINE)
    col_w = (w - 16) / 2
    blocks = [
        (
            "WHAT THIS MEANS",
            [
                "Internal sailing LT should start at 55 days (80% coverage), not the 2025 winter average.",
                "Door-to-Dushan = sailing + Yangshan customs + truck + WH posting — those legs are not in this page.",
                "Latest arrived sailing 1 Jun 2026 = 57d (n=1; month incomplete).",
            ],
        ),
        (
            "HOW TO READ THE SPIKES",
            [
                "Jan 63–64d are HAM–SHA (not transshipment) — they lift Dec–May 90% coverage to 63d.",
                "Feb all-routes mean 55.4d includes GBLON 76d; direct HAM–SHA that month is 50.3d.",
                "Default HAM–SHA parameter still uses May 55d / 80%=55d — the worsening holds without transshipment.",
            ],
        ),
    ]
    for i, (title, bullets) in enumerate(blocks):
        bx = x + 8 + i * (col_w + 8)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(bx, y - 12, title)
        c.setFillColor(INK)
        c.setFont("Helvetica", 7.5)
        yy = y - 24
        for b in bullets:
            c.circle(bx + 2, yy + 2, 1.1, fill=1, stroke=0)
            lines = wrap(c, b, "Helvetica", 7.5, col_w - 12)
            for j, line in enumerate(lines):
                c.drawString(bx + 8, yy if j == 0 else yy, line)
                yy -= 9.5
            yy -= 3.5


def draw_footer(c, W, m):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(m, 11 * mm, W - m, 11 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.8)
    text = (
        "Source: factory ATD×Route pivot, 199 × 40' Oct 2025–Aug 2026; this page uses 38 Arrived detail rows "
        "(no SUM rows, no Not Arrived). Unit = one row (ATD + Route), equal weight — container count does not "
        "weight the average.  knowledge/06-performance/ham-sha-sailing-lead-time.md"
    )
    # two-line wrap
    lines = wrap(c, text, "Helvetica", 6.8, W - 2 * m)
    yy = 8.2 * mm
    for line in lines[:2]:
        c.drawString(m, yy, line)
        yy -= 8.5


def build():
    W, H = landscape(A4)
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("HAM→SHA arrival lead-time is getting worse")
    c.setAuthor("Mankiewicz China Logistics")
    m = 10 * mm

    y = draw_header(c, W, H, m)
    y = draw_kpis(c, m, y, W, m)

    chart_h = 90 * mm
    fact_w = 78 * mm
    gap = 3.5 * mm
    chart_w = W - 2 * m - fact_w - gap
    draw_chart(c, m, y, chart_w, chart_h)
    draw_facts(c, m + chart_w + gap, y, fact_w, chart_h)

    y2 = y - chart_h - 3.5 * mm
    so_h = 38 * mm
    draw_sowhat(c, m, y2, W - 2 * m, so_h)
    draw_footer(c, W, m)

    c.showPage()
    c.save()
    print("wrote", OUT, "pagesize", W, H)


if __name__ == "__main__":
    build()
