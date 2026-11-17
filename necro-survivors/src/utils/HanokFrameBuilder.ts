import Phaser from 'phaser';

export interface HanokFrameOptions {
  /** 내부 한지-다크 배경 색상 (기본: 0x1b140f) */
  bgColor?: number;
  /** 내부 배경 투명도 (기본: 0.94) */
  bgAlpha?: number;
  /** 목재 문틀 기본 색상 (기본: 0x633a1e) */
  woodColor?: number;
  /** 놋쇠 장석/강조 색상 (기본: 0xd4a338) */
  accentColor?: number;
  /** 모서리 라운딩 반경 (기본: 3) */
  radius?: number;
  /** 창살(격자) 장식 표시 여부 (기본: true) */
  showLattice?: boolean;
}

/**
 * 실제 한옥 나무 문틀(문설주·상하인방 사개맞춤·띠살 창살·놋쇠 감잡이 장석) 스타일의
 * UI 프레임 Graphics를 생성해 반환합니다.
 */
export function drawHanokFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  options: HanokFrameOptions = {}
): Phaser.GameObjects.Graphics {
  const {
    bgColor = 0x1b140f,
    bgAlpha = 0.94,
    woodColor = 0x633a1e,
    accentColor = 0xd4a338,
    radius = 3,
    showLattice = true,
  } = options;

  const g = scene.add.graphics();
  const frameT = Math.min(11, Math.max(7, Math.floor(Math.min(w, h) * 0.06)));
  const ext = 4; // 사개맞춤(상하인방이 문설주 바깥으로 살짝 돌출되는 한옥 문틀 결구)

  // 1. 문틀 전체 드롭 섀도우
  g.fillStyle(0x090503, 0.85);
  g.fillRoundedRect(x - ext - 2, y - 2, w + ext * 2 + 4, h + 6, radius + 2);

  // 2. 내부 한지-다크 배경
  g.fillStyle(bgColor, bgAlpha);
  g.fillRect(x + frameT - 2, y + frameT - 2, w - (frameT - 2) * 2, h - (frameT - 2) * 2);

  // 3. 한옥 창호 창살(띠살 + 은은한 격자)
  if (showLattice && w >= 120 && h >= 80) {
    const innerX = x + frameT;
    const innerY = y + frameT;
    const innerW = w - frameT * 2;
    const innerH = h - frameT * 2;

    // 중앙 은은한 창살 격자 (텍스트 가독성을 위해 낮은 투명도 유지)
    g.lineStyle(1.5, woodColor, 0.18);
    const cols = Math.max(3, Math.min(8, Math.floor(innerW / 76)));
    const rows = Math.max(2, Math.min(6, Math.floor(innerH / 76)));
    for (let i = 1; i < cols; i++) {
      const lx = innerX + (innerW * i) / cols;
      g.lineBetween(lx, innerY, lx, innerY + innerH);
    }
    for (let j = 1; j < rows; j++) {
      const ly = innerY + (innerH * j) / rows;
      g.lineBetween(innerX, ly, innerX + innerW, ly);
    }

    // 상/하단 띠살 창호 장식대 (선명한 문틀 디테일)
    const bandH = Math.min(12, Math.floor(innerH * 0.09));
    if (bandH >= 6) {
      g.lineStyle(1.5, woodColor, 0.55);
      // 상단 띠살 가로줄 & 세로살
      g.lineBetween(innerX, innerY + bandH, innerX + innerW, innerY + bandH);
      // 하단 띠살 가로줄 & 세로살
      g.lineBetween(innerX, innerY + innerH - bandH, innerX + innerW, innerY + innerH - bandH);

      const subCols = Math.max(6, Math.floor(innerW / 32));
      for (let i = 1; i < subCols; i++) {
        const sx = innerX + (innerW * i) / subCols;
        g.lineBetween(sx, innerY, sx, innerY + bandH);
        g.lineBetween(sx, innerY + innerH - bandH, sx, innerY + innerH);
      }
    }
  }

  // 4. 한옥 나무 문틀 본체 (좌/우 문설주 + 상/하 인방)
  const woodDark = 0x2a160a;
  const woodHighlight = 0x8f5a34;

  // 좌·우 세로 문설주
  g.fillStyle(woodColor, 1);
  g.fillRect(x, y, frameT, h);
  g.fillRect(x + w - frameT, y, frameT, h);

  // 상·하 가로 인방 (양끝 사개맞춤 돌출)
  g.fillStyle(woodColor, 1);
  g.fillRoundedRect(x - ext, y, w + ext * 2, frameT, 2);
  g.fillRoundedRect(x - ext, y + h - frameT, w + ext * 2, frameT, 2);

  // 목재 입체감 (바깥 짙은 먹선 + 안쪽 밝은 나뭇결 하이라이트 + 안쪽 깊은 그림자)
  g.lineStyle(2, woodDark, 1);
  g.strokeRect(x, y, w, h);
  g.strokeRect(x + frameT, y + frameT, w - frameT * 2, h - frameT * 2);

  // 상단·좌측 햇빛 하이라이트 라인
  g.lineStyle(1.5, woodHighlight, 0.85);
  g.lineBetween(x - ext + 2, y + 2, x + w + ext - 2, y + 2);
  g.lineBetween(x + 2, y + frameT, x + 2, y + h - frameT);
  // 하단·안쪽 턱 하이라이트
  g.lineBetween(x + frameT, y + h - frameT + 2, x + w - frameT, y + h - frameT + 2);
  g.lineBetween(x + w - frameT + 2, y + frameT, x + w - frameT + 2, y + h - frameT);

  // 나뭇결 장식선
  g.lineStyle(1, woodDark, 0.45);
  g.lineBetween(x + 4, y + Math.floor(frameT * 0.55), x + w - 4, y + Math.floor(frameT * 0.55));
  g.lineBetween(x + 4, y + h - Math.floor(frameT * 0.45), x + w - 4, y + h - Math.floor(frameT * 0.45));

  // 5. 사방 모서리 놋쇠 감잡이 장석 + 광두정(못)
  const plate = Math.min(18, Math.max(11, frameT + 6));
  g.fillStyle(accentColor, 0.88);
  // 좌상 / 우상 / 좌하 / 우하 L자 장석
  const corners = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    // 가로 장석편
    g.fillRect(dx > 0 ? cx : cx - plate, dy > 0 ? cy : cy - frameT, plate, frameT);
    // 세로 장석편
    g.fillRect(dx > 0 ? cx : cx - frameT, dy > 0 ? cy : cy - plate, frameT, plate);
    // 장석 테두리 & 놋쇠 못
    g.lineStyle(1, woodDark, 0.9);
    g.strokeRect(dx > 0 ? cx : cx - plate, dy > 0 ? cy : cy - frameT, plate, frameT);
    g.fillStyle(0xfff0b3, 0.95);
    g.fillCircle(cx + dx * (frameT * 0.5), cy + dy * (frameT * 0.5), 1.6);
    g.fillStyle(accentColor, 0.88);
  }

  return g;
}

/**
 * 카드/버튼용 컴팩트한 한옥 나무 문틀 프레임 Graphics를 생성해 반환합니다.
 */
export function drawHanokCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: number = 0xd4a338,
  bgColor: number = 0x211812
): Phaser.GameObjects.Graphics {
  return drawHanokFrame(scene, x, y, w, h, {
    bgColor,
    bgAlpha: 0.95,
    woodColor: 0x633a1e,
    accentColor,
    radius: 3,
    showLattice: h >= 100,
  });
}
