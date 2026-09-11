#!/usr/bin/env python3
"""A4 landscape: HAM→SHA Shanghai typhoon-season voyage performance 2023–2026."""
from __future__ import annotations

import csv
from collections import defaultdict
from datetime import date, datetime
from math import ceil
from pathlib import Path
from statistics import mean, median

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent
VOYAGE = Path(
    "/workspace/knowledge/06-performance/intl-transport/snapshots/"
    "2026-09-09_ham-sha_merged_voyage.csv"
)
OUT = Path("/workspace/deliverables/HAM-SHA_typhoon_season_leadtime.pdf")
ASOF = date(2026, 9, 7)
SEASON = {6, 7, 8, 9, 10}
PEAK = {7, 8, 9}
YEARS = (2023, 2024, 2025, 2026)

NAVY = HexColor("#0E2744")
RED = HexColor("#C0392B")
GREEN = HexColor("#1F6B4A")
BLUE = HexColor("#1B4F8A")
MUTED = HexColor("#5B6B7C")
LINE = HexColor("#D5DEE6")
INK = HexColor("#24384A")
ORANGE = HexColor("#D35400")
BG = HexColor("#F7F9FB")
BG_BAD = HexColor("#FDECEA")
BG_OK = HexColor("#EAF6EF")
GRID = HexColor("#E6EBF0")
TEAL = HexColor("#1A7A6D")
YEAR_COLORS = {
    2023: HexColor("#7A8FA3"),
    2024: HexColor("#3D5A73"),
    2025: HexColor("#1F6B4A"),
    2026: HexColor("#C0392B"),
}


def parse_iso(s: str) -> date:
    return datetime.fromisoformat(s).date()


def coverage(days_list, rate: float) -> int:
    s = sorted(days_list)
    k = ceil(len(s) * rate)
    return s[k - 1]


def load_voyages():
    rows = []
    with VOYAGE.open() as f:
        for r in csv.DictReader(f):
            atd = parse_iso(r["atd"])
            sch = parse_iso(r["schedule_date"])
            days = int(r["days"])
            rows.append(
                {
                    "atd": atd,
                    "sch": sch,
                    "days": days,
                    "eta": r["status"] == "eta",
                    "n_bl": int(r["bl_count"]),
                }
            )
    return rows


def stats(days):
    if not days:
        return None
    return {
        "n": len(days),
        "min": min(days),
        "max": max(days),
        "mean": mean(days),
        "med": median(days),
        "p80": coverage(days, 0.80),
    }


def main():
    rows = load_voyages()
    complete = [r for r in rows if not r["eta"]]

    in_season = defaultdict(list)
    off_season = defaultdict(list)
    peak = defaultdict(list)
    monthly = defaultdict(list)  # (year, month) arrival
    atd_in = defaultdict(list)

    for r in complete:
        y, m = r["sch"].year, r["sch"].month
        if y in YEARS:
            monthly[(y, m)].append(r["days"])
            if m in SEASON:
                in_season[y].append(r["days"])
            else:
                off_season[y].append(r["days"])
            if m in PEAK:
                peak[y].append(r["days"])
        ay = r["atd"].year
        if ay in YEARS and r["atd"].month in SEASON:
            atd_in[ay].append(r["days"])

    eta_sep = [r["days"] for r in rows if r["eta"] and r["sch"].year == 2026 and r["sch"].month == 9]
    s_in = {y: stats(in_season[y]) for y in YEARS}
    s_off = {y: stats(off_season[y]) for y in YEARS}
    s_peak = {y: stats(peak[y]) for y in YEARS}
    s_atd = {y: stats(atd_in[y]) for y in YEARS}

    # 2026 Aug arrivals
    aug26 = monthly[(2026, 8)]
    jun26_atd = [r["days"] for r in complete if r["atd"].year == 2026 and r["atd"].month == 6]

    page_w, page_h = landscape(A4)
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    m = 9 * mm

    # header
    c.setFillColor(NAVY)
    c.rect(0, page_h - 22 * mm, page_w, 22 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, page_h - 22 * mm, 3.2 * mm, 22 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14.5)
    c.drawString(m + 2 * mm, page_h - 8.2 * mm, "Shanghai typhoon-season arrivals — 2026 is the outlier")
    c.setFont("Helvetica", 8)
    c.drawString(
        m + 2 * mm,
        page_h - 13.4 * mm,
        "上海台风季 HAM→SHA 航次  |  到港月 Jun–Oct  |  Latest Vessel Schedule − ATD  |  "
        "voyage-equal  |  ETA excluded",
    )
    c.setFont("Helvetica", 7.5)
    c.drawString(m + 2 * mm, page_h - 18.4 * mm, "snapshot 7 Sep 2026  ·  seasons 2023–2026")
    c.setFont("Helvetica", 7.5)
    c.drawRightString(page_w - m, page_h - 9.2 * mm, "one page  ·  logistics")
    c.drawRightString(page_w - m, page_h - 15.6 * mm, "do not mix with door-to-Dushan")

    # KPI strip
    kpi_y = page_h - 22 * mm - 28 * mm
    kpi_h = 26 * mm
    gap = 3 * mm
    left = m
    usable = page_w - 2 * m
    # 4 year cards + 1 delta card
    card_w = (usable - 4 * gap) / 5

    def card(x, y, w, h, fill, title, value, sub, value_color=NAVY):
        c.setFillColor(fill)
        c.roundRect(x, y, w, h, 2.2 * mm, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawString(x + 2.4 * mm, y + h - 6.2 * mm, title)
        c.setFillColor(value_color)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 2.4 * mm, y + 8.6 * mm, value)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.2)
        c.drawString(x + 2.4 * mm, y + 3.2 * mm, sub)

    for i, y in enumerate(YEARS):
        st = s_in[y]
        fill = BG_BAD if y == 2026 else BG
        vc = RED if y == 2026 else NAVY
        n_note = f"n={st['n']}  med {st['med']:.0f}d  80% {st['p80']}d"
        if y == 2026:
            n_note += "  ·  Jun–Aug only"
        card(
            left + i * (card_w + gap),
            kpi_y,
            card_w,
            kpi_h,
            fill,
            f"{y} in-season mean",
            f"{st['mean']:.1f} d",
            n_note,
            vc,
        )
    dlt = s_in[2026]["mean"] - s_in[2025]["mean"]
    pct = 100 * dlt / s_in[2025]["mean"]
    card(
        left + 4 * (card_w + gap),
        kpi_y,
        card_w,
        kpi_h,
        BG_BAD,
        "2026 vs 2025 in-season",
        f"+{dlt:.1f} d",
        f"+{pct:.0f}%  ·  80%  {s_in[2025]['p80']} → {s_in[2026]['p80']}d",
        RED,
    )

    # left chart: in vs off by year
    chart_top = kpi_y - 5 * mm
    chart_h = 72 * mm
    chart_left_w = 118 * mm
    draw_grouped(
        c,
        m,
        chart_top - chart_h,
        chart_left_w,
        chart_h,
        s_in,
        s_off,
        s_peak,
    )

    # right monthly lines Jun–Oct
    draw_monthly(
        c,
        m + chart_left_w + 4 * mm,
        chart_top - chart_h,
        78 * mm,
        chart_h,
        monthly,
        eta_sep,
    )

    # fact boxes bottom
    box_y = 9 * mm
    box_h = 48 * mm
    bw = (page_w - 2 * m - 2 * gap) / 3
    boxes = [
        (
            BG,
            NAVY,
            "HOW TO READ",
            [
                "Typhoon season = Shanghai arrival month Jun–Oct (CN East China ~95% of TCs). Peak = Jul–Sep.",
                "Grain: one point per voyage (same ATD + schedule date). Not ticket-weighted.",
                "2026 in-season = Jun–Aug arrivals only. Sep 2026 arrivals are still ETA (hatched / dashed).",
                "2022–2025 dates from screenshot OCR; 2026 from typed extract. Do not mix with door-to-Dushan.",
            ],
        ),
        (
            BG_OK,
            GREEN,
            "2023–2025: season was not the spike",
            [
                f"2023 in-season +7.9d vs that year off-season, but mean stayed 53.8d — same 52–55d band as 2024.",
                f"2024–25 in-season similar or faster than off-season. 2025 peak Jul–Sep {s_peak[2025]['mean']:.1f}d (n={s_peak[2025]['n']}).",
                f"ATD Jun–Oct 2025: {s_atd[2025]['mean']:.1f}d vs off 53.8d. Typhoon months did not stretch the lane then.",
                "2025 in-season floor 45d, median 50d. The 83d max is one June transship, not the centre.",
            ],
        ),
        (
            BG_BAD,
            RED,
            "2026: every complete arrival is above 2025’s median",
            [
                f"In-season floor 51d > 2025 median 50d. Peak Jul–Sep mean {s_peak[2026]['mean']:.1f}d (n={s_peak[2026]['n']}, 80%={s_peak[2026]['p80']}d).",
                f"Aug 2026 arrivals: mean {mean(aug26):.1f}d (n={len(aug26)}, 59–71). Jun ATD already 57–71d (mean {mean(jun26_atd):.1f}, n={len(jun26_atd)}) — before Jul/Aug ETAs.",
                "Public (not our B/L IDs): Bavi / 巴威 10–13 Jul Yangshan clear-out; Baihaitun / 白海豚 8–11 Aug, 42 ships restow.",
                "Do not treat Sep ETA ~48d as recovery. Factory 55d (80%) does not cover 2026 in-season 80% = 65d.",
            ],
        ),
    ]
    for i, (fill, accent, title, lines) in enumerate(boxes):
        x = m + i * (bw + gap)
        c.setFillColor(fill)
        c.roundRect(x, box_y, bw, box_h, 2 * mm, fill=1, stroke=0)
        c.setFillColor(accent)
        c.rect(x, box_y, 1.6 * mm, box_h, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(x + 4 * mm, box_y + box_h - 6.5 * mm, title)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.15)
        ty = box_y + box_h - 12.2 * mm
        for line in lines:
            wrapped = wrap(line, 52 if i == 0 else 50)
            for wline in wrapped:
                c.drawString(x + 4 * mm, ty, wline)
                ty -= 3.35 * mm
            ty -= 0.6 * mm

    c.showPage()
    c.save()
    print("wrote", OUT)
    print("in-season", {y: s_in[y] for y in YEARS})
    print("off", {y: s_off[y] for y in YEARS})
    print("peak", {y: s_peak[y] for y in YEARS})


def wrap(text: str, width: int) -> list[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if len(trial) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_grouped(c, x, y, w, h, s_in, s_off, s_peak):
    pad_l, pad_r, pad_t, pad_b = 12 * mm, 4 * mm, 10 * mm, 12 * mm
    plot_x = x + pad_l
    plot_y = y + pad_b
    plot_w = w - pad_l - pad_r
    plot_h = h - pad_t - pad_b
    ymin, ymax = 30, 88

    c.setFillColor(white)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 2 * mm, fill=1, stroke=1)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 3.5 * mm, y + h - 6.5 * mm, "In-season vs off-season  ·  voyage mean (whisker = min–max)")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(x + 3.5 * mm, y + h - 10.5 * mm, "Solid = arrival Jun–Oct   Outline = rest of year   Peak Jul–Sep marked as diamond")

    def sy(v):
        return plot_y + (v - ymin) / (ymax - ymin) * plot_h

    c.setStrokeColor(GRID)
    c.setLineWidth(0.3)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    for v in range(30, 89, 10):
        yy = sy(v)
        c.setStrokeColor(GRID)
        c.line(plot_x, yy, plot_x + plot_w, yy)
        c.setFillColor(MUTED)
        c.drawRightString(plot_x - 1.6 * mm, yy - 1.4 * mm, str(v))

    n_g = len(YEARS)
    gw = plot_w / n_g
    bar_w = gw * 0.28

    for i, yr in enumerate(YEARS):
        gx = plot_x + i * gw + gw / 2
        inn, off = s_in[yr], s_off[yr]
        # off outline bar
        ox = gx - bar_w - 1.2 * mm
        c.setStrokeColor(YEAR_COLORS[yr])
        c.setFillColor(Color(YEAR_COLORS[yr].red, YEAR_COLORS[yr].green, YEAR_COLORS[yr].blue, alpha=0.18))
        c.setLineWidth(1)
        c.rect(ox, sy(ymin), bar_w, sy(off["mean"]) - sy(ymin), fill=1, stroke=1)
        # in solid
        ix = gx + 1.2 * mm
        c.setFillColor(YEAR_COLORS[yr])
        c.setStrokeColor(YEAR_COLORS[yr])
        c.rect(ix, sy(ymin), bar_w, sy(inn["mean"]) - sy(ymin), fill=1, stroke=0)
        # whisker in-season
        c.setStrokeColor(NAVY if yr != 2026 else RED)
        c.setLineWidth(0.9)
        mid = ix + bar_w / 2
        c.line(mid, sy(inn["min"]), mid, sy(inn["max"]))
        c.line(mid - 1.4 * mm, sy(inn["min"]), mid + 1.4 * mm, sy(inn["min"]))
        c.line(mid - 1.4 * mm, sy(inn["max"]), mid + 1.4 * mm, sy(inn["max"]))
        # peak diamond
        pk = s_peak[yr]
        if pk:
            py = sy(pk["mean"])
            px = mid
            c.setFillColor(ORANGE)
            p = c.beginPath()
            p.moveTo(px, py + 1.6 * mm)
            p.lineTo(px + 1.6 * mm, py)
            p.lineTo(px, py - 1.6 * mm)
            p.lineTo(px - 1.6 * mm, py)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
        # labels
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 6.2)
        c.drawCentredString(ix + bar_w / 2, sy(inn["mean"]) + 1.8 * mm, f"{inn['mean']:.1f}")
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 5.8)
        c.drawCentredString(ox + bar_w / 2, sy(off["mean"]) + 1.4 * mm, f"{off['mean']:.1f}")
        c.setFillColor(NAVY if yr != 2026 else RED)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(gx, plot_y - 6.5 * mm, str(yr))
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 5.5)
        extra = "Jun–Aug" if yr == 2026 else f"n={inn['n']}"
        c.drawCentredString(gx, plot_y - 10.2 * mm, extra)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 5.5)
    c.drawString(plot_x, y + 2.2 * mm, "days   ·   orange diamond = Jul–Sep peak mean")


def draw_monthly(c, x, y, w, h, monthly, eta_sep):
    pad_l, pad_r, pad_t, pad_b = 10 * mm, 3 * mm, 10 * mm, 12 * mm
    plot_x = x + pad_l
    plot_y = y + pad_b
    plot_w = w - pad_l - pad_r
    plot_h = h - pad_t - pad_b
    ymin, ymax = 40, 75
    months = [6, 7, 8, 9, 10]
    labels = ["Jun", "Jul", "Aug", "Sep", "Oct"]

    c.setFillColor(white)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 2 * mm, fill=1, stroke=1)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 3 * mm, y + h - 6.5 * mm, "Arrival month inside the season")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(x + 3 * mm, y + h - 10.5 * mm, "2026 Aug = 66d   ·   Sep 26 dashed = ETA")

    def sy(v):
        return plot_y + (v - ymin) / (ymax - ymin) * plot_h

    def sx(i):
        return plot_x + (i / (len(months) - 1)) * plot_w

    c.setStrokeColor(GRID)
    c.setLineWidth(0.3)
    c.setFont("Helvetica", 6)
    for v in range(40, 76, 10):
        yy = sy(v)
        c.setStrokeColor(GRID)
        c.line(plot_x, yy, plot_x + plot_w, yy)
        c.setFillColor(MUTED)
        c.drawRightString(plot_x - 1.4 * mm, yy - 1.4 * mm, str(v))

    for yr in YEARS:
        pts = []
        for i, mo in enumerate(months):
            d = monthly.get((yr, mo), [])
            if d:
                pts.append((i, mean(d), False))
        if yr == 2026 and eta_sep:
            pts.append((3, mean(eta_sep), True))
        if len(pts) < 2:
            continue
        c.setStrokeColor(YEAR_COLORS[yr])
        c.setFillColor(YEAR_COLORS[yr])
        c.setLineWidth(1.6 if yr == 2026 else 1.15)
        for a, b in zip(pts, pts[1:]):
            dash = 1 if a[2] or b[2] else 0
            if dash:
                c.setDash(1.5, 1.5)
                c.setLineWidth(1.1)
            else:
                c.setDash()
                c.setLineWidth(1.6 if yr == 2026 else 1.15)
            c.line(sx(a[0]), sy(a[1]), sx(b[0]), sy(b[1]))
        c.setDash()
        for i, val, is_eta in pts:
            r = 1.7 * mm if yr == 2026 and not is_eta else 1.25 * mm
            if is_eta:
                c.setFillColor(white)
                c.setStrokeColor(YEAR_COLORS[yr])
                c.setLineWidth(1)
                c.circle(sx(i), sy(val), r, fill=1, stroke=1)
            else:
                c.setFillColor(YEAR_COLORS[yr])
                c.circle(sx(i), sy(val), r, fill=1, stroke=0)
            if yr == 2026 and not is_eta:
                c.setFillColor(RED)
                c.setFont("Helvetica-Bold", 5.8)
                c.drawCentredString(sx(i), sy(val) + 2.4 * mm, f"{val:.0f}")

    for i, lab in enumerate(labels):
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(sx(i), plot_y - 6.5 * mm, lab)

    # legend
    lx = plot_x
    ly = y + 2.4 * mm
    for yr in YEARS:
        c.setFillColor(YEAR_COLORS[yr])
        c.rect(lx, ly, 3.2 * mm, 2.1 * mm, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica", 5.5)
        c.drawString(lx + 3.8 * mm, ly, str(yr))
        lx += 14 * mm


if __name__ == "__main__":
    main()
