import 'phaser';
import { DigScene } from './scenes/DigScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TreasureHunterScene } from './scenes/TreasureHunterScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scene: [TreasureHunterScene, DigScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
