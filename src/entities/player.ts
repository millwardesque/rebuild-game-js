import Phaser from 'phaser';
import { isAboveGround } from '../utils';
import { ABOVE_GROUND_GRAVITY } from '../constants';

const PLAYER_HORIZONTAL_DRAG = 0.85;
const PLAYER_JUMP_VELOCITY = -200;
const PLAYER_SPEED = 200;
const PLAYER_TOOL_OFFSET = 24;
const PLAYER_DEPTH = 1;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerTool: Phaser.GameObjects.Container;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    sprite: string | Phaser.Textures.Texture
  ) {
    super(scene, x, y, sprite);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = cursors;

    this.setBounce(0);
    this.setDepth(PLAYER_DEPTH);

    this.playerTool = scene.add.container(0, 0);
    this.playerTool.setPosition(PLAYER_TOOL_OFFSET, 0);
    const playerToolSprite = scene.add.graphics();
    playerToolSprite.lineStyle(1, 0xffffff);
    playerToolSprite.strokeCircle(0, 0, 1);
    this.playerTool.add(playerToolSprite);
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
  }

  /**
   * Handles pre-update logic when the player is above-ground
   */
  aboveGroundPreUpdate(): void {
    this.setGravityY(ABOVE_GROUND_GRAVITY);

    if (this.cursors.left.isDown) {
      this.setVelocityX(-PLAYER_SPEED);
      this.setAngle(180);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(PLAYER_SPEED);
      this.setAngle(0);
    } else {
      this.setVelocityX((this.body?.velocity.x ?? 0) * PLAYER_HORIZONTAL_DRAG);
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
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.setAngle(angle);

      this.setVelocityX(PLAYER_SPEED * dx);
      this.setVelocityY(PLAYER_SPEED * dy);
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
    const toolX =
      this.getCenter().x + Math.cos(this.rotation) * PLAYER_TOOL_OFFSET;
    const toolY =
      this.getCenter().y + Math.sin(this.rotation) * PLAYER_TOOL_OFFSET;
    this.playerTool.setPosition(toolX, toolY);
  }
}
