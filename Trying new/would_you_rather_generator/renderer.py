import os
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont

def text_wrap(text, font, max_width, draw):
    """Wraps text to fit within a maximum pixel width."""
    words = text.split(' ')
    lines = []
    current_line = []
    
    for word in words:
        # Check size of line with the new word
        test_line = ' '.join(current_line + [word])
        # Get bounding box of test line
        bbox = draw.textbbox((0, 0), test_line, font=font)
        width = bbox[2] - bbox[0]
        
        if width <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                # Word itself is wider than max_width, force it on a line
                lines.append(word)
                current_line = []
                
    if current_line:
        lines.append(' '.join(current_line))
        
    return lines

def get_text_size(text, font, draw):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def draw_card(draw, x_start, y_start, width, height, text, font_title, font_body, font_pct, 
              title_text, card_bg, border_color, text_color, border_width=6, 
              reveal=False, percentage=0, accent_color=None):
    """Draws a themed choice card with optional progress bar and percentage."""
    x_end = x_start + width
    y_end = y_start + height
    
    # Card Background
    draw.rounded_rectangle(
        [x_start, y_start, x_end, y_end], 
        radius=30, 
        fill=card_bg, 
        outline=border_color, 
        width=border_width
    )
    
    # Title (Option A / Option B)
    t_w, t_h = get_text_size(title_text, font_title, draw)
    draw.text((x_start + (width - t_w)//2, y_start + 40), title_text, font=font_title, fill=border_color)
    
    # Body Text (Wrapped)
    # Available width for text is card width - padding
    max_text_width = width - 120
    lines = text_wrap(text, font_body, max_text_width, draw)
    
    # Calculate total height of the body text block to center it vertically
    line_heights = []
    total_text_height = 0
    for line in lines:
        _, h = get_text_size(line, font_body, draw)
        line_heights.append(h)
    
    spacing = 15
    total_text_height = sum(line_heights) + spacing * (len(lines) - 1)
    
    # Vertical offset to center body text inside card (leaving room for title and pct)
    # Card middle is y_start + height // 2
    # Adjust for title at top (offset +60px) and potential percent at bottom (offset -80px if reveal)
    v_center = y_start + (height // 2)
    if reveal:
        v_center -= 30  # shift text up slightly to fit percentage & progress bar
    
    current_y = v_center - (total_text_height // 2)
    for idx, line in enumerate(lines):
        w, h = get_text_size(line, font_body, draw)
        draw.text((x_start + (width - w)//2, current_y), line, font=font_body, fill=text_color)
        current_y += h + spacing
        
    # Reveal Screen elements: Percentage & Progress Bar
    if reveal:
        # Pct Text
        pct_text = f"{percentage}%"
        p_w, p_h = get_text_size(pct_text, font_pct, draw)
        draw.text((x_start + (width - p_w)//2, y_end - 160), pct_text, font=font_pct, fill=border_color)
        
        # Progress Bar Background
        pb_width = width - 200
        pb_height = 20
        pb_x = x_start + 100
        pb_y = y_end - 70
        
        draw.rounded_rectangle(
            [pb_x, pb_y, pb_x + pb_width, pb_y + pb_height],
            radius=10,
            fill="#2A2A4A"
        )
        
        # Filled Progress Bar
        fill_width = int(pb_width * (percentage / 100.0))
        if fill_width > 10:  # Only draw if there's filling
            draw.rounded_rectangle(
                [pb_x, pb_y, pb_x + fill_width, pb_y + pb_height],
                radius=10,
                fill=accent_color if accent_color else border_color
            )

def create_base_images(q_data, font_path, temp_dir="temp"):
    """Generates the question and reveal frame images for a given question dict."""
    os.makedirs(temp_dir, exist_ok=True)
    
    # Screen Settings
    w, h = 1080, 1920
    
    # Fonts
    font_title = ImageFont.truetype(font_path, 40)
    font_body = ImageFont.truetype(font_path, 48)
    font_pct = ImageFont.truetype(font_path, 72)
    font_header = ImageFont.truetype(font_path, 64)
    
    q_id = q_data["id"]
    paths = {}
    
    for reveal in [False, True]:
        img = Image.new("RGB", (w, h), "#0E0B16") # Deep dark space background
        draw = ImageDraw.Draw(img)
        
        # Draw top banner "WOULD YOU RATHER?"
        header_text = "WOULD YOU RATHER?"
        hw, hh = get_text_size(header_text, font_header, draw)
        # Gradient text effect (or simple stylish color)
        draw.text(((w - hw)//2, 80), header_text, font=font_header, fill="#FFFFFF")
        
        # Draw Card A (Top)
        # Position: X=90, Y=180, Width=900, Height=680
        draw_card(
            draw=draw,
            x_start=90,
            y_start=200,
            width=900,
            height=650,
            text=q_data["option_a"],
            font_title=font_title,
            font_body=font_body,
            font_pct=font_pct,
            title_text="OPTION A",
            card_bg="#131124",
            border_color="#00F0FF", # Neon Cyan
            text_color="#FFFFFF",
            border_width=6,
            reveal=reveal,
            percentage=q_data["percentage_a"],
            accent_color="#00FFFF"
        )
        
        # Draw Card B (Bottom)
        # Position: X=90, Y=1090, Width=900, Height=680
        draw_card(
            draw=draw,
            x_start=90,
            y_start=1070,
            width=900,
            height=650,
            text=q_data["option_b"],
            font_title=font_title,
            font_body=font_body,
            font_pct=font_pct,
            title_text="OPTION B",
            card_bg="#1C1021",
            border_color="#FF007F", # Neon Pink/Magenta
            text_color="#FFFFFF",
            border_width=6,
            reveal=reveal,
            percentage=q_data["percentage_b"],
            accent_color="#FF007F"
        )
        
        # Save Frame
        suffix = "reveal" if reveal else "question"
        out_path = os.path.join(temp_dir, f"q_{q_id}_{suffix}.png")
        img.save(out_path)
        print(f"Saved {out_path}")
        paths[suffix] = out_path
    return paths

def generate_countdown_badges(font_path, temp_dir="temp"):
    """Generates the circular center badges (OR, 5, 4, 3, 2, 1) to overlay on the screen."""
    os.makedirs(temp_dir, exist_ok=True)
    
    # Badge size
    size = 220
    center = size // 2
    radius = 90
    
    # Define circles to draw
    badges = {
        "or": {"text": "OR", "color": "#E50914", "font_size": 52},
        "5": {"text": "5", "color": "#00F0FF", "font_size": 72},
        "4": {"text": "4", "color": "#00F0FF", "font_size": 72},
        "3": {"text": "3", "color": "#00F0FF", "font_size": 72},
        "2": {"text": "2", "color": "#00F0FF", "font_size": 72},
        "1": {"text": "1", "color": "#00F0FF", "font_size": 72},
        "check": {"text": "✔", "color": "#39FF14", "font_size": 72} # Neon Green
    }
    
    paths = {}
    for name, data in badges.items():
        # Transparent background for composite overlays in MoviePy
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw Circle Background
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill="#1E1E2E",
            outline=data["color"],
            width=8
        )
        
        # Text
        font = ImageFont.truetype(font_path, data["font_size"])
        w, h = get_text_size(data["text"], font, draw)
        # Fine-tune vertical offset for centering letters vs numbers vs symbols
        y_offset = 2
        if data["text"] == "✔":
            y_offset = -5
        draw.text((center - w//2, center - h//2 - y_offset), data["text"], font=font, fill="#FFFFFF")
        
        out_path = os.path.join(temp_dir, f"badge_{name}.png")
        img.save(out_path)
        print(f"Saved {out_path}")
        paths[name] = out_path
    return paths

if __name__ == "__main__":
    # Test script run
    import assets_manager
    assets = assets_manager.setup_assets()
    
    test_q = {
        "id": 1,
        "question": "Would you rather...",
        "option_a": "Have unlimited free flights for life",
        "option_b": "Never have to wait in line again",
        "percentage_a": 54,
        "percentage_b": 46
    }
    create_base_images(test_q, assets["font"])
    generate_countdown_badges(assets["font"])
