# -*- coding: utf-8 -*-
"""Mirror of Parse.ps1 logic for automated verification on Linux CI."""
from __future__ import annotations

import json
import unittest
from datetime import datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_config():
    with open(ROOT / "config.json", encoding="utf-8") as f:
        return json.load(f)


def split_clipboard_or_tsv(text: str):
    if not text or not text.strip():
        return []
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.rstrip() for ln in normalized.split("\n") if ln.strip() != ""]
    rows = []
    for line in lines:
        if "\t" in line:
            parts = line.split("\t")
        elif ";" in line:
            parts = line.split(";")
        else:
            parts = line.split(",")
        rows.append([p.strip().strip('"') for p in parts])
    return rows


def norm_header(text: str) -> str:
    return "".join((text or "").split())


def convert_raw_rows_to_records(cfg, raw_rows, operator="tester"):
    business = [c["name"] for c in cfg["columns"]]
    if not raw_rows:
        return []

    start = 0
    header_map = None
    first = raw_rows[0]
    norm_first = [norm_header(x) for x in first]
    norm_business = [norm_header(x) for x in business]
    match = sum(1 for h in norm_first if h in norm_business)
    if match >= max(1, (len(business) + 1) // 2):
        header_map = {}
        for i, h in enumerate(norm_first):
            for col in business:
                if norm_header(col) == h:
                    header_map[col] = i
        start = 1

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    records = []
    for r in range(start, len(raw_rows)):
        row = raw_rows[r]
        obj = {}
        for idx, col in enumerate(business):
            if header_map is not None:
                i = header_map.get(col)
                obj[col] = row[i] if i is not None and i < len(row) else ""
            else:
                obj[col] = row[idx] if idx < len(row) else ""

        missing = [
            c["name"]
            for c in cfg["columns"]
            if c.get("required") and not str(obj.get(c["name"], "")).strip()
        ]
        if missing:
            raise ValueError(f"第 {r + 1} 行缺少必填字段: {', '.join(missing)}")

        obj[cfg["timestampColumn"]] = now
        obj[cfg["operatorColumn"]] = operator
        records.append(obj)
    return records


def test_capacity(current, incoming, max_records):
    total = current + incoming
    return {
        "Allowed": total <= max_records,
        "Total": total,
        "Max": max_records,
        "Remaining": max(0, max_records - current),
    }


def select_within_retention(records, cfg, as_of=None):
    as_of = as_of or datetime.now()
    days = int(cfg["retentionDays"])
    cutoff = (as_of.date() - timedelta(days=days - 1))
    ts_name = cfg["timestampColumn"]
    kept = []
    for rec in records:
        raw = rec.get(ts_name, "")
        try:
            dt = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
            if dt.date() >= cutoff:
                kept.append(rec)
        except Exception:
            kept.append(rec)
    return kept


class ParseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cfg = load_config()

    def test_config_limits(self):
        self.assertEqual(self.cfg["maxRecords"], 1000)
        self.assertEqual(self.cfg["retentionDays"], 7)
        self.assertIn("jason.jiang", self.cfg["dataFolder"])
        self.assertTrue(
            ("桌面" in self.cfg["dataFolder"]) or ("Desktop" in self.cfg["dataFolder"])
        )

    def test_paste_with_header(self):
        text = (
            "日期\t单号\t客户\t业务类型\t内容摘要\t状态\t备注\n"
            "2026-09-01\tA001\t客户甲\t改单\t改地址\t处理中\t\n"
            "2026-09-02\tA002\t客户乙\t补料\t补单\t完成\tx"
        )
        rows = split_clipboard_or_tsv(text)
        recs = convert_raw_rows_to_records(self.cfg, rows)
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]["单号"], "A001")
        self.assertEqual(recs[1]["客户"], "客户乙")
        self.assertIn("录入时间", recs[0])

    def test_paste_without_header_positional(self):
        text = "2026-09-01\tB100\t客户丙\t查询\t问进度\t开放\t"
        rows = split_clipboard_or_tsv(text)
        recs = convert_raw_rows_to_records(self.cfg, rows)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0]["单号"], "B100")

    def test_required_field_missing(self):
        text = "日期\t单号\n2026-09-01\t"
        rows = split_clipboard_or_tsv(text)
        with self.assertRaises(ValueError):
            convert_raw_rows_to_records(self.cfg, rows)

    def test_capacity_blocks_over_1000(self):
        cap = test_capacity(995, 10, 1000)
        self.assertFalse(cap["Allowed"])
        self.assertEqual(cap["Remaining"], 5)

    def test_retention_keeps_week(self):
        as_of = datetime(2026, 9, 2, 12, 0, 0)
        records = [
            {"录入时间": "2026-08-20 10:00:00", "单号": "old"},
            {"录入时间": "2026-09-01 10:00:00", "单号": "new"},
        ]
        kept = select_within_retention(records, self.cfg, as_of=as_of)
        self.assertEqual([r["单号"] for r in kept], ["new"])

    def test_csv_template_exists(self):
        path = ROOT / "templates" / "导入模板示例.csv"
        self.assertTrue(path.exists())
        content = path.read_text(encoding="utf-8")
        self.assertIn("日期,单号,客户", content)


if __name__ == "__main__":
    unittest.main()
