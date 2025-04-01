import Phaser from 'phaser';

export interface StatusBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  backgroundColor: number;
  fillColor: number;
  borderColor: number;
  borderWidth?: number; // Optional border width
  maxValue: number; // Initial max value
}

export class StatusBar extends Phaser.GameObjects.Container {
  protected config: StatusBarConfig;
  protected border: Phaser.GameObjects.Graphics;
  protected background: Phaser.GameObjects.Graphics;
  protected fill: Phaser.GameObjects.Graphics;
  protected currentValue: number;
  protected maxValue: number;

  constructor(scene: Phaser.Scene, config: StatusBarConfig) {
    super(scene, config.x, config.y);
    scene.add.existing(this);
    this.setScrollFactor(0); // Keep it fixed relative to the camera

    this.config = config;
    this.maxValue = config.maxValue;
    this.currentValue = config.maxValue; // Start full

    this.border = scene.add.graphics();
    this.add(this.border);

    this.background = scene.add.graphics();
    this.add(this.background);

    this.fill = scene.add.graphics();
    this.add(this.fill);

    this.draw(); // Initial draw
  }

  public setValue(current: number, max?: number): void {
    this.currentValue = Math.max(0, Math.min(max ?? this.maxValue, current));
    if (max !== undefined) {
      this.maxValue = max;
    }
    this.draw();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public getMaxValue(): number {
    return this.maxValue;
  }

  protected draw(): void {
    // Position based on container origin (0,0) and padding
    const x = this.config.padding;
    const y = this.config.padding;
    const width = this.config.width;
    const height = this.config.height;
    const borderWidth = this.config.borderWidth ?? 2; // Default border width

    // Clear previous graphics
    this.background.clear();
    this.fill.clear();
    this.border.clear();

    // Draw background
    this.background.fillStyle(this.config.backgroundColor);
    this.background.fillRect(x, y, width, height);

    // Draw fill based on value percentage
    const fillWidth =
      Math.max(0, Math.min(1, this.currentValue / this.maxValue)) * width;
    this.fill.fillStyle(this.config.fillColor);
    this.fill.fillRect(x, y, fillWidth, height);

    // Draw border
    if (borderWidth > 0) {
        this.border.lineStyle(borderWidth, this.config.borderColor);
        this.border.strokeRect(x, y, width, height);
    }
  }
}
