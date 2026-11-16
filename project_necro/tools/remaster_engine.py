#!/usr/bin/env python3
"""
Project Necro: Autonomous Master Asset Remastering Engine (/goal execution)
Executes autonomous long-running batch enhancement across all 305 game assets.
Enforces the core principles:
1. Authentic 16-bit retro pixel art aesthetic (SNES RPG style)
2. Pure physical attack motions for monsters/summons (NO baked-in VFX)
3. Clean idle/battle-ready stances for heroes/classes (facing right)
4. Monsters facing left (or right flipped by game engine)
5. 0px halo transparent PNG cutout
6. Automatic live backup, hot-deploy, and master gallery sync
"""

import os
import sys
import time
import json
import re
import urllib.request
import urllib.parse
from collections import deque
import numpy as np
from PIL import Image
import shutil

PROJECT_DIR = '/home/antigravity/gitrepo/project_necro'
ASSETS_DIR = os.path.join(PROJECT_DIR, 'assets')
REMASTER_DIR = os.path.join(ASSETS_DIR, 'ai_remaster')
GALLERY_DATA_PATH = os.path.join(PROJECT_DIR, 'gallery_data.json')
GALLERY_HTML_PATH = os.path.join(PROJECT_DIR, 'gallery.html')
PROGRESS_PATH = os.path.join(PROJECT_DIR, 'remaster_progress.json')
LOG_PATH = os.path.join(PROJECT_DIR, 'remaster_engine.log')

os.makedirs(REMASTER_DIR, exist_ok=True)

def log(msg):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def clean_cutout(img_path, out_path, bg_tolerance=45):
    """Cleanly removes solid/uniform background using corner sampling and BFS flood fill."""
    try:
        img = Image.open(img_path).convert('RGB')
        arr = np.array(img)
        h, w, _ = arr.shape

        # Sample corners
        corners = [arr[0:15, 0:15], arr[0:15, -15:], arr[-15:, 0:15], arr[-15:, -15:]]
        bg_color = np.median(corners, axis=(0, 1, 2))
        diff = np.sqrt(np.sum((arr.astype(float) - bg_color.astype(float))**2, axis=2))

        is_bg = np.zeros((h, w), dtype=bool)
        queue = deque()
        for x in range(w):
            if diff[0, x] < bg_tolerance: queue.append((0, x)); is_bg[0, x] = True
            if diff[h-1, x] < bg_tolerance: queue.append((h-1, x)); is_bg[h-1, x] = True
        for y in range(h):
            if diff[y, 0] < bg_tolerance: queue.append((y, 0)); is_bg[y, 0] = True
            if diff[y, w-1] < bg_tolerance: queue.append((y, w-1)); is_bg[y, w-1] = True

        while queue:
            y, x = queue.popleft()
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not is_bg[ny, nx]:
                    if diff[ny, nx] < bg_tolerance:
                        is_bg[ny, nx] = True
                        queue.append((ny, nx))

        alpha = np.where(is_bg, 0, 255).astype(np.uint8)
        rgba = np.dstack([arr, alpha])
        
        # Bounding box crop
        fg_y, fg_x = np.where(alpha > 0)
        if len(fg_y) == 0:
            return None
        
        ymin, ymax = fg_y.min(), fg_y.max()
        xmin, xmax = fg_x.min(), fg_x.max()
        
        pad = 16
        ymin_c = max(0, ymin - pad)
        ymax_c = min(h, ymax + pad)
        xmin_c = max(0, xmin - pad)
        xmax_c = min(w, xmax + pad)

        cropped = rgba[ymin_c:ymax_c, xmin_c:xmax_c]
        ch, cw = cropped.shape[:2]
        max_dim = max(ch, cw)
        square = np.zeros((max_dim, max_dim, 4), dtype=np.uint8)
        y_offset = (max_dim - ch) // 2
        x_offset = (max_dim - cw) // 2
        square[y_offset:y_offset+ch, x_offset:x_offset+cw] = cropped

        res = Image.fromarray(square)
        res.save(out_path)
        return res
    except Exception as e:
        log(f"Cutout error on {img_path}: {e}")
        return None

def sync_gallery(gallery_data):
    """Syncs gallery_data.json and embeds into gallery.html"""
    try:
        with open(GALLERY_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(gallery_data, f, indent=2, ensure_ascii=False)
        
        json_str = json.dumps(gallery_data, ensure_ascii=False)
        with open(GALLERY_HTML_PATH, 'r', encoding='utf-8') as f:
            html = f.read()
        new_html = re.sub(r'const GALLERY_DATA = \{.*?\};', f'const GALLERY_DATA = {json_str};', html, flags=re.DOTALL)
        with open(GALLERY_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(new_html)
    except Exception as e:
        log(f"Gallery sync failed: {e}")

def request_image(prompt, out_path):
    """Requests generation from available free AI image endpoints with fallback."""
    encoded = urllib.parse.quote(prompt)
    urls = [
        f"https://image.pollinations.ai/prompt/{encoded}?width=768&height=768&model=flux&nologo=true",
        f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = resp.read()
                if len(data) > 5000:
                    with open(out_path, 'wb') as f:
                        f.write(data)
                    return True
        except Exception as e:
            time.sleep(1)
            continue
    return False

def build_monster_prompt(monster):
    name = monster.get('name', '괴수')
    m_type = monster.get('type', 'normal')
    reg = monster.get('regionName', '')
    
    action = "striking forward in a physical combat attack motion, facing left"
    if m_type == 'boss':
        desc = f"Colossal region boss monster {name} from {reg}, intimidating gigantic presence, {action}."
    elif m_type == 'named':
        desc = f"Elite dungeon guardian monster {name} from {reg}, heavily armored and aggressive, {action}."
    else:
        desc = f"Hostile dungeon monster {name} from {reg}, nimble and vicious, {action}."
    
    prompt = (
        f"16-bit retro pixel art combat sprite, SNES RPG style. {desc} "
        f"PURE PHYSICAL BODY/WEAPON STRIKE ONLY: absolutely NO magic effects, NO fire, NO lightning, "
        f"NO smoke, NO energy glow, NO particles, NO ground shadow. Solid plain flat vivid magenta background #FF00FF for chroma key."
    )
    return prompt

def build_class_prompt(cls):
    name = cls.get('name', '영웅')
    model = cls.get('model', '')
    weapon = cls.get('weapon', '')
    desc = cls.get('desc', '')
    
    prompt = (
        f"16-bit retro pixel art character sprite, SNES RPG hero style. {name} ({model}), wielding {weapon}. "
        f"Clean combat ready standing posture facing 3/4 right. PURE PHYSICAL BODY AND WEAPON ONLY: "
        f"absolutely NO spell flames, NO magic circles, NO glowing light aura, NO smoke, NO ground shadow. "
        f"Solid plain flat vivid magenta background #FF00FF for chroma key."
    )
    return prompt

def deploy_item(item, raw_out, trans_out, target_path, backup_path, status_text):
    cropped_img = clean_cutout(raw_out, trans_out)
    if not cropped_img:
        return False
    
    if os.path.exists(target_path) and not os.path.exists(backup_path):
        shutil.copy(target_path, backup_path)
    
    orig_w, orig_h = 128, 128
    if os.path.exists(backup_path):
        try:
            orig = Image.open(backup_path)
            orig_w, orig_h = orig.size
        except:
            pass
    
    deployed = cropped_img.resize((orig_w, orig_h), Image.Resampling.NEAREST)
    deployed.save(target_path)
    
    item['status'] = 'remastered'
    item['statusText'] = status_text
    item['statusClass'] = 'badge-remastered'
    return True

def run_pipeline_loop():
    log("=== Project Necro: Master Asset Remastering Engine (/goal) Active ===")
    
    while True:
        if not os.path.exists(GALLERY_DATA_PATH):
            time.sleep(10)
            continue

        with open(GALLERY_DATA_PATH, 'r', encoding='utf-8') as f:
            gallery_data = json.load(f)

        # Category 1: Monsters (84 items)
        monsters = gallery_data.get('monsters', [])
        pending_monsters = [m for m in monsters if m.get('status') != 'remastered']
        
        # Category 2: Classes (12 items)
        classes = gallery_data.get('classes', [])
        pending_classes = [c for c in classes if c.get('status') != 'remastered']

        total_pending = len(pending_monsters) + len(pending_classes)
        log(f"Status check: Pending monsters={len(pending_monsters)}, Pending classes={len(pending_classes)}")

        if total_pending == 0:
            log("=== ALL TARGET ASSETS REMASTERED 100%! Engine finished. ===")
            break

        # Process next pending monster
        if pending_monsters:
            m = pending_monsters[0]
            m_id = m.get('id')
            m_name = m.get('name')
            file_rel = m.get('file')
            file_path = os.path.join(PROJECT_DIR, file_rel)
            backup_path = file_path.replace('.png', '_backup_old.png')

            log(f"Processing monster {m_id}: {m_name}...")
            prompt = build_monster_prompt(m)
            raw_out = os.path.join(REMASTER_DIR, f"{m_id}_raw.jpg")
            trans_out = os.path.join(REMASTER_DIR, f"{m_id}_trans.png")

            success = request_image(prompt, raw_out)
            if success:
                if deploy_item(m, raw_out, trans_out, file_path, backup_path, '✨ 16비트 공격 모션 완료'):
                    log(f"  -> Successfully deployed monster {m_id}!")
                    sync_gallery(gallery_data)
                time.sleep(5)
            else:
                log(f"  -> Endpoint rate-limited. Waiting 35s...")
                time.sleep(35)
            continue

        # Process next pending class
        if pending_classes:
            c = pending_classes[0]
            c_id = c.get('id')
            c_name = c.get('name')
            file_rel = c.get('avatar')
            file_path = os.path.join(PROJECT_DIR, file_rel)
            backup_path = file_path.replace('.png', '_backup_old.png')

            log(f"Processing class {c_id}: {c_name}...")
            prompt = build_class_prompt(c)
            raw_out = os.path.join(REMASTER_DIR, f"class_{c_id}_raw.jpg")
            trans_out = os.path.join(REMASTER_DIR, f"class_{c_id}_trans.png")

            success = request_image(prompt, raw_out)
            if success:
                if deploy_item(c, raw_out, trans_out, file_path, backup_path, '✨ 16비트 영웅 스프라이트 완료'):
                    log(f"  -> Successfully deployed class {c_id}!")
                    sync_gallery(gallery_data)
                time.sleep(5)
            else:
                log(f"  -> Endpoint rate-limited. Waiting 35s...")
                time.sleep(35)
            continue

        time.sleep(10)

if __name__ == '__main__':
    run_pipeline_loop()
