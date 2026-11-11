import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';

// 텍스트 고해상도 렌더링 패치:
// 화면을 축소하거나 고해상도(Retina/모바일) 디스플레이에서 폰트가 깨지거나 뭉개지지 않도록
// 텍스트 내부 캔버스 해상도를 기본 2배(devicePixelRatio 기반)로 선명하게 렌더링
const origText = (Phaser.GameObjects.GameObjectFactory.prototype as any).text;
(Phaser.GameObjects.GameObjectFactory.prototype as any).text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const mergedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    resolution: Math.max(2, window.devicePixelRatio || 2),
    ...style,
    fontFamily: style?.fontFamily ? `${style.fontFamily}, Pretendard, sans-serif` : 'NeoDunggeunmo, Pretendard, monospace, sans-serif',
  };
  return origText.call(this, x, y, text, mergedStyle);
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'app',
  backgroundColor: '#0c0908',
  pixelArt: false, // 캔버스 레벨 pixelated 비활성화 (화면 축소 시 글자 픽셀 탈락 깨짐 방지)
  antialias: false, // 픽셀 아트 스프라이트의 NEAREST 텍스처링 유지
  antialiasGL: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BattleScene, UIScene],
};

new Phaser.Game(config);
