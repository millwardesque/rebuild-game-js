import Phaser from 'phaser';

const HEALTH_BAR_WIDTH = 200;
const HEALTH_BAR_HEIGHT = 20;
const HEALTH_BAR_PADDING = 10;
const HEALTH_BAR_BACKGROUND_COLOR = 0x000000;
const HEALTH_BAR_FILL_COLOR = 0xff0000;
const HEALTH_BAR_BORDER_COLOR = 0xffffff;

export class HealthBar extends Phaser.GameObjects.Container {
  private border: Phaser.GameObjects.Graphics;
  private background: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setScrollFactor(0);

    this.border = scene.add.graphics();
    this.add(this.border);

    this.background = scene.add.graphics();
    this.add(this.background);

    this.fill = scene.add.graphics();
    this.add(this.fill);
  }

  public updateHealthBar(currentHealth: number, maxHealth: number): void {
    // Position based on camera viewport
    const x = this.x + HEALTH_BAR_PADDING;
    const y = this.y + HEALTH_BAR_PADDING;

    // Clear previous graphics
    this.background.clear();
    this.fill.clear();
    this.border.clear();

    // Draw background
    this.background.fillStyle(HEALTH_BAR_BACKGROUND_COLOR);
    this.background.fillRect(x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    // Draw fill based on health percentage
    const fillWidth =
      Math.max(0, Math.min(1, currentHealth / maxHealth)) * HEALTH_BAR_WIDTH;
    this.fill.fillStyle(HEALTH_BAR_FILL_COLOR);
    this.fill.fillRect(x, y, fillWidth, HEALTH_BAR_HEIGHT);

    // Draw border
    this.border.lineStyle(2, HEALTH_BAR_BORDER_COLOR);
    this.border.strokeRect(x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
  }
}
