import os
import math
from PIL import Image, ImageDraw

def create_dirs():
    os.makedirs('public/assets/skills/vfx', exist_ok=True)
    os.makedirs('public/assets/skills', exist_ok=True)
    os.makedirs('public/assets/pixel_vfx/skills', exist_ok=True)

# 1. 마력탄 UI 아이콘 (64x64)
def create_mana_missile_icon():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 배경 원형 보라/남색 마법진 베이스
    d.ellipse([4, 4, 60, 60], fill=(22, 14, 38, 250), outline=(90, 60, 150, 255), width=2)
    # 은은한 마력 오라
    for r, a in [(24, 40), (20, 70), (16, 110), (12, 160)]:
        d.ellipse([34 - r, 30 - r, 34 + r, 30 + r], fill=(0, 220, 255, a))
    # 마력탄 꼬리 (좌하단 -> 우상단)
    for i in range(12):
        t = i / 12.0
        x = int(14 + t * 24)
        y = int(48 - t * 20)
        radius = int(3 + t * 5)
        d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(150, 60, 255, int(80 + t * 140)))
    for i in range(10):
        t = i / 10.0
        x = int(18 + t * 20)
        y = int(44 - t * 16)
        radius = int(2 + t * 4)
        d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(0, 245, 255, int(120 + t * 135)))
    # 중심 마력탄 핵 (x:38, y:26)
    d.ellipse([26, 14, 50, 38], fill=(0, 240, 255, 255), outline=(180, 240, 255, 255), width=2)
    d.ellipse([31, 19, 45, 33], fill=(255, 255, 255, 255))
    # 십자 섬광
    d.line([(38, 8), (38, 44)], fill=(255, 255, 255, 240), width=2)
    d.line([(20, 26), (56, 26)], fill=(255, 255, 255, 240), width=2)
    # 반짝이는 별가루 입자들
    sparkles = [(16, 18), (50, 48), (48, 12), (20, 52), (54, 36)]
    for sx, sy in sparkles:
        d.line([(sx - 2, sy), (sx + 2, sy)], fill=(255, 255, 255, 230), width=1)
        d.line([(sx, sy - 2), (sx, sy + 2)], fill=(255, 255, 255, 230), width=1)
    img.save('public/assets/skills/skill_necro_spear.png')
    print("Created skill_necro_spear.png (마력탄 아이콘)")

# 2. 마력탄 인게임 투사체 VFX (64x32)
def create_mana_missile_vfx():
    img = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 보라/청록 에너지 꼬리 (x: 4..44)
    for r, a in [(14, 40), (10, 80), (7, 140), (4, 200)]:
        d.ellipse([14 - r, 16 - r//2, 38 + r//2, 16 + r//2], fill=(140, 50, 255, a))
    for r, a in [(10, 70), (7, 120), (4, 180)]:
        d.ellipse([20 - r, 16 - r//2, 42 + r//2, 16 + r//2], fill=(0, 235, 255, a))
    d.line([(4, 14), (24, 15), (44, 16)], fill=(0, 255, 255, 200), width=2)
    d.line([(6, 18), (26, 17), (44, 16)], fill=(180, 100, 255, 200), width=2)
    # 중심 발광 헤드 (x: 40..58, y: 7..25)
    d.ellipse([38, 7, 56, 25], fill=(0, 240, 255, 255), outline=(220, 250, 255, 255), width=2)
    d.ellipse([43, 11, 53, 21], fill=(255, 255, 255, 255))
    # 뾰족한 전방 에너지 팁
    d.polygon([(52, 9), (62, 16), (52, 23)], fill=(255, 255, 255, 255))
    img.save('public/assets/skills/vfx/vfx_necro_spear.png')
    print("Created vfx_necro_spear.png (마력탄 VFX)")

# 3. 마력폭풍 UI 아이콘 (64x64)
def create_mana_storm_icon():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 배경 원형 심연
    d.ellipse([4, 4, 60, 60], fill=(16, 10, 32, 250), outline=(0, 230, 255, 255), width=2)
    # 나선형 은하 소용돌이
    for angle_deg in range(0, 720, 15):
        rad = math.radians(angle_deg)
        r = 3 + (angle_deg / 720.0) * 23
        x = 32 + math.cos(rad) * r
        y = 32 + math.sin(rad) * r
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(160, 60, 255, 180))
        # 반대편 대칭 나선
        x2 = 32 - math.cos(rad) * r
        y2 = 32 - math.sin(rad) * r
        d.ellipse([x2 - 2, y2 - 2, x2 + 2, y2 + 2], fill=(0, 240, 255, 200))
    # 4개의 공전 마력 구체
    for i in range(4):
        ang = math.radians(i * 90 + 30)
        ox = 32 + math.cos(ang) * 19
        oy = 32 + math.sin(ang) * 19
        d.ellipse([ox - 5, oy - 5, ox + 5, oy + 5], fill=(0, 255, 245, 255), outline=(255, 255, 255, 255), width=1)
        d.point([(int(ox), int(oy))], fill=(255, 255, 255, 255))
    # 중앙 코어 폭풍
    d.ellipse([23, 23, 41, 41], fill=(180, 50, 255, 255), outline=(0, 255, 255, 255), width=2)
    d.ellipse([27, 27, 37, 37], fill=(255, 255, 255, 255))
    # 십자 광선
    d.line([(32, 10), (32, 54)], fill=(255, 255, 255, 220), width=2)
    d.line([(10, 32), (54, 32)], fill=(255, 255, 255, 220), width=2)
    img.save('public/assets/skills/skill_necro_bone_storm.png')
    print("Created skill_necro_bone_storm.png (마력폭풍 아이콘)")

# 4. 마력폭풍 인게임 투사체 VFX (32x32)
def create_mana_storm_vfx():
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 외곽 보라/청록 에너지 아우라
    for r, a in [(14, 50), (11, 100), (8, 160), (5, 220)]:
        d.ellipse([16 - r, 16 - r, 16 + r, 16 + r], fill=(0, 240, 255, a))
    d.ellipse([10, 10, 22, 22], fill=(160, 60, 255, 255), outline=(220, 255, 255, 255), width=1)
    d.ellipse([13, 13, 19, 19], fill=(255, 255, 255, 255))
    # 4방향 회전 스파크
    d.line([(16, 2), (16, 30)], fill=(255, 255, 255, 220), width=1)
    d.line([(2, 16), (30, 16)], fill=(255, 255, 255, 220), width=1)
    d.line([(6, 6), (26, 26)], fill=(0, 255, 240, 180), width=1)
    d.line([(6, 26), (26, 6)], fill=(0, 255, 240, 180), width=1)
    img.save('public/assets/skills/vfx/vfx_necro_bone_storm.png')
    print("Created vfx_necro_bone_storm.png (마력폭풍 VFX)")

# 5. 진(眞) 마력폭풍 아이콘 & VFX (64x64)
def create_jin_mana_storm():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 초월적 오로라 오라
    for r, a in [(28, 40), (24, 75), (20, 120), (16, 180)]:
        d.ellipse([32 - r, 32 - r, 32 + r, 32 + r], fill=(0, 230, 255, a))
    # 8방향 초월 광선
    for i in range(8):
        ang = math.radians(i * 45)
        x1 = 32 + math.cos(ang) * 10
        y1 = 32 + math.sin(ang) * 10
        x2 = 32 + math.cos(ang) * 28
        y2 = 32 + math.sin(ang) * 28
        d.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 240), width=2)
        # 끝단의 마력 결정
        d.ellipse([x2 - 3, y2 - 3, x2 + 3, y2 + 3], fill=(0, 255, 240, 255), outline=(255, 255, 255, 255))
    # 이중 마법진 링
    d.ellipse([12, 12, 52, 52], outline=(180, 80, 255, 220), width=2)
    d.ellipse([18, 18, 46, 46], outline=(0, 255, 255, 240), width=1)
    # 중심 핵
    d.ellipse([22, 22, 42, 42], fill=(130, 40, 255, 255), outline=(255, 255, 255, 255), width=2)
    d.ellipse([26, 26, 38, 38], fill=(255, 255, 255, 255))
    img.save('public/assets/skills/vfx/vfx_awakened_spear.png')
    img.save('public/assets/pixel_vfx/skills/vfx_necro_ult.png')
    print("Created vfx_awakened_spear.png & vfx_necro_ult.png (진 마력폭풍)")

# 6. 홀리 아머 UI 아이콘 (64x64)
def create_holy_armor_icon():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 성스러운 배경 (다크 골드/버건디 테두리)
    d.ellipse([4, 4, 60, 60], fill=(28, 20, 12, 250), outline=(255, 215, 0, 255), width=2)
    # 신성한 황금 오라
    for r, a in [(24, 35), (20, 65), (16, 100)]:
        d.ellipse([32 - r, 34 - r, 32 + r, 34 + r], fill=(255, 215, 0, a))
    # 상단 천상 헤일로 (빛의 고리)
    d.ellipse([20, 8, 44, 18], fill=None, outline=(255, 240, 150, 255), width=2)
    d.ellipse([22, 9, 42, 17], fill=None, outline=(255, 255, 255, 200), width=1)
    # 성기사 카이트 실드 (황금 기사 방패)
    # 상단 수평, 측면 곡선, 하단 뾰족
    shield_pts = [
        (16, 20), (48, 20),
        (50, 36), (44, 48), (32, 56), (20, 48), (14, 36)
    ]
    d.polygon(shield_pts, fill=(240, 190, 40, 255), outline=(130, 85, 10, 255))
    # 방패 내부 이너 패널
    inner_pts = [
        (19, 23), (45, 23),
        (47, 35), (41, 45), (32, 52), (23, 45), (17, 35)
    ]
    d.polygon(inner_pts, fill=(255, 230, 110, 255))
    # 방패 중앙 성스러운 하얀 십자가
    d.rectangle([29, 25, 35, 49], fill=(255, 255, 255, 255), outline=(200, 150, 30, 255))
    d.rectangle([21, 31, 43, 37], fill=(255, 255, 255, 255), outline=(200, 150, 30, 255))
    # 십자가 중앙 푸른 성수 보석
    d.ellipse([30, 32, 34, 36], fill=(0, 240, 255, 255))
    # 빛나는 반짝임
    d.line([(48, 16), (54, 16)], fill=(255, 255, 255, 240), width=1)
    d.line([(51, 13), (51, 19)], fill=(255, 255, 255, 240), width=1)
    img.save('public/assets/skills/skill_necro_armor.png')
    print("Created skill_necro_armor.png (홀리 아머 아이콘)")

# 7. 홀리 아머 인게임 오비탈 VFX (64x64)
def create_holy_armor_vfx():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 황금 신성 광휘 아우라
    for r, a in [(28, 40), (23, 75), (18, 120), (13, 170)]:
        d.ellipse([32 - r, 32 - r, 32 + r, 32 + r], fill=(255, 215, 0, a))
    # 8방향 성스러운 빛살
    for i in range(8):
        ang = math.radians(i * 45)
        x1 = 32 + math.cos(ang) * 16
        y1 = 32 + math.sin(ang) * 16
        x2 = 32 + math.cos(ang) * 27
        y2 = 32 + math.sin(ang) * 27
        d.line([(x1, y1), (x2, y2)], fill=(255, 250, 180, 220), width=2)
    # 황금 방패 형상 (중심)
    shield_pts = [
        (18, 16), (46, 16),
        (48, 32), (42, 44), (32, 52), (22, 44), (16, 32)
    ]
    d.polygon(shield_pts, fill=(245, 195, 45, 255), outline=(140, 90, 15, 255))
    inner_pts = [
        (21, 19), (43, 19),
        (45, 31), (39, 41), (32, 48), (25, 41), (19, 31)
    ]
    d.polygon(inner_pts, fill=(255, 235, 120, 255))
    # 방패 십자가
    d.rectangle([29, 21, 35, 44], fill=(255, 255, 255, 255), outline=(180, 130, 20, 255))
    d.rectangle([23, 27, 41, 33], fill=(255, 255, 255, 255), outline=(180, 130, 20, 255))
    d.ellipse([30, 28, 34, 32], fill=(0, 240, 255, 255))
    img.save('public/assets/skills/vfx/vfx_necro_armor.png')
    print("Created vfx_necro_armor.png (홀리 아머 VFX)")

# 8. 발키리 부대 아이콘 & VFX (64x64)
def create_valkyrie_squad():
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 찬란한 천상 배경광
    for r, a in [(30, 30), (25, 60), (20, 100), (15, 150)]:
        d.ellipse([32 - r, 32 - r, 32 + r, 32 + r], fill=(255, 230, 120, a))
    # 좌우 거대 순백/황금 날개 (천사/발키리의 날개)
    # 좌측 날개
    left_wing = [
        (30, 32), (20, 20), (6, 16), (2, 26), (10, 38), (20, 44), (28, 42)
    ]
    d.polygon(left_wing, fill=(255, 255, 255, 255), outline=(220, 180, 60, 255))
    # 우측 날개
    right_wing = [
        (34, 32), (44, 20), (58, 16), (62, 26), (54, 38), (44, 44), (36, 42)
    ]
    d.polygon(right_wing, fill=(255, 255, 255, 255), outline=(220, 180, 60, 255))
    # 깃털 디테일
    d.line([(8, 22), (24, 32)], fill=(230, 210, 140, 255), width=2)
    d.line([(12, 30), (26, 36)], fill=(230, 210, 140, 255), width=2)
    d.line([(56, 22), (40, 32)], fill=(230, 210, 140, 255), width=2)
    d.line([(52, 30), (38, 36)], fill=(230, 210, 140, 255), width=2)
    # 상단 황금빛 헤일로
    d.ellipse([22, 6, 42, 14], fill=None, outline=(255, 245, 160, 255), width=2)
    # 발키리 황금 투구 & 머리
    d.ellipse([26, 18, 38, 30], fill=(255, 225, 180, 255))
    d.polygon([(24, 16), (40, 16), (36, 24), (28, 24)], fill=(255, 215, 0, 255), outline=(160, 110, 20, 255))
    # 투구 날개 장식
    d.polygon([(24, 14), (20, 8), (25, 18)], fill=(255, 245, 180, 255))
    d.polygon([(40, 14), (44, 8), (39, 18)], fill=(255, 245, 180, 255))
    # 눈 (귀여운 픽셀 눈)
    d.rectangle([28, 22, 30, 25], fill=(30, 50, 100, 255))
    d.rectangle([34, 22, 36, 25], fill=(30, 50, 100, 255))
    # 발키리 황금 갑주 & 가슴판
    d.polygon([(26, 30), (38, 30), (36, 46), (28, 46)], fill=(245, 195, 45, 255), outline=(140, 90, 15, 255))
    # 중앙 푸른 수호석
    d.ellipse([30, 34, 34, 38], fill=(0, 230, 255, 255))
    # 오른손에 든 빛의 신성창
    d.line([(42, 12), (48, 54)], fill=(255, 255, 255, 255), width=2)
    d.polygon([(40, 10), (45, 4), (45, 14)], fill=(255, 220, 50, 255))
    img.save('public/assets/skills/vfx/vfx_awakened_armor.png')
    img.save('public/assets/pixel_vfx/skills/vfx_dk_ult.png')
    print("Created vfx_awakened_armor.png & vfx_dk_ult.png (발키리 부대)")

if __name__ == '__main__':
    create_dirs()
    create_mana_missile_icon()
    create_mana_missile_vfx()
    create_mana_storm_icon()
    create_mana_storm_vfx()
    create_jin_mana_storm()
    create_holy_armor_icon()
    create_holy_armor_vfx()
    create_valkyrie_squad()
