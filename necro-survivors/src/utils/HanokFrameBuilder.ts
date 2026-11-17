import Phaser from 'phaser';

export interface HanokFrameOptions {
  /** 내부 한지-다크 배경 색상 (기본: 0x1a130e) */
  bgColor?: number;
  /** 내부 배경 투명도 (기본: 0.94) */
  bgAlpha?: number;
  /** 외곽 나무 테두리 강조색 (기본: 0x7c4f2b) */
  woodColor?: number;
  /** 모서리 장석/내부 포인트 테두리색 (기본: 0xd4a338) */
  accentColor?: number;
  /** 모서리 라운딩 반경 (기본: 6) */
  radius?: number;
  /** 창살(격자) 장식 표시 여부 (기본: true) */
  showLattice?: boolean;
}

/**
 * 한옥 나무 창호(창살 + 한지 + 장석) 스타일의 UI 프레임 Graphics를 생성해 반환합니다.
 * 어떠한 크기의 메뉴/모달/카드에도 픽셀 깨짐 없이 깔끔한 전통 창호 느낌을 입힙니다.
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
    bgColor = 0x1a130e,
    bgAlpha = 0.94,
    woodColor = 0x7a4b2a,
    accentColor = 0xd4a338,
    radius = 6,
    showLattice = true,
  } = options;

  const g = scene.add.graphics();

  // 1. 어두운 바깥 나무 그림자/외곽선
  g.fillStyle(0x0c0806, 0.9);
  g.fillRoundedRect(x - 3, y - 3, w + 6, h + 6, radius + 2);

  // 2. 따뜻한 한지-다크 배경 채우기
  g.fillStyle(bgColor, bgAlpha);
  g.fillRoundedRect(x, y, w, h, radius);

  // 3. 은은한 창살 격자 무늬 (내용을 가리지 않도록 낮은 투명도)
  if (showLattice && w >= 120 && h >= 80) {
    const pad = 12;
    const innerX = x + pad;
    const innerY = y + pad;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    // 얇은 한옥 창살 세로/가로선
    g.lineStyle(1, woodColor, 0.22);
    const cols = Math.max(2, Math.min(6, Math.floor(innerW / 90)));
    const rows = Math.max(2, Math.min(5, Math.floor(innerH / 90)));

    for (let i = 1; i < cols; i++) {
      const lx = innerX + (innerW * i) / cols;
      g.lineBetween(lx, y + 6, lx, y + h - 6);
    }
    for (let j = 1; j < rows; j++) {
      const ly = innerY + (innerH * j) / rows;
      g.lineBetween(x + 6, ly, x + w - 6, ly);
    }

    // 상/하단 전통 띠살(완자창) 포인트 라인
    g.lineStyle(1.5, woodColor, 0.55);
    g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  }

  // 4. 한옥 나무 외곽 프레임 (이중 목재 테두리)
  g.lineStyle(4, 0x3b2212, 1);
  g.strokeRoundedRect(x, y, w, h, radius);

  g.lineStyle(2, woodColor, 1);
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, Math.max(2, radius - 1));

  // 5. 네 모서리 전통 놋쇠(금속) 장석 ㄱ자 장식
  const bracket = Math.min(14, Math.floor(Math.min(w, h) * 0.16));
  g.lineStyle(2, accentColor, 0.9);

  // 좌상
  g.lineBetween(x + 4, y + 4 + bracket, x + 4, y + 4);
  g.lineBetween(x + 4, y + 4, x + 4 + bracket, y + 4);
  // 우상
  g.lineBetween(x + w - 4 - bracket, y + 4, x + w - 4, y + 4);
  g.lineBetween(x + w - 4, y + 4, x + w - 4, y + 4 + bracket);
  // 좌하
  g.lineBetween(x + 4, y + h - 4 - bracket, x + 4, y + h - 4);
  g.lineBetween(x + 4, y + h - 4, x + 4 + bracket, y + h - 4);
  // 우하
  g.lineBetween(x + w - 4 - bracket, y + h - 4, x + w - 4, y + h - 4);
  g.lineBetween(x + w - 4, y + h - 4 - bracket, x + w - 4, y + h - 4);

  return g;
}

/**
 * 카드/버튼용 컴팩트한 한옥 나무 창호 프레임 Graphics를 생성해 반환합니다.
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
    woodColor: 0x6e4324,
    accentColor,
    radius: 5,
    showLattice: h >= 100,
  });
}
