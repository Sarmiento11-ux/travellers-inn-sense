import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_fixed_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Explicit Colors (High Contrast)
    DARK_NAVY    = RGBColor(15, 23, 42)      # #0F172A
    CARD_NAVY    = RGBColor(30, 41, 59)      # #1E293B
    LIGHT_BG     = RGBColor(241, 245, 249)   # #F1F5F9 - clean slate background
    CARD_BG      = RGBColor(255, 255, 255)   # #FFFFFF
    WHITE        = RGBColor(255, 255, 255)
    GOLD         = RGBColor(217, 119, 6)     # #D97706
    GOLD_BANNER  = RGBColor(245, 158, 11)    # #F59E0B
    TEXT_MAIN    = RGBColor(15, 23, 42)      # #0F172A - deep black/navy for all body titles
    TEXT_BODY    = RGBColor(51, 65, 85)      # #334155 - high contrast slate body text
    TEXT_MUTED   = RGBColor(100, 116, 139)   # #64748B
    BORDER_COLOR = RGBColor(203, 213, 225)   # #CBD5E1 - distinct card outline
    ACCENT_RED   = RGBColor(220, 38, 38)     # #DC2626
    ACCENT_AMBER = RGBColor(217, 119, 6)     # #D97706
    ACCENT_BLUE  = RGBColor(37, 99, 235)     # #2563EB
    ACCENT_GREEN = RGBColor(16, 185, 129)    # #10B981

    uploaded_folder = r"C:\Users\Temp\.gemini\antigravity\brain\05324ffa-11b8-42f7-9b94-0d42265836d8\.user_uploaded"
    img_cust_dash = os.path.join(uploaded_folder, "media_1792330268277_4d3672a2.png")
    img_pricing = os.path.join(uploaded_folder, "media_1792329319543_6449235d.png")

    def add_para(tf, text, size=11, bold=False, color=TEXT_BODY, space_after=4, font_name="Calibri", is_first=False):
        p = tf.paragraphs[0] if is_first else tf.add_paragraph()
        p.text = text
        p.space_after = Pt(space_after)
        for r in p.runs:
            r.font.name = font_name
            r.font.size = Pt(size)
            r.font.bold = bold
            r.font.color.rgb = color
        return p

    def add_header(slide, tag_text, title_text, dark=False):
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.15))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = add_para(tf, tag_text.upper(), size=11, bold=True, color=GOLD if dark else ACCENT_AMBER, space_after=2, font_name="Segoe UI", is_first=True)
        p1 = add_para(tf, title_text, size=22, bold=True, color=WHITE if dark else DARK_NAVY, space_after=0, font_name="Georgia")

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (30 Seconds)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = DARK_NAVY
    bg1.line.color.rgb = DARK_NAVY

    # Top Pill
    pill1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(5.0), Inches(0.42))
    pill1.fill.solid()
    pill1.fill.fore_color.rgb = CARD_NAVY
    pill1.line.color.rgb = GOLD
    p = pill1.text_frame.paragraphs[0]
    p.text = "CAPSTONE DEFENSE PRESENTATION | 5 MINUTES"
    p.alignment = PP_ALIGN.CENTER
    for r in p.runs:
        r.font.name = "Segoe UI"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = GOLD

    # Main Title Box
    title_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(3.2))
    tf1 = title_box.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    add_para(tf1, "Travellers Inn Sense", size=44, bold=True, color=WHITE, space_after=12, font_name="Georgia", is_first=True)
    add_para(tf1, "An AI-Powered Hotel Management and Reservation System with NLP Sentiment Analysis and Algorithmic Dynamic Pricing", size=18, bold=False, color=RGBColor(226, 232, 240), space_after=16, font_name="Segoe UI")

    # 3 Badges at bottom
    badges = [
        ("CORE AI MODULE 1", "NLP Sentiment Analysis", "TextBlob polarity scoring & automatic theme extraction from customer reviews."),
        ("CORE AI MODULE 2", "Algorithmic Dynamic Pricing", "30-day occupancy & demand model with 1-click live room price synchronization."),
        ("RESERVATION & OPS", "Secure Online Booking", "Mandatory login gate, automated date validation, and interactive audit reports."),
    ]
    b_lefts = [0.8, 4.8, 8.8]
    for i, (b_tag, b_head, b_desc) in enumerate(badges):
        card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(b_lefts[i]), Inches(5.0), Inches(3.7), Inches(1.7))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_NAVY
        card.line.color.rgb = RGBColor(71, 85, 105)

        tb = s1.shapes.add_textbox(Inches(b_lefts[i] + 0.25), Inches(5.15), Inches(3.2), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        add_para(tf, b_tag, size=10, bold=True, color=GOLD, space_after=2, font_name="Segoe UI", is_first=True)
        add_para(tf, b_head, size=13, bold=True, color=WHITE, space_after=4, font_name="Segoe UI")
        add_para(tf, b_desc, size=10.5, bold=False, color=RGBColor(203, 213, 225), space_after=0, font_name="Segoe UI")

    # =========================================================================
    # SLIDE 2: INTRODUCTION & PROBLEM STATEMENT (60 Seconds)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg2.fill.solid()
    bg2.fill.fore_color.rgb = LIGHT_BG
    bg2.line.color.rgb = LIGHT_BG

    add_header(s2, "01. Introduction", "Background & The Critical Problems in Boutique Hospitality")

    cards_s2 = [
        ("STATIC PRICING DILEMMA", 
         "Lost Revenue & Inflexible Rates", 
         [
             "Boutique hotels rely on static room rates throughout the year.",
             "High Demand Surges: The hotel misses out on optimized revenue due to fixed prices.",
             "Low Demand Periods: Rooms sit vacant because prices do not automatically adjust down.",
             "Manual Guesswork: Hotel owners lack dynamic demand calculation tools.",
         ],
         ACCENT_RED),

        ("UNSTRUCTURED GUEST FEEDBACK", 
         "Feedback Overload & Slow Response", 
         [
             "Customer reviews are read manually or left unanalyzed across channels.",
             "Delayed Action: Recurring complaints (AC, cleanliness, staff) are identified too late.",
             "No Sentiment Scoring: Management has no automated polarity or priority metrics.",
             "Raw comments fail to translate into actionable operational improvements.",
         ],
         ACCENT_AMBER),

        ("RESERVATION & OPS FRICTION", 
         "Unverified & Conflicted Bookings", 
         [
             "Unauthenticated visitors cause fake, duplicate, or ghost reservations.",
             "Date Conflict Risks: Lack of strict calendar validation allows invalid check-out dates.",
             "Manual Reporting: Gathering audit and revenue statistics is tedious and error-prone.",
             "No real-time room availability status filters for prospective guests.",
         ],
         ACCENT_BLUE),
    ]

    lefts = [0.8, 4.8, 8.8]
    for i, (tag, head, points, accent) in enumerate(cards_s2):
        # Card background shape
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(lefts[i]), Inches(1.8), Inches(3.7), Inches(5.1))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        # Colored header accent strip
        strip = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(lefts[i]), Inches(1.8), Inches(3.7), Inches(0.12))
        strip.fill.solid()
        strip.fill.fore_color.rgb = accent
        strip.line.color.rgb = accent

        # Dedicated Textbox on top of card with explicit dark text
        tb = s2.shapes.add_textbox(Inches(lefts[i] + 0.25), Inches(2.1), Inches(3.2), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        add_para(tf, tag, size=10, bold=True, color=accent, space_after=3, font_name="Segoe UI", is_first=True)
        add_para(tf, head, size=14, bold=True, color=TEXT_MAIN, space_after=12, font_name="Georgia")

        for pt in points:
            add_para(tf, f"- {pt}", size=10.5, bold=False, color=TEXT_BODY, space_after=6, font_name="Segoe UI")

    # =========================================================================
    # SLIDE 3: OBJECTIVES (45 Seconds)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg3.fill.solid()
    bg3.fill.fore_color.rgb = LIGHT_BG
    bg3.line.color.rgb = LIGHT_BG

    add_header(s3, "02. Objectives", "Project Goal & Specific Engineering Objectives")

    # Left Hero Card: General Objective
    gen_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(4.6), Inches(5.1))
    gen_card.fill.solid()
    gen_card.fill.fore_color.rgb = DARK_NAVY
    gen_card.line.color.rgb = DARK_NAVY

    tb_gen = s3.shapes.add_textbox(Inches(1.15), Inches(2.15), Inches(3.9), Inches(4.4))
    tf_gen = tb_gen.text_frame
    tf_gen.word_wrap = True
    tf_gen.margin_left = tf_gen.margin_top = tf_gen.margin_right = tf_gen.margin_bottom = 0

    add_para(tf_gen, "GENERAL OBJECTIVE", size=11, bold=True, color=GOLD, space_after=10, font_name="Segoe UI", is_first=True)
    add_para(tf_gen, "To design and develop an intelligent, automated Hotel Management and Reservation System for Travellers Inn that integrates NLP-based Sentiment Analysis and Algorithmic Dynamic Pricing decision support.", size=16, bold=True, color=WHITE, space_after=18, font_name="Georgia")
    add_para(tf_gen, "Core Target:\nEmpower hotel management with data-driven decision tools to maximize room revenue and maintain guest satisfaction, while giving customers a secure, conflict-free online reservation experience.", size=11.5, bold=False, color=RGBColor(203, 213, 225), space_after=0, font_name="Segoe UI")

    # Right: 4 Specific Objectives
    spec_items = [
        ("1. Automated Secure Booking Engine", 
         "Enforces customer authentication before reservation, prevents overlapping bookings, validates check-in/out date logic, and provides real-time room availability status filters."),
        
        ("2. NLP Sentiment Analysis & Theme Extraction", 
         "Integrates TextBlob Natural Language Processing to classify customer feedback into Positive, Neutral, and Negative sentiments, extracting actionable service themes."),
        
        ("3. Algorithmic Dynamic Pricing Decision Support", 
         "Formulates a dynamic pricing algorithm based on 30-day occupancy and demand metrics, featuring 1-click live price synchronization across all room listings."),
        
        ("4. Centralized Admin Management & Reports", 
         "Develops interactive administrative dashboards with filterable room maintenance status toggles and exportable revenue, booking, and guest feedback reports."),
    ]

    top_y = 1.8
    for i, (s_title, s_desc) in enumerate(spec_items):
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.7), Inches(top_y), Inches(6.8), Inches(1.18))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        # Left gold accent bar
        bar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.7), Inches(top_y), Inches(0.12), Inches(1.18))
        bar.fill.solid()
        bar.fill.fore_color.rgb = GOLD
        bar.line.color.rgb = GOLD

        tb = s3.shapes.add_textbox(Inches(6.0), Inches(top_y + 0.12), Inches(6.3), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        add_para(tf, s_title, size=12.5, bold=True, color=TEXT_MAIN, space_after=3, font_name="Segoe UI", is_first=True)
        add_para(tf, s_desc, size=10, bold=False, color=TEXT_BODY, space_after=0, font_name="Segoe UI")

        top_y += 1.30

    # =========================================================================
    # SLIDE 4: METHODOLOGY & ARCHITECTURE (60 Seconds)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg4.fill.solid()
    bg4.fill.fore_color.rgb = LIGHT_BG
    bg4.line.color.rgb = LIGHT_BG

    add_header(s4, "03. Methodology & Architecture", "Iterative Development & Technical Architecture")

    # Left: Methodology Card
    m_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.1))
    m_card.fill.solid()
    m_card.fill.fore_color.rgb = CARD_BG
    m_card.line.color.rgb = BORDER_COLOR
    m_card.line.width = Pt(1.5)

    strip_m = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(0.12))
    strip_m.fill.solid()
    strip_m.fill.fore_color.rgb = GOLD
    strip_m.line.color.rgb = GOLD

    tb_m = s4.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.6))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = tf_m.margin_top = tf_m.margin_right = tf_m.margin_bottom = 0

    add_para(tf_m, "DEVELOPMENT METHODOLOGY", size=10.5, bold=True, color=GOLD, space_after=4, font_name="Segoe UI", is_first=True)
    add_para(tf_m, "Iterative & Agile Software Engineering Model", size=15, bold=True, color=TEXT_MAIN, space_after=12, font_name="Georgia")

    m_steps = [
        ("Phase 1: Requirements Gathering", "Analyzed Travellers Inn manual reservation records, pricing policies, and customer review workflows."),
        ("Phase 2: Architectural Design", "Structured normalized relational PostgreSQL schemas and RESTful API contracts with Pydantic validation."),
        ("Phase 3: Iterative Sprints", "Developed React client interfaces, FastAPI backend endpoints, and integrated the TextBlob NLP & pricing algorithms."),
        ("Phase 4: Verification & Refinement", "End-to-end verification of date validation logic, mandatory auth gating, and automatic live price synchronization."),
    ]
    for s_head, s_body in m_steps:
        add_para(tf_m, f"- {s_head}", size=11, bold=True, color=TEXT_MAIN, space_after=2, font_name="Segoe UI")
        add_para(tf_m, f"   {s_body}", size=9.5, bold=False, color=TEXT_BODY, space_after=6, font_name="Segoe UI")

    # Right: System Architecture Card
    t_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1))
    t_card.fill.solid()
    t_card.fill.fore_color.rgb = CARD_BG
    t_card.line.color.rgb = BORDER_COLOR
    t_card.line.width = Pt(1.5)

    strip_t = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(0.12))
    strip_t.fill.solid()
    strip_t.fill.fore_color.rgb = ACCENT_BLUE
    strip_t.line.color.rgb = ACCENT_BLUE

    tb_t = s4.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.1), Inches(4.6))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0

    add_para(tf_t, "SYSTEM ARCHITECTURE & TECH STACK", size=10.5, bold=True, color=ACCENT_BLUE, space_after=4, font_name="Segoe UI", is_first=True)
    add_para(tf_t, "3-Tier Enterprise Web Application", size=15, bold=True, color=TEXT_MAIN, space_after=12, font_name="Georgia")

    t_layers = [
        ("Presentation Layer", "React 18 + Vite + Tailwind CSS", "High-performance SPA with client-side routing, interactive modals, and responsive layout."),
        ("Application Layer", "FastAPI (Python) + Uvicorn", "Asynchronous RESTful APIs with JWT authentication, dependency injection, and Pydantic schemas."),
        ("AI & Algorithm Layer", "TextBlob NLP & Dynamic Pricing Model", "Real-time polarity/subjectivity scoring and 30-day occupancy/demand recommendation formula."),
        ("Data Layer", "PostgreSQL + SQLAlchemy ORM", "ACID-compliant storage for users, rooms, bookings, reviews, and dynamic pricing recommendations."),
    ]
    for l_name, l_tech, l_desc in t_layers:
        add_para(tf_t, f"[{l_name}] {l_tech}", size=11, bold=True, color=ACCENT_BLUE, space_after=2, font_name="Segoe UI")
        add_para(tf_t, f"   {l_desc}", size=9.5, bold=False, color=TEXT_BODY, space_after=6, font_name="Segoe UI")

    # =========================================================================
    # SLIDE 5: GUI – CUSTOMER PORTAL & SMART RESERVATION (45 Seconds)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg5.fill.solid()
    bg5.fill.fore_color.rgb = LIGHT_BG
    bg5.line.color.rgb = LIGHT_BG

    add_header(s5, "04. Graphical User Interface", "Customer Portal & Frictionless Booking Workflow")

    # Screenshot on the left
    if os.path.exists(img_cust_dash):
        pic = s5.shapes.add_picture(img_cust_dash, Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.9))
        border_box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.9))
        border_box.fill.background()
        border_box.line.color.rgb = BORDER_COLOR
        border_box.line.width = Pt(1.5)

    # Right Card: GUI Feature Highlights
    r_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.6), Inches(1.8), Inches(4.9), Inches(4.9))
    r_card.fill.solid()
    r_card.fill.fore_color.rgb = CARD_BG
    r_card.line.color.rgb = BORDER_COLOR
    r_card.line.width = Pt(1.5)

    tb_r = s5.shapes.add_textbox(Inches(7.9), Inches(2.05), Inches(4.3), Inches(4.4))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0

    add_para(tf_r, "KEY CUSTOMER CAPABILITIES", size=10.5, bold=True, color=GOLD, space_after=8, font_name="Segoe UI", is_first=True)

    c_feats = [
        ("Mandatory Auth Gate Before Booking", 
         "Unregistered visitors can browse rooms, but clicking 'Book Now' triggers an 'Account Required' modal requiring registration or login, preventing ghost bookings."),
        
        ("Automated Date & Capacity Validation", 
         "Enforces check-out date > check-in date with automatic calendar minimum adjustments (minimum 1 night stay) and live room price calculation."),
        
        ("Personalized Customer Portal", 
         "Dedicated dashboard displaying live room availability, confirmed booking statuses, upcoming stays, and direct 5-star review submission."),
    ]
    for c_title, c_desc in c_feats:
        add_para(tf_r, f"✓ {c_title}", size=12, bold=True, color=TEXT_MAIN, space_after=2, font_name="Segoe UI")
        add_para(tf_r, c_desc, size=10, bold=False, color=TEXT_BODY, space_after=12, font_name="Segoe UI")

    # =========================================================================
    # SLIDE 6: GUI – ADMIN AI & DYNAMIC PRICING (45 Seconds)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg6.fill.solid()
    bg6.fill.fore_color.rgb = LIGHT_BG
    bg6.line.color.rgb = LIGHT_BG

    add_header(s6, "05. Administrative & AI Modules", "Algorithmic Dynamic Pricing & NLP Sentiment Analytics")

    # Screenshot on the left
    if os.path.exists(img_pricing):
        pic = s6.shapes.add_picture(img_pricing, Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.9))
        border_box = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.9))
        border_box.fill.background()
        border_box.line.color.rgb = BORDER_COLOR
        border_box.line.width = Pt(1.5)

    # Right Card: Admin AI Capabilities
    a_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.6), Inches(1.8), Inches(4.9), Inches(4.9))
    a_card.fill.solid()
    a_card.fill.fore_color.rgb = CARD_BG
    a_card.line.color.rgb = BORDER_COLOR
    a_card.line.width = Pt(1.5)

    tb_a = s6.shapes.add_textbox(Inches(7.9), Inches(2.05), Inches(4.3), Inches(4.4))
    tf_a = tb_a.text_frame
    tf_a.word_wrap = True
    tf_a.margin_left = tf_a.margin_top = tf_a.margin_right = tf_a.margin_bottom = 0

    add_para(tf_a, "CORE ADMINISTRATIVE AI CAPABILITIES", size=10.5, bold=True, color=ACCENT_GREEN, space_after=8, font_name="Segoe UI", is_first=True)

    a_feats = [
        ("1-Click Algorithmic Price Synchronization", 
         "The dynamic pricing engine evaluates 30-day occupancy and market demand. Clicking 'Approve' immediately updates the live room price in PostgreSQL and syncs across all customer booking channels."),
        
        ("NLP Sentiment Analysis & Thematic Insights", 
         "TextBlob calculates Polarity (-1.0 to +1.0) and Subjectivity scores, classifying reviews into Positive, Neutral, or Negative, and categorizing feedback into themes (Cleanliness, Amenities, Staff)."),
        
        ("Interactive Management & Audit Reports", 
         "Real-time room availability toggles (Available/Maintenance), local device image uploads with HTML5 canvas compression, and CSV/print exportable reports."),
    ]
    for a_title, a_desc in a_feats:
        add_para(tf_a, f"★ {a_title}", size=12, bold=True, color=TEXT_MAIN, space_after=2, font_name="Segoe UI")
        add_para(tf_a, a_desc, size=10, bold=False, color=TEXT_BODY, space_after=12, font_name="Segoe UI")

    # =========================================================================
    # SLIDE 7: CONCLUSION & DEMO TRANSITION (15 Seconds)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    bg7 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg7.fill.solid()
    bg7.fill.fore_color.rgb = DARK_NAVY
    bg7.line.color.rgb = DARK_NAVY

    add_header(s7, "06. Conclusion", "Project Summary & Ready for Live Demonstration", dark=True)

    c_cards = [
        ("EFFORTLESS RESERVATION", 
         "100% Conflict-Free Booking", 
         "Guaranteed customer authentication, strict check-in/out date validations, and live room availability status filters."),
        
        ("ACTIONABLE NLP INSIGHTS", 
         "Automated Sentiment Triage", 
         "TextBlob natural language processing translates unstructured feedback into prioritized operational improvements."),
        
        ("REVENUE OPTIMIZATION", 
         "Dynamic Price Synchronization", 
         "Demand-driven price recommendations with instant live updates to capture peak revenue and minimize room vacancy."),
    ]
    c_lefts = [0.8, 4.8, 8.8]
    for i, (tag, head, body) in enumerate(c_cards):
        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(c_lefts[i]), Inches(1.8), Inches(3.7), Inches(3.9))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_NAVY
        card.line.color.rgb = RGBColor(71, 85, 105)

        tb = s7.shapes.add_textbox(Inches(c_lefts[i] + 0.25), Inches(2.05), Inches(3.2), Inches(3.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        add_para(tf, tag, size=10, bold=True, color=GOLD, space_after=6, font_name="Segoe UI", is_first=True)
        add_para(tf, head, size=15, bold=True, color=WHITE, space_after=12, font_name="Georgia")
        add_para(tf, body, size=11, bold=False, color=RGBColor(203, 213, 225), space_after=0, font_name="Segoe UI")

    # Bottom Banner
    banner = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.85))
    banner.fill.solid()
    banner.fill.fore_color.rgb = GOLD_BANNER
    banner.line.color.rgb = GOLD_BANNER

    tb_b = s7.shapes.add_textbox(Inches(1.0), Inches(6.15), Inches(11.333), Inches(0.55))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p = add_para(tf_b, "Thank you very much! We are now ready for the LIVE SYSTEM DEMONSTRATION & Q&A.", size=13.5, bold=True, color=DARK_NAVY, space_after=0, font_name="Segoe UI", is_first=True)
    p.alignment = PP_ALIGN.CENTER

    output_path = r"c:\Users\Temp\Desktop\New folder\travellers-inn-sense\Travellers_Inn_Sense_5Min_Presentation.pptx"
    desktop_path = r"c:\Users\Temp\Desktop\Travellers_Inn_Sense_5Min_Presentation.pptx"
    
    prs.save(output_path)
    prs.save(desktop_path)
    print("Clean, fixed presentation successfully saved!")

if __name__ == "__main__":
    create_fixed_presentation()
