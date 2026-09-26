"""screens/ledger/make_xlsx.py: the money ledger as an Excel workbook (openpyxl).

Called by ./make-downloads.mjs, which prepares the rows (the CSV's columns, from ./csv.mjs) and the README
text, both counted from editions/hisaab/data/money-ledger.json:

    python3 make_xlsx.py <input.json> <output.xlsx>

Sheets: README (what the file is, sources, the as-of date, how to read it, the column dictionary),
Ledger (one row per measure, source URLs as links, filters on), By year (COUNTIFS over Ledger, so the
counts recalculate if a reader edits or filters a copy). Arial throughout.
"""

import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="E7E6E6")
WIDTHS = {
    "id": 30, "launched": 10, "launched_is_approximate": 12, "year": 7, "measure": 34, "mode": 13,
    "mode_name": 26, "level": 8, "state_code": 7, "state": 18, "governing_party": 14, "enacted_by": 40,
    "benefit": 52, "reach": 34, "cost": 36, "poll": 30, "poll_month": 10, "days_before_poll": 10,
    "poll_result": 40, "outcome": 64, "package_overlaps_parts": 12, "tags": 22, "bank_items": 22,
    "play_links": 44, "source_label": 52, "source_url": 52,
}
WRAP = {"measure", "mode_name", "enacted_by", "benefit", "reach", "cost", "poll", "poll_result", "outcome",
        "tags", "bank_items", "play_links", "source_label"}


def font(**kw):
    return Font(name=FONT, **kw)


def text_cell(ws, row, col, value, **style):
    """Write a value; a string that looks like a formula stays a string."""
    cell = ws.cell(row=row, column=col, value=value if value != "" else None)
    if isinstance(value, str) and value.startswith("="):
        cell.data_type = "s"
    cell.font = style.get("font", font())
    if "alignment" in style:
        cell.alignment = style["alignment"]
    return cell


def main(src, out):
    with open(src, encoding="utf-8") as fh:
        data = json.load(fh)
    headers, rows, readme = data["headers"], data["rows"], data["readme"]
    col = {h: i + 1 for i, h in enumerate(headers)}
    last = len(rows) + 1

    wb = Workbook()

    # ---- README -------------------------------------------------------------------------------------
    ws = wb.active
    ws.title = "README"
    ws.column_dimensions["A"].width = 26
    ws.column_dimensions["B"].width = 110
    top = Alignment(vertical="top", wrap_text=True)
    text_cell(ws, 1, 1, readme["title"], font=font(bold=True, size=14))
    r = 3
    for label, value in readme["facts"]:
        text_cell(ws, r, 1, label, font=font(bold=True), alignment=top)
        cell = text_cell(ws, r, 2, value, alignment=top)
        if value.startswith("http"):
            cell.hyperlink = value
            cell.font = font(color="0563C1", underline="single")
        r += 1
    r += 1
    text_cell(ws, r, 1, "About this file", font=font(bold=True, size=12))
    r += 1
    for head, para in readme["about"]:
        text_cell(ws, r, 1, head, font=font(bold=True), alignment=top)
        text_cell(ws, r, 2, para, alignment=top)
        r += 1
    r += 1
    text_cell(ws, r, 1, "Column", font=font(bold=True), alignment=top).fill = HEAD_FILL
    text_cell(ws, r, 2, "Meaning", font=font(bold=True), alignment=top).fill = HEAD_FILL
    r += 1
    for name, meaning in readme["columns"]:
        text_cell(ws, r, 1, name, font=font(bold=True), alignment=top)
        text_cell(ws, r, 2, meaning, alignment=top)
        r += 1

    # ---- Ledger -------------------------------------------------------------------------------------
    wl = wb.create_sheet("Ledger")
    for c, h in enumerate(headers, start=1):
        cell = text_cell(wl, 1, c, h, font=font(bold=True), alignment=Alignment(vertical="top", wrap_text=True))
        cell.fill = HEAD_FILL
        wl.column_dimensions[get_column_letter(c)].width = WIDTHS.get(h, 16)
    for i, values in enumerate(rows, start=2):
        for c, (h, v) in enumerate(zip(headers, values), start=1):
            cell = text_cell(wl, i, c, v, alignment=Alignment(vertical="top", wrap_text=h in WRAP))
            if h == "source_url" and v:
                cell.hyperlink = v
                cell.font = font(color="0563C1", underline="single")
    wl.freeze_panes = "B2"
    wl.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{last}"

    # ---- By year (formulas over Ledger) -------------------------------------------------------------
    wy = wb.create_sheet("By year")
    def rng(name):
        letter = get_column_letter(col[name])
        return f"Ledger!${letter}$2:${letter}${last}"
    year, mode, level, poll = rng("year"), rng("mode"), rng("level"), rng("poll")
    heads = ["Year", "Seedha Khaate Mein (distribution)", "Rahat Kosh (relief)", "Chunav Se Pehle (pre-election)",
             "All measures", "Centre", "State", "Named the poll it preceded"]
    for c, h in enumerate(heads, start=1):
        cell = text_cell(wy, 1, c, h, font=font(bold=True), alignment=Alignment(vertical="top", wrap_text=True))
        cell.fill = HEAD_FILL
        wy.column_dimensions[get_column_letter(c)].width = 8 if c == 1 else 18
    years = sorted({v[headers.index("year")] for v in rows})
    first_year, last_year = min(years), max(years)
    for i, y in enumerate(range(first_year, last_year + 1), start=2):
        wy.cell(row=i, column=1, value=y).font = font()
        formulas = [
            f'=COUNTIFS({year},$A{i},{mode},"distribution")',
            f'=COUNTIFS({year},$A{i},{mode},"relief")',
            f'=COUNTIFS({year},$A{i},{mode},"pre-election")',
            f"=SUM(B{i}:D{i})",
            f'=COUNTIFS({year},$A{i},{level},"Centre")',
            f'=COUNTIFS({year},$A{i},{level},"State")',
            f'=COUNTIFS({year},$A{i},{poll},"<>")',
        ]
        for c, f in enumerate(formulas, start=2):
            wy.cell(row=i, column=c, value=f).font = font()
    total = last_year - first_year + 3
    wy.cell(row=total, column=1, value="Total").font = font(bold=True)
    for c in range(2, len(heads) + 1):
        letter = get_column_letter(c)
        wy.cell(row=total, column=c, value=f"=SUM({letter}2:{letter}{total - 1})").font = font(bold=True)
    wy.cell(row=total + 2, column=1, value="Check").font = font(bold=True)
    wy.cell(row=total + 2, column=2, value=f"=COUNTA(Ledger!$A$2:$A${last})").font = font()
    note = wy.cell(row=total + 2, column=3, value="rows on the Ledger sheet; equals the All measures total above.")
    note.font = font(italic=True)
    wy.freeze_panes = "B2"

    wb.active = 0
    wb.save(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
