#!/usr/bin/env python3
"""
FACT//DUEL — seed deck chart renderer.

Renders the seven investor-deck charts into
public/product/investor/charts/ at 2x resolution (dpi=200), 16:9 slide sizing.

EVERY numeric value in this file is copied verbatim from
public/product/investor/numbers.md. Nothing is invented, rounded up or
extrapolated. Section references (§) point at numbers.md. Projections are
labelled (P) and described as a plan, never a forecast.

House style: "Floodlight".
"""

from __future__ import annotations

import datetime as dt
import os
import textwrap

import matplotlib

matplotlib.use("Agg")

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from matplotlib.ticker import FuncFormatter

# ----------------------------------------------------------------------------
# Brand tokens — Floodlight
# ----------------------------------------------------------------------------
BG = "#0a0e14"
PANEL = "#121821"
TEXT = "#f7f6ef"
MUTED = "#a6adba"
GRID = "#2a3340"
GRID_ALPHA = 0.6

VOLT = "#d4ff3a"      # primary
CYAN = "#4ee1ff"      # science / learning
EMBER = "#ff7a2f"     # competition
GOLD = "#ffc83d"      # money
MAGENTA = "#ff5ea8"   # risk

OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "product", "investor", "charts",
)

plt.rcParams.update({
    "figure.facecolor": BG,
    "axes.facecolor": BG,
    "savefig.facecolor": BG,
    "font.family": "DejaVu Sans",
    "text.color": TEXT,
    "axes.labelcolor": MUTED,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "axes.edgecolor": GRID,
    "axes.linewidth": 0.8,
    "xtick.major.size": 0,
    "ytick.major.size": 0,
    "xtick.minor.size": 0,
    "ytick.minor.size": 0,
    "grid.color": GRID,
    "grid.alpha": GRID_ALPHA,
    "grid.linewidth": 0.8,
    "figure.dpi": 200,
    "savefig.dpi": 200,
    # Every label on these charts is full of dollar signs. Without this,
    # matplotlib reads "$1.69bn – $2.83bn" as mathtext and italicises it.
    "text.parse_math": False,
})


# ----------------------------------------------------------------------------
# Shared furniture
# ----------------------------------------------------------------------------
def titles(fig, title, subtitle=None, x=0.012, y=0.975, sub_y=None):
    """Title inside the figure, left-aligned, bold. Optional muted subtitle."""
    fig.text(x, y, title, ha="left", va="top", fontsize=15.5,
             fontweight="bold", color=TEXT)
    if subtitle:
        wrapped = "\n".join(textwrap.fill(p, 116) for p in subtitle.split("\n"))
        fig.text(x, sub_y if sub_y is not None else y - 0.072, wrapped,
                 ha="left", va="top", fontsize=9.2, color=MUTED, linespacing=1.55)


def source(fig, text, x=0.012, y=0.012):
    """Small source line, bottom left, muted, 7pt.

    Wrapped hard: bbox_inches='tight' crops to the widest artist, so an
    over-long source line silently widens the whole PNG and pushes every
    figure-fraction coordinate out of place.
    """
    wrapped = "\n".join(
        textwrap.fill(para, 176) for para in text.split("\n")
    )
    fig.text(x, y, wrapped, ha="left", va="bottom", fontsize=7,
             color=MUTED, linespacing=1.5)


def strip(ax, keep=("left",)):
    for side in ("top", "right", "left", "bottom"):
        ax.spines[side].set_visible(side in keep)
    for side in keep:
        ax.spines[side].set_color(GRID)


def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=200, facecolor=BG, transparent=False,
                bbox_inches="tight", pad_inches=0.22)
    plt.close(fig)
    print(f"  wrote {name:22s} {os.path.getsize(path):>8,} bytes")


def usd_m(v):
    """Format a $ value given in millions."""
    if v >= 1000:
        return f"${v / 1000:,.2f}bn"
    if v >= 1:
        return f"${v:,.1f}M"
    return f"${v:,.2f}M"


# ============================================================================
# 1. TAM / SAM / SOM  (numbers.md §1.3, §1.4, §1.5)
# ============================================================================
def chart_tam_sam_som():
    fig = plt.figure(figsize=(10, 6))
    gs = fig.add_gridspec(2, 1, height_ratios=[3.6, 1.0], hspace=0.55,
                          left=0.078, right=0.655, top=0.735, bottom=0.125)
    ax = fig.add_subplot(gs[0])
    ax2 = fig.add_subplot(gs[1])

    titles(
        fig,
        "Market, built bottom-up — and the honest slice of it",
        "Population × observed revenue per active user. No penetration percentage anywhere in TAM or SAM;\n"
        "every activation, retention and conversion haircut sits in SOM, where it belongs.",
        sub_y=0.885,
    )

    rows = [
        ("TAM-A", 1691.0, 2834.0, VOLT,
         "216.8M US second-screen adults\n×  $7.80–$13.07 / user / yr",
         "$1.69bn – $2.83bn"),
        ("SAM", 704.3, 1180.2, CYAN,
         "90.3M North American fantasy / sports-betting adults\n×  $7.80–$13.07 / user / yr",
         "$704M – $1.18bn"),
        ("SOM (P)", 0.4, 1.6, EMBER,
         "Year-3 base plan (P): $1.63M install model\n/ $0.42M subscription cross-check",
         "$0.4M – $1.6M"),
    ]

    XMAX = 3000.0
    LABEL_X = 3080.0
    y_positions = [2, 1, 0]

    for y, (label, lo, hi, colour, arithmetic, band) in zip(y_positions, rows):
        # full band, translucent; the "low" anchor solid
        ax.barh(y, hi, height=0.46, color=colour, alpha=0.22,
                edgecolor=colour, linewidth=1.1, zorder=3)
        ax.barh(y, lo, height=0.46, color=colour, alpha=0.78,
                edgecolor="none", zorder=4)
        ax.plot([lo, lo], [y - 0.23, y + 0.23], color=BG, lw=1.6, zorder=5)

        ax.text(-60, y + 0.02, label, ha="right", va="center",
                fontsize=12.5, fontweight="bold", color=colour)
        ax.text(LABEL_X, y + 0.22, band, ha="left", va="top",
                fontsize=12, fontweight="bold", color=TEXT)
        ax.text(LABEL_X, y - 0.02, arithmetic, ha="left", va="top",
                fontsize=8.0, color=MUTED, linespacing=1.5)

    # The SOM bar is 1.6 of 3,450 on this axis — thinner than one pixel.
    # Draw it at its true width as a rule rather than inflate it, and say so.
    ax.plot([1.6, 1.6], [-0.23, 0.23], color=EMBER, lw=2.2, zorder=6)
    ax.annotate(
        "drawn at true width — 1.6 of 3,000 on this axis is thinner than one pixel. A seed-stage SOM\n"
        "that is a fraction of one percent of SAM is what an honest bottom-up model produces.",
        xy=(4.0, -0.26), xytext=(55, -0.50),
        fontsize=8.0, color=EMBER, va="top", ha="left", linespacing=1.6,
        arrowprops=dict(arrowstyle="->", color=EMBER, lw=0.9,
                        connectionstyle="angle,angleA=0,angleB=90,rad=3"),
    )

    ax.set_xlim(0, XMAX)
    ax.set_ylim(-1.18, 2.60)
    ax.set_yticks([])
    ax.set_xticks([0, 1000, 2000, 3000])
    ax.set_xticklabels(["$0", "$1.0bn", "$2.0bn", "$3.0bn"], fontsize=8.5)
    ax.xaxis.grid(True, zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    # --- bottom strip: SOM as a share of SAM -------------------------------
    ax2.add_patch(Rectangle((0, -0.30), 100, 0.60, facecolor=PANEL,
                            edgecolor=GRID, linewidth=1.0, zorder=2))
    ax2.add_patch(Rectangle((0, -0.30), 0.23, 0.60, facecolor=EMBER,
                            edgecolor=EMBER, linewidth=1.2, zorder=3))
    ax2.text(-1.4, 0.0, "SOM ÷ SAM", ha="right", va="center",
             fontsize=9.5, fontweight="bold", color=MUTED)
    ax2.annotate(
        "0.14% – 0.23%   ($1.63M ÷ $1,180.2M  to  $1.63M ÷ $704.3M)",
        xy=(0.23, 0.0), xytext=(6.0, 0.0),
        fontsize=9.0, fontweight="bold", color=EMBER, va="center", ha="left",
        arrowprops=dict(arrowstyle="->", color=EMBER, lw=1.0, shrinkA=2, shrinkB=1),
    )
    ax2.text(99, -0.52, "100% of SAM", ha="right", va="top", fontsize=7.6, color=MUTED)
    ax2.set_xlim(0, 100)
    ax2.set_ylim(-0.72, 0.45)
    ax2.set_xticks([])
    ax2.set_yticks([])
    strip(ax2, keep=())

    source(fig,
           "ARPU band $7.80–$13.07/MAU/yr: Duolingo FY2025 $1,037.6M ÷ 133.1M MAU (SEC 8-K) and MAG Interactive $21.563M 9-mo ÷ 2.2M MAU × 12/9 (interim report).  "
           "Populations: EMARKETER 216.8M US second-screen adults 2026; FSGA/Angus Reid 2026 90.3M North American fantasy/betting adults.\n"
           "SOM is the Year-3 exit of the base-case plan — a target chosen from third-party benchmarks with zero company data behind it, not a prediction. "
           "FACT//DUEL has no users and no revenue.  numbers.md §1.1–§1.5.")
    save(fig, "tam-sam-som.png")


# ============================================================================
# 2. The gap  (numbers.md §1.6)
# ============================================================================
def chart_the_gap():
    fig = plt.figure(figsize=(10, 5.9))
    ax = fig.add_axes([0.255, 0.150, 0.725, 0.545])

    titles(
        fig,
        "The gap: a $3–8bn “market” against $5.33M of observed trivia revenue",
        "Top-down vendor estimates above the rule, observed consumer spend below it — same log scale. Vendors disagree\n"
        "with each other by 2.00× and 3.93× on the same markets in the same year: the empirical case for bottom-up.",
        sub_y=0.888,
    )
    fig.text(0.012, 0.795,
             "Two readings, and the deck owes both: the category is structurally under-monetised and\n"
             "under-built — or trivia audiences do not pay, and this is what the ceiling looks like.",
             ha="left", va="top", fontsize=8.8, color=MUTED, linespacing=1.6)

    rows = [
        ("Fan engagement, 2025", 8.09e9, GOLD, "The Business Research Company", "top"),
        ("Game-based learning, 2025", 6.23e9, GOLD, "MarketsandMarkets", "top"),
        ("Second-screen sports apps, 2025", 3.00e9, GOLD, "Fact.MR", "top"),
        ("Top-three US iOS trivia, gross", 5.33e6, VOLT, "$102.5K/week × 52 — Sensor Tower est., Q2 2025", "obs"),
        ("Kahoot! alone, US iOS gross", 2.00e6, EMBER, "$38.5K/week × 52 — Sensor Tower est., Q2 2025", "obs"),
    ]

    ys = [4, 3, 2, 1, 0]
    for y, (label, val, colour, note, kind) in zip(ys, rows):
        ax.barh(y, val, height=0.48, color=colour,
                alpha=0.85 if kind == "obs" else 0.42,
                edgecolor=colour, linewidth=1.2, zorder=3)
        txt = f"${val / 1e9:,.2f}bn" if val >= 1e9 else f"${val / 1e6:,.2f}M"
        ax.text(val * 1.28, y, txt, ha="left", va="center",
                fontsize=11.5, fontweight="bold", color=colour, zorder=4)
        ax.text(-0.02, y + 0.15, label, transform=ax.get_yaxis_transform(),
                ha="right", va="center", fontsize=9.6, fontweight="bold", color=TEXT)
        ax.text(-0.02, y - 0.20, note, transform=ax.get_yaxis_transform(),
                ha="right", va="center", fontsize=7.4, color=MUTED)

    # cluster captions
    ax.text(1.02e6, 4.62, "TOP-DOWN  “MARKET”  ESTIMATES", fontsize=8.4,
            fontweight="bold", color=GOLD, va="center", ha="left")
    ax.text(1.02e6, 1.48, "OBSERVED  REVENUE  (largest single storefront)", fontsize=8.4,
            fontweight="bold", color=VOLT, va="center", ha="left")
    ax.axhline(1.70, color=GRID, lw=1.0, alpha=GRID_ALPHA, zorder=1)

    # the gap arrow
    ax.annotate("", xy=(5.33e6, -0.52), xytext=(3.00e9, -0.52),
                arrowprops=dict(arrowstyle="<->", color=MAGENTA, lw=1.5))
    ax.text(1.3e8, -0.80, "~1,000×", ha="center", va="top", fontsize=13.5,
            fontweight="bold", color=MAGENTA)


    ax.set_xscale("log")
    ax.set_xlim(1e6, 3e10)
    ax.set_ylim(-1.18, 5.05)
    ax.set_yticks([])
    ax.set_xticks([1e6, 1e7, 1e8, 1e9, 1e10])
    ax.xaxis.set_major_formatter(FuncFormatter(
        lambda v, _: {1e6: "$1M", 1e7: "$10M", 1e8: "$100M", 1e9: "$1bn", 1e10: "$10bn"}.get(v, "")))
    ax.tick_params(axis="x", labelsize=8.5)
    ax.xaxis.grid(True, which="major", zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    source(fig,
           "Top-down: Fact.MR second-screen sports apps $3.0bn 2025; The Business Research Company fan engagement $8.09bn 2025; MarketsandMarkets game-based learning $6.23bn 2025 — all third-party vendor estimates.  "
           "Rival vendors put fan engagement at $16.2bn (market.us, 2024) and game-based learning at $24.5bn (IMARC, 2025).\n"
           "Observed: Sensor Tower US iOS Q2 2025 modelled gross consumer spend, before Apple’s 15–30% cut — Kahoot! $38.5K/wk peak, Trivia Crack Premium ~$33K/wk, GeoGuessr $31K/wk; top three combined $102.5K/wk × 52.  numbers.md §1.6.")
    save(fig, "the-gap.png")


# ============================================================================
# 3. The 1v1 vacuum  (numbers.md §2.2, §2.1)
# ============================================================================
def chart_vacuum():
    fig = plt.figure(figsize=(10, 6.2))
    ax = fig.add_axes([0.062, 0.330, 0.920, 0.375])

    titles(
        fig,
        "The live 1v1 vacuum: hundreds of millions of installs, no maintained incumbent",
        "Lifetime Android installs, log scale. Colour is maintenance status, not size.",
        sub_y=0.888,
    )
    fig.text(0.062, 0.800,
             "Every app currently marketing itself as live 1v1 trivia is negligible. "
             "The format’s installed base is not.",
             ha="left", va="top", fontsize=9.6, fontweight="bold", color=VOLT)

    bars = [
        ("Trivia Crack", 267_939_837, "267,939,837", MAGENTA, "PIVOTED",
         "Listing is now “Trivia Crack\nby The Floor”, leading with a\nFOX TV tie-in. Duels abandoned."),
        ("Kahoot!", 100_263_409, "100,263,409", VOLT, "MAINTAINED",
         "Updated 3 Sep 2026.\nClassroom quiz, not 1v1.\nMonetises B2B, not IAP."),
        ("Jeopardy!\nWorld Tour", 5_177_147, "5,177,147", VOLT, "MAINTAINED",
         "Live. iOS build last updated\n20 Oct 2025. Game-show\nformat, not 1v1."),
        ("TRIVIA GO!\nLive 1v1 Quiz", 10_000, "10,000+", MAGENTA, "STALE",
         "No update since 22 May 2025.\n4.5★ from 138 ratings."),
        ("Quizion\n1v1 Trivia Battles", 10, "10+", VOLT, "MAINTAINED",
         "Updated 13 Aug 2026.\nTen-plus downloads.\nNo ratings displayed."),
    ]

    for x, (name, val, shown, colour, status, note) in enumerate(bars):
        ax.bar(x, val, width=0.50, color=colour, alpha=0.80,
               edgecolor=colour, linewidth=1.2, zorder=3)
        ax.text(x, val * 20.0, status, ha="center", va="bottom", fontsize=8.0,
                fontweight="bold", color=colour, zorder=4)
        ax.text(x, val * 1.45, shown, ha="center", va="bottom",
                fontsize=11.5, fontweight="bold", color=colour, zorder=4)
        ax.text(x, -0.055, name, ha="center", va="top", fontsize=10.0,
                fontweight="bold", color=TEXT, transform=ax.get_xaxis_transform(),
                linespacing=1.35)
        ax.text(x, -0.235, note, ha="center", va="top", fontsize=7.4,
                color=MUTED, transform=ax.get_xaxis_transform(), linespacing=1.6)

    ax.set_yscale("log")
    ax.set_ylim(1, 3e10)
    ax.set_xlim(-0.60, len(bars) - 0.40)
    ax.set_xticks([])
    ax.set_yticks([1, 1e2, 1e4, 1e6, 1e8])
    ax.yaxis.set_major_formatter(FuncFormatter(
        lambda v, _: {1: "1", 1e2: "100", 1e4: "10K", 1e6: "1M", 1e8: "100M"}.get(v, "")))
    ax.tick_params(axis="y", labelsize=8.5)
    ax.yaxis.grid(True, which="major", zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    source(fig,
           "Google Play internal install counts, verified 13 Sep 2026: Trivia Crack 267,939,837 (displayed as 100M+); Kahoot! 100,263,409; Jeopardy! World Tour 5,177,147; TRIVIA GO! (live.trivia, Sorbet Live) 10K+; Quizion (com.quizion.app) 10+.\n"
           "QuizDuel — the one live duel product at scale — is shrinking: MAG Interactive group DAU −14% and MAU −13% YoY, US iOS 3.51★ from 78 ratings. Wayground’s apps have been stale since 14 Nov 2025.  numbers.md §2.1–§2.2.")
    save(fig, "vacuum.png")


# ============================================================================
# 4. The graveyard  (numbers.md §2.3)
# ============================================================================
def chart_graveyard():
    fig = plt.figure(figsize=(10, 6))
    ax = fig.add_axes([0.028, 0.185, 0.955, 0.520])

    titles(
        fig,
        "Why the vacuum exists: big audiences, real money raised, all dead",
        "Distribution was never the binding constraint in this category. Retention and monetisation were.",
        sub_y=0.888,
    )
    fig.text(0.028, 0.800,
             "Trivia Royale proved trivia acquires users almost free — ≤$0.20 blended, 45% D1 — "
             "and died anyway, in eight months.",
             ha="left", va="top", fontsize=9.6, fontweight="bold", color=VOLT)

    def d(s_):
        return mdates.date2num(dt.datetime.strptime(s_, "%Y-%m-%d"))

    # Labels are separated horizontally (ha) as well as vertically, so adjacent
    # lanes never fight for the same pixels.
    lanes = [
        dict(
            y=2.0, colour=CYAN, name="QuizUp",
            capital="~$32.4M equity raised",
            span=(d("2014-03-01"), d("2021-03-22")),
            peak=(d("2014-05-19"), "left",
                  "“on track to pass 20 million users” — company, 19 May 2014.\n"
                  "A 6-month registration milestone, not a peak."),
            mid=(d("2016-12-19"), "right",
                 "Sold to Glu Mobile, 19 Dec 2016 —\n"
                 "$7.5M face value of notes cancelled,\n"
                 "fair value booked at $3.2M, zero goodwill"),
            end=(d("2021-03-22"), "Discontinued\n22 Mar 2021"),
        ),
        dict(
            y=1.0, colour=EMBER, name="HQ Trivia",
            capital=">$15M raised — $15,000,001 offered,\n$12,539,999 sold to 6 investors",
            span=(d("2018-03-28"), d("2020-02-14")),
            peak=(d("2018-03-28"), "left",
                  "2,380,000 concurrent players\n28 Mar 2018"),
            mid=(d("2020-01-15"), "right",
                 "67,000 installs in Jan 2020 —\n3.35% of the ~2M/month Feb 2018 peak"),
            end=(d("2020-02-14"), "Shut down 14 Feb 2020,\n25 staff"),
        ),
        dict(
            y=0.0, colour=MAGENTA, name="Trivia Royale",
            capital="$9,155,139 + $1,499,913 raised",
            span=(d("2020-06-17"), d("2021-02-23")),
            peak=(d("2020-07-10"), "left",
                  "2,500,000 downloads in ~3 weeks · 45% D1 iOS, on a launch\n"
                  "budget under $500,000 → blended ≤$0.20 per download"),
            mid=None,
            end=(d("2021-02-23"), "Closed 23 Feb 2021 — 8 months.\nAll 16 staff let go."),
        ),
    ]

    GUTTER = d("2011-08-01")

    for lane in lanes:
        y, c = lane["y"], lane["colour"]
        x0, x1 = lane["span"]
        ax.plot([x0, x1], [y, y], color=c, lw=5.0, alpha=0.34,
                solid_capstyle="butt", zorder=3)
        px, pha, plabel = lane["peak"]
        # only draw a span-start dot when it is a distinct dated event
        if abs(px - x0) > 200:
            ax.plot([x0], [y], marker="o", ms=5.0, color=c, mec=BG, mew=1.2, zorder=5)
        ax.plot([px], [y], marker="o", ms=9, color=c, mec=BG, mew=1.4, zorder=6)
        ax.text(px + (60 if pha == "left" else -60), y + 0.15, plabel, ha=pha,
                va="bottom", fontsize=7.8, color=TEXT, linespacing=1.55)

        if lane.get("mid"):
            mx, mha, mlabel = lane["mid"]
            ax.plot([mx], [y], marker="o", ms=5.5, color=BG, mec=c, mew=1.6, zorder=6)
            ax.text(mx + (60 if mha == "left" else -60), y - 0.18, mlabel, ha=mha,
                    va="top", fontsize=7.4, color=MUTED, linespacing=1.55)

        ex, elabel = lane["end"]
        ax.plot([ex], [y], marker="X", ms=13, color=MAGENTA, mec=BG, mew=1.2, zorder=7)
        ax.text(ex + 110, y, elabel, ha="left", va="center", fontsize=7.9,
                color=MAGENTA, fontweight="bold", linespacing=1.55)

        ax.text(GUTTER, y + 0.12, lane["name"], ha="left", va="bottom",
                fontsize=12.5, fontweight="bold", color=c)
        ax.text(GUTTER, y - 0.02, lane["capital"], ha="left", va="top",
                fontsize=7.4, color=MUTED, linespacing=1.55)

    ax.set_xlim(d("2011-04-01"), d("2024-10-01"))
    ax.set_ylim(-0.78, 2.82)
    ax.set_yticks([])
    ax.xaxis.set_major_locator(mdates.YearLocator(1))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
    ax.tick_params(axis="x", labelsize=8.5)
    ax.xaxis.grid(True, zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    source(fig,
           "HQ Trivia: TechCrunch 14 Feb 2020 (peak 2.38M concurrent 28 Mar 2018; 67,000 installs Jan 2020); SEC Form D (CIK 1734125) $15,000,001 offered / $12,539,999 sold to 6 investors, Founders Fund lead. Relaunched 29 Mar 2020, last game 17 Nov 2022, delisted 5 Aug 2023.\n"
           "QuizUp: Glu Mobile 10-K and 8-K (19 Dec 2016) — $7.5M notes cancelled, $3.2M fair value, zero goodwill; ~$32.4M equity per SEC Form Ds; removed from the App Store 20 Jan 2021.\n"
           "Trivia Royale: TechCrunch 10 Jul 2020 (2.5M downloads, 45% D1 iOS, <$500K budget, ~40% of it to TikTok influencers); Teatime Games SEC Form Ds $9,155,139 (9 May 2018) + $1,499,913 (first sale 19 Sep 2017).  numbers.md §2.3.")
    save(fig, "graveyard.png")


# ============================================================================
# 5. Scenarios  (numbers.md §4.2, §4.3)
# ============================================================================
def chart_scenarios():
    fig = plt.figure(figsize=(10, 5.9))
    ax = fig.add_axes([0.075, 0.215, 0.905, 0.465])

    titles(
        fig,
        "Three-year revenue model — (P) plan, not a forecast",
        "Zero users and zero months of cohort data, so there is nothing to anchor projections to. Every\n"
        "input is a published third-party benchmark or a stated assumption, and only install volume\n"
        "changes between scenarios. Per a16z and YC this belongs in the appendix, not the deck.",
        sub_y=0.893,
    )
    fig.text(0.075, 0.718,
             "Revenue per install:  conservative $0.3688  ·  base $1.3588  ·  optimistic $1.8902.",
             ha="left", va="top", fontsize=8.6, color=MUTED)

    years = ["Year 1 (P)", "Year 2 (P)", "Year 3 (P)"]
    series = [
        ("Conservative", [9_220, 33_193, 92_202], CYAN),
        ("Base", [101_907, 475_567, 1_630_517], VOLT),
        ("Optimistic", [378_039, 1_890_196, 7_560_784], GOLD),
    ]

    width = 0.26
    for (name, vals, colour), off in zip(series, [-width, 0.0, width]):
        for i, v in enumerate(vals):
            x = i + off
            ax.bar(x, v, width=width * 0.9, color=colour, alpha=0.82,
                   edgecolor=colour, linewidth=1.1, zorder=3)
            ax.text(x, v * 1.17, f"${v:,}", ha="center", va="bottom",
                    fontsize=9.2, fontweight="bold", color=colour, zorder=4)
            if i == 0:  # direct-label the scenario over the Year-1 group
                ax.text(x, v * 2.2, name, ha="center", va="bottom", fontsize=10,
                        fontweight="bold", color=colour, zorder=4)

    # Subscription cross-check on the Year-3 base case, drawn on the bar itself
    ax.plot([2 - width * 0.50, 2 + width * 0.50], [420_666, 420_666],
            color=MAGENTA, lw=2.4, zorder=6)
    # Routed down the empty gap between the Year-2 and Year-3 groups so the
    # leader never crosses a bar or a value label.
    ax.annotate(
        "Subscription cross-check, Year 3 base: 105,900 MAU × 9.03% (Duolingo’s\n"
        "MAU→paid) × $43.99/yr = $420,666 — 3.88× below the install model.\n"
        "The honest base-case Year-3 band is $0.4M – $1.6M, not $1.6M.",
        xy=(2 - width * 0.50, 420_666), xytext=(1.50, 5.5e7),
        fontsize=8.2, color=MAGENTA, va="top", ha="right", linespacing=1.6,
        arrowprops=dict(arrowstyle="->", color=MAGENTA, lw=1.0,
                        connectionstyle="angle,angleA=0,angleB=90,rad=6"),
    )

    ax.set_yscale("log")
    ax.set_ylim(2.2e3, 8e7)
    ax.set_xlim(-0.52, 2.52)
    ax.set_xticks(range(3))
    ax.set_xticklabels(years, fontsize=10.5, fontweight="bold")
    ax.tick_params(axis="x", labelcolor=TEXT, pad=8)
    ax.set_yticks([1e4, 1e5, 1e6, 1e7])
    ax.yaxis.set_major_formatter(FuncFormatter(
        lambda v, _: {1e4: "$10K", 1e5: "$100K", 1e6: "$1M", 1e7: "$10M"}.get(v, "")))
    ax.tick_params(axis="y", labelsize=8.5)
    ax.yaxis.grid(True, which="major", zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    source(fig,
           "Inputs — D30 retention: 0.68% global median low / 1.18% North American median / 1.70% global P75 (GameAnalytics CY2025). Install→payer: 5.08% NA repeat / 11.14% NA one-time / 18.46% derived from $1.34 ÷ $7.26 (AppsFlyer). ARPPU $7.26 and ad revenue $0.55 per install in every scenario (AppsFlyer casual D90); the conservative case assumes no ad stack at all.\n"
           "Install volumes (25K/90K/250K · 75K/350K/1.2M · 200K/1.0M/4.0M) and 20%/month churn of the retained base are stated assumptions with no company data behind them. Cross-check: Duolingo 9.03% MAU→paid (SEC Q2 FY26) × Sporcle Orange $43.99/yr.  numbers.md §4.1–§4.3.")
    save(fig, "scenarios.png")


# ============================================================================
# 6. Where the money actually is  (numbers.md §1.6, §2.1, §2.4)
# ============================================================================
def chart_where_money_is():
    fig = plt.figure(figsize=(10, 5.9))
    ax = fig.add_axes([0.300, 0.215, 0.680, 0.485])

    titles(
        fig,
        "Where the money actually is — and it is not trivia IAP",
        "Reported annual revenue, log scale. The two largest are habit-subscription businesses.",
        sub_y=0.888,
    )
    fig.text(0.300, 0.800,
             "Model FACT//DUEL on Duolingo’s habit-subscription economics, not Trivia Crack’s IAP economics.",
             ha="left", va="top", fontsize=9.6, fontweight="bold", color=VOLT)

    rows = [
        ("Duolingo, FY2025", 1037.6, "$1,037.6M", VOLT,
         "Consumer subscription on a streak / XP / quest loop\n9.03% MAU→paid · audited SEC filing"),
        ("Kahoot!, FY2022", 146.0, "$146.0M", VOLT,
         "B2B and education subscriptions · 95% gross margin\n$19–$79/mo per presenter, billed annually"),
        ("Skillz, FY2025", 104.5, "$104.5M", EMBER,
         "Head-to-head entry fees · 141,000 paying MAU at $61.70/mo\ndown from $380.2M revenue in FY2021"),
        ("MAG Interactive, annualised", 28.8, "≈$28.8M", GOLD,
         "QuizDuel et al. · ads + IAP across the whole portfolio\n2.2M MAU, shrinking 13% YoY"),
        ("Top-three US iOS trivia, gross", 5.33, "$5.33M", MAGENTA,
         "Kahoot! + Trivia Crack Premium + GeoGuessr consumer IAP\nSensor Tower estimate, Q2 2025 × 52"),
    ]

    for y, (label, val, shown, colour, note) in zip(range(len(rows))[::-1], rows):
        ax.barh(y, val, height=0.46, color=colour, alpha=0.82,
                edgecolor=colour, linewidth=1.2, zorder=3)
        ax.text(val * 1.22, y, shown, ha="left", va="center",
                fontsize=11.5, fontweight="bold", color=colour, zorder=4)
        ax.text(-0.018, y + 0.34, label, transform=ax.get_yaxis_transform(),
                ha="right", va="top", fontsize=9.8, fontweight="bold", color=TEXT)
        ax.text(-0.018, y + 0.02, note, transform=ax.get_yaxis_transform(),
                ha="right", va="top", fontsize=7.2, color=MUTED, linespacing=1.5)

    # The two volt bars are the argument; state it in the empty right-hand
    # space beside the short bars rather than with a leader across them.
    ax.text(55, 0.20,
            "The two largest are habit subscriptions, not trivia IAP:\n"
            "$1,037.6M and $146.0M on streak, quest and class-plan\n"
            "renewals — not on consumable in-app purchases.",
            ha="left", va="center", fontsize=8.4, color=VOLT, linespacing=1.7)

    ax.set_xscale("log")
    ax.set_xlim(1, 1.7e3)
    ax.set_ylim(-0.75, 4.75)
    ax.set_yticks([])
    ax.set_xticks([1, 10, 100, 1000])
    ax.xaxis.set_major_formatter(FuncFormatter(
        lambda v, _: {1: "$1M", 10: "$10M", 100: "$100M", 1000: "$1bn"}.get(v, "")))
    ax.tick_params(axis="x", labelsize=8.5)
    ax.xaxis.grid(True, which="major", zorder=0)
    ax.set_axisbelow(True)
    strip(ax, keep=())

    source(fig,
           "Duolingo FY2025 revenue $1,037.6M and 9.03% MAU→paid conversion — SEC 8-K exhibits.  Kahoot! FY2022 revenue $146.0M at 95% gross margin — Q4 2022 quarterly report; Kahoot has published no audited group figures since delisting on 23 Jan 2024.\n"
           "Skillz FY2025 revenue $104.5M, 141,000 paying MAU at $61.70 monthly ARPPU, net loss $70.4M — SEC 8-K ex-99.1.  MAG Interactive: $21.563M nine-month net sales annualised — Q3 2025/26 interim report; group-level across the whole portfolio, not QuizDuel standalone.\n"
           "Top-three US iOS trivia: $102.5K/week × 52, gross before Apple’s 15–30% cut — Sensor Tower modelled estimate, not audited revenue.  numbers.md §1.6, §2.1, §2.4.")
    save(fig, "where-money-is.png")


# ============================================================================
# 7. Retention  (numbers.md §3.1, §4.2)
# ============================================================================
def chart_retention_bar():
    fig = plt.figure(figsize=(10, 6.6))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.04, 1.0], wspace=0.26,
                          left=0.062, right=0.982, top=0.720, bottom=0.335)
    axl = fig.add_subplot(gs[0])
    axr = fig.add_subplot(gs[1])

    titles(
        fig,
        "D30 is where casual games die — and we cannot measure ours at all",
        "GameAnalytics CY2025 benchmarks: 16,000+ mobile games, 9 regions, iOS and Android, ≥1,000 MAU.",
        sub_y=0.905,
    )
    fig.text(0.062, 0.838,
             "At the base case’s 1.18% D30, the retained resident base is 5,900 of 105,900 MAU — 5.6%. "
             "The rest is this month’s installs.",
             ha="left", va="top", fontsize=9.3, fontweight="bold", color=VOLT)

    # --- left: the collapse -------------------------------------------------
    labels = ["D1", "D7", "D30"]
    vals = [22.0, 4.0, 0.79]
    shown = ["~22%", "just under 4%", "0.68 – 0.79%"]
    cols = [CYAN, CYAN, MAGENTA]

    for i, (v, sh, c) in enumerate(zip(vals, shown, cols)):
        axl.bar(i, v, width=0.52, color=c, alpha=0.82, edgecolor=c,
                linewidth=1.2, zorder=3)
        axl.text(i, v + 0.85, sh, ha="center", va="bottom", fontsize=11,
                 fontweight="bold", color=c, zorder=4)

    axl.text(2.55, 19.5,
             "At a median D30 of ~0.7%,\na game’s MAU is almost entirely\nits current month’s new installs.",
             ha="right", va="top", fontsize=8.6, color=MUTED, linespacing=1.7)

    axl.set_ylim(0, 27)
    axl.set_xlim(-0.62, 2.62)
    axl.set_xticks(range(3))
    axl.set_xticklabels(labels, fontsize=11, fontweight="bold")
    axl.tick_params(axis="x", labelcolor=TEXT, pad=7)
    axl.set_yticks([0, 5, 10, 15, 20, 25])
    axl.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.0f}%"))
    axl.tick_params(axis="y", labelsize=8.5)
    axl.yaxis.grid(True, zorder=0)
    axl.set_axisbelow(True)
    strip(axl, keep=())
    axl.set_title("Global median retention (P50)", loc="left", fontsize=9.8,
                  fontweight="bold", color=TEXT, pad=10)

    # --- right: the D30 zoom -----------------------------------------------
    d30 = [
        ("Global median\n(P50)", 0.79, MUTED, "0.68 – 0.79%",
         "conservative case\nuses 0.68%"),
        ("North America\nmedian (P50)", 1.18, VOLT, "1.18%",
         "the base case\nassumes this"),
        ("Global P75", 1.70, GOLD, "1.70%",
         "optimistic case\nP75 band 1.6 – 1.8%"),
    ]
    for i, (name, v, c, lab, note) in enumerate(d30):
        axr.bar(i, v, width=0.52, color=c, alpha=0.82, edgecolor=c,
                linewidth=1.2, zorder=3)
        axr.text(i, v + 0.052, lab, ha="center", va="bottom", fontsize=11,
                 fontweight="bold", color=c, zorder=4)
        axr.text(i, -0.055, name, ha="center", va="top", fontsize=9.0,
                 fontweight="bold", color=TEXT, linespacing=1.35,
                 transform=axr.get_xaxis_transform())
        axr.text(i, -0.215, note, ha="center", va="top", fontsize=7.3,
                 color=c, linespacing=1.5, transform=axr.get_xaxis_transform())

    axr.set_ylim(0, 2.32)
    axr.set_xlim(-0.62, 2.62)
    axr.set_xticks([])
    axr.set_yticks([0, 0.5, 1.0, 1.5, 2.0])
    axr.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.1f}%"))
    axr.tick_params(axis="y", labelsize=8.5)
    axr.yaxis.grid(True, zorder=0)
    axr.set_axisbelow(True)
    strip(axr, keep=())
    axr.set_title("D30 only — the whole business, magnified", loc="left",
                  fontsize=9.8, fontweight="bold", color=TEXT, pad=10)

    fig.text(0.062, 0.170,
             "FACT//DUEL’s progression is device-local with no accounts, so we cannot measure D1/D7/D30 at all — "
             "not “haven’t yet”, but cannot, architecturally.\n"
             "That is what the raise buys: accounts, server-side progression, instrumentation, and a "
             "≥1,000-player four-week cohort reported against these medians.",
             ha="left", va="top", fontsize=8.6, color=TEXT, linespacing=1.7)

    source(fig,
           "GameAnalytics 2026 Mobile & PC Gaming Benchmarks, published 24 Aug 2026 — calendar-year 2025 data, third-party estimate. Global P50 D1 ~22%, D7 just under 4%, D30 0.68–0.79%; P75 D30 1.6–1.8%; North America P50 D1 23.28%, D7 4.97%, D30 1.18%.\n"
           "Caveat that travels with every figure on this slide: all of it is measured on iOS and Android store installs. FACT//DUEL is a web app with no install step and no push notifications, and no verified web-first retention benchmark exists in our evidence base.  numbers.md §3.1, §4.2, §5.14, §5.15.")
    save(fig, "retention-bar.png")


# ============================================================================
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Rendering FACT//DUEL investor charts → {OUT_DIR}")
    chart_tam_sam_som()
    chart_the_gap()
    chart_vacuum()
    chart_graveyard()
    chart_scenarios()
    chart_where_money_is()
    chart_retention_bar()
    print("done — 7 charts")


if __name__ == "__main__":
    main()
