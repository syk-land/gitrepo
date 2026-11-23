import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';

// 텍스트 고해상도 렌더링 & 고급 타이포그래피 패치:
// 1) 해상도 변화 및 고해상도(Retina/모바일) 환경에서 폰트가 깨지지 않도록 2~3배 슈퍼샘플링 적용
// 2) 텍스트 내부 텍스처에 LINEAR 필터를 강제하여 축소/확대 시 글자 획 탈락 방지
// 3) padding을 부여해 이모지 상하단 클리핑 방지
const UI_FONT_STACK = "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY_FONT_STACK = "'Cinzel', 'Gowun Batang', 'Pretendard Variable', 'Pretendard', serif";

const origText = (Phaser.GameObjects.GameObjectFactory.prototype as any).text;
(Phaser.GameObjects.GameObjectFactory.prototype as any).text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const fontSizeNum = style?.fontSize ? parseInt(String(style.fontSize), 10) : 14;
  const isDisplayHeading = fontSizeNum >= 18 || style?.fontFamily?.includes('Gowun Batang') || style?.fontFamily?.includes('Cinzel');
  const resolvedFont = isDisplayHeading ? DISPLAY_FONT_STACK : UI_FONT_STACK;

  const mergedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    resolution: Math.min(3, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2))),
    padding: { x: 4, y: 3 },
    shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true },
    ...style,
    fontFamily: style?.fontFamily && !style.fontFamily.includes('NeoDunggeunmo')
      ? `${style.fontFamily}, ${resolvedFont}`
      : resolvedFont,
  };
  const textObj = origText.call(this, x, y, text, mergedStyle) as Phaser.GameObjects.Text;
  if (textObj && textObj.texture) {
    textObj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  return textObj;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'app',
  backgroundColor: '#0c0908',
  pixelArt: true,
  antialias: false,
  antialiasGL: false,
  roundPixels: true,
  input: {
    activePointers: 4, // 멀티터치 지원 (조이스틱 조작 중 필살기 및 배속 버튼 동시 터치)
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BattleScene, UIScene],
};

async function initGame(): Promise<void> {
  try {
    if (document.fonts) {
      await Promise.race([
        Promise.all([
          document.fonts.load('700 20px "Gowun Batang"'),
          document.fonts.load('700 16px "Pretendard Variable"'),
          document.fonts.ready,
        ]),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);
    }
  } catch {
    // Ignore font pre-load failures and proceed with fallback fonts
  }
  const game = new Phaser.Game(config);
  window.addEventListener('resize', () => {
    game.scale.refresh();
  });
}

void initGame();
