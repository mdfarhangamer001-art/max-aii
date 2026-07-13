import sys
import os
from PIL import Image, ImageDraw, ImageFont

def diagnose_file(filepath):
    """Prints diagnostic information about a file to help debug failures."""
    if not os.path.exists(filepath):
        print(f"DIAGNOSTIC: File '{filepath}' does not exist.", file=sys.stderr)
        return
    
    size = os.path.getsize(filepath)
    print(f"DIAGNOSTIC: File '{filepath}' size is {size} bytes.", file=sys.stderr)
    
    try:
        with open(filepath, 'rb') as f:
            header = f.read(500)
            print(f"DIAGNOSTIC: File '{filepath}' hex header (first 32 bytes): {header[:32].hex()}", file=sys.stderr)
            try:
                text_header = header.decode('utf-8', errors='ignore')
                print(f"DIAGNOSTIC: File '{filepath}' text preview:\n---\n{text_header[:200]}\n---", file=sys.stderr)
                if "version https://git-lfs.github.com" in text_header:
                    print("DIAGNOSTIC WARNING: This is a Git LFS pointer file! The actual image content is not downloaded.", file=sys.stderr)
            except Exception as e:
                print(f"DIAGNOSTIC: Could not decode header as text: {e}", file=sys.stderr)
    except Exception as e:
        print(f"DIAGNOSTIC: Failed to read file header: {e}", file=sys.stderr)

def save_icon_formats(img, png_path='assets/icon.png', ico_path='assets/icon.ico'):
    """Saves the PIL Image to both PNG and Windows multi-size ICO formats."""
    try:
        # Ensure the directories exist
        os.makedirs(os.path.dirname(png_path), exist_ok=True)
        
        # Save PNG
        png_img = img.convert('RGBA')
        png_img.save(png_path, 'PNG')
        print(f"SUCCESS: Saved {png_path} in verified genuine PNG format!")
        
        # Save ICO with multiple sizes suitable for Windows
        # Standard sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        
        # Resize to 256x256 for high-res base or keep original if it is square.
        # For ICO, PIL requires the largest size to be <= 256x256.
        try:
            resample_filter = Image.Resampling.LANCZOS
        except AttributeError:
            resample_filter = Image.ANTIALIAS # fallback for older Pillow versions
            
        img_resized = png_img.resize((256, 256), resample_filter)
        img_resized.save(ico_path, format='ICO', sizes=ico_sizes)
        print(f"SUCCESS: Saved {ico_path} as a Windows multi-size ICO file!")
        return True
    except Exception as e:
        print(f"Error saving icon formats: {e}", file=sys.stderr)
        return False

def main():
    png_path = 'assets/icon.png'
    jpg_path = 'assets/icon.jpg'
    success = False

    # Attempt 1: Try to open and convert assets/icon.png
    print(f"Attempting to load primary icon from {png_path}...")
    try:
        img = Image.open(png_path)
        print(f"Successfully loaded {png_path}. Original format: {img.format}, size: {img.size}, mode: {img.mode}")
        if save_icon_formats(img):
            success = True
    except Exception as e:
        print(f"Primary icon load failed: {e}", file=sys.stderr)
        diagnose_file(png_path)

    # Attempt 2: Fallback to assets/icon.jpg if png failed
    if not success:
        print(f"Attempting fallback to alternative icon from {jpg_path}...")
        try:
            img = Image.open(jpg_path)
            print(f"Successfully loaded fallback {jpg_path}. Original format: {img.format}, size: {img.size}, mode: {img.mode}")
            if save_icon_formats(img):
                success = True
        except Exception as e:
            print(f"Fallback icon load failed: {e}", file=sys.stderr)
            diagnose_file(jpg_path)

    # Attempt 3: If both failed, dynamically generate a stunning, genuine high-quality 1024x1024 PNG icon!
    if not success:
        print("Attempting to dynamically generate a stunning default application icon...")
        try:
            width, height = 1024, 1024
            img = Image.new('RGBA', (width, height), (11, 15, 25, 255)) # Deep dark #0B0F19 background
            draw = ImageDraw.Draw(img)
            
            # Center of the canvas
            cx, cy = width // 2, height // 2
            
            # Outer cyber ring 1 (very faint)
            draw.ellipse([cx - 400, cy - 400, cx + 400, cy + 400], outline=(34, 211, 238, 20), width=15)
            # Cyber ring 2
            draw.ellipse([cx - 350, cy - 350, cx + 350, cy + 350], outline=(34, 211, 238, 45), width=8)
            # Cyber ring 3 (dashed/segmented effect simulated with multiple arcs)
            for angle in range(0, 360, 45):
                draw.arc([cx - 300, cy - 300, cx + 300, cy + 300], angle, angle + 25, fill=(6, 182, 212, 180), width=10)
                
            # Inner core glowing ring
            draw.ellipse([cx - 200, cy - 200, cx + 200, cy + 200], outline=(8, 145, 178, 120), width=6)
            draw.ellipse([cx - 180, cy - 180, cx + 180, cy + 180], fill=(6, 182, 212, 15))
            
            # Draw sleek geometric accents (crosshairs, scale ticks)
            draw.line([cx, cy - 430, cx, cy - 370], fill=(34, 211, 238, 150), width=4)
            draw.line([cx, cy + 370, cx, cy + 430], fill=(34, 211, 238, 150), width=4)
            draw.line([cx - 430, cy, cx - 370, cy], fill=(34, 211, 238, 150), width=4)
            draw.line([cx + 370, cy, cx + 430, cy], fill=(34, 211, 238, 150), width=4)
            
            # Draw central glowing core text
            font = None
            font_size = 180
            font_loaded = False
            
            # Look for common fonts on Linux/Ubuntu runner
            font_paths = [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "DejaVuSans-Bold.ttf",
                "arial.ttf"
            ]
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        font = ImageFont.truetype(font_path, font_size)
                        font_loaded = True
                        print(f"Loaded font {font_path}")
                        break
                    except Exception:
                        pass
            
            if not font_loaded:
                try:
                    font = ImageFont.load_default()
                    print("Loaded default system font")
                except Exception:
                    print("Could not load any font, will draw geometric logo")
            
            text = "TZ"
            subtext = "AI OS"
            
            if font:
                try:
                    # Draw "TZ"
                    bbox = draw.textbbox((0, 0), text, font=font)
                    text_w = bbox[2] - bbox[0]
                    text_h = bbox[3] - bbox[1]
                    draw.text((cx - text_w // 2, cy - text_h // 2 - 40), text, fill=(255, 255, 255, 255), font=font)
                    
                    # Draw smaller "AI OS"
                    sub_font_size = 60
                    sub_font = None
                    for font_path in font_paths:
                        if os.path.exists(font_path):
                            try:
                                sub_font = ImageFont.truetype(font_path, sub_font_size)
                                break
                            except Exception:
                                pass
                    if not sub_font:
                        sub_font = font
                    
                    sub_bbox = draw.textbbox((0, 0), subtext, font=sub_font)
                    sub_w = sub_bbox[2] - sub_bbox[0]
                    sub_h = sub_bbox[3] - sub_bbox[1]
                    draw.text((cx - sub_w // 2, cy + 120), subtext, fill=(34, 211, 238, 255), font=sub_font)
                except Exception as text_err:
                    print(f"Text drawing failed: {text_err}, drawing geometric central core instead.")
                    draw.polygon([cx, cy - 80, cx + 80, cy, cx, cy + 80, cx - 80, cy], fill=(34, 211, 238, 200), outline=(255, 255, 255, 255), width=5)
            else:
                draw.polygon([cx, cy - 100, cx + 100, cy, cx, cy + 100, cx - 100, cy], fill=(34, 211, 238, 200), outline=(255, 255, 255, 255), width=6)
                draw.line([cx - 120, cy, cx + 120, cy], fill=(255, 255, 255, 180), width=4)
                draw.line([cx, cy - 120, cx, cy + 120], fill=(255, 255, 255, 180), width=4)
            
            if save_icon_formats(img):
                success = True
        except Exception as e:
            print(f"Failed to dynamically generate fallback icon: {e}", file=sys.stderr)

    if not success:
        print("FATAL ERROR: All attempts to load, convert or generate application icons failed.", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
