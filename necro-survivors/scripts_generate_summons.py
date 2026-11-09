import os
import math
from PIL import Image, ImageDraw, ImageFilter

SUMMONS_DIR = "public/assets/summons"
os.makedirs(SUMMONS_DIR, exist_ok=True)

def generate_skeleton_warrior():
    # 96x96 high detail pixel art
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    
    # Bone colors
    c_bone_hi = (252, 248, 238, 255)
    c_bone = (230, 222, 204, 255)
    c_bone_shd = (180, 168, 146, 255)
    c_bone_dark = (120, 108, 92, 255)
    c_outline = (32, 26, 22, 255)
    c_soul = (0, 255, 170, 255)
    c_soul_glow = (0, 220, 140, 160)
    
    # 1. 두개골 (Skull) - 38 to 56, 14 to 32
    d.rectangle([39, 14, 55, 27], fill=c_bone, outline=c_outline)
    d.rectangle([41, 15, 53, 24], fill=c_bone_hi)
    # 턱 (Jaw)
    d.rectangle([43, 28, 51, 33], fill=c_bone, outline=c_outline)
    # 이빨 (Teeth)
    for tx in [44, 46, 48, 50]:
        d.line([(tx, 27), (tx, 29)], fill=c_bone_hi)
        d.point([(tx, 28)], fill=c_outline)
    # 안와 (Eye sockets) & 영혼 안광
    d.rectangle([41, 20, 45, 25], fill=(15, 12, 10, 255))
    d.rectangle([49, 20, 53, 25], fill=(15, 12, 10, 255))
    d.rectangle([42, 21, 44, 24], fill=c_soul)
    d.rectangle([50, 21, 52, 24], fill=c_soul)
    # 코 (Nasal cavity)
    d.polygon([(47, 24), (46, 26), (48, 26)], fill=c_outline)
    # 이마 균열
    d.line([(44, 15), (46, 18)], fill=c_bone_shd)
    
    # 2. 척추 (Spine)
    for sy in range(34, 56, 3):
        d.rectangle([45, sy, 48, sy+2], fill=c_bone_hi, outline=c_outline)
        
    # 3. 흉곽 갈비뼈 (Ribcage)
    ribs = [(38, 55, 37), (35, 58, 41), (36, 57, 45), (38, 55, 49), (41, 52, 53)]
    for rx1, rx2, ry in ribs:
        # 좌측 갈비뼈
        d.line([(45, ry), (rx1, ry+2)], fill=c_bone_hi, width=2)
        d.line([(rx1, ry+2), (rx1+2, ry+4)], fill=c_bone_shd, width=2)
        # 우측 갈비뼈
        d.line([(48, ry), (rx2, ry+2)], fill=c_bone_hi, width=2)
        d.line([(rx2, ry+2), (rx2-2, ry+4)], fill=c_bone_shd, width=2)
    # 흉곽 내부 영혼석 핵 (Glowing Soul Core)
    d.ellipse([44, 41, 49, 46], fill=c_soul)
    d.ellipse([42, 39, 51, 48], outline=c_soul_glow, width=1)
    
    # 4. 골반 (Pelvis)
    d.rectangle([41, 56, 52, 60], fill=c_bone, outline=c_outline)
    d.polygon([(44, 57), (49, 57), (46, 61)], fill=c_outline)
    
    # 5. 다리뼈 (Legs)
    # 왼다리
    d.line([(43, 61), (40, 72)], fill=c_bone_hi, width=3) # 대퇴골
    d.rectangle([39, 71, 42, 74], fill=c_bone_shd, outline=c_outline) # 무릎
    d.line([(41, 74), (39, 86)], fill=c_bone, width=3) # 경골
    d.rectangle([36, 86, 42, 89], fill=c_bone_shd, outline=c_outline) # 발뼈
    # 오른다리
    d.line([(50, 61), (53, 72)], fill=c_bone_hi, width=3)
    d.rectangle([51, 71, 54, 74], fill=c_bone_shd, outline=c_outline)
    d.line([(52, 74), (54, 86)], fill=c_bone, width=3)
    d.rectangle([52, 86, 58, 89], fill=c_bone_shd, outline=c_outline)
    
    # 6. 왼팔 & 원형 철갑 방패 (Shield)
    d.line([(38, 38), (28, 46)], fill=c_bone, width=3)
    # 방패 몸통
    d.ellipse([14, 38, 34, 62], fill=(68, 62, 58, 255), outline=(130, 120, 110, 255), width=2)
    d.ellipse([18, 42, 30, 58], fill=(95, 88, 80, 255))
    d.ellipse([21, 47, 27, 53], fill=c_bone, outline=c_outline) # 방패 중심 뼈 문양
    d.point([(24, 50)], fill=c_soul)
    # 방패 징 (Rivets)
    for bx, by in [(24, 39), (24, 61), (15, 50), (33, 50)]:
        d.point([(bx, by)], fill=(190, 180, 160, 255))
        
    # 7. 오른팔 & 거대 사령 뼈검 (Bone Blade)
    d.line([(55, 38), (66, 44)], fill=c_bone, width=3)
    # 칼자루
    d.rectangle([65, 43, 68, 50], fill=(80, 55, 35, 255), outline=c_outline)
    d.rectangle([62, 49, 71, 52], fill=(130, 100, 60, 255))
    # 뼈검 검신 (Bone Scimitar)
    d.polygon([(67, 52), (78, 22), (83, 20), (74, 52)], fill=c_bone_hi, outline=c_outline)
    d.line([(70, 50), (80, 22)], fill=c_soul, width=2) # 칼날 영혼광 룬
    
    # 외곽선 보강
    im.save(os.path.join(SUMMONS_DIR, "minion_skeleton_warrior.png"))
    print("Generated minion_skeleton_warrior.png")

def generate_skeleton_archer():
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    
    c_bone_hi = (252, 248, 238, 255)
    c_bone = (230, 222, 204, 255)
    c_bone_shd = (180, 168, 146, 255)
    c_outline = (32, 26, 22, 255)
    c_soul = (0, 255, 170, 255)
    c_hood = (58, 42, 68, 255)
    c_hood_hi = (82, 62, 96, 255)
    
    # 1. 두건 및 해골 두개골
    # 두건 외형
    d.polygon([(36, 12), (58, 12), (61, 26), (33, 26)], fill=c_hood, outline=c_outline)
    d.polygon([(39, 14), (55, 14), (57, 22), (37, 22)], fill=c_hood_hi)
    # 노출된 해골 안면
    d.rectangle([40, 22, 54, 32], fill=c_bone, outline=c_outline)
    d.rectangle([42, 23, 52, 30], fill=c_bone_hi)
    # 눈구멍 & 에메랄드 안광
    d.rectangle([42, 24, 46, 28], fill=(15, 12, 10, 255))
    d.rectangle([48, 24, 52, 28], fill=(15, 12, 10, 255))
    d.rectangle([43, 25, 45, 27], fill=c_soul)
    d.rectangle([49, 25, 51, 27], fill=c_soul)
    # 턱
    d.rectangle([44, 31, 50, 35], fill=c_bone, outline=c_outline)
    
    # 2. 척추 및 갈비뼈
    for sy in range(36, 56, 3):
        d.rectangle([45, sy, 48, sy+2], fill=c_bone_hi, outline=c_outline)
    for ry in [38, 42, 46, 50, 53]:
        d.line([(38, ry), (56, ry)], fill=c_bone_hi, width=2)
        
    # 등에 멘 화살통
    d.polygon([(32, 30), (37, 28), (41, 52), (36, 54)], fill=(90, 60, 35, 255), outline=c_outline)
    # 화살 깃
    d.line([(32, 22), (34, 30)], fill=c_bone_hi, width=2)
    d.line([(35, 20), (36, 30)], fill=c_bone_hi, width=2)
    d.line([(38, 22), (38, 30)], fill=c_bone_hi, width=2)
    
    # 3. 골반 및 다리
    d.rectangle([41, 56, 52, 60], fill=c_bone, outline=c_outline)
    # 궁수 사격 보법
    d.line([(42, 60), (36, 73)], fill=c_bone_hi, width=3)
    d.line([(36, 73), (32, 88)], fill=c_bone, width=3)
    d.rectangle([28, 87, 34, 90], fill=c_bone_shd, outline=c_outline)
    
    d.line([(51, 60), (55, 73)], fill=c_bone_hi, width=3)
    d.line([(55, 73), (58, 88)], fill=c_bone, width=3)
    d.rectangle([(56, 87), (62, 90)], fill=c_bone_shd, outline=c_outline)
    
    # 4. 팔과 뼈 활 (Bone Bow) 조준 자세
    d.line([(40, 39), (48, 32)], fill=c_bone, width=3) # 시위 당기는 오른팔
    d.line([(54, 39), (68, 38)], fill=c_bone, width=3) # 활 뻗은 왼팔
    
    # 거대 뼈 활대 (곡선)
    d.arc([58, 16, 78, 68], start=270, end=90, fill=c_bone_hi, width=4)
    d.arc([59, 15, 79, 69], start=270, end=90, fill=c_outline, width=1)
    # 빛의 활시위
    d.line([(68, 16), (48, 38)], fill=(0, 255, 220, 220), width=1)
    d.line([(48, 38), (68, 68)], fill=(0, 255, 220, 220), width=1)
    # 장전된 관통 영혼 화살
    d.line([(46, 38), (86, 38)], fill=c_soul, width=3)
    d.polygon([(86, 35), (92, 38), (86, 41)], fill=(180, 255, 240, 255), outline=c_outline)
    
    im.save(os.path.join(SUMMONS_DIR, "minion_skeleton_archer.png"))
    print("Generated minion_skeleton_archer.png")

def generate_skeleton_mage():
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    
    c_bone_hi = (252, 248, 238, 255)
    c_bone = (230, 222, 204, 255)
    c_outline = (32, 26, 22, 255)
    c_purple = (180, 50, 255, 255)
    c_purple_dark = (50, 20, 80, 255)
    c_gold = (255, 215, 0, 255)
    
    # 1. 흑마도 로브 하단 (Tattered Robe)
    d.polygon([(36, 34), (20, 88), (62, 88), (56, 34)], fill=(32, 18, 48, 255), outline=c_outline)
    # 로브 금빛 룬 장식 띠
    d.line([(24, 85), (58, 85)], fill=c_gold, width=2)
    d.line([(41, 38), (41, 85)], fill=c_gold, width=2)
    
    # 2. 로브 후드 & 드러난 해골 안면
    d.polygon([(34, 10), (60, 10), (64, 32), (30, 32)], fill=c_purple_dark, outline=c_outline)
    d.rectangle([39, 18, 55, 30], fill=c_bone, outline=c_outline)
    d.rectangle([41, 19, 53, 27], fill=c_bone_hi)
    # 보라색 비전 마도 안광
    d.rectangle([42, 21, 46, 25], fill=(15, 10, 20, 255))
    d.rectangle([48, 21, 52, 25], fill=(15, 10, 20, 255))
    d.rectangle([43, 22, 45, 24], fill=c_purple)
    d.rectangle([49, 22, 51, 24], fill=c_purple)
    # 턱 & 이빨
    d.rectangle([44, 29, 50, 33], fill=c_bone, outline=c_outline)
    
    # 3. 마법 시전하는 왼손 (Magic Hand)
    d.line([(34, 40), (22, 44)], fill=c_bone, width=3)
    # 손끝 회전하는 마력 구체
    d.ellipse([14, 38, 24, 48], fill=c_purple, outline=(230, 180, 255, 255))
    d.ellipse([11, 35, 27, 51], outline=(150, 50, 255, 150), width=1)
    
    # 4. 오른손 사령 지팡이 (Necromancer Staff)
    d.line([(56, 42), (68, 46)], fill=c_bone, width=3)
    # 거대 뼈 지팡이 몸체
    d.line([(70, 8), (70, 88)], fill=(140, 115, 85, 255), width=4)
    d.line([(70, 8), (70, 88)], fill=(200, 180, 150, 255), width=2)
    # 지팡이 머리: 미니 두개골 조각
    d.ellipse([64, 10, 76, 22], fill=c_bone_hi, outline=c_outline)
    d.point([(67, 15), (73, 15)], fill=c_purple)
    # 지팡이 꼭대기 부유하는 영혼 보옥
    d.ellipse([65, 0, 75, 10], fill=c_purple, outline=c_gold)
    d.ellipse([61, -3, 79, 13], outline=(255, 100, 255, 160), width=1)
    
    im.save(os.path.join(SUMMONS_DIR, "minion_skeleton_mage.png"))
    print("Generated minion_skeleton_mage.png")

def generate_drone():
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    
    c_metal_dark = (35, 42, 58, 255)
    c_metal = (60, 75, 105, 255)
    c_metal_hi = (110, 135, 180, 255)
    c_cyan = (0, 240, 255, 255)
    c_cyan_glow = (0, 180, 255, 140)
    c_outline = (18, 22, 32, 255)
    
    # 1. 반중력 호버 링 (Anti-Grav Thruster Ring)
    d.ellipse([20, 56, 76, 76], fill=(20, 28, 44, 255), outline=c_cyan, width=2)
    d.ellipse([28, 60, 68, 72], fill=c_cyan_glow)
    # 반중력 플라즈마 분사 파티클
    for px in [32, 40, 48, 56, 64]:
        d.line([(px, 72), (px, 86)], fill=c_cyan, width=2)
        d.point([(px, 88)], fill=(180, 255, 255, 255))
        
    # 2. 드론 주 기체 (Saucer Drone Hull)
    d.ellipse([22, 30, 74, 60], fill=c_metal, outline=c_outline, width=2)
    d.ellipse([26, 32, 70, 52], fill=c_metal_hi)
    
    # 3. 좌우 날개 및 플라즈마 레이저 포탑 (Twin Plasma Blasters)
    # 좌측 포탑
    d.polygon([(16, 40), (26, 36), (24, 48), (14, 46)], fill=c_metal_dark, outline=c_outline)
    d.rectangle([8, 41, 16, 45], fill=(80, 95, 125, 255), outline=c_outline)
    d.rectangle([6, 42, 8, 44], fill=c_cyan) # 총구 플라즈마 충전
    # 우측 포탑
    d.polygon([(80, 40), (70, 36), (72, 48), (82, 46)], fill=c_metal_dark, outline=c_outline)
    d.rectangle([80, 41, 88, 45], fill=(80, 95, 125, 255), outline=c_outline)
    d.rectangle([88, 42, 90, 44], fill=c_cyan)
    
    # 4. 상단 돔 및 센서 옵티컬 아이 (Central Cyan Lens)
    d.ellipse([34, 20, 62, 42], fill=c_metal_dark, outline=c_outline, width=2)
    d.ellipse([38, 22, 58, 38], fill=c_metal)
    # 중앙 센서 렌즈
    d.ellipse([42, 26, 54, 34], fill=c_cyan, outline=(255, 255, 255, 255), width=1)
    d.point([(46, 29), (47, 29)], fill=(255, 255, 255, 255)) # 렌즈 반사광
    
    # 5. 통신 안테나 (Sci-Fi Antenna)
    d.line([(48, 14), (48, 20)], fill=c_metal_hi, width=2)
    d.point([(48, 13)], fill=(255, 50, 80, 255)) # 적색 통신 비콘
    
    im.save(os.path.join(SUMMONS_DIR, "minion_drone.png"))
    print("Generated minion_drone.png")

generate_skeleton_warrior()
generate_skeleton_archer()
generate_skeleton_mage()
generate_drone()
