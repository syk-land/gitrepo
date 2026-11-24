import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';

// High-DPI text rendering & typography patch:
// 1) Cap text supersampling at 2x to reduce mobile GPU texture memory and draw overhead
// 2) Force LINEAR filtering on text textures to keep scaled glyphs crisp
// 3) Add slight padding to prevent emoji/glyph clipping
const UI_FONT_STACK = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY_FONT_STACK = "'Cinzel', 'Inter', serif";

const origText = (Phaser.GameObjects.GameObjectFactory.prototype as any).text;
(Phaser.GameObjects.GameObjectFactory.prototype as any).text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const fontSizeNum = style?.fontSize ? parseInt(String(style.fontSize), 10) : 14;
  const isDisplayHeading = fontSizeNum >= 18 || style?.fontFamily?.includes('Cinzel');
  const resolvedFont = isDisplayHeading ? DISPLAY_FONT_STACK : UI_FONT_STACK;

  const mergedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    resolution: Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)),
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
          document.fonts.load('700 20px "Cinzel"'),
          document.fonts.load('600 16px "Inter"'),
        ]),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    }
  } catch {
    // Ignore font pre-load failures and proceed with fallback fonts
  }
  const game = new Phaser.Game(config);
  let resizeTimer: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimer !== null) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      game.scale.refresh();
    }, 120);
  });
}

void initGame();
