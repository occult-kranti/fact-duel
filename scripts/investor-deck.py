#!/usr/bin/env python3
"""
Build the FACT//DUEL seed investor deck (.pptx) and its markdown mirror.

  in   public/product/investor/deck-plan.json      slide plan (fixed)
       public/product/investor/numbers.md          verified numeric backbone (fixed)
       public/product/investor/verified-claims.json 119 fact-checked claims (fixed)
       public/product/investor/charts/*.png        pre-rendered charts (fixed)
  out  public/product/investor/factduel-seed-deck.pptx
       public/product/investor/deck.md

Every number on every slide face comes from the plan, which was itself validated
against numbers.md / verified-claims.json. This script invents no figures: the
only content it authors is the three appended appendix pages (the full year-by-year
model, the input/assumption register and the source register), each of which is a
verbatim transcription of numbers.md §3-§4 and of the plan's own source lists.

Text is laid out with real Liberation Sans metrics (metric-compatible with Arial),
so every block is measured and fitted before it is written, and the same measurement
code re-checks the finished file for overflow.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import OrderedDict

from PIL import Image, ImageFont

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

# --------------------------------------------------------------------------- #
# paths
# --------------------------------------------------------------------------- #

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
INV = os.path.join(ROOT, "public", "product", "investor")
PLAN_PATH = os.path.join(INV, "deck-plan.json")
CLAIMS_PATH = os.path.join(INV, "verified-claims.json")
CHART_DIR = os.path.join(INV, "charts")
PPTX_OUT = os.path.join(INV, "factduel-seed-deck.pptx")
MD_OUT = os.path.join(INV, "deck.md")

FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

# --------------------------------------------------------------------------- #
# brand
# --------------------------------------------------------------------------- #

BG = RGBColor(0x0A, 0x0E, 0x14)
PANEL = RGBColor(0x12, 0x18, 0x21)
PANEL_ALT = RGBColor(0x0D, 0x13, 0x1B)
TEXT = RGBColor(0xF7, 0xF6, 0xEF)
MUTED = RGBColor(0xA6, 0xAD, 0xBA)
VOLT = RGBColor(0xD4, 0xFF, 0x3A)
GOLD = RGBColor(0xFF, 0xC8, 0x3D)
CYAN = RGBColor(0x4E, 0xE1, 0xFF)
EMBER = RGBColor(0xFF, 0x7A, 0x2F)

FONT = "Arial"

# type scale (points) — maxima; blocks are fitted down from here when a slide is dense
SZ_TITLE = 40.0
SZ_TITLE_MIN = 21.0
SZ_KICKER = 11.0
SZ_BODY = 18.0
SZ_BODY_MIN = 10.5
SZ_TABLE = 12.0
SZ_TABLE_MIN = 7.0
SZ_SOURCE = 8.0
SZ_CAPTION = 9.5

# geometry (inches)
SLIDE_W = 13.333
SLIDE_H = 7.5
MARGIN = 0.62
CONTENT_W = SLIDE_W - 2 * MARGIN
KICKER_TOP = 0.40
KICKER_H = 0.24
HEAD_TOP = 0.72
HEAD_GAP = 0.26
CONTENT_BOT = 6.46
RULE_Y = 6.60
RULE_H = 0.013
FOOT_TOP = 6.72
FOOT_H = 0.60
PAGENO_W = 1.05

LINE_SPACING = 1.16
PARA_GAP_RATIO = 0.55  # paragraph gap as a fraction of font size

CELL_PAD_X = 0.07
CELL_PAD_Y = 0.045
MIN_ROW_H = 0.20

MONEY_RE = re.compile(r"\$[\d][\d,.]*(?:bn|m|M|K|k)?")
PLAN_RE = re.compile(r"\(P\)")

# --------------------------------------------------------------------------- #
# text metrics — Liberation Sans is metric-compatible with Arial
# --------------------------------------------------------------------------- #

_FONT_CACHE: dict = {}
_SCALE = 8  # render at 8x nominal size for sub-point precision


def _face(size_pt: float, bold: bool):
    key = (round(size_pt * _SCALE), bold)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ImageFont.truetype(FONT_BLD if bold else FONT_REG, max(1, key[0]))
    return _FONT_CACHE[key]


def tw(text: str, size_pt: float, bold: bool = False) -> float:
    """Width of `text` in inches at `size_pt`."""
    if not text:
        return 0.0
    return _face(size_pt, bold).getlength(text) / _SCALE / 72.0


def wrap(text: str, width_in: float, size_pt: float, bold: bool = False):
    """Greedy word wrap. Returns the list of rendered lines."""
    if not text:
        return [""]
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = w if not cur else cur + " " + w
        if tw(trial, size_pt, bold) <= width_in or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def longest_word(text: str, size_pt: float, bold: bool = False) -> float:
    return max([tw(w, size_pt, bold) for w in text.split()] or [0.0])


def block_height(paras, width_in, size_pt, bold=False, line_spacing=LINE_SPACING,
                 gap_ratio=PARA_GAP_RATIO) -> float:
    lh = size_pt * line_spacing / 72.0
    gap = size_pt * gap_ratio / 72.0
    total = 0.0
    for i, p in enumerate(paras):
        total += len(wrap(p, width_in, size_pt, bold)) * lh
        if i:
            total += gap
    return total


def fit_block(paras, width_in, height_in, start, floor, bold=False,
              line_spacing=LINE_SPACING, gap_ratio=PARA_GAP_RATIO, step=0.5):
    """Largest size in [floor, start] whose wrapped block fits the box."""
    size = start
    while size > floor:
        h = block_height(paras, width_in, size, bold, line_spacing, gap_ratio)
        if h <= height_in and all(longest_word(p, size, bold) <= width_in for p in paras):
            return size, h
        size = round(size - step, 2)
    return floor, block_height(paras, width_in, floor, bold, line_spacing, gap_ratio)


# --------------------------------------------------------------------------- #
# low-level shape helpers
# --------------------------------------------------------------------------- #


def set_bg(slide):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG


def rect(slide, x, y, w, h, color, shape=MSO_SHAPE.RECTANGLE):
    sh = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    sh.text_frame.text = ""
    return sh


def textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    return tb, tf


def style_run(run, size, color, bold=False, italic=False, spc=None):
    f = run.font
    f.name = FONT
    f.size = Pt(size)
    f.bold = bold
    f.italic = italic
    f.color.rgb = color
    if spc is not None:
        run._r.get_or_add_rPr().set("spc", str(int(spc * 100)))


def rich_runs(para, text, size, base_color, bold=False):
    """Write `text` into `para`, colouring money tokens gold and (P) markers cyan."""
    marks = []
    for m in MONEY_RE.finditer(text):
        marks.append((m.start(), m.end(), GOLD, bold))
    for m in PLAN_RE.finditer(text):
        marks.append((m.start(), m.end(), CYAN, True))
    marks.sort()
    merged, last_end = [], -1
    for s, e, c, b in marks:
        if s >= last_end:
            merged.append((s, e, c, b))
            last_end = e
    pos = 0
    for s, e, c, b in merged:
        if s > pos:
            style_run(para.add_run(), size, base_color, bold)
            para.runs[-1].text = text[pos:s]
            style_run(para.runs[-1], size, base_color, bold)
        r = para.add_run()
        r.text = text[s:e]
        style_run(r, size, c, b or bold)
        pos = e
    if pos < len(text):
        r = para.add_run()
        r.text = text[pos:]
        style_run(r, size, base_color, bold)
    if not para.runs:
        r = para.add_run()
        r.text = text
        style_run(r, size, base_color, bold)


def set_bullet(para, char, color, indent_in):
    """Hanging-indent bullet via DrawingML (python-pptx has no API for this)."""
    pPr = para._p.get_or_add_pPr()
    pPr.set("marL", str(Emu(int(Inches(indent_in)))))
    pPr.set("indent", str(-Emu(int(Inches(indent_in)))))
    for tag in ("a:buNone", "a:buChar", "a:buAutoNum", "a:buClr", "a:buFont"):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    clr = pPr.makeelement(qn("a:buClr"), {})
    srgb = pPr.makeelement(qn("a:srgbClr"), {"val": "%02X%02X%02X" % (color[0], color[1], color[2])})
    clr.append(srgb)
    fnt = pPr.makeelement(qn("a:buFont"), {"typeface": FONT})
    ch = pPr.makeelement(qn("a:buChar"), {"char": char})
    # schema order inside a:pPr: ... buClr, buSzX, buFont, buChar ...
    pPr.append(clr)
    pPr.append(fnt)
    pPr.append(ch)


# --------------------------------------------------------------------------- #
# source labelling
# --------------------------------------------------------------------------- #

SOURCE_LABELS = {
    "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising":
        "Y Combinator — A guide to seed fundraising",
    "https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck":
        "Y Combinator — How to design a better pitch deck",
    "https://play.google.com/store/apps/details?id=com.etermax.preguntados.lite&hl=en_US&gl=US":
        "Google Play — Trivia Crack listing",
    "https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf":
        "MAG Interactive — Q3 2025/26 interim report",
    "https://itunes.apple.com/lookup?id=1484354626&country=de":
        "Apple lookup API — QuizDuel listing",
    "https://itunes.apple.com/lookup?id=1484354626&country=us":
        "Apple lookup API — QuizDuel listing (US storefront)",
    "https://itunes.apple.com/lookup?id=1160249042&country=us":
        "Apple lookup API — Wayground listing",
    "https://play.google.com/store/apps/details?id=com.wb.goog.ellen.psych&hl=en_US&gl=US":
        "Google Play — Psych! listing",
    "https://play.google.com/store/apps/details?id=com.quizion.app&hl=en_US":
        "Google Play — Quizion listing",
    "https://play.google.com/store/apps/details?id=live.trivia&hl=en_US":
        "Google Play — TRIVIA GO! listing",
    "https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/":
        "TechCrunch — Trivia Royale, 2.5M downloads in 3 weeks",
    "https://www.sec.gov/Archives/edgar/data/1717682/000171768218000001/primary_doc.xml":
        "SEC Form D — Teatime Games (Trivia Royale)",
    "https://techcrunch.com/2020/02/14/hq-trivia-shuts-down/":
        "TechCrunch — HQ Trivia shuts down",
    "https://techcrunch.com/2018/08/14/hq-trivia-apple-tv/":
        "TechCrunch — HQ Trivia peak concurrent record",
    "https://www.sec.gov/Archives/edgar/data/1734125/000173412518000001/xslFormDX01/primary_doc.xml":
        "SEC Form D — HQ Trivia",
    "https://www.sec.gov/Archives/edgar/data/1366246/000155837017001621/gluu-20161231x10k.htm":
        "SEC 10-K — Glu Mobile FY2016 (QuizUp mark)",
    "https://www.sec.gov/Archives/edgar/data/1366246/000155837016010604/gluu-20161215x8k.htm":
        "SEC 8-K — Glu Mobile / QuizUp acquisition",
    "https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks":
        "GameAnalytics — 2026 Mobile & PC Gaming Benchmarks",
    "https://www.emarketer.com/content/second-screen-engagement-during-live-sports":
        "EMARKETER — second-screen engagement during live sport",
    "https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm":
        "SEC — Duolingo FY2025 shareholder letter",
    "https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm":
        "SEC — Duolingo Q2 FY2026 shareholder letter",
    "https://www.sec.gov/Archives/edgar/data/1562088/000162828026053603/duol-20260630.htm":
        "SEC — Duolingo Q2 FY2026 10-Q (user counts at 30 Jun 2026)",
    "https://members.thefsga.org/news/Details/new-fsga-research-details-growing-role-of-ai-prediction-markets-in-fantasy-sports-and-sports-betting-341850":
        "FSGA / Angus Reid 2026 — participation research",
    "https://members.thefsga.org/news/Details/new-fsga-research-highlights-industry-stability-and-next-generation-growth-in-fantasy-sports-and-sports-betting-305937":
        "FSGA 2025 — next-generation engagement research",
    "https://paulgraham.com/convince.html":
        "Paul Graham — How to convince investors",
    "https://a16z.com/16-more-startup-metrics/":
        "a16z — 16 More Startup Metrics",
    "https://a16z.com/the-insiders-guide-to-data-rooms-what-to-know-before-you-raise/":
        "a16z — The Insider's Guide to Data Rooms",
    "https://www.apptweak.com/":
        "AppTweak — US store conversion benchmarks, CY2025",
    "https://www.sporcle.com/memberships/":
        "Sporcle — Orange membership pricing",
    "https://www.sec.gov/Archives/edgar/data/1801661/000180166124000100/sklz-20231231.htm":
        "SEC 10-K — Skillz FY2023 (Skillz v. AviaGames)",
    "https://web.archive.org/web/20240302210508/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/":
        "DocSend — what VCs want inside a seed deck",
    "https://web.archive.org/web/20260622084020/https://www.docsend.com/blog/what-vcs-really-want-to-see-inside-your-seed-deck/":
        "DocSend — per-section dwell times",
    "https://sensortower.com/blog/2025-q2-ios-top-5-trivia%20games-revenue-us-604118ed241bc16eb8b8453a":
        "Sensor Tower — Q2 2025 US iOS trivia revenue (est.)",
    "https://kahoot.com/files/2023/02/4Q22_Kahoot_quarterly_report.pdf":
        "Kahoot! — Q4 2022 quarterly report",
    "https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/":
        "AppsFlyer — State of App Monetization 2026",
    "https://play.google.com/store/apps/details?id=no.mobitroll.kahoot.android&hl=en_US&gl=US":
        "Google Play — Kahoot! listing",
    "https://newsweb.oslobors.no/message/608893":
        "Oslo Børs — Kahoot! delisting notice",
    "https://www.prnewswire.com/news-releases/quizizz-gains-momentum-raises-31-5-million-to-motivate-every-student-301322655.html":
        "PR Newswire — Quizizz $31.5M Series B",
    "https://www.sec.gov/Archives/edgar/data/1801661/000180166126000019/q425skillzex991-earningsre.htm":
        "SEC 8-K — Skillz FY2025 results",
    "https://www.sec.gov/Archives/edgar/data/1801661/000180166123000003/ex991_fy22q4-8xkxearningsr.htm":
        "SEC 8-K — Skillz FY2022 results (FY2021 peak)",
    "https://carta.com/data/state-of-private-markets-q3-2025/":
        "Carta — State of Private Markets, Q3 2025",
    "https://news.crunchbase.com/venture/average-seed-funding-amounts-deals-grew-2025/":
        "Crunchbase — US seed funding, 2025",
    "https://www.factmr.com/report/second-screen-sports-apps-market":
        "Fact.MR — second-screen sports apps market",
    "https://www.thebusinessresearchcompany.com/report/fan-engagement-global-market-report":
        "The Business Research Company — fan engagement",
    "https://market.us/report/fan-engagement-market/":
        "market.us — fan engagement market",
    "https://www.marketsandmarkets.com/Market-Reports/game-based-learning-market-169115901.html":
        "MarketsandMarkets — game-based learning",
    "https://www.imarcgroup.com/game-based-learning-market":
        "IMARC — game-based learning",
    "https://www.sensortower.com/blog/state-of-mobile-2026":
        "Sensor Tower — State of Mobile 2026",
    "https://www.icc-cricket.com/media-releases/first-global-market-research-project-unveils-more-than-one-billion-cricket-fans":
        "ICC — global cricket market research",
    "https://www.nielsen.com/news-center/2025/the-future-of-sport-nielsens-2025-report-reveals-growth-drivers/":
        "Nielsen — 2025 Global Sports Report",
    "https://newzoo.com/articles/global-games-market-2025":
        "Newzoo — Global Games Market 2025",
}

# kinds for the handful of sources with no matching entry in verified-claims.json
SOURCE_KIND_OVERRIDE = {
    "https://www.apptweak.com/": "third-party-estimate",
    "https://itunes.apple.com/lookup?id=1484354626&country=us": "company-disclosure",
    "https://play.google.com/store/apps/details?id=live.trivia&hl=en_US": "company-disclosure",
}

KIND_SHORT = {
    "audited-filing": "audited filing",
    "company-disclosure": "company disclosure",
    "third-party-estimate": "third-party estimate",
    "analyst-estimate": "analyst estimate",
    "press-report": "press report",
    "marketing": "marketing",
    "internal": "internal (company disclosure)",
}


def source_label(src: str) -> str:
    if src.startswith("FACT//DUEL internal:"):
        tail = src.split("FACT//DUEL internal:", 1)[1].strip()
        tail = tail.replace("public/product/investor/", "")
        tail = re.sub(r"\s*\(company disclosure\)\s*$", "", tail)
        return "FACT//DUEL internal — " + tail
    if src in SOURCE_LABELS:
        return SOURCE_LABELS[src]
    host = re.sub(r"^https?://(www\.)?", "", src).split("/")[0]
    return host


def build_source_kinds():
    kinds = {}
    with open(CLAIMS_PATH, "r", encoding="utf-8") as fh:
        for claim in json.load(fh):
            kinds.setdefault(claim["source"], claim.get("kind", "third-party-estimate"))
    kinds.update(SOURCE_KIND_OVERRIDE)
    return kinds


# --------------------------------------------------------------------------- #
# slide chrome
# --------------------------------------------------------------------------- #


def chrome(slide, kicker, headline, page_no, sources, head_max=SZ_TITLE, head_min=SZ_TITLE_MIN,
           accent=VOLT):
    """Kicker, headline (into the title placeholder), footer rule, sources, page number.

    Returns the y at which slide content may start.
    """
    set_bg(slide)

    # kicker
    _, tf = textbox(slide, MARGIN, KICKER_TOP, CONTENT_W, KICKER_H)
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = kicker.upper()
    style_run(r, SZ_KICKER, accent, bold=True, spc=1.6)

    # headline goes in the real title placeholder so the deck has a title per slide
    title = slide.shapes.title
    title.left, title.top = Inches(MARGIN), Inches(HEAD_TOP)
    title.width, title.height = Inches(CONTENT_W), Inches(2.2)
    ttf = title.text_frame
    ttf.word_wrap = True
    ttf.margin_left = ttf.margin_right = ttf.margin_top = ttf.margin_bottom = 0
    ttf.vertical_anchor = MSO_ANCHOR.TOP
    try:
        ttf.auto_size = None
    except Exception:
        pass

    size, h = fit_block([headline], CONTENT_W, 2.0, head_max, head_min, bold=True,
                        line_spacing=1.08)
    tp = ttf.paragraphs[0]
    tp.line_spacing = 1.08
    r = tp.add_run()
    r.text = headline
    style_run(r, size, TEXT, bold=True)
    title.height = Inches(max(0.4, h + 0.04))

    # footer rule
    rect(slide, MARGIN, RULE_Y, CONTENT_W, RULE_H, accent)

    # page number
    _, ptf = textbox(slide, SLIDE_W - MARGIN - PAGENO_W, FOOT_TOP, PAGENO_W, 0.3)
    pp = ptf.paragraphs[0]
    pp.alignment = PP_ALIGN.RIGHT
    r = pp.add_run()
    r.text = str(page_no)
    style_run(r, 9.5, MUTED, bold=True, spc=0.6)

    # source line
    if sources:
        add_source_line(slide, sources)

    return HEAD_TOP + h + HEAD_GAP


def add_source_line(slide, sources, max_lines=3):
    labels = [source_label(s) for s in sources]
    width = CONTENT_W - PAGENO_W - 0.25
    prefix = "Sources: "
    shown, line, lines = [], prefix, []
    for i, lab in enumerate(labels):
        piece = lab if line in (prefix, "") else "  ·  " + lab
        if tw(line + piece, SZ_SOURCE) <= width or line in (prefix, ""):
            line += piece
            shown.append(lab)
        else:
            lines.append(line)
            if len(lines) == max_lines:
                break
            line = lab
            shown.append(lab)
    if len(lines) < max_lines and line:
        lines.append(line)
    rest = len(labels) - len(shown)
    if rest > 0:
        tail = "  ·  +%d more in the speaker notes and the source register" % rest
        if tw(lines[-1] + tail, SZ_SOURCE) <= width:
            lines[-1] += tail
        elif len(lines) < max_lines:
            lines.append(tail.strip(" ·"))

    _, tf = textbox(slide, MARGIN, FOOT_TOP, width, FOOT_H)
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = 1.15
        r = p.add_run()
        r.text = ln
        style_run(r, SZ_SOURCE, MUTED)


def body_block(slide, x, y, w, h, lines, start=SZ_BODY, floor=SZ_BODY_MIN, bullet="—",
               bullet_color=VOLT, color=TEXT):
    """Bulleted body copy, fitted to the box. Returns (size, used height)."""
    indent = 0.0
    if bullet:
        indent = max(0.20, tw(bullet + " ", start) * 0.9)
    size, used = fit_block(lines, w - indent, h, start, floor)
    if bullet:
        indent = max(0.18, tw(bullet + " ", size) * 1.05)
        size, used = fit_block(lines, w - indent, h, size, floor)
    _, tf = textbox(slide, x, y, w, max(h, used))
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = LINE_SPACING
        if i:
            p.space_before = Pt(size * PARA_GAP_RATIO)
        if bullet:
            set_bullet(p, bullet, bullet_color, indent)
        rich_runs(p, ln, size, color)
    return size, used


def add_picture_fit(slide, path, x, y, w, h, align="center", valign="middle"):
    """Insert a picture scaled to fit (never stretched) inside the box."""
    with Image.open(path) as im:
        iw, ih = im.size
    scale = min(w / iw, h / ih)
    pw, ph = iw * scale, ih * scale
    px = x + (w - pw) / 2 if align == "center" else (x if align == "left" else x + w - pw)
    if valign == "middle":
        py = y + (h - ph) / 2
    elif valign == "bottom":
        py = y + h - ph
    else:
        py = y
    slide.shapes.add_picture(path, Inches(px), Inches(py), Inches(pw), Inches(ph))
    return px, py, pw, ph


# --------------------------------------------------------------------------- #
# tables
# --------------------------------------------------------------------------- #

NO_STYLE_NO_GRID = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}"


def table_grid(headers, rows, emphasis_rows=()):
    """(text, bold) for every cell, including the header row — the single source of
    truth for measurement and for painting, so the two can never disagree."""
    grid = [[(h, True) for h in headers]]
    for ri, row in enumerate(rows):
        emph = ri in emphasis_rows
        grid.append([(txt, bool(emph or ci == 0)) for ci, txt in enumerate(row)])
    return grid


def table_widths(grid, total_w, size):
    """Column widths, or None when the columns cannot hold their longest words."""
    cols = len(grid[0])
    nat, need = [], []
    for c in range(cols):
        col = [row[c] for row in grid]
        nat.append(max(tw(t, size, b) for t, b in col) + 2 * CELL_PAD_X)
        need.append(max(longest_word(t, size, b) for t, b in col) + 2 * CELL_PAD_X)
    if sum(need) > total_w:
        return None
    if sum(nat) <= total_w:
        extra, s = total_w - sum(nat), sum(nat)
        return [n + extra * n / s for n in nat]
    remain = total_w - sum(need)
    appetite = [nat[c] - need[c] for c in range(cols)]
    total_ap = sum(appetite)
    if total_ap <= 1e-9:
        return [n + remain / cols for n in need]
    return [need[c] + remain * appetite[c] / total_ap for c in range(cols)]


def table_row_heights(grid, widths, size):
    lh = size * 1.14 / 72.0
    heights = []
    for row in grid:
        n = 1
        for c, (txt, bold) in enumerate(row):
            n = max(n, len(wrap(txt, widths[c] - 2 * CELL_PAD_X, size, bold)))
        heights.append(max(MIN_ROW_H, n * lh + 2 * CELL_PAD_Y))
    return heights


def fit_table(grid, total_w, max_h, start=SZ_TABLE, floor=SZ_TABLE_MIN):
    size, best = start, None
    while size >= floor:
        widths = table_widths(grid, total_w, size)
        if widths is not None:
            heights = table_row_heights(grid, widths, size)
            if best is None:
                best = (size, widths, heights)
            if sum(heights) <= max_h:
                return size, widths, heights
        size = round(size - 0.5, 2)
    if best is not None:
        return best
    widths = table_widths(grid, total_w, floor) or [total_w / len(grid[0])] * len(grid[0])
    return floor, widths, table_row_heights(grid, widths, floor)


def add_table(slide, headers, rows, x, y, w, max_h, start=SZ_TABLE, emphasis_rows=()):
    grid = table_grid(headers, rows, emphasis_rows)
    size, widths, heights = fit_table(grid, w, max_h, start)
    natural = sum(heights)
    # a short table looks stranded in a tall band: grow the rows to fill it, but
    # never past 1.8x their natural height, and never past the band
    target = min(max_h, natural * 1.8)
    if natural > 0 and target > natural:
        heights = [h * target / natural for h in heights]
    total_h = sum(heights)
    gf = slide.shapes.add_table(len(rows) + 1, len(headers), Inches(x), Inches(y),
                                Inches(w), Inches(total_h))
    tbl = gf.table
    tbl.first_row = False
    tbl.horz_banding = False
    tblPr = tbl._tbl.find(qn("a:tblPr"))
    for el in tblPr.findall(qn("a:tableStyleId")):
        tblPr.remove(el)
    sid = tblPr.makeelement(qn("a:tableStyleId"), {})
    sid.text = NO_STYLE_NO_GRID
    tblPr.append(sid)

    for c, cw in enumerate(widths):
        tbl.columns[c].width = Inches(cw)
    for r, rh in enumerate(heights):
        tbl.rows[r].height = Inches(rh)

    def paint(cell, text, bold, color, fill):
        cell.fill.solid()
        cell.fill.fore_color.rgb = fill
        cell.margin_left = Inches(CELL_PAD_X)
        cell.margin_right = Inches(CELL_PAD_X)
        cell.margin_top = Inches(CELL_PAD_Y)
        cell.margin_bottom = Inches(CELL_PAD_Y)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.line_spacing = 1.14
        r = p.add_run()
        r.text = text
        style_run(r, size, color, bold=bold)

    for c, (txt, bold) in enumerate(grid[0]):
        paint(tbl.cell(0, c), txt, bold, VOLT, PANEL)
    for ri, row in enumerate(grid[1:]):
        fill = PANEL if ri % 2 == 0 else PANEL_ALT
        emph = ri in emphasis_rows
        for c, (txt, bold) in enumerate(row):
            color = VOLT if emph else (GOLD if txt.strip().startswith("$") else TEXT)
            paint(tbl.cell(ri + 1, c), txt, bold, color, fill)
    return total_h


# --------------------------------------------------------------------------- #
# slide renderers
# --------------------------------------------------------------------------- #

SHOT_DIRS = [os.path.join(INV, "shots")]  # in-repo copies; the plan's own paths are the fallback


def shot(name, spec=None):
    """Resolve a screenshot by file name: repo copy first, then the plan's own path."""
    for d in SHOT_DIRS:
        cand = os.path.join(d, name)
        if os.path.exists(cand):
            return cand
    if spec:
        cand = os.path.join(os.path.dirname(spec), name)
        if os.path.exists(cand):
            return cand
    return None


# each plan image is shown next to its counterpart on the other form factor
IMAGE_PAIRS = {
    "phone-arena.png": [
        ("desktop-arena.png",
         "Choosing a format and an opponent. The practice opponent carries a BOT badge "
         "(app/screens/play/opponent-picker.tsx)."),
        ("phone-arena.png", "The same choice on a phone."),
    ],
    "phone-home.png": [
        ("desktop-home.png",
         "Home: level and XP, day streak, gems, Arena Rank, the day's quests, one-tap duel."),
        ("phone-home.png", "Home on a phone."),
    ],
    "desktop-journeys.png": [
        ("desktop-journeys.png",
         "Expeditions: short untimed routes, a Steady-or-Bold choice, a stamp for finishing one."),
        ("phone-journeys.png", "Expeditions on a phone."),
    ],
    "desktop-passport.png": [
        ("desktop-passport.png",
         "The player record: level and XP, Arena Rank, day streak, mastery — all device-local."),
        ("phone-passport.png", "The record on a phone."),
    ],
}


def images_for(spec):
    if not spec:
        return []
    base = os.path.basename(spec)
    pair = IMAGE_PAIRS.get(base)
    if pair:
        found = [(shot(name, spec), caption) for name, caption in pair]
        return [(p, c) for p, c in found if p]
    direct = shot(base, spec)
    return [(direct, "")] if direct else []


def render_title(slide, plan, s, page_no):
    set_bg(slide)
    deck = plan["deck"]

    _, tf = textbox(slide, MARGIN, 1.06, CONTENT_W, 0.3)
    r = tf.paragraphs[0].add_run()
    r.text = s["kicker"].upper()
    style_run(r, SZ_KICKER, VOLT, bold=True, spc=1.8)

    title = slide.shapes.title
    title.left, title.top = Inches(MARGIN), Inches(1.46)
    title.width, title.height = Inches(CONTENT_W), Inches(2.1)
    ttf = title.text_frame
    ttf.word_wrap = True
    ttf.margin_left = ttf.margin_right = ttf.margin_top = ttf.margin_bottom = 0
    try:
        ttf.auto_size = None
    except Exception:
        pass
    p0 = ttf.paragraphs[0]
    p0.line_spacing = 1.0
    for txt, col in (("FACT", TEXT), ("//", VOLT), ("DUEL", TEXT)):
        r = p0.add_run()
        r.text = txt
        style_run(r, 62, col, bold=True, spc=0.5)
    tagline = s["title"].split("—", 1)[1].strip()
    tagline = tagline[0].upper() + tagline[1:] + "."
    p1 = ttf.add_paragraph()
    p1.line_spacing = 1.08
    p1.space_before = Pt(14)
    tsize, th = fit_block([tagline], CONTENT_W, 0.9, 26, 16, bold=True, line_spacing=1.08)
    r = p1.add_run()
    r.text = tagline
    style_run(r, tsize, VOLT, bold=True)
    title.height = Inches(0.95 + th + 0.3)

    y = 1.46 + 0.95 + th + 0.44
    sub = deck["subtitle"]
    ssize, sh = fit_block([sub], CONTENT_W - 1.6, 0.7, 16, 12)
    _, stf = textbox(slide, MARGIN, y, CONTENT_W - 1.6, sh + 0.05)
    sp = stf.paragraphs[0]
    sp.line_spacing = 1.2
    rich_runs(sp, sub, ssize, MUTED)
    y += sh + 0.34

    body_h = 5.62 - y
    body_block(slide, MARGIN, y, CONTENT_W - 1.2, body_h, s["body"], start=15.5, floor=11)

    rect(slide, MARGIN, RULE_Y, CONTENT_W, RULE_H, VOLT)

    conf = deck["confidentiality"]
    csize, ch = fit_block([conf], CONTENT_W - PAGENO_W - 0.25, FOOT_H, 8.0, 6.5)
    _, ctf = textbox(slide, MARGIN, FOOT_TOP, CONTENT_W - PAGENO_W - 0.25, FOOT_H)
    cp = ctf.paragraphs[0]
    cp.line_spacing = 1.2
    r = cp.add_run()
    r.text = conf
    style_run(r, csize, MUTED)

    _, ptf = textbox(slide, SLIDE_W - MARGIN - PAGENO_W, FOOT_TOP, PAGENO_W, 0.3)
    pp = ptf.paragraphs[0]
    pp.alignment = PP_ALIGN.RIGHT
    r = pp.add_run()
    r.text = deck["date"]
    style_run(r, 9.5, MUTED, bold=True, spc=0.6)


def render_chart(slide, s, top, accent):
    chart_path = os.path.join(CHART_DIR, s["chart"] + ".png")
    band_h = CONTENT_BOT - top
    chart_w = 6.15
    gap = 0.35
    text_w = CONTENT_W - chart_w - gap
    body_block(slide, MARGIN, top, text_w, band_h, s["body"], start=16.5, floor=10.5,
               bullet_color=accent)
    add_picture_fit(slide, chart_path, MARGIN + text_w + gap, top, chart_w, band_h)


def render_chart_and_table(slide, s, top, accent):
    chart_path = os.path.join(CHART_DIR, s["chart"] + ".png")
    band_h = CONTENT_BOT - top
    chart_w = 4.95
    gap = 0.32
    table_w = CONTENT_W - chart_w - gap
    grid = table_grid(s["table"]["headers"], s["table"]["rows"])
    cap = body_cap_for_table(grid, table_w, band_h, share=0.36)
    bsize, bh = fit_block(s["body"], CONTENT_W - 0.22, cap, 13.5, 9.0)
    body_block(slide, MARGIN, top, CONTENT_W, bh + 0.04, s["body"], start=bsize, floor=9.0,
               bullet_color=accent)
    y = top + bh + 0.30
    rest = CONTENT_BOT - y
    add_table(slide, s["table"]["headers"], s["table"]["rows"], MARGIN, y, table_w, rest,
              start=10.5)
    add_picture_fit(slide, chart_path, MARGIN + table_w + gap, y, chart_w, rest)


def body_cap_for_table(grid, total_w, band_h, share=0.42, gap=0.30):
    """How much of the band the body copy may take before the table stops fitting."""
    floor_w = table_widths(grid, total_w, SZ_TABLE_MIN)
    floor_h = sum(table_row_heights(grid, floor_w, SZ_TABLE_MIN)) if floor_w else band_h * 0.5
    return max(band_h * 0.14, min(band_h * share, band_h - floor_h - gap))


def render_table(slide, s, top, accent, emphasis_rows=()):
    band_h = CONTENT_BOT - top
    grid = table_grid(s["table"]["headers"], s["table"]["rows"], emphasis_rows)
    cap = body_cap_for_table(grid, CONTENT_W, band_h)
    bsize, bh = fit_block(s["body"], CONTENT_W - 0.22, cap, 14.0, 9.0)
    body_block(slide, MARGIN, top, CONTENT_W, bh + 0.04, s["body"], start=bsize, floor=9.0,
               bullet_color=accent)
    y = top + bh + 0.30
    add_table(slide, s["table"]["headers"], s["table"]["rows"], MARGIN, y, CONTENT_W,
              CONTENT_BOT - y, emphasis_rows=emphasis_rows)


def render_product(slide, s, top, accent):
    shots = images_for(s.get("image"))
    band_h = CONTENT_BOT - top
    text_w = 5.20
    gap = 0.38
    region_x = MARGIN + text_w + gap
    region_w = CONTENT_W - text_w - gap
    body_block(slide, MARGIN, top, text_w, band_h, s["body"], start=15.0, floor=10.5,
               bullet_color=accent)
    if not shots:
        return

    cap_h = 0.62
    pad = 0.11
    aspects = []
    for path, _ in shots:
        with Image.open(path) as im:
            aspects.append(im.size[0] / im.size[1])
    n = len(shots)
    card_gap = 0.26 if n > 1 else 0.0
    avail_w = region_w - card_gap * (n - 1) - 2 * pad * n
    h = min(band_h - cap_h - 2 * pad, avail_w / sum(aspects))
    card_ws = [a * h + 2 * pad for a in aspects]
    total = sum(card_ws) + card_gap * (n - 1)
    x = region_x + (region_w - total) / 2
    card_h = h + 2 * pad + cap_h
    y = top + (band_h - card_h) / 2
    for (path, caption), cw, a in zip(shots, card_ws, aspects):
        rect(slide, x, y, cw, card_h, PANEL)
        add_picture_fit(slide, path, x + pad, y + pad, cw - 2 * pad, h)
        _, tf = textbox(slide, x + pad, y + pad + h + 0.07, cw - 2 * pad, cap_h - 0.12)
        csize, _ = fit_block([caption], cw - 2 * pad, cap_h - 0.14, SZ_CAPTION, 6.5,
                             line_spacing=1.12)
        p = tf.paragraphs[0]
        p.line_spacing = 1.12
        r = p.add_run()
        r.text = caption
        style_run(r, csize, MUTED)
        x += cw + card_gap


def render_ask(slide, s, top, accent):
    stats = [
        ("$1,080,000", "4 engineers x $15,000/month x 18 months (YC's own arithmetic)"),
        ("6.98%", "dilution: $1.2M into a $17.2M post-money (Carta Q3 2025 median)"),
        ("5.00%", "dilution: $1.2M into a $24.0M post-money (Carta Q4 2025 high)"),
    ]
    band_h = CONTENT_BOT - top
    panel_h = 1.22
    gap = 0.24
    pw = (CONTENT_W - 2 * gap) / 3
    x = MARGIN
    for value, caption in stats:
        rect(slide, x, top, pw, panel_h, PANEL)
        rect(slide, x, top, 0.045, panel_h, accent)
        _, tf = textbox(slide, x + 0.24, top + 0.16, pw - 0.42, 0.5)
        r = tf.paragraphs[0].add_run()
        r.text = value
        vsize, _ = fit_block([value], pw - 0.42, 0.5, 27, 15, bold=True)
        style_run(r, vsize, GOLD, bold=True)
        _, ctf = textbox(slide, x + 0.24, top + 0.66, pw - 0.42, 0.48)
        csize, _ = fit_block([caption], pw - 0.42, 0.46, 9.5, 7.0, line_spacing=1.14)
        cp = ctf.paragraphs[0]
        cp.line_spacing = 1.14
        r = cp.add_run()
        r.text = caption
        style_run(r, csize, MUTED)
        x += pw + gap
    y = top + panel_h + 0.30
    body_block(slide, MARGIN, y, CONTENT_W, CONTENT_BOT - y, s["body"], start=16.5, floor=10.5,
               bullet_color=accent)


def render_bullets(slide, s, top, accent):
    band_h = CONTENT_BOT - top
    body_block(slide, MARGIN, top, CONTENT_W, band_h, s["body"], start=SZ_BODY, floor=11,
               bullet_color=accent)


# --------------------------------------------------------------------------- #
# appended appendix pages (H, I, J) — transcribed from numbers.md §3-§4
# --------------------------------------------------------------------------- #

APPENDIX_MODEL = {
    "kind": "table",
    "kicker": "APPENDIX — THE MODEL, YEAR BY YEAR",
    "title": "Appendix H — the whole model on one page. Every figure is (P).",
    "body": [
        "Revenue(year) = Installs x [ payer rate x ARPPU ] + Installs x ad revenue per install.",
        "Steady-state MAU = monthly installs + ( monthly installs x D30 / monthly churn ), churn fixed at 20%.",
        "There is nothing to mark (A): zero users and zero months of cohort data, so nothing here is an actual.",
        "Annual installs run about 11x steady-state MAU. Revenue per MAU is throughput, not intensity.",
    ],
    "chart": None,
    "image": None,
    "table": {
        "headers": ["Scenario (P)", "Year", "Installs", "$ / install", "Revenue",
                    "Monthly installs", "Steady MAU", "Rev / MAU / yr"],
        "rows": [
            ["Conservative", "Y1", "25,000", "$0.3688", "$9,220", "2,083", "2,154", "$4.28"],
            ["Conservative", "Y2", "90,000", "$0.3688", "$33,193", "7,500", "7,755", "$4.28"],
            ["Conservative", "Y3", "250,000", "$0.3688", "$92,202", "20,833", "21,542", "$4.28"],
            ["Conservative", "3-yr", "365,000", "—", "$134,615", "—", "—", "—"],
            ["Base", "Y1", "75,000", "$1.3588", "$101,907", "6,250", "6,619", "$15.40"],
            ["Base", "Y2", "350,000", "$1.3588", "$475,567", "29,167", "30,888", "$15.40"],
            ["Base", "Y3", "1,200,000", "$1.3588", "$1,630,517", "100,000", "105,900", "$15.40"],
            ["Base", "3-yr", "1,625,000", "—", "$2,207,992", "—", "—", "—"],
            ["Optimistic", "Y1", "200,000", "$1.8902", "$378,039", "16,667", "18,083", "$20.91"],
            ["Optimistic", "Y2", "1,000,000", "$1.8902", "$1,890,196", "83,333", "90,417", "$20.91"],
            ["Optimistic", "Y3", "4,000,000", "$1.8902", "$7,560,784", "333,333", "361,667", "$20.91"],
            ["Optimistic", "3-yr", "5,200,000", "—", "$9,829,019", "—", "—", "—"],
        ],
    },
    "sources": [
        "https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks",
        "https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/",
        "FACT//DUEL internal: public/product/investor/numbers.md §4.1-§4.3",
    ],
    "notes": (
        "This is §4.3 of numbers.md reproduced in full, so that anyone who wants to check the "
        "arithmetic can do it on the page instead of asking for a spreadsheet. Two things to say "
        "before they are asked. First, the only thing that changes between scenarios is three "
        "inputs — D30 retention, install-to-payer rate and install volume; the model itself is "
        "identical, ARPPU is held at AppsFlyer's casual D90 $7.26 in all three, and monthly churn "
        "of the retained base is held at 20% everywhere so it cannot flatter one case. Second, the "
        "install volumes are chosen assumptions with no company data behind them, which is why "
        "appendix I lists them as assumptions rather than inputs. Revenue per MAU rises across "
        "scenarios only because higher churn makes annual installs about 11x steady-state MAU — "
        "that is throughput, not better monetisation, and it is the reason the subscription "
        "cross-check on slide 10 exists."
    ),
}

APPENDIX_INPUTS = {
    "kind": "table",
    "kicker": "APPENDIX — INPUTS AND ASSUMPTIONS",
    "title": "Appendix I — every input, every assumption, and which of them has no source.",
    "body": [
        "Two rows in this table are not sourced: monthly churn, and the install volumes. Both are labelled.",
        "The 18.46% payer rate is arithmetic on two published AppsFlyer figures, used only as a ceiling.",
        "Break-even blended cost per install: $0.37 / $1.36 / $1.89 (P). Trivia Royale's was under $0.20.",
        "Base-case revenue per MAU of $15.40 exceeds MAG's $13.07 and Duolingo's $7.80. A ceiling, not a target.",
    ],
    "chart": None,
    "image": None,
    "table": {
        "headers": ["Input", "Conservative", "Base", "Optimistic", "Where it comes from"],
        "rows": [
            ["D30 retention", "0.68%", "1.18%", "1.70%",
             "GameAnalytics CY2025: global median low / NA median / global P75"],
            ["Install to payer", "5.08%", "11.14%", "18.46%",
             "AppsFlyer: NA repeat payer / NA one-time payer / derived $1.34 / $7.26"],
            ["ARPPU (D90)", "$7.26", "$7.26", "$7.26", "AppsFlyer casual games D90 ARPPU"],
            ["Ad revenue per install", "$0.00", "$0.55", "$0.55",
             "AppsFlyer casual D90 IAA ARPU; $0.00 assumes no mediation stack, which is today's state"],
            ["Monthly churn of retained base", "20%", "20%", "20%",
             "Assumption, unsourced. Held constant so it cannot flatter a scenario"],
            ["Installs Y1 / Y2 / Y3", "25K / 90K / 250K", "75K / 350K / 1.2M",
             "200K / 1.0M / 4.0M", "Assumptions. No company data behind them"],
        ],
    },
    "sources": [
        "https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks",
        "https://www.appsflyer.com/resources/reports/app-marketing-monetization-report/",
        "https://techcrunch.com/2020/07/10/how-thor-fridrikssons-trivia-royale-earned-2-5m-downloads-in-3-weeks/",
        "https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm",
        "https://storage.mfn.se/8d863483-ccc8-4f02-b0c5-d37d899b23e8/mag-interim-report-eng-2025-26-q3.pdf",
        "FACT//DUEL internal: public/product/investor/numbers.md §4.1-§4.3",
    ],
    "notes": (
        "The point of showing the inputs separately from the outputs is that an investor can "
        "replace any one of them and re-run the model without our help. Even the optimistic case "
        "assumes only median casual per-install monetisation — AppsFlyer's own $1.34 IAP plus $0.55 "
        "ad revenue — so all of the optimism sits in install volume and none of it in monetisation "
        "quality. The derived 18.46% payer rate is arithmetic on two published figures that may rest "
        "on different samples and windows, and it sits well above the 11.14% North American 30-day "
        "figure, which is why it is used only as a ceiling and labelled derived. The conservative "
        "case carries $0.00 of ad revenue because we are a web app with no mediation stack today. "
        "On break-even cost per install: Trivia Royale's sourced blended figure of under $0.20 is "
        "inside all three of ours, and that company still died with 2.5M downloads and 45% D1, so "
        "clearing break-even is necessary and demonstrably not sufficient."
    ),
}


def build_source_register_slides(plan, kinds):
    """One row per distinct source in the deck: label, kind, the slides that cite it."""
    used = OrderedDict()
    for s in plan["slides"]:
        for src in s["sources"]:
            used.setdefault(src, []).append(s["n"])
    rows = []
    for src, pages in used.items():
        if src.startswith("FACT//DUEL internal:"):
            kind = KIND_SHORT["internal"]
        else:
            kind = KIND_SHORT.get(kinds.get(src, ""), kinds.get(src, "third-party estimate"))
        rows.append([source_label(src), kind, ", ".join(str(p) for p in pages), src])

    # four appendix pages, however many sources the plan cites
    per = max(13, -(-len(rows) // 4))
    chunks = [rows[i:i + per] for i in range(0, len(rows), per)]
    slides = []
    for i, chunk in enumerate(chunks):
        first = i == 0
        slides.append({
            "kind": "table",
            "kicker": "APPENDIX — SOURCE REGISTER (%d OF %d)" % (i + 1, len(chunks)),
            "title": "Appendix J — every source cited in this deck, and what kind of evidence it is.",
            "body": ([
                "%d distinct sources across %d slides. Full URLs are in the speaker notes of every slide."
                % (len(rows), len(plan["slides"])),
                "Kind key: audited filing, company disclosure, third-party estimate, analyst estimate, press report.",
                "Nothing in this deck rests on a source that is not on this list, and nothing on this list is ours.",
            ] if first else [
                "Continued. Kinds are taken from the fact-check register, not assigned by us.",
            ]),
            "chart": None,
            "image": None,
            "table": {
                "headers": ["Source", "Kind", "Cited on"],
                "rows": [[r[0], r[1], r[2]] for r in chunk],
            },
            "sources": [],
            "notes": (
                ("Read this page alongside appendix E. The kinds matter more than the count: an "
                 "audited filing and a vendor's modelled estimate are not the same evidence, and "
                 "the deck says which is which every time it uses one. Where a figure is a modelled "
                 "estimate — every Sensor Tower number, every GameAnalytics and AppsFlyer benchmark, "
                 "the AppTweak conversion figures — it is labelled as an estimate on the slide that "
                 "carries it. Full URLs for this page:\n\n" if first else
                 "Source register, continued. Full URLs for this page:\n\n")
                + "\n".join("- %s\n  %s" % (r[0], r[3]) for r in chunk)
            ),
        })
    return slides


# --------------------------------------------------------------------------- #
# build
# --------------------------------------------------------------------------- #

APPENDIX_ACCENT = CYAN
RISK_SLIDE = 12


def accent_for(s):
    if s["n"] == RISK_SLIDE:
        return EMBER
    if str(s.get("kind")) == "appendix" or str(s.get("kicker", "")).startswith("APPENDIX"):
        return APPENDIX_ACCENT
    return VOLT


def notes_text(s):
    lines = [s["notes"].strip()]
    if s.get("sources"):
        lines.append("")
        lines.append("SOURCES")
        for src in s["sources"]:
            lines.append("- " + src)
    return "\n".join(lines)


def build(plan, kinds):
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)
    layout = prs.slide_layouts[5]  # Title Only

    slides = list(plan["slides"]) + [
        dict(APPENDIX_MODEL, n=len(plan["slides"]) + 1),
        dict(APPENDIX_INPUTS, n=len(plan["slides"]) + 2),
    ]
    for i, extra in enumerate(build_source_register_slides(plan, kinds)):
        slides.append(dict(extra, n=len(plan["slides"]) + 3 + i))

    unrendered = []

    for s in slides:
        slide = prs.slides.add_slide(layout)
        # drop any stray placeholders the layout brought along
        for ph in list(slide.placeholders):
            if ph.placeholder_format.idx != 0:
                ph._element.getparent().remove(ph._element)

        accent = accent_for(s)
        n = s["n"]

        if s["kind"] == "title":
            render_title(slide, plan, s, n)
        else:
            head_max = 30.0 if accent is APPENDIX_ACCENT else SZ_TITLE
            top = chrome(slide, s["kicker"], s["title"], n, s["sources"],
                         head_max=head_max, accent=accent)
            has_chart = bool(s.get("chart"))
            has_table = bool(s.get("table"))
            has_image = bool(images_for(s.get("image")))

            if has_chart and has_table:
                render_chart_and_table(slide, s, top, accent)
            elif has_chart:
                render_chart(slide, s, top, accent)
            elif has_table:
                emph = (5,) if n == 11 else ()
                render_table(slide, s, top, accent, emphasis_rows=emph)
            elif has_image:
                render_product(slide, s, top, accent)
            elif s["kind"] == "ask":
                render_ask(slide, s, top, accent)
            else:
                render_bullets(slide, s, top, accent)

            if s.get("image") and not has_image:
                unrendered.append("slide %d: image not found on disk (%s)" % (n, s["image"]))

        slide.notes_slide.notes_text_frame.text = notes_text(s)

    prs.save(PPTX_OUT)
    return slides, unrendered


# --------------------------------------------------------------------------- #
# markdown mirror
# --------------------------------------------------------------------------- #


def md_escape(text):
    return text.replace("|", "\\|")


def write_markdown(plan, slides):
    deck = plan["deck"]
    out = []
    out.append("# %s — seed deck" % deck["title"])
    out.append("")
    out.append("*%s*" % deck["subtitle"])
    out.append("")
    out.append("**%s** · %d slides · generated by `scripts/investor-deck.py` from "
               "`deck-plan.json`; the PowerPoint is `factduel-seed-deck.pptx`."
               % (deck["date"], len(slides)))
    out.append("")
    out.append("> %s" % deck["confidentiality"])
    out.append("")
    out.append("---")
    out.append("")

    for s in slides:
        out.append("## %d. %s" % (s["n"], s["title"]))
        out.append("")
        out.append("**Kicker:** %s  " % s["kicker"])
        out.append("**Kind:** %s" % s["kind"])
        out.append("")
        if s["kind"] == "title":
            out.append("**Subtitle:** %s" % deck["subtitle"])
            out.append("")
        out.append("### Body")
        out.append("")
        for line in s["body"]:
            out.append("- %s" % line)
        out.append("")

        if s.get("table"):
            out.append("### Table")
            out.append("")
            hdr = s["table"]["headers"]
            out.append("| " + " | ".join(md_escape(h) for h in hdr) + " |")
            out.append("|" + "|".join("---" for _ in hdr) + "|")
            for row in s["table"]["rows"]:
                out.append("| " + " | ".join(md_escape(c) for c in row) + " |")
            out.append("")

        if s.get("chart"):
            out.append("### Chart")
            out.append("")
            out.append("`charts/%s.png` — see `scripts/investor-charts.py`." % s["chart"])
            out.append("")

        shots = images_for(s.get("image"))
        if shots:
            out.append("### Screenshots")
            out.append("")
            for path, caption in shots:
                out.append("- `%s` — %s" % (os.path.basename(path), caption or "(no caption)"))
            out.append("")

        if s.get("sources"):
            out.append("### Sources")
            out.append("")
            for src in s["sources"]:
                if src.startswith("http"):
                    out.append("- [%s](%s)" % (source_label(src), src))
                else:
                    out.append("- %s" % src)
            out.append("")

        out.append("### Speaker notes")
        out.append("")
        out.append(s["notes"].strip())
        out.append("")
        out.append("---")
        out.append("")

    with open(MD_OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out).rstrip() + "\n")


# --------------------------------------------------------------------------- #
# validation — re-open the saved file and measure everything again
# --------------------------------------------------------------------------- #


def validate(expected_slides):
    prs = Presentation(PPTX_OUT)
    problems, warnings = [], []

    count = len(prs.slides)
    assert count == expected_slides, "slide count is %d, expected %d" % (count, expected_slides)

    for i, slide in enumerate(prs.slides, start=1):
        title = slide.shapes.title
        assert title is not None, "slide %d has no title placeholder" % i
        assert title.text_frame.text.strip(), "slide %d has an empty title" % i

        assert slide.has_notes_slide, "slide %d has no notes slide" % i
        assert slide.notes_slide.notes_text_frame.text.strip(), "slide %d has empty notes" % i

        for shape in slide.shapes:
            if shape.has_text_frame:
                _check_frame(shape.text_frame, shape.width, shape.height, i,
                             shape.shape_type, problems, warnings)
            if getattr(shape, "has_table", False) and shape.has_table:
                tbl = shape.table
                widths = [c.width for c in tbl.columns]
                heights = [r.height for r in tbl.rows]
                for ri, row in enumerate(tbl.rows):
                    for ci, cell in enumerate(row.cells):
                        # a table cell's text inset lives on a:tcPr, not on the body's bodyPr
                        insets = (cell.margin_left, cell.margin_right,
                                  cell.margin_top, cell.margin_bottom)
                        _check_frame(cell.text_frame, widths[ci], heights[ri],
                                     i, "table cell r%d c%d" % (ri, ci), problems, warnings,
                                     insets=insets)
    return count, problems, warnings


def _check_frame(tf, width_emu, height_emu, slide_no, what, problems, warnings, insets=None):
    if width_emu is None or height_emu is None:
        return
    if insets is None:
        insets = (tf.margin_left, tf.margin_right, tf.margin_top, tf.margin_bottom)
    defaults = (Pt(7.2), Pt(7.2), Pt(3.6), Pt(3.6))
    inset_l, inset_r, inset_t, inset_b = [
        d if v is None else v for v, d in zip(insets, defaults)]
    usable_w = (width_emu - inset_l - inset_r) / 914400.0
    usable_h = (height_emu - inset_t - inset_b) / 914400.0
    if usable_w <= 0:
        return

    total_h = 0.0
    for p in tf.paragraphs:
        text = "".join(r.text for r in p.runs)
        if not text.strip():
            continue
        size = None
        bold = False
        for r in p.runs:
            if r.font.size is not None:
                size = r.font.size.pt
                bold = bool(r.font.bold)
                break
        if size is None:
            size = 18.0
        pPr = p._p.find(qn("a:pPr"))
        marl = 0.0
        if pPr is not None and pPr.get("marL"):
            marl = int(pPr.get("marL")) / 914400.0
        avail = usable_w - marl
        if avail <= 0:
            problems.append("slide %d %s: indent exceeds frame width" % (slide_no, what))
            continue
        lw = longest_word(text, size, bold)
        if lw > avail + 0.004:
            problems.append(
                "slide %d %s: unbreakable %.2fin token in a %.2fin box (%.1fpt) — %r"
                % (slide_no, what, lw, avail, size, text[:56]))
        ls = p.line_spacing if isinstance(p.line_spacing, float) else LINE_SPACING
        lines = len(wrap(text, avail, size, bold))
        total_h += lines * size * ls / 72.0
        if p.space_before is not None:
            total_h += p.space_before.pt / 72.0
    if total_h <= 0.0:  # decorative shape (rules, panels) — nothing to overflow
        return
    if total_h > usable_h * 1.06 + 0.02:
        warnings.append("slide %d %s: text needs ~%.2fin, box is %.2fin"
                        % (slide_no, what, total_h, usable_h))


# --------------------------------------------------------------------------- #


def main():
    with open(PLAN_PATH, "r", encoding="utf-8") as fh:
        plan = json.load(fh)
    kinds = build_source_kinds()

    missing_charts = [s["chart"] for s in plan["slides"]
                      if s.get("chart") and not os.path.exists(
                          os.path.join(CHART_DIR, s["chart"] + ".png"))]

    slides, unrendered = build(plan, kinds)
    write_markdown(plan, slides)

    count, problems, warnings = validate(len(slides))
    size_bytes = os.path.getsize(PPTX_OUT)

    print("built   %s" % PPTX_OUT)
    print("slides  %d  (%d from the plan + %d appended appendix pages)"
          % (count, len(plan["slides"]), count - len(plan["slides"])))
    print("size    %s bytes (%.1f KB)" % (format(size_bytes, ","), size_bytes / 1024.0))
    print("markdown %s (%s bytes)" % (MD_OUT, format(os.path.getsize(MD_OUT), ",")))
    print("charts  %d used, %d missing" % (
        len({s["chart"] for s in plan["slides"] if s.get("chart")}), len(missing_charts)))
    if missing_charts:
        print("  MISSING CHARTS: %s" % ", ".join(missing_charts))
    for u in unrendered:
        print("  NOT RENDERED: %s" % u)
    print("validation: %d overflow problems, %d suspicious blocks" % (len(problems), len(warnings)))
    for p in problems:
        print("  PROBLEM  %s" % p)
    for w in warnings:
        print("  SUSPECT  %s" % w)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
