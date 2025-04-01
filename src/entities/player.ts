import Phaser from 'phaser';
import { isAboveGround } from '../utils';
import { ABOVE_GROUND_GRAVITY } from '../constants';

const PLAYER_HORIZONTAL_DRAG = 0.8;
const PLAYER_JUMP_VELOCITY = -200;
const PLAYER_SPEED = 200;
const PLAYER_TOOL_OFFSET = 24;
const PLAYER_DEPTH = 1;
const PLAYER_SCALE = 1.5; // Scale of player sprite. Ideally this should be 1.0, but since I'm not yet making custom pixel art, this lets us fudge it.
const PLAYER_MAX_HEALTH = 100;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerTool: Phaser.GameObjects.Container;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private spriteKey: string;
  private leftWalkKey: string;
  private rightWalkKey: string;
  private upWalkKey: string;
  private downWalkKey: string;

  private facingAngle: number = 0;

  // Health properties
  private maxHealth: number = PLAYER_MAX_HEALTH;
  private currentHealth: number = PLAYER_MAX_HEALTH;
  private onHealthChange: ((health: number, maxHealth: number) => void) | null =
    null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    sprite: string
  ) {
    super(scene, x, y, sprite);
    this.setScale(PLAYER_SCALE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;
    this.spriteKey = sprite;
    this.leftWalkKey = `${this.spriteKey}-walk-left`;
    this.rightWalkKey = `${this.spriteKey}-walk-right`;
    this.upWalkKey = `${this.spriteKey}-walk-up`;
    this.downWalkKey = `${this.spriteKey}-walk-down`;

    this.setBounce(0);
    this.setDepth(PLAYER_DEPTH);

    // Create animations
    this.createAnimations();

    this.playerTool = scene.add.container(0, 0);
    this.playerTool.setPosition(PLAYER_TOOL_OFFSET, 0);
    const playerToolSprite = scene.add.graphics();
    playerToolSprite.lineStyle(1, 0xffffff);
    playerToolSprite.strokeCircle(0, 0, 1);
    this.playerTool.add(playerToolSprite);
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

    this.updateToolPosition();

    // @DEBUG console.log('[CPM] Player preUpdate', this.x, this.y); // @DEBUG
  }

  /**
   * Handles pre-update logic when the player is above-ground
   */
  aboveGroundPreUpdate(): void {
    this.setGravityY(ABOVE_GROUND_GRAVITY);

    if (this.cursors.left.isDown) {
      this.setVelocityX(-PLAYER_SPEED);
      this.play(this.leftWalkKey, true);
      this.facingAngle = 180;
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(PLAYER_SPEED);
      this.play(this.rightWalkKey, true);
      this.facingAngle = 0;
    } else {
      this.setVelocityX((this.body?.velocity.x ?? 0) * PLAYER_HORIZONTAL_DRAG);
      this.stopAfterRepeat(0);
    }

    if (this.cursors.up.isDown && this.body?.blocked.down) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  /**
   * Handles pre-update logic when the player is below-ground
   */
  belowGroundPreUpdate(): void {
    this.setGravityY(0);

    // Player movement
    this.setVelocity(0);

    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown) {
      dx = -1;
    } else if (this.cursors.right.isDown) {
      dx = 1;
    }

    if (this.cursors.up.isDown) {
      dy = -1;
    } else if (this.cursors.down.isDown) {
      dy = 1;
    }

    if (dx !== 0 || dy !== 0) {
      this.facingAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      this.setVelocityX(PLAYER_SPEED * dx);
      this.setVelocityY(PLAYER_SPEED * dy);

      if (dx > 0) {
        this.play(this.rightWalkKey, true);
      } else if (dx < 0) {
        this.play(this.leftWalkKey, true);
      } else if (dy > 0) {
        this.play(this.downWalkKey, true);
      } else if (dy < 0) {
        this.play(this.upWalkKey, true);
      }
    } else {
      this.stopAfterRepeat(0);
    }
  }

  /**
   * Returns the position of the player tool.
   */
  getToolPosition(): Phaser.Geom.Point {
    return new Phaser.Geom.Point(this.playerTool.x, this.playerTool.y);
  }

  /**
   * Updates the position of the player tool to stay consistent with
   * the player's position
   */
  updateToolPosition(): void {
    const angleInRadians = this.facingAngle * (Math.PI / 180);
    const toolX =
      this.getCenter().x + Math.cos(angleInRadians) * PLAYER_TOOL_OFFSET;
    const toolY =
      this.getCenter().y + Math.sin(angleInRadians) * PLAYER_TOOL_OFFSET;
    this.playerTool.setPosition(toolX, toolY);
  }

  /**
   * Get the current health of the player
   * @returns Current health value
   */
  getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get the maximum health of the player
   * @returns Maximum health value
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Set callback for when health changes
   * @param callback Function to call when health changes
   */
  setHealthChangeListener(
    callback: (health: number, maxHealth: number) => void
  ): void {
    this.onHealthChange = callback;
  }

  /**
   * Private helper function to change the health and call the onHealthChange callback
   * @param newHealth New health value
   */
  private changeHealth(newHealth: number): void {
    this.currentHealth = newHealth;
    if (this.onHealthChange) {
      this.onHealthChange(this.currentHealth, this.maxHealth);
    }
  }

  /**
   * Take damage and reduce player health
   * @param amount Amount of damage to take
   * @returns Whether the player is still alive
   */
  takeDamage(amount: number): boolean {
    this.changeHealth(Math.max(0, this.currentHealth - amount));
    return this.currentHealth > 0;
  }

  /**
   * Heal the player
   * @param amount Amount to heal
   */
  heal(amount: number): void {
    this.changeHealth(Math.min(this.maxHealth, this.currentHealth + amount));
  }
}
