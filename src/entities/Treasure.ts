export class Treasure extends Phaser.Physics.Arcade.Image {
  private value: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    imageKey: string,
    value: number
  ) {
    super(scene, x, y, imageKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.value = value;
    this.setOrigin(0.0, 1.0);
    this.setDepth(1.0);

    this.setImmovable(true);

    scene.tweens.add({
      targets: this,
      y: this.y + 4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
  }

  getValue(): number {
    return this.value;
  }
}
