import { StatusBar, StatusBarConfig } from './StatusBar';
import Phaser from 'phaser';

// Define constants specific to the Oxygen Bar
const OXYGEN_BAR_WIDTH = 200;
const OXYGEN_BAR_HEIGHT = 20;
const OXYGEN_BAR_PADDING = 10;
const OXYGEN_BAR_BACKGROUND_COLOR = 0x000000;
const OXYGEN_BAR_FILL_COLOR = 0x0000ff; // Blue for oxygen
const OXYGEN_BAR_BORDER_COLOR = 0xffffff;
const DEFAULT_MAX_OXYGEN = 100; // Or adjust as needed

export class OxygenBar extends StatusBar {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialMaxOxygen: number = DEFAULT_MAX_OXYGEN
  ) {
    const config: StatusBarConfig = {
      x: x,
      y: y,
      width: OXYGEN_BAR_WIDTH,
      height: OXYGEN_BAR_HEIGHT,
      padding: OXYGEN_BAR_PADDING,
      backgroundColor: OXYGEN_BAR_BACKGROUND_COLOR,
      fillColor: OXYGEN_BAR_FILL_COLOR,
      borderColor: OXYGEN_BAR_BORDER_COLOR,
      maxValue: initialMaxOxygen,
      // borderWidth is optional, defaults to 2 in StatusBar
    };
    super(scene, config);
  }

  // Expose a specific method for oxygen if desired
  public updateOxygen(currentOxygen: number, maxOxygen?: number): void {
    this.setValue(currentOxygen, maxOxygen);
  }

  public getOxygen(): number {
    return this.getValue();
  }

  public getMaxOxygen(): number {
    return this.getMaxValue();
  }
}
