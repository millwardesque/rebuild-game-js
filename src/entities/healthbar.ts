import { StatusBar, StatusBarConfig } from './StatusBar';
import Phaser from 'phaser';

const HEALTH_BAR_WIDTH = 200;
const HEALTH_BAR_HEIGHT = 20;
const HEALTH_BAR_PADDING = 10;
const HEALTH_BAR_BACKGROUND_COLOR = 0x000000;
const HEALTH_BAR_FILL_COLOR = 0xff0000; // Red for health
const HEALTH_BAR_BORDER_COLOR = 0xffffff;
const DEFAULT_MAX_HEALTH = 100;

export class HealthBar extends StatusBar {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialMaxHealth: number = DEFAULT_MAX_HEALTH
  ) {
    const config: StatusBarConfig = {
      x: x,
      y: y,
      width: HEALTH_BAR_WIDTH,
      height: HEALTH_BAR_HEIGHT,
      padding: HEALTH_BAR_PADDING,
      backgroundColor: HEALTH_BAR_BACKGROUND_COLOR,
      fillColor: HEALTH_BAR_FILL_COLOR,
      borderColor: HEALTH_BAR_BORDER_COLOR,
      maxValue: initialMaxHealth,
    };
    super(scene, config);
  }

  public updateHealth(currentHealth: number, maxHealth?: number): void {
    this.setValue(currentHealth, maxHealth);
  }

  public getHealth(): number {
    return this.getValue();
  }

  public getMaxHealth(): number {
    return this.getMaxValue();
  }
}
