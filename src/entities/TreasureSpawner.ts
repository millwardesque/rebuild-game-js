import { Treasure } from './Treasure';

export class TreasureSpawner {
  private scene: Phaser.Scene;
  private spawnArea: Phaser.Geom.Rectangle;
  private spawnRate: number;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private maxTreasures: number;
  private treasureGroup: Phaser.GameObjects.Group;
  private treasureImageKey: string;
  private treasureValue: number;

  constructor(
    scene: Phaser.Scene,
    spawnRate: number,
    maxTreasures: number,
    spawnArea: Phaser.Geom.Rectangle,
    treasureValue: number,
    treasureImageKey: string
  ) {
    this.maxTreasures = maxTreasures;
    this.scene = scene;
    this.spawnArea = spawnArea;
    this.spawnRate = spawnRate;
    this.treasureGroup = scene.physics.add.group();
    this.treasureImageKey = treasureImageKey;
    this.treasureValue = treasureValue;

    this.startSpawning();
  }

  public startSpawning(): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnRate,
      callback: this.spawnTreasure,
      callbackScope: this,
      repeat: -1,
    });
  }

  public stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
  }

  private spawnTreasure(): void {
    if (this.treasureGroup.getLength() >= this.maxTreasures) {
      return;
    }

    const spawnPositionX = Phaser.Math.Between(
      this.spawnArea.x,
      this.spawnArea.x + this.spawnArea.width
    );
    const spawnPositionY = Phaser.Math.Between(
      this.spawnArea.y,
      this.spawnArea.y + this.spawnArea.height
    );

    const treasure = new Treasure(
      this.scene,
      spawnPositionX,
      spawnPositionY,
      this.treasureImageKey,
      this.treasureValue
    );
    treasure.y -= (treasure.scaleY * treasure.height) / 2;
    this.treasureGroup.add(treasure);
  }

  public getTreasuresGroup(): Phaser.GameObjects.Group {
    return this.treasureGroup;
  }
}
