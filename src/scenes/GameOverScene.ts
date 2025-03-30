import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private sceneToLaunch: string;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { sceneToLaunch: string }) {
    this.sceneToLaunch = data.sceneToLaunch;
  }

  create() {
    // Add semi-transparent black background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Center-align text and button
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 - 50;

    // Game Over text
    this.add
      .text(centerX, centerY, 'GAME OVER', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FF0000',
      })
      .setOrigin(0.5);

    // Restart button
    const restartButton = this.add
      .text(centerX, centerY + 100, 'Restart', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FFFFFF',
        backgroundColor: '#222222',
        padding: {
          left: 20,
          right: 20,
          top: 10,
          bottom: 10,
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button hover effects
    restartButton.on('pointerover', () => {
      restartButton.setStyle({ backgroundColor: '#444444' });
    });

    restartButton.on('pointerout', () => {
      restartButton.setStyle({ backgroundColor: '#222222' });
    });

    // Restart the DigScene when button is clicked
    restartButton.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      if (this.sceneToLaunch) {
        this.scene.get(this.sceneToLaunch).scene.restart();
      }
    });
  }
}
