import Phaser from 'phaser';
import { isAboveGround } from '../utils';
import { ABOVE_GROUND_GRAVITY } from '../constants';

const MONSTER_SPEED = 150;
const MONSTER_DEPTH = 1;
const MONSTER_SCALE = 3.0; // Scale of player sprite. Ideally this should be 1.0, but since I'm not yet making custom pixel art, this lets us fudge it.
const CHASE_THRESHOLD = 200.0; // Distance in pixels within which the zombie will chase the target

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  private spriteKey: string;
  private leftWalkKey: string;
  private rightWalkKey: string;
  private upWalkKey: string;
  private downWalkKey: string;

  private target: Phaser.Physics.Arcade.Sprite | undefined;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sprite: string,
    target: Phaser.Physics.Arcade.Sprite | undefined
  ) {
    super(scene, x, y, sprite);
    this.setScale(MONSTER_SCALE);
    this.setTint(0x00ff33);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.target = target;

    this.spriteKey = sprite;
    this.leftWalkKey = `${this.spriteKey}-walk-left`;
    this.rightWalkKey = `${this.spriteKey}-walk-right`;
    this.upWalkKey = `${this.spriteKey}-walk-up`;
    this.downWalkKey = `${this.spriteKey}-walk-down`;

    this.setBounce(0);
    this.setDepth(MONSTER_DEPTH);

    // Create animations
    this.createAnimations();
  }

  /**
   * Creates the player animations
   */
  private createAnimations(): void {
    if (!this.scene.anims.exists(this.downWalkKey)) {
      this.scene.anims.create({
        key: this.downWalkKey,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          frames: [0, 4, 8],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists(this.leftWalkKey)) {
      this.scene.anims.create({
        key: this.leftWalkKey,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          frames: [1, 5, 9],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists(this.rightWalkKey)) {
      this.scene.anims.create({
        key: this.rightWalkKey,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          frames: [2, 6, 10],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists(this.upWalkKey)) {
      this.scene.anims.create({
        key: this.upWalkKey,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          frames: [3, 7, 11],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  /**
   * Handles pre-update logic for the player
   * @param time The current time in milliseconds
   * @param delta The delta time in milliseconds
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (isAboveGround(this)) {
      this.aboveGroundPreUpdate();
    } else {
      this.belowGroundPreUpdate();
    }
  }

  /**
   * Handles pre-update logic when the player is above-ground
   */
  aboveGroundPreUpdate(): void {
    this.setGravityY(ABOVE_GROUND_GRAVITY);
    this.setVelocity(0);

    const targetX = this.target?.x;
    const isTargetAboveGround = this.target && isAboveGround(this.target);

    if (targetX && isTargetAboveGround) {
      if (targetX < this.x && Math.abs(this.x - targetX) < CHASE_THRESHOLD) {
        this.setVelocityX(-MONSTER_SPEED);
        this.play(this.leftWalkKey, true);
      } else if (
        targetX > this.x &&
        Math.abs(targetX - this.x) < CHASE_THRESHOLD
      ) {
        this.setVelocityX(MONSTER_SPEED);
        this.play(this.rightWalkKey, true);
      } else {
        this.stopAfterRepeat(0);
      }
    } else {
      this.stopAfterRepeat(0);
    }
  }

  /**
   * Handles pre-update logic when the player is below-ground
   */
  belowGroundPreUpdate(): void {
    this.setGravityY(0);
  }
}
