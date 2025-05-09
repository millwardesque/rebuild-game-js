import 'phaser';
import { DigScene } from './scenes/DigScene';
import { DiverScene } from './scenes/DiverScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TreasureHunterScene } from './scenes/TreasureHunterScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scene: [DiverScene, TreasureHunterScene, DigScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
