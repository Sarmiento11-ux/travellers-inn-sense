import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Ellipse
import numpy as np

# ── Canvas ────────────────────────────────────────────────────────────────────
FIG_W, FIG_H = 24, 36
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, FIG_W)
ax.set_ylim(0, FIG_H)
ax.axis('off')
fig.patch.set_facecolor('white')

# ── Colours ───────────────────────────────────────────────────────────────────
SYS_FILL   = '#F8FAFC'
SYS_EDGE   = '#1E293B'
UC_FILL    = '#FFFFFF'
GUEST_COL  = '#1D4ED8'
ADMIN_COL  = '#B91C1C'
UC_TXT     = '#0F172A'
FR_COL_G   = '#1D4ED8'
FR_COL_A   = '#B91C1C'
INCL_COL   = '#94A3B8'
TITLE_COL  = '#0F172A'

# ── Helpers ───────────────────────────────────────────────────────────────────
def draw_actor(ax, x, y, label, sublabel, color, scale=1.0):
    s = scale
    head = plt.Circle((x, y + 0.95*s), 0.38*s, color=color, fill=True, zorder=5)
    ax.add_patch(head)
    ax.plot([x, x],             [y+0.57*s, y-0.30*s], color=color, lw=2.5*s, zorder=5)
    ax.plot([x-0.55*s, x+0.55*s],[y+0.18*s, y+0.18*s],color=color, lw=2.5*s, zorder=5)
    ax.plot([x, x-0.48*s],      [y-0.30*s, y-1.00*s], color=color, lw=2.5*s, zorder=5)
    ax.plot([x, x+0.48*s],      [y-0.30*s, y-1.00*s], color=color, lw=2.5*s, zorder=5)
    ax.text(x, y-1.22*s, label,    ha='center', va='top', fontsize=11*s,
            fontweight='bold', color=color, zorder=6)
    if sublabel:
        ax.text(x, y-1.60*s, sublabel, ha='center', va='top', fontsize=9*s,
                color=color, style='italic', zorder=6)

def draw_uc(ax, cx, cy, w, h, label, fr_id, ec, ls='-', fr_col=None):
    ell = Ellipse((cx, cy), w, h, facecolor=UC_FILL, edgecolor=ec,
                  linewidth=1.8, linestyle=ls, zorder=4)
    ax.add_patch(ell)
    ax.text(cx, cy + h/2 + 0.12, fr_id,
            ha='center', va='bottom', fontsize=7.8,
            color=fr_col or ec, fontweight='bold', zorder=5)
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=9.0, color=UC_TXT, zorder=5, multialignment='center')

def connect_line(ax, src, cx, cy, w, h, color):
    dx, dy = cx - src[0], cy - src[1]
    dist = np.hypot(dx, dy)
    if dist == 0: return
    a, b = w/2, h/2
    t = np.arctan2(dy * a, dx * b)
    ex, ey = cx - a*np.cos(t), cy - b*np.sin(t)
    ax.annotate("", xy=(ex, ey), xytext=src,
                arrowprops=dict(arrowstyle='->', color=color,
                                lw=1.4, connectionstyle='arc3,rad=0'))

def include_arrow(ax, x1, y1, x2, y2, h, label='«include»'):
    ax.annotate("", xy=(x2, y2+h/2), xytext=(x1, y1-h/2),
                arrowprops=dict(arrowstyle='->', color=INCL_COL,
                                lw=1.1, linestyle='dashed'))
    mid_y = (y1 + y2) / 2
    ax.text(x1 + 0.2, mid_y, label, fontsize=7.5, color=INCL_COL,
            style='italic', ha='left', va='center', zorder=5)

# ──────────────────────────────────────────────────────────────────────────────
# TITLE
# ──────────────────────────────────────────────────────────────────────────────
ax.text(FIG_W/2, FIG_H-0.5, 'TRAVELLERS INN SENSE',
        ha='center', va='top', fontsize=20, fontweight='bold', color=TITLE_COL)
ax.text(FIG_W/2, FIG_H-1.2, 'USE CASE DIAGRAM',
        ha='center', va='top', fontsize=15, fontweight='bold', color=TITLE_COL)
ax.text(FIG_W/2, FIG_H-1.9,
        'Figure 4.  Use Case Diagram of Travellers Inn Sense  (FR-C01–FR-C12 | FR-A01–FR-A14)',
        ha='center', va='top', fontsize=9.5, color='#64748B', style='italic')

# ──────────────────────────────────────────────────────────────────────────────
# SYSTEM BOUNDARY
# ──────────────────────────────────────────────────────────────────────────────
BND_L, BND_R = 2.8, FIG_W - 2.8
BND_B, BND_T = 1.2, FIG_H - 2.5
boundary = FancyBboxPatch((BND_L, BND_B), BND_R - BND_L, BND_T - BND_B,
                          boxstyle='round,pad=0.1',
                          linewidth=2.2, edgecolor=SYS_EDGE,
                          facecolor=SYS_FILL, zorder=1)
ax.add_patch(boundary)
ax.text(BND_L + 0.3, BND_T - 0.15,
        'System Boundary: Travellers Inn Sense',
        fontsize=9.5, style='italic', color='#334155', va='top')

# ──────────────────────────────────────────────────────────────────────────────
# ACTORS  (vertically centred in boundary)
# ──────────────────────────────────────────────────────────────────────────────
ACTOR_Y    = (BND_B + BND_T) / 2 + 0.5
GUEST_X    = 1.40
ADMIN_X    = FIG_W - 1.40
draw_actor(ax, GUEST_X, ACTOR_Y, 'Guest', '(Customer)', GUEST_COL, scale=1.2)
draw_actor(ax, ADMIN_X, ACTOR_Y, 'Administrator', '', ADMIN_COL, scale=1.2)

GUEST_PT = (GUEST_X + 0.66, ACTOR_Y + 0.22)
ADMIN_PT  = (ADMIN_X - 0.66, ACTOR_Y + 0.22)

# ──────────────────────────────────────────────────────────────────────────────
# USE CASE LAYOUT PARAMS
# ──────────────────────────────────────────────────────────────────────────────
UC_W  = 4.6    # ellipse width
UC_H  = 0.88   # ellipse height
GAP   = 1.20   # vertical gap between centres

CUST_X     = 7.2
ADMIN_UC_X = FIG_W - 7.2

# ──────────────────────────────────────────────────────────────────────────────
# CUSTOMER USE CASES  (FR-C01 – FR-C12)
# ──────────────────────────────────────────────────────────────────────────────
cust_cases = [
    ('FR-C03', 'Register Account'),
    ('FR-C04', 'Login / Authenticate'),
    ('FR-C01', 'Browse Room Catalog\n(Multi-Currency: ₱ / $ / €)'),
    ('FR-C02', 'Filter & Sort Rooms'),
    ('FR-C05', 'Reserve / Book a Room\n(Pay at Front Desk)'),
    ('FR-C06', 'View Booking History\n& Status Tracking'),
    ('FR-C10', 'Extend Stay\n(Self-Service)'),
    ('FR-C11', 'Early Checkout\n(Anytime)'),
    ('FR-C12', 'Cancel Reservation\n(Customer-Exclusive)'),
    ('FR-C07', 'Submit Guest Feedback\n& Star Rating'),
    ('FR-C08', 'Automated Sentiment\nIngestion  [System]'),
    ('FR-C09', 'Manage Customer Profile'),
]

n_cust    = len(cust_cases)
cust_top  = ACTOR_Y + (n_cust - 1) * GAP / 2
cust_pos  = {}

for idx, (fr_id, label) in enumerate(cust_cases):
    cy = cust_top - idx * GAP
    cust_pos[fr_id] = cy
    is_sys = (fr_id == 'FR-C08')
    ec  = INCL_COL if is_sys else GUEST_COL
    ls  = '--'     if is_sys else '-'
    draw_uc(ax, CUST_X, cy, UC_W, UC_H, label, fr_id, ec, ls, fr_col=FR_COL_G)
    if not is_sys:
        connect_line(ax, GUEST_PT, CUST_X, cy, UC_W, UC_H, GUEST_COL)

# «include» from FR-C07 → FR-C08
include_arrow(ax, CUST_X, cust_pos['FR-C07'], CUST_X, cust_pos['FR-C08'], UC_H)

# column header
ax.text(CUST_X, BND_T - 0.45, 'GUEST (CUSTOMER)',
        ha='center', va='top', fontsize=11, fontweight='bold', color=GUEST_COL)
ax.text(CUST_X, BND_T - 0.92, 'FR-C01 – FR-C12  ( 12 Use Cases )',
        ha='center', va='top', fontsize=9, color=GUEST_COL, style='italic')

# ──────────────────────────────────────────────────────────────────────────────
# ADMIN USE CASES  (FR-A01 – FR-A14)
# ──────────────────────────────────────────────────────────────────────────────
admin_cases = [
    ('FR-A01', 'Admin Login /\nAuthentication'),
    ('FR-A02', 'Executive Dashboard\n& KPI Overview'),
    ('FR-A03', 'Manage Guest Feedback\n& Inspect Reviews'),
    ('FR-A04', 'Sentiment Analytics\nVisualization (AI/NLP)'),
    ('FR-A05', 'Thematic Service\nConcern Analysis'),
    ('FR-A06', 'Front Desk Stay Lifecycle\n(Check-in / Pay / Complete)'),
    ('FR-A11', 'Generate Official E-Receipt\n& Hotel Guest Pass'),
    ('FR-A07', 'Room Catalog CRUD\n& Housekeeping Mgmt'),
    ('FR-A12', 'Housekeeping Sanitation\nClearance  (Linis na)'),
    ('FR-A08', 'Dynamic AI Pricing\nReview (Approve / Reject)'),
    ('FR-A09', 'User Account\nAdministration'),
    ('FR-A13', 'Hotel Settings &\nMulti-Currency Config'),
    ('FR-A10', 'Executive Reporting\n& CSV Export'),
    ('FR-A14', 'Analytics Dashboard'),
]

n_admin   = len(admin_cases)
admin_top = ACTOR_Y + (n_admin - 1) * GAP / 2
admin_pos = {}

for idx, (fr_id, label) in enumerate(admin_cases):
    cy = admin_top - idx * GAP
    admin_pos[fr_id] = cy
    draw_uc(ax, ADMIN_UC_X, cy, UC_W, UC_H, label, fr_id, ADMIN_COL, fr_col=FR_COL_A)
    connect_line(ax, ADMIN_PT, ADMIN_UC_X, cy, UC_W, UC_H, ADMIN_COL)

# «include» sub-flows
include_arrow(ax, ADMIN_UC_X, admin_pos['FR-A06'],
              ADMIN_UC_X, admin_pos['FR-A11'], UC_H)
include_arrow(ax, ADMIN_UC_X, admin_pos['FR-A07'],
              ADMIN_UC_X, admin_pos['FR-A12'], UC_H)

# column header
ax.text(ADMIN_UC_X, BND_T - 0.45, 'ADMINISTRATOR',
        ha='center', va='top', fontsize=11, fontweight='bold', color=ADMIN_COL)
ax.text(ADMIN_UC_X, BND_T - 0.92, 'FR-A01 – FR-A14  ( 14 Use Cases )',
        ha='center', va='top', fontsize=9, color=ADMIN_COL, style='italic')

# ──────────────────────────────────────────────────────────────────────────────
# LEGEND
# ──────────────────────────────────────────────────────────────────────────────
lx, ly = BND_L + 0.3, BND_B + 2.4
ax.add_patch(FancyBboxPatch((lx-0.2, ly-1.1), 7.2, 1.8,
                             boxstyle='round,pad=0.1',
                             linewidth=1.2, edgecolor='#CBD5E1',
                             facecolor='#F1F5F9', zorder=3))
ax.text(lx + 0.1, ly + 0.55, 'Legend', fontsize=9.5, fontweight='bold',
        color=TITLE_COL, va='top')

ax.annotate("", xy=(lx + 0.9, ly + 0.10), xytext=(lx + 0.2, ly + 0.10),
            arrowprops=dict(arrowstyle='->', color='#475569', lw=1.5))
ax.text(lx + 1.05, ly + 0.10, 'Actor ↔ Use Case Association',
        fontsize=9, color=TITLE_COL, va='center')

ax.annotate("", xy=(lx + 0.9, ly - 0.38), xytext=(lx + 0.2, ly - 0.38),
            arrowprops=dict(arrowstyle='->', color=INCL_COL, lw=1.1,
                            linestyle='dashed',
                            connectionstyle='arc3,rad=0'))
ax.text(lx + 1.05, ly - 0.38, '«include» Dependency',
        fontsize=9, color=TITLE_COL, va='center')

ax.add_patch(Ellipse((lx + 3.8, ly + 0.10), 0.6, 0.32,
                      facecolor='white', edgecolor=GUEST_COL, lw=1.6))
ax.text(lx + 4.2, ly + 0.10, 'Customer UC',
        fontsize=9, color=GUEST_COL, va='center')

ax.add_patch(Ellipse((lx + 5.5, ly + 0.10), 0.6, 0.32,
                      facecolor='white', edgecolor=ADMIN_COL, lw=1.6))
ax.text(lx + 5.9, ly + 0.10, 'Admin UC',
        fontsize=9, color=ADMIN_COL, va='center')

ax.add_patch(Ellipse((lx + 3.8, ly - 0.38), 0.6, 0.32,
                      facecolor='white', edgecolor=INCL_COL, lw=1.2, ls='--'))
ax.text(lx + 4.2, ly - 0.38, '[System] — auto-triggered',
        fontsize=9, color=INCL_COL, va='center')

# ──────────────────────────────────────────────────────────────────────────────
# SAVE
# ──────────────────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.4)
plt.savefig('c:/Users/Temp/Desktop/extracted_figures/usecase_updated.png',
            dpi=180, bbox_inches='tight', facecolor='white')
plt.close()
print("Done! Saved usecase_updated.png")
