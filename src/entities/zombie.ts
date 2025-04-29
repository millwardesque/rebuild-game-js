import Phaser from 'phaser';
import { isAboveGround, isPositionAboveGround } from '../utils';
import { ABOVE_GROUND_GRAVITY, IN_WATER_GRAVITY } from '../constants';

const MONSTER_SPEED = 150;
const MONSTER_DEPTH = 1;
const MONSTER_SCALE = 3.0; // Scale of the sprite. Ideally this should be 1.0, but since I'm not yet making custom pixel art, this lets us fudge it.
export const MONSTER_TINT = 0x00ff33; // Tint of the monster sprite
const CHASE_THRESHOLD = 200.0; // Distance in pixels within which the zombie will chase the target
const ZOMBIE_MAX_HEALTH = 30; // Maximum health for zombies
const ZOMBIE_FADE_DURATION = 800; // Time in ms for zombie to fade out when dying

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  private spriteKey: string;
  private leftWalkKey: string;
  private rightWalkKey: string;
  private upWalkKey: string;
  private downWalkKey: string;

  private motivation: 'chase' | 'roam';
  private target: Phaser.Physics.Arcade.Sprite | undefined;
  
  // Health properties
  private health: number = ZOMBIE_MAX_HEALTH;
  private maxHealth: number = ZOMBIE_MAX_HEALTH;
  private isAlive: boolean = true;
  private onDeath: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sprite: string,
    target: Phaser.Physics.Arcade.Sprite | undefined,
    maxHealth: number = ZOMBIE_MAX_HEALTH
  ) {
    super(scene, x, y, sprite);
    this.setScale(MONSTER_SCALE);
    this.setTint(MONSTER_TINT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.motivation = 'roam';
    this.target = target;

    this.spriteKey = sprite;
    this.leftWalkKey = `${this.spriteKey}-walk-left`;
    this.rightWalkKey = `${this.spriteKey}-walk-right`;
    this.upWalkKey = `${this.spriteKey}-walk-up`;
    this.downWalkKey = `${this.spriteKey}-walk-down`;

    this.setBounce(0);
    this.setDepth(MONSTER_DEPTH);
    
    // Set health
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;

    // Create animations
    this.createAnimations();
  }

  /**
   * Creates the animations
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
   * Handles pre-update logic
   * @param time The current time in milliseconds
   * @param delta The delta time in milliseconds
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    // Skip updates if zombie is dead
    if (!this.isAlive) return;
    
    if (isPositionAboveGround(this.getBottomCenter())) {
      this.aboveGroundPreUpdate();
    } else {
      this.belowGroundPreUpdate();
    }
  }

  /**
   * Handles pre-update logic when above ground
   */
  aboveGroundPreUpdate(): void {
    this.setGravityY(ABOVE_GROUND_GRAVITY);
    this.setVelocity(0);

    switch (this.motivation) {
      case 'roam':
        this.onPreUpdateRoam();
        break;
      case 'chase':
        this.onPreUpdateChase();
        break;
    }
  }

  /**
   * Handles pre-update logic when below-ground
   */
  belowGroundPreUpdate(): void {
    this.setGravityY(IN_WATER_GRAVITY);
  }

  onPreUpdateRoam(): void {
    const targetX = this.target?.x;
    const isTargetAboveGround = this.target && isAboveGround(this.target);

    if (
      targetX &&
      isTargetAboveGround &&
      Math.abs(this.x - targetX) <= CHASE_THRESHOLD
    ) {
      this.motivation = 'chase';
      return;
    }

    this.setVelocity(0);
    this.stopAfterRepeat(0);
  }

  onPreUpdateChase(): void {
    const targetX = this.target?.x;
    const isTargetAboveGround = this.target && isAboveGround(this.target);

    if (
      !isTargetAboveGround ||
      !targetX ||
      Math.abs(this.x - targetX) > CHASE_THRESHOLD
    ) {
      this.motivation = 'roam';
      return;
    }

    if (targetX < this.x) {
      this.setVelocityX(-MONSTER_SPEED);
      this.play(this.leftWalkKey, true);
    } else if (targetX > this.x) {
      this.setVelocityX(MONSTER_SPEED);
      this.play(this.rightWalkKey, true);
    }
  }
  
  /**
   * Take damage and reduce zombie health
   * @param amount Amount of damage to take
   * @returns Whether the zombie is still alive
   */
  takeDamage(amount: number): boolean {
    // Skip if already dead
    if (!this.isAlive) return false;
    
    // Reduce health
    this.health = Math.max(0, this.health - amount);
    
    // Flash red to indicate damage
    this.scene.tweens.add({
      targets: this,
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        // Restore original tint if still alive
        if (this.isAlive) {
          this.setTint(MONSTER_TINT);
        }
      }
    });
    
    // Check if dead
    if (this.health <= 0) {
      this.die();
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle zombie death
   */
  private die(): void {
    this.isAlive = false;
    
    // Stop movement and animations
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.setGravityY(0);
    this.stopAfterRepeat(0);
    
    // Disable physics
    this.disableBody(true, false);
    
    // Start fade out animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: ZOMBIE_FADE_DURATION,
      onComplete: () => {
        // Call onDeath callback if provided
        if (this.onDeath) {
          this.onDeath();
        }
        // Remove from scene
        this.destroy();
      }
    });
  }
  
  /**
   * Set a callback for when the zombie dies
   * @param callback Function to call when zombie dies
   */
  setDeathListener(callback: () => void): void {
    this.onDeath = callback;
  }
  
  /**
   * Get current health value
   */
  getHealth(): number {
    return this.health;
  }
  
  /**
   * Get maximum health value
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }
  
  /**
   * Check if zombie is alive
   */
  getIsAlive(): boolean {
    return this.isAlive;
  }
}
