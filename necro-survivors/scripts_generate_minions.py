import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = 'public/assets/summons'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_skull_base(d, cx, cy, eye_color=(0, 255, 170), eye_style='both', aura_color=(0, 240, 255)):
    # 1. Floating ghost tail aura underneath
    for i, (w, h, off_y, a) in enumerate([(32, 28, 38, 40), (24, 24, 46, 80), (14, 18, 54, 140), (6, 10, 60, 220)]):
        d.ellipse([cx - w//2, cy + off_y - h//2, cx + w//2, cy + off_y + h//2], fill=(*aura_color, a))
    
    # Ghostly wisp tail line
    d.polygon([(cx - 10, cy + 34), (cx + 10, cy + 34), (cx + 4, cy + 56), (cx - 2, cy + 64), (cx - 8, cy + 48)], fill=(*aura_color, 180))

    # 2. Skull dome
    d.ellipse([cx - 30, cy - 24, cx + 30, cy + 24], fill=(30, 24, 20, 255))
    d.ellipse([cx - 27, cy - 21, cx + 27, cy + 21], fill=(245, 238, 225, 255))
    d.arc([cx - 27, cy - 21, cx + 27, cy + 21], 30, 150, fill=(210, 195, 175, 255), width=4)

    # 3. Jaw / cheekbones
    d.rectangle([cx - 18, cy + 12, cx + 18, cy + 30], fill=(30, 24, 20, 255))
    d.rectangle([cx - 15, cy + 14, cx + 15, cy + 28], fill=(240, 230, 215, 255))
    
    # Teeth slits
    for tx in [cx - 10, cx - 5, cx, cx + 5, cx + 10]:
        d.line([(tx, cy + 18), (tx, cy + 28)], fill=(35, 28, 24, 255), width=2)
    d.line([(cx - 14, cy + 23), (cx + 14, cy + 23)], fill=(35, 28, 24, 255), width=2)

    # 4. Nose cavity
    d.polygon([(cx, cy + 6), (cx - 4, cy + 13), (cx + 4, cy + 13)], fill=(35, 28, 24, 255))

    # 5. Eye sockets
    if eye_style == 'both':
        # Left eye
        d.ellipse([cx - 22, cy - 6, cx - 6, cy + 10], fill=(30, 22, 18, 255))
        d.ellipse([cx - 19, cy - 3, cx - 9, cy + 7], fill=eye_color)
        d.ellipse([cx - 16, cy, cx - 12, cy + 4], fill=(255, 255, 255, 255))
        # Right eye
        d.ellipse([cx + 6, cy - 6, cx + 22, cy + 10], fill=(30, 22, 18, 255))
        d.ellipse([cx + 9, cy - 3, cx + 19, cy + 7], fill=eye_color)
        d.ellipse([cx + 12, cy, cx + 16, cy + 4], fill=(255, 255, 255, 255))
    elif eye_style == 'eyepatch_left':
        # Left eye: Leather Eyepatch
        d.ellipse([cx - 24, cy - 7, cx - 4, cy + 11], fill=(25, 20, 18, 255))
        d.polygon([(cx - 22, cy - 4), (cx - 6, cy - 4), (cx - 8, cy + 9), (cx - 20, cy + 9)], fill=(45, 32, 22, 255))
        # Patch straps
        d.line([(cx - 28, cy - 14), (cx - 6, cy + 12)], fill=(45, 32, 22, 255), width=3)
        d.line([(cx - 22, cy - 4), (cx, cy - 22)], fill=(45, 32, 22, 255), width=2)
        # Right eye: Glowing
        d.ellipse([cx + 6, cy - 6, cx + 22, cy + 10], fill=(30, 22, 18, 255))
        d.ellipse([cx + 9, cy - 3, cx + 19, cy + 7], fill=eye_color)
        d.ellipse([cx + 12, cy, cx + 16, cy + 4], fill=(255, 255, 255, 255))
    elif eye_style == 'fierce':
        # Fierce angled sockets
        d.polygon([(cx - 23, cy - 8), (cx - 6, cy - 2), (cx - 8, cy + 11), (cx - 21, cy + 8)], fill=(25, 15, 15, 255))
        d.ellipse([cx - 18, cy - 2, cx - 10, cy + 6], fill=eye_color)
        d.ellipse([cx - 15, cy, cx - 12, cy + 3], fill=(255, 255, 200, 255))

        d.polygon([(cx + 6, cy - 2), (cx + 23, cy - 8), (cx + 21, cy + 8), (cx + 8, cy + 11)], fill=(25, 15, 15, 255))
        d.ellipse([cx + 10, cy - 2, cx + 18, cy + 6], fill=eye_color)
        d.ellipse([cx + 12, cy, cx + 15, cy + 3], fill=(255, 255, 200, 255))

def generate_warrior():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 70

    # Skull Base
    draw_skull_base(d, cx, cy, eye_color=(0, 240, 255), eye_style='both', aura_color=(0, 200, 255))

    # Curved Viking Horns on sides
    # Left Horn
    horn_l = [(cx - 28, cy - 14), (cx - 46, cy - 22), (cx - 54, cy - 40), (cx - 48, cy - 44), (cx - 40, cy - 30), (cx - 26, cy - 22)]
    d.polygon(horn_l, fill=(240, 230, 205, 255), outline=(30, 25, 20, 255), width=2)
    d.polygon([(cx - 54, cy - 40), (cx - 48, cy - 44), (cx - 50, cy - 36)], fill=(50, 40, 30, 255))
    # Right Horn
    horn_r = [(cx + 28, cy - 14), (cx + 46, cy - 22), (cx + 54, cy - 40), (cx + 48, cy - 44), (cx + 40, cy - 30), (cx + 26, cy - 22)]
    d.polygon(horn_r, fill=(240, 230, 205, 255), outline=(30, 25, 20, 255), width=2)
    d.polygon([(cx + 54, cy - 40), (cx + 48, cy - 44), (cx + 50, cy - 36)], fill=(50, 40, 30, 255))

    # Helmet Solid Cap
    d.polygon([(cx - 33, cy - 8), (cx + 33, cy - 8), (cx + 31, cy - 28), (cx, cy - 42), (cx - 31, cy - 28)], 
              fill=(115, 125, 140, 255), outline=(25, 30, 40, 255), width=3)
    d.line([(cx - 20, cy - 26), (cx - 4, cy - 36)], fill=(160, 175, 195, 255), width=3)

    # Helmet Brow Rim with gold rivets
    d.rectangle([cx - 34, cy - 14, cx + 34, cy - 6], fill=(80, 90, 105, 255), outline=(25, 30, 40, 255), width=2)
    for rx in [cx - 24, cx - 12, cx, cx + 12, cx + 24]:
        d.ellipse([rx - 2, cy - 12, rx + 2, cy - 8], fill=(255, 200, 40, 255))
    
    # Nasal Guard bar
    d.polygon([(cx - 4, cy - 6), (cx + 4, cy - 6), (cx + 3, cy + 8), (cx - 3, cy + 8)], fill=(90, 100, 115, 255), outline=(25, 30, 40, 255))

    # Crimson Plume crest on top
    d.polygon([(cx - 6, cy - 40), (cx + 6, cy - 40), (cx + 12, cy - 60), (cx - 12, cy - 60)], fill=(220, 20, 40, 255), outline=(70, 10, 15, 255), width=2)
    d.ellipse([cx - 10, cy - 64, cx + 10, cy - 52], fill=(255, 60, 80, 255))

    img.save(os.path.join(OUTPUT_DIR, 'minion_skeleton_warrior.png'))

def generate_archer():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 70

    # Skull Base with Eyepatch
    draw_skull_base(d, cx, cy, eye_color=(50, 255, 100), eye_style='eyepatch_left', aura_color=(40, 220, 100))

    # ARCHER CAP (Robin Hood / Ranger Felt Hat with Bright Feather)
    # Hat Brim
    d.polygon([(cx - 38, cy - 6), (cx + 38, cy - 4), (cx + 42, cy - 16), (cx - 32, cy - 18)], 
              fill=(35, 115, 55, 255), outline=(15, 45, 20, 255), width=2)
    
    # Hat Crown
    d.polygon([(cx - 30, cy - 14), (cx + 28, cy - 14), (cx + 8, cy - 44), (cx - 24, cy - 38)], 
              fill=(45, 140, 68, 255), outline=(15, 45, 20, 255), width=2)
    d.line([(cx - 18, cy - 32), (cx + 16, cy - 16)], fill=(25, 80, 40, 255), width=2)

    # Leather Hat Band
    d.polygon([(cx - 31, cy - 14), (cx + 29, cy - 12), (cx + 28, cy - 6), (cx - 32, cy - 8)], 
              fill=(120, 70, 35, 255), outline=(40, 25, 15, 255))
    d.rectangle([cx - 6, cy - 13, cx + 4, cy - 7], fill=(255, 210, 40, 255), outline=(60, 45, 10, 255))

    # Long Archer Feather (crimson with yellow tip)
    d.polygon([(cx + 14, cy - 14), (cx + 46, cy - 54), (cx + 36, cy - 52), (cx + 8, cy - 16)], 
              fill=(235, 40, 40, 255), outline=(80, 10, 10, 255))
    d.polygon([(cx + 36, cy - 52), (cx + 46, cy - 54), (cx + 42, cy - 44)], fill=(255, 220, 40, 255))
    d.line([(cx + 12, cy - 14), (cx + 44, cy - 52)], fill=(255, 255, 255, 255), width=1)

    img.save(os.path.join(OUTPUT_DIR, 'minion_skeleton_archer.png'))

def generate_mage():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 74

    # Skull Base with purple arcane eyes
    draw_skull_base(d, cx, cy, eye_color=(230, 70, 255), eye_style='both', aura_color=(190, 50, 255))

    # WIZARD / MAGE HAT
    d.ellipse([cx - 46, cy - 24, cx + 46, cy - 6], fill=(55, 20, 85, 255), outline=(25, 10, 40, 255), width=2)
    d.ellipse([cx - 42, cy - 21, cx + 42, cy - 9], fill=(85, 30, 125, 255))

    cone_points = [
        (cx - 28, cy - 16),
        (cx + 28, cy - 16),
        (cx + 18, cy - 42),
        (cx + 38, cy - 64),
        (cx + 28, cy - 68),
        (cx + 4, cy - 46),
        (cx - 16, cy - 30)
    ]
    d.polygon(cone_points, fill=(80, 28, 120, 255), outline=(25, 10, 40, 255), width=2)
    d.line([(cx - 12, cy - 20), (cx + 12, cy - 44)], fill=(125, 50, 180, 255), width=3)

    d.polygon([(cx - 26, cy - 18), (cx + 26, cy - 18), (cx + 24, cy - 10), (cx - 24, cy - 10)], 
              fill=(235, 170, 20, 255), outline=(60, 40, 5, 255))
    d.ellipse([cx - 8, cy - 20, cx + 6, cy - 6], fill=(255, 240, 100, 255), outline=(80, 60, 10, 255))
    d.ellipse([cx - 5, cy - 20, cx + 7, cy - 6], fill=(235, 170, 20, 255))

    # Sparkle stars
    for sx, sy in [(cx - 28, cy - 38), (cx - 36, cy - 22), (cx + 34, cy - 36), (cx + 42, cy - 54)]:
        d.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 245, 160, 255))
        d.line([(sx - 4, sy), (sx + 4, sy)], fill=(255, 255, 255, 255), width=1)
        d.line([(sx, sy - 4), (sx, sy + 4)], fill=(255, 255, 255, 255), width=1)

    img.save(os.path.join(OUTPUT_DIR, 'minion_skeleton_mage.png'))

def generate_arthur():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 70

    # Skull Base (fierce eyes, purple/red hellfire aura)
    draw_skull_base(d, cx, cy, eye_color=(255, 80, 20), eye_style='fierce', aura_color=(220, 30, 80))

    d.line([(cx - 8, cy - 16), (cx - 4, cy - 8), (cx - 6, cy - 2)], fill=(80, 40, 30, 255), width=2)

    # COMMANDER KING CROWN
    d.polygon([(cx - 36, cy - 14), (cx - 28, cy - 16), (cx - 26, cy + 10), (cx - 38, cy + 2)], 
              fill=(90, 80, 100, 255), outline=(25, 20, 30, 255), width=2)
    d.polygon([(cx + 36, cy - 14), (cx + 28, cy - 16), (cx + 26, cy + 10), (cx + 38, cy + 2)], 
              fill=(90, 80, 100, 255), outline=(25, 20, 30, 255), width=2)

    d.rectangle([cx - 32, cy - 22, cx + 32, cy - 10], fill=(235, 175, 25, 255), outline=(40, 25, 5, 255), width=2)
    spikes = [
        [(cx - 32, cy - 22), (cx - 30, cy - 40), (cx - 20, cy - 22)],
        [(cx - 20, cy - 22), (cx - 14, cy - 48), (cx - 6, cy - 22)],
        [(cx - 10, cy - 22), (cx, cy - 58), (cx + 10, cy - 22)],
        [(cx + 6, cy - 22), (cx + 14, cy - 48), (cx + 20, cy - 22)],
        [(cx + 20, cy - 22), (cx + 30, cy - 40), (cx + 32, cy - 22)]
    ]
    for sp in spikes:
        d.polygon(sp, fill=(245, 195, 45, 255), outline=(40, 25, 5, 255), width=2)

    d.ellipse([cx - 3, cy - 46, cx + 3, cy - 38], fill=(230, 20, 40, 255), outline=(60, 5, 10, 255))
    d.ellipse([cx - 16, cy - 38, cx - 12, cy - 32], fill=(230, 20, 40, 255))
    d.ellipse([cx + 12, cy - 38, cx + 16, cy - 32], fill=(230, 20, 40, 255))
    for rx in [cx - 22, cx - 11, cx, cx + 11, cx + 22]:
        d.ellipse([rx - 2, cy - 18, rx + 2, cy - 14], fill=(220, 20, 40, 255))

    img.save(os.path.join(OUTPUT_DIR, 'minion_arthur.png'))

def generate_drone():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 70

    # 1. Dual side thruster jets & exhaust glow
    d.ellipse([cx - 48, cy + 2, cx - 32, cy + 22], fill=(50, 60, 75, 255), outline=(20, 25, 35, 255), width=2)
    d.ellipse([cx + 32, cy + 2, cx + 48, cy + 22], fill=(50, 60, 75, 255), outline=(20, 25, 35, 255), width=2)
    d.polygon([(cx - 44, cy + 18), (cx - 36, cy + 18), (cx - 40, cy + 38)], fill=(0, 255, 240, 220))
    d.polygon([(cx + 36, cy + 18), (cx + 44, cy + 18), (cx + 40, cy + 38)], fill=(0, 255, 240, 220))

    # 2. Spherical Drone Orb Head
    d.ellipse([cx - 32, cy - 24, cx + 32, cy + 24], fill=(25, 30, 40, 255))
    d.ellipse([cx - 29, cy - 21, cx + 29, cy + 21], fill=(230, 238, 245, 255))
    d.arc([cx - 29, cy - 21, cx + 29, cy + 21], 15, 165, fill=(180, 195, 210, 255), width=3)
    d.line([(cx - 28, cy), (cx - 16, cy)], fill=(0, 200, 255, 255), width=2)
    d.line([(cx + 16, cy), (cx + 28, cy)], fill=(0, 200, 255, 255), width=2)

    # 3. Big Cute Glowing Cyclops Camera Eye
    d.ellipse([cx - 16, cy - 14, cx + 16, cy + 14], fill=(20, 25, 35, 255))
    d.ellipse([cx - 13, cy - 11, cx + 13, cy + 11], fill=(0, 220, 255, 255))
    d.ellipse([cx - 9, cy - 7, cx + 9, cy + 7], fill=(0, 140, 230, 255))
    d.ellipse([cx - 8, cy - 8, cx - 2, cy - 2], fill=(255, 255, 255, 255))
    d.point([(cx + 3, cy + 3)], fill=(255, 255, 255, 255))

    # 4. DRONE HAT: Aviator Pilot Cap with Goggles & Propeller!
    d.chord([cx - 33, cy - 38, cx + 33, cy - 4], 175, 365, fill=(130, 75, 40, 255), outline=(35, 20, 10, 255), width=2)
    d.polygon([(cx - 33, cy - 16), (cx - 25, cy - 14), (cx - 28, cy + 10), (cx - 34, cy + 6)], 
              fill=(115, 65, 32, 255), outline=(35, 20, 10, 255))
    d.polygon([(cx + 33, cy - 16), (cx + 25, cy - 14), (cx + 28, cy + 10), (cx + 34, cy + 6)], 
              fill=(115, 65, 32, 255), outline=(35, 20, 10, 255))

    d.rectangle([cx - 33, cy - 26, cx + 33, cy - 20], fill=(40, 25, 15, 255))
    d.ellipse([cx - 22, cy - 30, cx - 4, cy - 14], fill=(210, 160, 40, 255), outline=(40, 25, 10, 255), width=2)
    d.ellipse([cx - 19, cy - 27, cx - 7, cy - 17], fill=(120, 240, 255, 255))
    d.line([(cx - 16, cy - 25), (cx - 10, cy - 19)], fill=(255, 255, 255, 255), width=2)
    d.ellipse([cx + 4, cy - 30, cx + 22, cy - 14], fill=(210, 160, 40, 255), outline=(40, 25, 10, 255), width=2)
    d.ellipse([cx + 7, cy - 27, cx + 19, cy - 17], fill=(120, 240, 255, 255))
    d.line([(cx + 10, cy - 25), (cx + 16, cy - 19)], fill=(255, 255, 255, 255), width=2)
    d.rectangle([cx - 4, cy - 24, cx + 4, cy - 20], fill=(210, 160, 40, 255), outline=(40, 25, 10, 255))

    d.line([(cx, cy - 36), (cx, cy - 48)], fill=(60, 60, 70, 255), width=3)
    d.ellipse([cx - 4, cy - 51, cx + 4, cy - 45], fill=(255, 200, 30, 255), outline=(40, 30, 5, 255))
    d.polygon([(cx - 24, cy - 52), (cx - 4, cy - 49), (cx - 4, cy - 47), (cx - 24, cy - 50)], fill=(240, 60, 60, 255), outline=(50, 10, 10, 255))
    d.polygon([(cx + 24, cy - 52), (cx + 4, cy - 49), (cx + 4, cy - 47), (cx + 24, cy - 50)], fill=(60, 140, 255, 255), outline=(10, 20, 60, 255))

    img.save(os.path.join(OUTPUT_DIR, 'minion_drone.png'))

generate_warrior()
generate_archer()
generate_mage()
generate_arthur()
generate_drone()
print('All 5 minion floating head sprites generated!')
