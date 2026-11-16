import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = 'public/assets/skills/vfx'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_bone_spear():
    img = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 1. Cyan soul flame tail (x: 4..28)
    for r, a in [(12, 35), (9, 70), (6, 130), (3, 200)]:
        d.ellipse([16 - r, 16 - r//2, 28 + r//2, 16 + r//2], fill=(0, 240, 255, a))
    d.line([(4, 13), (16, 15), (28, 16)], fill=(0, 255, 240, 150), width=2)
    d.line([(6, 19), (18, 17), (28, 16)], fill=(0, 210, 255, 150), width=2)
    # 2. Bone shaft (x: 12..46)
    d.line([(12, 16), (46, 16)], fill=(40, 32, 28, 255), width=4)
    d.line([(12, 16), (46, 16)], fill=(215, 200, 180, 255), width=2)
    # Bone segments
    for sx in [20, 32]:
        d.rectangle([sx, 13, sx + 3, 19], fill=(240, 235, 220, 255), outline=(40, 32, 28, 255))
    # 3. Spearhead (x: 44..62)
    d.polygon([(44, 9), (62, 16), (44, 23), (48, 16)], fill=(245, 240, 230, 255), outline=(35, 25, 20, 255))
    d.line([(48, 16), (60, 16)], fill=(255, 255, 255, 255), width=1)
    # Glowing skull eye rune on spearhead
    d.ellipse([46, 13, 51, 19], fill=(0, 255, 240, 255))
    d.point([(48, 16)], fill=(255, 255, 255, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_necro_spear.png'))

def create_bone_armor():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Cyan outer soul aura
    d.ellipse([4, 4, 60, 60], fill=(0, 240, 255, 30))
    d.ellipse([8, 8, 56, 56], fill=(0, 240, 255, 60))
    # Outer rib bone ring
    d.ellipse([10, 10, 54, 54], fill=(225, 215, 195, 255), outline=(35, 25, 20, 255), width=2)
    d.ellipse([16, 16, 48, 48], fill=(30, 22, 26, 255), outline=(45, 35, 30, 255), width=2)
    # Rib bone struts
    for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
        rad = math.radians(angle)
        x1 = 32 + math.cos(rad) * 16
        y1 = 32 + math.sin(rad) * 16
        x2 = 32 + math.cos(rad) * 26
        y2 = 32 + math.sin(rad) * 26
        d.line([(x1, y1), (x2, y2)], fill=(235, 225, 205, 255), width=3)
    # Center skull
    d.ellipse([23, 22, 41, 38], fill=(245, 240, 230, 255), outline=(35, 25, 20, 255))
    d.rectangle([26, 35, 38, 42], fill=(245, 240, 230, 255), outline=(35, 25, 20, 255))
    # Glowing cyan eyes
    d.ellipse([26, 27, 30, 32], fill=(0, 255, 240, 255))
    d.ellipse([34, 27, 38, 32], fill=(0, 255, 240, 255))
    # Teeth slits
    for tx in [28, 32, 36]:
        d.line([(tx, 38), (tx, 41)], fill=(35, 25, 20, 255), width=1)
    img.save(os.path.join(OUTPUT_DIR, 'vfx_necro_armor.png'))

def create_ber_whirlwind():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Red blood whirl aura
    for r, a in [(28, 25), (24, 45)]:
        d.ellipse([32 - r, 32 - r, 32 + r, 32 + r], fill=(255, 40, 60, a))
    # Wooden shaft (diagonal)
    d.line([(14, 50), (50, 14)], fill=(35, 22, 16, 255), width=5)
    d.line([(14, 50), (50, 14)], fill=(120, 75, 45, 255), width=3)
    # Gold pommel & socket
    d.ellipse([10, 48, 17, 55], fill=(240, 180, 20, 255), outline=(35, 25, 10, 255))
    d.ellipse([38, 20, 46, 28], fill=(240, 180, 20, 255), outline=(35, 25, 10, 255))
    # Double battleaxe blades
    # Upper-left blade
    blade1 = [(42, 24), (24, 10), (18, 24), (32, 34)]
    d.polygon(blade1, fill=(200, 205, 215, 255), outline=(30, 30, 35, 255))
    d.line([(24, 10), (18, 24)], fill=(255, 50, 70, 255), width=2)
    # Lower-right blade
    blade2 = [(42, 24), (54, 38), (48, 52), (32, 34)]
    d.polygon(blade2, fill=(200, 205, 215, 255), outline=(30, 30, 35, 255))
    d.line([(54, 38), (48, 52)], fill=(255, 50, 70, 255), width=2)
    # Crimson runic glow in blade center
    d.point([(26, 22), (28, 23), (44, 36), (46, 37)], fill=(255, 100, 120, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_ber_whirlwind.png'))

def create_sm_dragon():
    img = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Giant blue dragon crescent slash facing RIGHT
    # Outer dragon flame aura
    d.pieslice([4, 8, 88, 88], 300, 60, fill=(0, 200, 255, 40))
    d.pieslice([12, 16, 84, 80], 310, 50, fill=(0, 240, 255, 80))
    # Main curved razor crescent blade
    points_outer = []
    points_inner = []
    cx, cy = 40, 48
    for deg in range(-65, 66, 5):
        rad = math.radians(deg)
        r_out = 44 + 6 * math.cos(rad)
        r_in = 30 + 4 * math.cos(rad)
        points_outer.append((cx + r_out * math.cos(rad), cy + r_out * math.sin(rad)))
        points_inner.append((cx + r_in * math.cos(rad), cy + r_in * math.sin(rad)))
    poly = points_outer + list(reversed(points_inner))
    d.polygon(poly, fill=(0, 240, 255, 240), outline=(0, 80, 160, 255))
    # Inner sharp white cutting edge
    d.line(points_outer, fill=(255, 255, 255, 255), width=2)
    # Dragon face / eye crest in center
    d.ellipse([cx + 20, cy - 6, cx + 32, cy + 6], fill=(255, 220, 0, 255))
    d.ellipse([cx + 24, cy - 3, cx + 28, cy + 3], fill=(255, 50, 0, 255))
    # Whiskers
    d.line([(cx + 30, cy - 4), (cx + 46, cy - 14)], fill=(0, 255, 240, 255), width=2)
    d.line([(cx + 30, cy + 4), (cx + 46, cy + 14)], fill=(0, 255, 240, 255), width=2)
    img.save(os.path.join(OUTPUT_DIR, 'vfx_sm_dragon.png'))

def create_sniper_shot():
    img = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Supersonic shockwave cone (Mach rings)
    for cx, w, col in [(12, 10, (255, 180, 0, 60)), (24, 14, (0, 240, 255, 90)), (36, 18, (0, 255, 255, 140))]:
        d.arc([cx - w//2, 16 - w//2, cx + w//2, 16 + w//2], 90, 270, fill=col, width=2)
    # High-speed trail
    d.line([(4, 16), (46, 16)], fill=(255, 240, 180, 160), width=3)
    d.line([(10, 16), (50, 16)], fill=(255, 255, 255, 240), width=2)
    # Heavy armor-piercing sabot bullet (x: 42..62)
    bullet = [(42, 13), (56, 14), (62, 16), (56, 18), (42, 19)]
    d.polygon(bullet, fill=(255, 220, 60, 255), outline=(40, 30, 10, 255))
    d.line([(46, 16), (60, 16)], fill=(255, 255, 255, 255), width=1)
    # Glowing plasma tip
    d.ellipse([58, 14, 63, 18], fill=(255, 255, 255, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_sniper_shot.png'))

def create_storm_chain():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Electric plasma ball with crackling lightning forks
    d.ellipse([14, 14, 50, 50], fill=(0, 220, 255, 50))
    d.ellipse([20, 20, 44, 44], fill=(255, 240, 100, 120))
    d.ellipse([26, 26, 38, 38], fill=(255, 255, 255, 240))
    # Branching electric bolts radiating
    bolts = [
        [(32, 26), (28, 14), (36, 8), (30, 2)],
        [(32, 38), (36, 50), (28, 56), (34, 62)],
        [(26, 32), (14, 28), (8, 36), (2, 30)],
        [(38, 32), (50, 36), (56, 28), (62, 34)],
        [(26, 26), (16, 16), (10, 18)],
        [(38, 26), (48, 16), (54, 18)],
        [(26, 38), (16, 48), (10, 46)],
        [(38, 38), (48, 48), (54, 46)],
    ]
    for bolt in bolts:
        d.line(bolt, fill=(255, 240, 80, 255), width=2)
        d.line(bolt, fill=(255, 255, 255, 255), width=1)
    img.save(os.path.join(OUTPUT_DIR, 'vfx_storm_chain.png'))

def create_psi_blackhole():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Deep purple nebula aura
    for r, a in [(60, 25), (50, 50), (40, 90)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(130, 0, 255, a))
    # Spiral gravitational accretion arms
    for arm in range(4):
        base_angle = arm * (math.pi / 2)
        points = []
        for step in range(25):
            t = step / 24.0
            r = 18 + t * 42
            angle = base_angle + t * 3.2
            px = cx + r * math.cos(angle)
            py = cy + r * math.sin(angle)
            points.append((px, py))
        d.line(points, fill=(240, 80, 255, 220), width=4)
        d.line(points, fill=(0, 240, 255, 200), width=2)
    # Bright event horizon photon ring
    d.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], fill=(255, 100, 255, 255), outline=(0, 255, 240, 255), width=3)
    # Pure black singularity center
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(5, 0, 10, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_psi_blackhole.png'))

def create_cryo_nova():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Frost mist aura
    d.ellipse([8, 8, 120, 120], fill=(0, 220, 255, 35))
    d.ellipse([24, 24, 104, 104], fill=(180, 245, 255, 70))
    # 12 Ice crystal spikes radiating outwards
    for i in range(12):
        angle = math.radians(i * 30)
        p_tip = (cx + math.cos(angle) * 58, cy + math.sin(angle) * 58)
        p_l = (cx + math.cos(angle - 0.15) * 20, cy + math.sin(angle - 0.15) * 20)
        p_r = (cx + math.cos(angle + 0.15) * 20, cy + math.sin(angle + 0.15) * 20)
        d.polygon([p_tip, p_l, p_r], fill=(0, 240, 255, 220), outline=(255, 255, 255, 255))
        d.line([(cx, cy), p_tip], fill=(255, 255, 255, 255), width=2)
    # Secondary smaller spikes
    for i in range(12):
        angle = math.radians(i * 30 + 15)
        p_tip = (cx + math.cos(angle) * 38, cy + math.sin(angle) * 38)
        p_l = (cx + math.cos(angle - 0.15) * 16, cy + math.sin(angle - 0.15) * 16)
        p_r = (cx + math.cos(angle + 0.15) * 16, cy + math.sin(angle + 0.15) * 16)
        d.polygon([p_tip, p_l, p_r], fill=(180, 255, 255, 230), outline=(255, 255, 255, 255))
    # Center snowflake core
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(255, 255, 255, 255))
    d.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(0, 240, 255, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_cryo_nova.png'))

def create_dk_grip():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Abyssal dark portal puddle
    d.ellipse([10, 20, 118, 108], fill=(30, 5, 45, 180), outline=(160, 30, 220, 240), width=3)
    d.ellipse([24, 34, 104, 94], fill=(15, 0, 25, 220))
    # Runic glyphs on portal edge
    for i in range(8):
        ang = math.radians(i * 45)
        rx = cx + math.cos(ang) * 48
        ry = cy + math.sin(ang) * 38
        d.ellipse([rx - 4, ry - 4, rx + 4, ry + 4], fill=(200, 60, 255, 220))
    # 4 Skeletal claws reaching upward from the abyss
    hands = [
        [(52, 80), (50, 60), (46, 44), (42, 38)], # left hand fingers
        [(76, 80), (78, 60), (82, 44), (86, 38)], # right hand fingers
        [(64, 90), (64, 68), (62, 50), (60, 40)], # center main hand
    ]
    for arm in hands:
        # Arm / wrist
        d.line(arm, fill=(40, 10, 50, 255), width=6)
        d.line(arm, fill=(180, 150, 200, 255), width=3)
        # Claws / sharp knuckles
        for px, py in arm[1:]:
            d.polygon([(px - 3, py + 2), (px, py - 6), (px + 3, py + 2)], fill=(230, 210, 240, 255), outline=(30, 5, 40, 255))
    # Purple cursed soul wisps
    d.ellipse([cx - 10, cy - 8, cx + 10, cy + 8], fill=(160, 30, 255, 180))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_dk_grip.png'))

def create_priest_sanctuary():
    img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Golden sacred aura
    d.ellipse([8, 8, 120, 120], fill=(255, 210, 0, 40))
    d.ellipse([16, 16, 112, 112], fill=(255, 230, 80, 70))
    # Outer runic circle
    d.ellipse([18, 18, 110, 110], outline=(255, 215, 0, 255), width=3)
    d.ellipse([26, 26, 102, 102], outline=(255, 240, 120, 220), width=2)
    # Sacred cross in center
    d.rectangle([cx - 6, cy - 36, cx + 6, cy + 36], fill=(255, 245, 180, 255), outline=(120, 90, 10, 255), width=2)
    d.rectangle([cx - 28, cy - 14, cx + 28, cy - 2], fill=(255, 245, 180, 255), outline=(120, 90, 10, 255), width=2)
    # Holy radiance star
    for i in range(8):
        ang = math.radians(i * 45)
        x1 = cx + math.cos(ang) * 40
        y1 = cy + math.sin(ang) * 40
        x2 = cx + math.cos(ang) * 48
        y2 = cy + math.sin(ang) * 48
        d.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 255), width=3)
    img.save(os.path.join(OUTPUT_DIR, 'vfx_priest_sanctuary.png'))

def create_psi_drone():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = 32, 32
    # Cyan energy shield
    d.ellipse([10, 14, 54, 50], fill=(0, 240, 255, 45))
    # Dual thruster wings
    d.polygon([(8, 22), (20, 26), (20, 38), (8, 42)], fill=(60, 70, 80, 255), outline=(20, 25, 30, 255))
    d.polygon([(56, 22), (44, 26), (44, 38), (56, 42)], fill=(60, 70, 80, 255), outline=(20, 25, 30, 255))
    # Thruster flame jets
    d.ellipse([4, 28, 9, 36], fill=(0, 255, 240, 255))
    d.ellipse([55, 28, 60, 36], fill=(0, 255, 240, 255))
    # Main fuselage
    d.ellipse([18, 18, 46, 46], fill=(225, 230, 240, 255), outline=(30, 35, 45, 255), width=2)
    # Glowing cyclops eye
    d.ellipse([25, 25, 39, 39], fill=(0, 240, 255, 255), outline=(0, 100, 160, 255))
    d.ellipse([29, 29, 35, 35], fill=(255, 255, 255, 255))
    # Front dual pulse blaster cannons
    d.rectangle([24, 44, 28, 52], fill=(40, 45, 55, 255))
    d.rectangle([36, 44, 40, 52], fill=(40, 45, 55, 255))
    img.save(os.path.join(OUTPUT_DIR, 'vfx_psi_drone.png'))

def create_minion_projectiles():
    # 1. Archer bone arrow
    img_arrow = Image.new('RGBA', (64, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_arrow)
    d.line([(8, 12), (54, 12)], fill=(120, 95, 65, 255), width=3)
    # Fletching
    d.polygon([(6, 6), (16, 12), (6, 12)], fill=(220, 220, 220, 255), outline=(40, 30, 20, 255))
    d.polygon([(6, 18), (16, 12), (6, 12)], fill=(220, 220, 220, 255), outline=(40, 30, 20, 255))
    # Bone arrowhead pointed right
    d.polygon([(52, 6), (62, 12), (52, 18)], fill=(245, 240, 230, 255), outline=(40, 30, 20, 255))
    img_arrow.save(os.path.join(OUTPUT_DIR, 'vfx_minion_arrow.png'))

    # 2. Mage skull soul bolt
    img_mage = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_mage)
    d.ellipse([8, 8, 40, 40], fill=(0, 240, 255, 60))
    d.ellipse([14, 14, 34, 34], fill=(0, 255, 200, 180))
    d.ellipse([18, 18, 30, 30], fill=(240, 255, 255, 255))
    img_mage.save(os.path.join(OUTPUT_DIR, 'vfx_minion_mage.png'))

    # 3. Drone laser dart
    img_drone = Image.new('RGBA', (48, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_drone)
    d.line([(4, 8), (44, 8)], fill=(0, 240, 255, 140), width=6)
    d.line([(10, 8), (46, 8)], fill=(255, 255, 255, 255), width=2)
    img_drone.save(os.path.join(OUTPUT_DIR, 'vfx_minion_drone.png'))

def create_awakened_vfx():
    # 1. 진 블리자드 빙하창
    img_spear = Image.new('RGBA', (96, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_spear)
    # Frost trail
    for x in range(8, 50, 4):
        d.ellipse([x - 6, 20 - 8, x + 6, 20 + 8], fill=(0, 240, 255, 60))
    # Giant glacier spear
    d.polygon([(30, 10), (92, 20), (30, 30), (38, 20)], fill=(200, 250, 255, 255), outline=(0, 100, 200, 255), width=2)
    d.line([(38, 20), (90, 20)], fill=(255, 255, 255, 255), width=3)
    img_spear.save(os.path.join(OUTPUT_DIR, 'vfx_awakened_spear.png'))

    # 2. 불멸의 백골 성채 방패
    img_shield = Image.new('RGBA', (80, 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_shield)
    d.ellipse([4, 4, 76, 76], fill=(160, 0, 255, 60))
    d.polygon([(40, 6), (72, 24), (66, 68), (40, 76), (14, 68), (8, 24)], fill=(40, 30, 45, 255), outline=(220, 200, 180, 255), width=3)
    d.ellipse([26, 26, 54, 54], fill=(235, 225, 210, 255), outline=(40, 30, 20, 255), width=2)
    d.ellipse([31, 34, 38, 42], fill=(255, 0, 120, 255))
    d.ellipse([42, 34, 49, 42], fill=(255, 0, 120, 255))
    img_shield.save(os.path.join(OUTPUT_DIR, 'vfx_awakened_armor.png'))

    # 3. 라그나로크 대도끼
    img_axe = Image.new('RGBA', (80, 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_axe)
    d.ellipse([4, 4, 76, 76], fill=(255, 0, 40, 50))
    d.line([(12, 68), (68, 12)], fill=(20, 15, 12, 255), width=7)
    d.line([(12, 68), (68, 12)], fill=(160, 40, 30, 255), width=4)
    # Huge executioner double blades
    d.polygon([(52, 28), (26, 8), (16, 28), (40, 40)], fill=(80, 80, 90, 255), outline=(255, 20, 40, 255), width=2)
    d.polygon([(52, 28), (72, 54), (54, 72), (40, 40)], fill=(80, 80, 90, 255), outline=(255, 20, 40, 255), width=2)
    d.line([(26, 8), (16, 28)], fill=(255, 240, 100, 255), width=3)
    d.line([(72, 54), (54, 72)], fill=(255, 240, 100, 255), width=3)
    img_axe.save(os.path.join(OUTPUT_DIR, 'vfx_awakened_whirlwind.png'))

    # 4. 진 청룡참 대검기
    img_dragon = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img_dragon)
    cx, cy = 50, 64
    d.pieslice([4, 10, 120, 118], 295, 65, fill=(0, 220, 255, 60))
    points_outer = []
    points_inner = []
    for deg in range(-70, 71, 4):
        rad = math.radians(deg)
        r_out = 60 + 8 * math.cos(rad)
        r_in = 40 + 6 * math.cos(rad)
        points_outer.append((cx + r_out * math.cos(rad), cy + r_out * math.sin(rad)))
        points_inner.append((cx + r_in * math.cos(rad), cy + r_in * math.sin(rad)))
    poly = points_outer + list(reversed(points_inner))
    d.polygon(poly, fill=(0, 240, 255, 255), outline=(255, 220, 0, 255), width=2)
    d.line(points_outer, fill=(255, 255, 255, 255), width=3)
    # Dragon golden crest
    d.ellipse([cx + 32, cy - 8, cx + 48, cy + 8], fill=(255, 220, 0, 255), outline=(255, 60, 0, 255))
    d.ellipse([cx + 36, cy - 4, cx + 44, cy + 4], fill=(255, 0, 0, 255))
    img_dragon.save(os.path.join(OUTPUT_DIR, 'vfx_awakened_dragon.png'))

create_bone_spear()
create_bone_armor()
create_ber_whirlwind()
create_sm_dragon()
create_sniper_shot()
create_storm_chain()
create_psi_blackhole()
create_cryo_nova()
create_dk_grip()
create_priest_sanctuary()
create_psi_drone()
create_minion_projectiles()
create_awakened_vfx()
print('All in-game skill VFX successfully generated!')
