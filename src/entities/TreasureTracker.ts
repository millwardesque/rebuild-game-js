export class TreasureTracker extends Phaser.GameObjects.Text {
  private treasureAmount: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number = 0) {
    super(scene, x, y, getTreasureString(amount), {
      color: '#FFD700', // Gold color for treasure
      fontSize: '16px',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2,
    });
    // this.setOrigin(0.5);
    this.setScrollFactor(0);
    this.treasureAmount = amount;

    scene.add.existing(this);
  }

  public addTreasure(amount: number): void {
    this.treasureAmount += amount;
    this.setText(getTreasureString(this.treasureAmount));
  }
}

/**
 * Returns a formatted string for the treasure amount.
 * @param amount The amount of treasure.
 * @returns A formatted string for the treasure amount.
 */
function getTreasureString(amount: number): string {
  return `Treasure: ${amount}`;
}
