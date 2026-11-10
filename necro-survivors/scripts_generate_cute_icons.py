import math
from PIL import Image, ImageDraw

ICON_SIZE = 64
OUT_DIR = "public/assets/skills"

def create_base_icon():
    """Creates a 64x64 transparent canvas for clean in-game and UI sprite rendering."""
    im = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    return im, d

def draw_necro_spear(d):
    # Cute bone spear with skull tip and cyan flame
    d.line([(10, 54), (46, 18)], fill=(120, 80, 50), width=4)
    d.line([(11, 55), (47, 19)], fill=(60, 40, 25), width=2)
    # Bone rings
    d.rectangle([22, 38, 27, 43], fill=(235, 230, 215), outline=(50, 40, 30))
    d.rectangle([34, 26, 39, 31], fill=(235, 230, 215), outline=(50, 40, 30))
    # Spear tip: cute mini skull blade
    d.polygon([(42, 22), (56, 8), (48, 6), (38, 16)], fill=(245, 240, 230), outline=(50, 45, 40))
    d.polygon([(48, 6), (60, 6), (56, 18)], fill=(255, 250, 240), outline=(50, 45, 40))
    # Mini skull eyes
    d.point([(48, 12), (52, 16)], fill=(0, 240, 255))
    # Cyan soul sparks
    for pt in [(58, 4), (60, 10), (52, 2), (40, 4)]:
        d.point(pt, fill=(0, 255, 200))
        d.point((pt[0]+1, pt[1]), fill=(180, 255, 255))

def draw_necro_legion(d):
    # Cute smiling chibi skull with crossed bones and purple cape
    d.polygon([(14, 52), (32, 40), (50, 52), (32, 58)], fill=(90, 35, 120), outline=(45, 15, 60))
    # Skull head
    d.rounded_rectangle([18, 12, 46, 40], radius=8, fill=(245, 242, 230), outline=(40, 35, 30), width=2)
    # Jaw
    d.rectangle([24, 38, 40, 46], fill=(230, 225, 210), outline=(40, 35, 30), width=2)
    # Big cute eye sockets
    d.ellipse([22, 22, 30, 32], fill=(25, 20, 30))
    d.ellipse([34, 22, 42, 32], fill=(25, 20, 30))
    # Cyan eye glints
    d.rectangle([25, 24, 28, 28], fill=(0, 255, 200))
    d.rectangle([37, 24, 40, 28], fill=(0, 255, 200))
    # Teeth marks
    d.line([(28, 38), (28, 45)], fill=(40, 35, 30), width=1)
    d.line([(32, 38), (32, 45)], fill=(40, 35, 30), width=1)
    d.line([(36, 38), (36, 45)], fill=(40, 35, 30), width=1)
    # Crossed bones behind
    d.line([(8, 12), (20, 22)], fill=(245, 240, 230), width=3)
    d.line([(56, 12), (44, 22)], fill=(245, 240, 230), width=3)

def draw_necro_armor(d):
    # Cute bone ribcage shield with glowing core
    d.ellipse([10, 10, 54, 54], fill=(30, 20, 30, 180), outline=(80, 65, 60), width=2)
    d.arc([14, 14, 50, 50], 0, 360, fill=(245, 240, 225), width=4)
    d.arc([16, 20, 48, 44], 180, 360, fill=(240, 235, 220), width=3)
    d.arc([16, 26, 48, 50], 180, 360, fill=(240, 235, 220), width=3)
    d.line([(32, 14), (32, 50)], fill=(250, 245, 235), width=4)
    # Glowing cyan soul core in center
    d.ellipse([25, 25, 39, 39], fill=(0, 255, 200), outline=(200, 255, 255), width=2)
    d.ellipse([29, 29, 35, 35], fill=(255, 255, 255))

def draw_dk_grip(d):
    # Cute shadow demon claw reaching up from a purple mist portal
    d.ellipse([12, 42, 52, 58], fill=(50, 15, 70), outline=(160, 50, 220), width=2)
    # Dark claw arm
    d.polygon([(24, 48), (40, 48), (38, 30), (26, 30)], fill=(35, 20, 50), outline=(90, 45, 120))
    d.polygon([(22, 32), (42, 32), (40, 24), (24, 24)], fill=(60, 35, 85))
    # 4 cute sharp claws
    d.polygon([(18, 26), (24, 24), (18, 10)], fill=(150, 50, 200), outline=(220, 120, 255))
    d.polygon([(25, 24), (31, 22), (28, 8)], fill=(150, 50, 200), outline=(220, 120, 255))
    d.polygon([(33, 22), (39, 24), (36, 8)], fill=(150, 50, 200), outline=(220, 120, 255))
    d.polygon([(40, 24), (46, 26), (46, 10)], fill=(150, 50, 200), outline=(220, 120, 255))
    for pt in [(16, 40), (48, 38), (32, 6), (14, 18), (50, 20)]:
        d.point(pt, fill=(230, 140, 255))

def draw_storm_chain(d):
    # Cute sharp lightning bolt with neon sparks
    bolt = [(38, 6), (16, 32), (32, 32), (20, 58), (48, 28), (32, 28), (44, 6)]
    d.polygon(bolt, fill=(255, 240, 60), outline=(255, 150, 0), width=2)
    inner_bolt = [(37, 10), (22, 30), (32, 30), (26, 50), (43, 30), (34, 30), (41, 10)]
    d.polygon(inner_bolt, fill=(255, 255, 240))
    for pt in [(12, 18), (50, 14), (10, 44), (52, 46), (36, 54)]:
        d.point(pt, fill=(0, 255, 255))
        d.point((pt[0]+1, pt[1]), fill=(255, 255, 255))

def draw_sniper_shot(d):
    # Cute sniper crosshair target with glowing green laser and bullet
    d.ellipse([10, 10, 54, 54], outline=(0, 255, 170), width=3)
    d.ellipse([18, 18, 46, 46], outline=(0, 200, 120), width=1)
    d.line([(32, 6), (32, 18)], fill=(0, 255, 170), width=3)
    d.line([(32, 46), (32, 58)], fill=(0, 255, 170), width=3)
    d.line([(6, 32), (18, 32)], fill=(0, 255, 170), width=3)
    d.line([(46, 32), (58, 32)], fill=(0, 255, 170), width=3)
    # Center bullet
    d.polygon([(29, 32), (35, 32), (32, 22)], fill=(255, 215, 0), outline=(255, 255, 255))
    d.rectangle([29, 32, 35, 38], fill=(210, 160, 40))

def draw_psi_blackhole(d):
    # Cute swirling purple cosmic vortex with orbiting stars
    for r in range(24, 6, -3):
        col = (int(160 - r*3), int(40 + r*2), int(240 - r*4))
        d.ellipse([32-r, 32-r, 32+r, 32+r], outline=col, width=2)
    d.ellipse([24, 24, 40, 40], fill=(5, 0, 20), outline=(200, 100, 255), width=2)
    d.arc([10, 10, 54, 54], 45, 180, fill=(220, 120, 255), width=3)
    d.arc([10, 10, 54, 54], 225, 360, fill=(0, 240, 255), width=3)
    for pt in [(14, 18), (48, 16), (50, 44), (16, 48), (32, 8)]:
        d.point(pt, fill=(255, 255, 255))

def draw_cryo_nova(d):
    # Cute 6-fold sparkling ice crystal snowflake
    cx, cy = 32, 32
    d.ellipse([26, 26, 38, 38], fill=(210, 248, 255), outline=(0, 210, 255), width=2)
    for a in range(0, 360, 60):
        rad = math.radians(a)
        ex = cx + math.cos(rad) * 22
        ey = cy + math.sin(rad) * 22
        d.line([(cx, cy), (ex, ey)], fill=(0, 230, 255), width=3)
        bx = cx + math.cos(rad) * 13
        by = cy + math.sin(rad) * 13
        p1x = bx + math.cos(rad + 0.7) * 7
        p1y = by + math.sin(rad + 0.7) * 7
        p2x = bx + math.cos(rad - 0.7) * 7
        p2y = by + math.sin(rad - 0.7) * 7
        d.line([(bx, by), (p1x, p1y)], fill=(200, 250, 255), width=2)
        d.line([(bx, by), (p2x, p2y)], fill=(200, 250, 255), width=2)
        d.point((ex, ey), fill=(255, 255, 255))

def draw_ber_whirlwind(d):
    # Cute chunky double-headed Viking battleaxe with spin wind trails
    d.line([(14, 52), (48, 18)], fill=(145, 90, 50), width=5)
    d.line([(15, 53), (49, 19)], fill=(85, 50, 30), width=2)
    # Left blade
    d.polygon([(36, 26), (20, 14), (26, 34)], fill=(215, 220, 230), outline=(60, 65, 75), width=2)
    d.polygon([(20, 14), (18, 24), (26, 34)], fill=(245, 250, 255))
    # Right blade
    d.polygon([(40, 24), (48, 10), (56, 28)], fill=(215, 220, 230), outline=(60, 65, 75), width=2)
    d.polygon([(48, 10), (58, 18), (56, 28)], fill=(245, 250, 255))
    # Golden center gem
    d.ellipse([33, 21, 41, 29], fill=(255, 210, 40), outline=(170, 110, 20), width=1)
    # Spin wind arcs
    d.arc([4, 4, 60, 60], 30, 120, fill=(255, 255, 255), width=3)
    d.arc([4, 4, 60, 60], 210, 300, fill=(255, 255, 255), width=3)

def draw_sm_dragon(d):
    # Cute azure dragon blade / glowing blue dragon slash
    d.line([(10, 52), (22, 40)], fill=(180, 130, 60), width=5) # hilt
    d.line([(20, 44), (26, 36)], fill=(255, 215, 0), width=4) # guard
    d.line([(24, 38), (52, 10)], fill=(240, 250, 255), width=4)
    d.line([(26, 36), (54, 8)], fill=(0, 220, 255), width=2)
    d.arc([6, 6, 58, 58], 220, 350, fill=(0, 240, 255), width=4)
    d.arc([10, 10, 54, 54], 230, 340, fill=(255, 255, 255), width=2)
    for pt in [(54, 8), (56, 14), (48, 6)]:
        d.point(pt, fill=(0, 255, 200))

def draw_psi_drone(d):
    # Cute UFO combat drone with blinking eye & guns
    d.ellipse([20, 16, 44, 34], fill=(140, 155, 175), outline=(50, 60, 75), width=2)
    d.ellipse([10, 24, 54, 42], fill=(95, 110, 130), outline=(40, 50, 65), width=2)
    d.ellipse([26, 25, 38, 35], fill=(0, 240, 255), outline=(255, 255, 255), width=2)
    d.rectangle([6, 30, 11, 35], fill=(50, 60, 75))
    d.rectangle([53, 30, 58, 35], fill=(50, 60, 75))
    d.line([(20, 44), (18, 54)], fill=(0, 255, 255), width=3)
    d.line([(32, 44), (32, 56)], fill=(0, 255, 255), width=3)
    d.line([(44, 44), (46, 54)], fill=(0, 255, 255), width=3)
    d.line([(32, 12), (32, 16)], fill=(70, 80, 95), width=2)
    d.point((32, 11), fill=(255, 60, 80))

def draw_priest_sanctuary(d):
    # Cute golden holy sun seal
    d.ellipse([10, 10, 54, 54], fill=(80, 65, 25, 200), outline=(255, 215, 0), width=3)
    d.ellipse([16, 16, 48, 48], outline=(255, 240, 140), width=1)
    d.line([(32, 12), (32, 52)], fill=(255, 255, 220), width=4)
    d.line([(16, 28), (48, 28)], fill=(255, 255, 220), width=4)
    for a in range(0, 360, 45):
        rad = math.radians(a)
        x1 = 32 + math.cos(rad) * 21
        y1 = 32 + math.sin(rad) * 21
        x2 = 32 + math.cos(rad) * 27
        y2 = 32 + math.sin(rad) * 27
        d.line([(x1, y1), (x2, y2)], fill=(255, 200, 30), width=3)
    d.ellipse([30, 26, 34, 30], fill=(255, 255, 255))

def draw_pas_frost_heart(d):
    d.polygon([(32, 52), (12, 28), (12, 16), (22, 12), (32, 20), (42, 12), (52, 16), (52, 28)],
              fill=(120, 225, 255), outline=(0, 150, 230), width=2)
    d.line([(32, 20), (32, 52)], fill=(255, 255, 255), width=3)
    d.line([(12, 28), (32, 38)], fill=(200, 245, 255), width=2)
    d.line([(52, 28), (32, 38)], fill=(200, 245, 255), width=2)
    d.ellipse([18, 16, 26, 24], fill=(255, 255, 255))
    for pt in [(8, 14), (54, 12), (32, 58)]:
        d.point(pt, fill=(0, 240, 255))

def draw_pas_undead_cmd(d):
    d.polygon([(10, 40), (16, 18), (24, 28), (32, 14), (40, 28), (48, 18), (54, 40)],
              fill=(255, 205, 30), outline=(180, 120, 10), width=2)
    d.rectangle([10, 40, 54, 48], fill=(220, 160, 20), outline=(160, 100, 10), width=2)
    d.ellipse([27, 28, 37, 38], fill=(245, 240, 230), outline=(40, 30, 20), width=1)
    d.point([(30, 32), (34, 32)], fill=(0, 255, 200))
    d.point([(16, 17), (32, 13), (48, 17)], fill=(190, 50, 255))

def draw_pas_cooldown(d):
    d.ellipse([10, 12, 54, 56], fill=(40, 30, 45, 220), outline=(255, 215, 0), width=3)
    d.ellipse([15, 17, 49, 51], fill=(245, 240, 220), outline=(160, 120, 20))
    d.rectangle([28, 7, 36, 13], fill=(255, 215, 0), outline=(180, 140, 20))
    d.arc([26, 4, 38, 14], 180, 360, fill=(255, 215, 0), width=2)
    d.line([(32, 34), (32, 22)], fill=(0, 130, 255), width=3)
    d.line([(32, 34), (42, 34)], fill=(0, 130, 255), width=3)
    d.ellipse([29, 31, 35, 37], fill=(255, 70, 50))

def draw_pas_area(d):
    d.ellipse([8, 8, 56, 56], outline=(0, 255, 200), width=3)
    d.ellipse([16, 16, 48, 48], outline=(0, 190, 255), width=2)
    d.ellipse([24, 24, 40, 40], outline=(180, 255, 230), width=2)
    d.polygon([(32, 10), (54, 32), (32, 54), (10, 32)], outline=(255, 255, 140), width=2)
    d.ellipse([28, 28, 36, 36], fill=(255, 255, 255))

def draw_pas_amount(d):
    cx, cy = 32, 32
    pts = []
    for i in range(8):
        ang = i * (math.pi / 4)
        r = 22 if i % 2 == 0 else 8
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    d.polygon(pts, fill=(215, 220, 235), outline=(50, 55, 65), width=2)
    for i in range(4):
        ang = i * (math.pi / 2)
        tip_x = cx + math.cos(ang) * 20
        tip_y = cy + math.sin(ang) * 20
        d.line([(cx, cy), (tip_x, tip_y)], fill=(255, 255, 255), width=2)
    d.ellipse([28, 28, 36, 36], fill=(255, 215, 0), outline=(160, 110, 20), width=2)

def draw_pas_hawk_eye(d):
    d.ellipse([8, 16, 56, 48], fill=(50, 30, 15), outline=(255, 190, 20), width=3)
    d.ellipse([18, 18, 46, 46], fill=(255, 165, 0), outline=(210, 100, 0), width=2)
    d.ellipse([27, 20, 37, 44], fill=(20, 10, 10))
    d.ellipse([22, 22, 30, 30], fill=(255, 255, 255))
    d.point([(36, 36), (26, 38)], fill=(255, 245, 190))

def draw_pas_iron_body(d):
    d.polygon([(18, 14), (46, 14), (52, 26), (44, 52), (32, 58), (20, 52), (12, 26)],
              fill=(165, 180, 200), outline=(50, 60, 75), width=2)
    d.ellipse([10, 14, 22, 28], fill=(195, 210, 230), outline=(50, 60, 75), width=2)
    d.ellipse([42, 14, 54, 28], fill=(195, 210, 230), outline=(50, 60, 75), width=2)
    d.polygon([(27, 26), (37, 26), (37, 38), (32, 42), (27, 38)], fill=(255, 205, 40), outline=(160, 110, 10))
    d.line([(22, 16), (22, 48)], fill=(235, 245, 255), width=2)

def draw_pas_speed(d):
    d.polygon([(22, 16), (32, 16), (32, 38), (50, 42), (50, 50), (20, 50), (18, 36)],
              fill=(255, 185, 30), outline=(140, 90, 10), width=2)
    d.polygon([(18, 22), (4, 12), (12, 22), (2, 26), (14, 34), (8, 38), (18, 38)],
              fill=(250, 250, 255), outline=(120, 140, 180), width=2)
    d.line([(16, 24), (8, 18)], fill=(255, 255, 255), width=2)

def draw_pas_blood_vamp(d):
    d.ellipse([18, 22, 46, 52], fill=(225, 20, 65), outline=(80, 10, 25), width=2)
    d.rectangle([27, 14, 37, 22], fill=(240, 240, 250), outline=(80, 10, 25), width=2)
    d.rectangle([25, 10, 39, 14], fill=(185, 135, 75), outline=(80, 10, 25))
    d.polygon([(18, 26), (4, 16), (10, 28), (2, 36), (18, 40)], fill=(70, 20, 45), outline=(25, 5, 20))
    d.polygon([(46, 26), (60, 16), (54, 28), (62, 36), (46, 40)], fill=(70, 20, 45), outline=(25, 5, 20))
    d.ellipse([22, 26, 30, 36], fill=(255, 110, 140))
    d.point([(25, 28), (26, 29)], fill=(255, 255, 255))

GENERATORS = {
    "necro_spear": draw_necro_spear,
    "necro_legion": draw_necro_legion,
    "necro_armor": draw_necro_armor,
    "dk_grip": draw_dk_grip,
    "storm_chain": draw_storm_chain,
    "sniper_shot": draw_sniper_shot,
    "psi_blackhole": draw_psi_blackhole,
    "cryo_nova": draw_cryo_nova,
    "ber_whirlwind": draw_ber_whirlwind,
    "sm_dragon": draw_sm_dragon,
    "psi_drone": draw_psi_drone,
    "priest_sanctuary": draw_priest_sanctuary,
    "pas_frost_heart": draw_pas_frost_heart,
    "pas_undead_cmd": draw_pas_undead_cmd,
    "pas_cooldown": draw_pas_cooldown,
    "pas_area": draw_pas_area,
    "pas_amount": draw_pas_amount,
    "pas_hawk_eye": draw_pas_hawk_eye,
    "pas_iron_body": draw_pas_iron_body,
    "pas_speed": draw_pas_speed,
    "pas_blood_vamp": draw_pas_blood_vamp,
}

for name, func in GENERATORS.items():
    im, d = create_base_icon()
    func(d)
    out_path = f"{OUT_DIR}/skill_{name}.png"
    im.save(out_path, "PNG")
    print(f"Generated {out_path}")

print("All 21 transparent cute skill icons successfully generated!")
