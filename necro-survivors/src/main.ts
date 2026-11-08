import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  parent: 'app',
  backgroundColor: '#0c0908',
  pixelArt: true, // 도트 안티앨리어싱 해제 (선명한 레트로 픽셀)
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BattleScene, UIScene],
};

new Phaser.Game(config);
