import sys
sys.stdout.reconfigure(encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch

# ─────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────
phases = [
    {
        "phase": "Requirements\nGathering &\nPlanning",
        "tasks": [
            ("Data Collection & Permission from Travellers Inn", [1]),
            ("Finalizing Functional & Technical Requirements",   [2]),
        ]
    },
    {
        "phase": "System Design\n& Architecture",
        "tasks": [
            ("UI/UX Wireframing & Responsive Layout Design",    [2, 3]),
            ("System Architecture, DFD & ERD Design",          [3, 4]),
        ]
    },
    {
        "phase": "Database &\nBackend Build",
        "tasks": [
            ("PostgreSQL Schema & Table Setup",                 [4, 5]),
            ("FastAPI REST Endpoints & JWT Security",           [5, 6]),
            ("AI / NLP Sentiment & Pricing Logic",              [5, 6]),
        ]
    },
    {
        "phase": "Frontend &\nIntegration",
        "tasks": [
            ("Customer Portal & Booking Flow Integration",      [6, 7]),
            ("Admin Dashboard, Feedback & Analytics Views",     [7, 8]),
        ]
    },
    {
        "phase": "Testing &\nEvaluation",
        "tasks": [
            ("System Integration Testing & Bug Fixes",          [7, 8]),
            ("Evaluation using ISO/IEC 25010 Standards",        [8]),
        ]
    },
    {
        "phase": "Documentation\n& Defense",
        "tasks": [
            ("Manuscript Completion & Final Revisions",         [7, 8]),
            ("Final System Presentation & Defense",            [8]),
        ]
    },
]

week_cols = ["W1-2", "W3-4", "W5-6", "W7-8", "W9-10", "W11-12", "W13-14", "W15-16"]
n_weeks = len(week_cols)

# ─────────────────────────────────────────────
# LAYOUT CONSTANTS
# ─────────────────────────────────────────────
PHASE_COL_W  = 1.7   # inches for Phase column
TASK_COL_W   = 3.6   # inches for Task Description column
WEEK_COL_W   = 0.72  # inches per week column
ROW_H        = 0.38  # inches per row
HEADER_H     = 0.50  # inches for header row
TITLE_H      = 0.42  # inches for title

total_rows = sum(len(p["tasks"]) for p in phases)
fig_w = PHASE_COL_W + TASK_COL_W + n_weeks * WEEK_COL_W + 0.3
fig_h = TITLE_H + HEADER_H + total_rows * ROW_H + 0.25

fig, ax = plt.subplots(figsize=(fig_w, fig_h))
ax.set_xlim(0, fig_w)
ax.set_ylim(0, fig_h)
ax.axis('off')

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
LEFT_MARGIN = 0.12

def col_x(col_idx):
    """Left edge x of column (0=Phase, 1=Task, 2..=weeks)."""
    if col_idx == 0:
        return LEFT_MARGIN
    if col_idx == 1:
        return LEFT_MARGIN + PHASE_COL_W
    return LEFT_MARGIN + PHASE_COL_W + TASK_COL_W + (col_idx - 2) * WEEK_COL_W

def col_cx(col_idx):
    if col_idx == 0:
        return col_x(0) + PHASE_COL_W / 2
    if col_idx == 1:
        return col_x(1) + TASK_COL_W / 2
    return col_x(col_idx) + WEEK_COL_W / 2

total_w = PHASE_COL_W + TASK_COL_W + n_weeks * WEEK_COL_W

# ─────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────
title_y = fig_h - TITLE_H / 2
ax.text(LEFT_MARGIN + total_w / 2, title_y,
        "PROJECT GANTT CHART (16-WEEK IMPLEMENTATION TIMELINE)",
        ha='center', va='center',
        fontsize=9.5, fontweight='bold', fontfamily='DejaVu Sans')

# ─────────────────────────────────────────────
# HEADER ROW
# ─────────────────────────────────────────────
header_top = fig_h - TITLE_H
header_bot = header_top - HEADER_H
header_cy  = (header_top + header_bot) / 2

HEADER_BG  = '#D9D9D9'
BORDER_CLR = '#555555'
LW = 0.6

def draw_cell(x, y_bot, w, h, bg=None, lw=LW, ec=BORDER_CLR):
    rect = mpatches.FancyBboxPatch(
        (x, y_bot), w, h,
        boxstyle="square,pad=0",
        linewidth=lw, edgecolor=ec,
        facecolor=bg if bg else 'white'
    )
    ax.add_patch(rect)

# Phase header
draw_cell(col_x(0), header_bot, PHASE_COL_W, HEADER_H, bg=HEADER_BG)
ax.text(col_cx(0), header_cy, "Phase", ha='center', va='center',
        fontsize=7.5, fontweight='bold')

# Task header
draw_cell(col_x(1), header_bot, TASK_COL_W, HEADER_H, bg=HEADER_BG)
ax.text(col_cx(1), header_cy, "Task Description", ha='center', va='center',
        fontsize=7.5, fontweight='bold')

# Week headers
for i, wk in enumerate(week_cols):
    ci = i + 2
    draw_cell(col_x(ci), header_bot, WEEK_COL_W, HEADER_H, bg=HEADER_BG)
    ax.text(col_cx(ci), header_cy, wk, ha='center', va='center',
            fontsize=7, fontweight='bold')

# ─────────────────────────────────────────────
# DATA ROWS
# ─────────────────────────────────────────────
ALT1 = '#FFFFFF'
ALT2 = '#F5F5F5'
MARK_CLR = '#1F497D'

row_idx = 0
y_cursor = header_bot  # top of next row

for phase in phases:
    phase_start_row = row_idx
    n_tasks = len(phase["tasks"])
    phase_h = n_tasks * ROW_H
    phase_top = y_cursor
    phase_bot = phase_top - phase_h

    for t_idx, (task, weeks) in enumerate(phase["tasks"]):
        row_bg = ALT1 if (row_idx % 2 == 0) else ALT2
        row_top = y_cursor
        row_bot = row_top - ROW_H
        row_cy  = (row_top + row_bot) / 2

        # Phase cell (only draw for first task in group, spanning all)
        if t_idx == 0:
            draw_cell(col_x(0), phase_bot, PHASE_COL_W, phase_h, bg='#EAF1FB')
            ax.text(col_cx(0), (phase_top + phase_bot) / 2,
                    phase["phase"],
                    ha='center', va='center',
                    fontsize=6.5, fontweight='bold',
                    multialignment='center',
                    wrap=True)

        # Task cell
        draw_cell(col_x(1), row_bot, TASK_COL_W, ROW_H, bg=row_bg)
        ax.text(col_x(1) + 0.08, row_cy, task,
                ha='left', va='center',
                fontsize=6.2,
                wrap=True)

        # Week cells
        for i in range(n_weeks):
            ci = i + 2
            week_num = i + 1   # 1-indexed
            draw_cell(col_x(ci), row_bot, WEEK_COL_W, ROW_H, bg=row_bg)
            if week_num in weeks:
                ax.text(col_cx(ci), row_cy, "✕",
                        ha='center', va='center',
                        fontsize=8, fontweight='bold',
                        color=MARK_CLR)

        y_cursor -= ROW_H
        row_idx += 1

# ─────────────────────────────────────────────
# OUTER BORDER
# ─────────────────────────────────────────────
table_top = fig_h - TITLE_H
table_bot = y_cursor
outer = mpatches.FancyBboxPatch(
    (LEFT_MARGIN, table_bot), total_w, table_top - table_bot,
    boxstyle="square,pad=0",
    linewidth=1.2, edgecolor='#333333', facecolor='none'
)
ax.add_patch(outer)

# ─────────────────────────────────────────────
# CAPTION
# ─────────────────────────────────────────────
ax.text(LEFT_MARGIN + total_w / 2, table_bot - 0.14,
        "Figure 2. Project Gantt Chart (16-Week Implementation Timeline)",
        ha='center', va='top',
        fontsize=7.5, fontstyle='italic', fontfamily='DejaVu Sans')

plt.tight_layout(pad=0.1)
out = r'c:\Users\Temp\Desktop\extracted_figures\gantt_updated.png'
plt.savefig(out, dpi=200, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
plt.close()
