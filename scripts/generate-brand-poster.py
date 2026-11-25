"""
Museum-grade Visual Philosophy Poster for Millar ('Measured Warmth')
Crafted following Anthropic's canvas-design skill:
  - 90% calibrated visual geometry, color fields, and spatial composition; 10% sparse clinical typography.
  - Subtle Hahlex DNA (shelter arch + three ascending pillars + calibrated mineral palette).
  - Outputs both crisp vector PDF and high-res 1600x2133 PNG to assets/brand/.
"""
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / ".agents" / "skills" / "canvas-design" / "canvas-fonts"
OUT_DIR = ROOT / "assets" / "brand"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Calibrated Millar Mineral Palette
CREAM = "#FFFCF8"
SAND_SOFT = "#F6EBDE"
BORDER_SAND = "#DFCBB2"
ESPRESSO = "#1A130D"
ESPRESSO_DEEP = "#120C08"
CHARCOAL = "#2B1F16"
DEEP_SAND = "#6B4D35"
BRONZE = "#A56B23"
BRONZE_LIGHT = "#C08A4A"
SOFT_SAND = "#D6B48A"
TAN = "#E4CBAF"
MUTED = "#5F4F40"

FONT_DISPLAY = FONTS_DIR / "Jura-Light.ttf"
FONT_MEDIUM = FONTS_DIR / "WorkSans-Bold.ttf"
FONT_MONO = FONTS_DIR / "JetBrainsMono-Regular.ttf"
FONT_MONO_BOLD = FONTS_DIR / "JetBrainsMono-Bold.ttf"


def build_png():
    W, H = 1600, 2133
    img = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    # Outer archival margin frame
    M = 88
    draw.rectangle([M, M, W - M, H - M], outline=BORDER_SAND, width=2)

    # Subtle top-left & bottom-right archival corner ticks
    tick = 18
    for x, y in [(M, M), (W - M, M), (M, H - M), (W - M, H - M)]:
        draw.line([x - tick, y, x + tick, y], fill=DEEP_SAND, width=2)
        draw.line([x, y - tick, x, y + tick], fill=DEEP_SAND, width=2)

    # Upper mineral field: Warm Espresso drafting sanctuary (asymmetric 58% height)
    stage_top = M + 120
    stage_bottom = 1380
    stage_left = M + 48
    stage_right = W - M - 48
    draw.rectangle([stage_left, stage_top, stage_right, stage_bottom], fill=ESPRESSO)

    # Subtle dot matrix inside upper third of stage (analytical observation layer)
    for gx in range(stage_left + 44, stage_right - 36, 36):
        for gy in range(stage_top + 44, stage_bottom - 44, 36):
            # Keep center sanctuary clear for geometry
            dist = math.hypot(gx - W / 2, gy - 870)
            if dist > 430:
                draw.ellipse([gx - 1, gy - 1, gx + 1, gy + 1], fill="#3A2D22")

    # Concentric shelter arcs (subtle DNA of Hahlex Arch)
    cx = W // 2
    cy = 1090
    radii = [190, 275, 360, 445, 530]
    for idx, r in enumerate(radii):
        bbox = [cx - r, cy - r, cx + r, cy + r]
        col = BRONZE_LIGHT if idx == 2 else ("#543A28" if idx % 2 == 0 else "#3E3128")
        width = 4 if idx == 2 else 2
        if idx in (1, 3):
            # Dashed semicircular arc
            for deg in range(180, 360, 8):
                draw.arc(bbox, start=deg, end=deg + 4, fill=col, width=width)
        else:
            draw.arc(bbox, start=180, end=360, fill=col, width=width)

    # Measuring degree ticks along the canonical radius (r=530)
    outer_r = 530
    for deg in range(180, 361, 10):
        rad = math.radians(deg)
        major = deg % 30 == 0
        r1 = outer_r - (16 if major else 8)
        r2 = outer_r + (22 if major else 10)
        x1, y1 = cx + math.cos(rad) * r1, cy + math.sin(rad) * r1
        x2, y2 = cx + math.cos(rad) * r2, cy + math.sin(rad) * r2
        draw.line([x1, y1, x2, y2], fill=SOFT_SAND if major else "#543A28", width=3 if major else 1)

    # Baseline horizon axis across stage
    draw.line([stage_left + 64, cy, stage_right - 64, cy], fill="#4A3829", width=2)

    # Zenith floating marker dot cleanly crowning above the primary shelter arch (zero tangent collision)
    apex_y = cy - 415
    draw.ellipse([cx - 22, apex_y - 22, cx + 22, apex_y + 22], fill=TAN)
    draw.ellipse([cx - 6, apex_y - 6, cx + 6, apex_y + 6], fill=ESPRESSO)

    # Arc terminal dots
    for dx in (-360, 360):
        draw.ellipse([cx + dx - 14, cy - 14, cx + dx + 14, cy + 14], fill=SOFT_SAND)

    # Three ascending monumental Hahlex pillars with crisp air beneath the arch
    pillars = [
        (-138, 195, 50, "#FAF8F5"),
        (0, 286, 56, SOFT_SAND),
        (138, 195, 50, BRONZE_LIGHT),
    ]
    for dx, ph, pw, col in pillars:
        x0 = cx + dx - pw // 2
        y0 = cy - ph
        draw.rounded_rectangle([x0, y0, x0 + pw, cy + 44], radius=pw // 2, fill=col)

    # Calibrated Albers mineral color swatch strip below stage (5 mineral squares)
    strip_y = stage_bottom + 54
    swatches = [
        ("#FFFCF8", BORDER_SAND, "CREAM 50"),
        ("#F6EBDE", BORDER_SAND, "SAND 200"),
        ("#D6B48A", "#D6B48A", "SOFT SAND"),
        ("#7A4E16", "#7A4E16", "BRONZE 700"),
        ("#4A3022", "#4A3022", "CTA BROWN"),
        ("#1A130D", "#1A130D", "ESPRESSO"),
    ]
    sw_w = (stage_right - stage_left - 5 * 20) // 6
    f_micro = ImageFont.truetype(str(FONT_MONO), 18)
    for i, (fill, out, lbl) in enumerate(swatches):
        sx = stage_left + i * (sw_w + 20)
        draw.rectangle([sx, strip_y, sx + sw_w, strip_y + 72], fill=fill, outline=out, width=2)
        draw.text((sx, strip_y + 84), lbl, fill=MUTED, font=f_micro)

    # Typography: sparse, clinical, monumental
    f_hdr_mono = ImageFont.truetype(str(FONT_MONO), 22)
    f_title = ImageFont.truetype(str(FONT_DISPLAY), 124)
    f_sub = ImageFont.truetype(str(FONT_MONO_BOLD), 24)
    f_foot = ImageFont.truetype(str(FONT_MONO), 20)

    # Top archival header rail (right-aligned flush to stage_right)
    draw.text((stage_left, M + 42), "HAHLEX  /  MILLAR DESIGN SYSTEM", fill=CHARCOAL, font=f_hdr_mono)
    hdr_right = "SPECIMEN PLATE 01  ·  V0.1"
    hdr_w = draw.textlength(hdr_right, font=f_hdr_mono)
    draw.text((stage_right - hdr_w, M + 42), hdr_right, fill=MUTED, font=f_hdr_mono)

    # Monumental philosophy title below mineral strip
    title_y = strip_y + 158
    draw.text((stage_left, title_y), "MEASURED WARMTH", fill=CHARCOAL, font=f_title)
    draw.line([stage_left, title_y + 158, stage_right, title_y + 158], fill=BORDER_SAND, width=2)

    # Clinical bottom metadata ledger (left / center / flush-right axis alignment)
    meta_y = title_y + 190
    draw.text((stage_left, meta_y), "TYPOGRAPHY", fill=DEEP_SAND, font=f_sub)
    draw.text((stage_left, meta_y + 36), "GEIST 300-600  ·  INTER  ·  GEIST MONO", fill=CHARCOAL, font=f_foot)

    col2_x = stage_left + 560
    draw.text((col2_x, meta_y), "OPTICAL STANDARD", fill=DEEP_SAND, font=f_sub)
    draw.text((col2_x, meta_y + 36), "OKLCH  ·  WCAG 2.1 AA  ·  80/80 PASS", fill=CHARCOAL, font=f_foot)

    c3_h = "CANONICAL URI"
    c3_v = "hahlex.com/millar"
    draw.text((stage_right - draw.textlength(c3_h, font=f_sub), meta_y), c3_h, fill=DEEP_SAND, font=f_sub)
    draw.text((stage_right - draw.textlength(c3_v, font=f_foot), meta_y + 36), c3_v, fill=CHARCOAL, font=f_foot)

    png_path = OUT_DIR / "measured-warmth-poster.png"
    img.save(png_path, "PNG", optimize=True)
    return png_path


def build_pdf():
    W, H = 595.28, 841.89  # A4 portrait vector poster
    pdf_path = OUT_DIR / "measured-warmth-poster.pdf"
    c = rl_canvas.Canvas(str(pdf_path), pagesize=(W, H))
    c.setTitle("Millar: Measured Warmth Specimen Plate 01")
    c.setAuthor("Hahlex Design System")

    pdfmetrics.registerFont(TTFont("JuraLight", str(FONT_DISPLAY)))
    pdfmetrics.registerFont(TTFont("JBMono", str(FONT_MONO)))
    pdfmetrics.registerFont(TTFont("JBMonoBold", str(FONT_MONO_BOLD)))

    # Paper ground
    c.setFillColor(HexColor(CREAM))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    M = 34
    c.setStrokeColor(HexColor(BORDER_SAND))
    c.setLineWidth(0.75)
    c.rect(M, M, W - 2 * M, H - 2 * M, stroke=1, fill=0)

    # Top bar
    c.setFont("JBMono", 8)
    c.setFillColor(HexColor(CHARCOAL))
    c.drawString(M + 18, H - M - 24, "HAHLEX  /  MILLAR DESIGN SYSTEM")
    c.setFillColor(HexColor(MUTED))
    c.drawRightString(W - M - 18, H - M - 24, "SPECIMEN PLATE 01  ·  V0.1")

    # Espresso stage
    sl, sr = M + 18, W - M - 18
    st, sb = H - M - 46, 305
    c.setFillColor(HexColor(ESPRESSO))
    c.rect(sl, sb, sr - sl, st - sb, stroke=0, fill=1)

    # Concentric shelter arcs (vector crisp)
    cx, cy = W / 2, 415
    for idx, r in enumerate([72, 104, 136, 168, 200]):
        c.setStrokeColor(HexColor(BRONZE_LIGHT if idx == 2 else "#4D392B"))
        c.setLineWidth(1.5 if idx == 2 else 0.75)
        c.setDash([3, 4] if idx in (1, 3) else [])
        c.arc(cx - r, cy - r, cx + r, cy + r, 0, 180)
    c.setDash([])

    # Baseline + floating apex + terminal dots (matching PNG 2nd-pass polish)
    c.setStrokeColor(HexColor("#4A3829"))
    c.setLineWidth(0.75)
    c.line(sl + 24, cy, sr - 24, cy)
    c.setFillColor(HexColor(TAN))
    c.circle(cx, cy + 158, 8, stroke=0, fill=1)
    c.setFillColor(HexColor(ESPRESSO))
    c.circle(cx, cy + 158, 2.5, stroke=0, fill=1)
    c.setFillColor(HexColor(SOFT_SAND))
    c.circle(cx - 136, cy, 5, stroke=0, fill=1)
    c.circle(cx + 136, cy, 5, stroke=0, fill=1)

    # Three ascending pillars with crisp air beneath arch
    for dx, ph, pw, col in [(-52, 74, 19, "#FAF8F5"), (0, 110, 21, SOFT_SAND), (52, 74, 19, BRONZE_LIGHT)]:
        c.setFillColor(HexColor(col))
        c.roundRect(cx + dx - pw / 2, cy - 16, pw, ph + 16, pw / 2, stroke=0, fill=1)

    # Mineral strip
    swatches = [
        ("#FFFCF8", BORDER_SAND, "CREAM 50"),
        ("#F6EBDE", BORDER_SAND, "SAND 200"),
        ("#D6B48A", "#D6B48A", "SOFT SAND"),
        ("#7A4E16", "#7A4E16", "BRONZE 700"),
        ("#4A3022", "#4A3022", "CTA BROWN"),
        ("#1A130D", "#1A130D", "ESPRESSO"),
    ]
    sw_w = (sr - sl - 5 * 8) / 6
    strip_y = 250
    for i, (fill, out, lbl) in enumerate(swatches):
        sx = sl + i * (sw_w + 8)
        c.setFillColor(HexColor(fill))
        c.setStrokeColor(HexColor(out))
        c.setLineWidth(0.75)
        c.rect(sx, strip_y, sw_w, 28, stroke=1, fill=1)
        c.setFont("JBMono", 6.5)
        c.setFillColor(HexColor(MUTED))
        c.drawString(sx, strip_y - 11, lbl)

    # Monumental title
    c.setFont("JuraLight", 44)
    c.setFillColor(HexColor(CHARCOAL))
    c.drawString(sl, 175, "MEASURED WARMTH")
    c.setStrokeColor(HexColor(BORDER_SAND))
    c.setLineWidth(0.75)
    c.line(sl, 155, sr, 155)

    # Bottom ledger
    c.setFont("JBMonoBold", 7.5)
    c.setFillColor(HexColor(DEEP_SAND))
    c.drawString(sl, 130, "TYPOGRAPHY")
    c.drawString(sl + 205, 130, "OPTICAL STANDARD")
    c.drawRightString(sr, 130, "CANONICAL URI")

    c.setFont("JBMono", 7.5)
    c.setFillColor(HexColor(CHARCOAL))
    c.drawString(sl, 114, "GEIST 300-600 · INTER · GEIST MONO")
    c.drawString(sl + 205, 114, "OKLCH · WCAG 2.1 AA · 80/80 PASS")
    c.drawRightString(sr, 114, "hahlex.com/millar")

    c.showPage()
    c.save()
    return pdf_path


if __name__ == "__main__":
    p_png = build_png()
    p_pdf = build_pdf()
    print(f"Generated: {p_png} and {p_pdf}")
