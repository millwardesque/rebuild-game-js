import Phaser from 'phaser';

const ROCK_SPEED = 400;
const ROCK_LIFETIME = 1000; // How long the rock exists in ms before automatic destruction

export class Rock extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number
  ) {
    super(scene, x, y, 'rock');

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set velocity based on direction
    this.setVelocity(velocityX * ROCK_SPEED, velocityY * ROCK_SPEED);

    // Set depth to appear above most objects
    this.setDepth(5);

    // Auto-destroy after lifetime expires
    scene.time.delayedCall(ROCK_LIFETIME, () => {
      this.destroy();
    });
  }
}
