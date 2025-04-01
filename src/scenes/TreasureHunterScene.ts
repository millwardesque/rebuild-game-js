import { ABOVE_GROUND_POSITION_Y } from '../constants';
import { isAboveGround } from '../utils';
import { Player } from '../entities/Player';
import { Zombie } from '../entities/Zombie';
import { HealthBar } from '../entities/HealthBar';
import { OxygenBar } from '../entities/OxygenBar';
import { TreasureTracker } from '../entities/TreasureTracker';

const CAMERA_DEADZONE_X = 200;
const CAMERA_DEADZONE_Y = 50;
const SKY_COLOUR_ACTIVE = '#87CEEB';
const SKY_COLOUR_MUTED = '#4A4A4A';
const TILE_MAP_WIDTH = 256;
const TILE_MAP_HEIGHT = 32;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;
const PLAYER_START_TILE_X = Math.floor(TILE_MAP_WIDTH / 2.0);
const PLAYER_SPRITESHEET_WIDTH = 16;
const PLAYER_SPRITESHEET_HEIGHT = 16;
const DIRT_TILE_INDEX = 0;
const WATER_TILE_INDEX = 2;

export class TreasureHunterScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private map!: Phaser.Tilemaps.Tilemap;
  private healthBar!: HealthBar;
  private oxygenBar!: OxygenBar;
  private treasure!: TreasureTracker;

  private currentOxygen: number = 100;
  private maxOxygen: number = 100;
  private oxygenDepletionRate: number = 10; // Units per second
  private oxygenRefillRate: number = 10; // Units per second

  private zombies: Zombie[] = [];

  constructor() {
    super({ key: 'TreasureHunterScene' });
  }

  restart() {
    this.scene.restart();
  }

  preload() {
    this.load.image('dirt', '/src/assets/wip-dirt.png');
    this.load.spritesheet('player', '/src/assets/wip-player.png', {
      frameWidth: PLAYER_SPRITESHEET_WIDTH,
      frameHeight: PLAYER_SPRITESHEET_HEIGHT,
    });
    this.load.image('ladder', '/src/assets/wip-ladder.png');
  }

  create() {
    if (!this.input.keyboard) {
      throw new Error('Unable to create keyboard input');
    }
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add restart key
    this.input.keyboard.on('keydown-R', () => {
      this.restart();
    });

    // DEBUG: Add a key to test Game Over scene
    this.input.keyboard.on('keydown-T', () => {
      this.player.takeDamage(25); // Take 25 damage each time T is pressed
      console.log(`Player health: ${this.player.getHealth()}`);
    });

    // Create the tilemap
    this.map = this.make.tilemap({
      tileWidth: TILE_WIDTH,
      tileHeight: TILE_HEIGHT,
      width: TILE_MAP_WIDTH,
      height: TILE_MAP_HEIGHT,
    });

    const tileset = this.map.addTilesetImage('dirt');
    if (!tileset) {
      throw new Error('Unable to create tileset');
    }

    const groundLayer = this.map.createBlankLayer('ground', tileset);
    if (!groundLayer) {
      throw new Error('Unable to create ground layer');
    }
    groundLayer.fill(WATER_TILE_INDEX);
    this.map.setCollision([DIRT_TILE_INDEX]);

    // Set the top row of the tilemap to dirt
    for (let x = 0; x < TILE_MAP_WIDTH; x++) {
      groundLayer.putTileAt(DIRT_TILE_INDEX, x, 0, true);
    }

    // Create the player
    this.player = new Player(
      this,
      PLAYER_START_TILE_X * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      this.cursors,
      'player'
    );
    // Shift the player up by half its height to align with the above-ground position
    this.player.y -= (this.player.scaleY * this.player.height) / 2;
    this.physics.add.collider(this.player, groundLayer);

    // Create zombies
    const zombie = new Zombie(
      this,
      (PLAYER_START_TILE_X - 15) * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      'player',
      this.player
    );
    zombie.y -= (zombie.scaleY * zombie.height) / 2;
    this.physics.add.collider(zombie, groundLayer);
    this.zombies.push(zombie);

    const zombie2 = new Zombie(
      this,
      (PLAYER_START_TILE_X + 15) * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      'player',
      this.player
    );
    zombie2.y -= (zombie2.scaleY * zombie2.height) / 2;
    this.physics.add.collider(zombie2, groundLayer);
    this.zombies.push(zombie2);

    // Add collisions between player and zombies
    this.physics.add.overlap(
      this.player,
      this.zombies,
      this.handlePlayerZombieCollision,
      undefined,
      this
    );

    // Configure the camera
    this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);
    this.cameras.main.startFollow(this.player, true, 0.9, 0.9);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE_X, CAMERA_DEADZONE_Y);

    // Configure the health bar
    this.healthBar = new HealthBar(this, 5, 5);
    this.healthBar.updateHealth(
      this.player.getHealth(),
      this.player.getMaxHealth()
    );

    this.player.setHealthChangeListener((health, maxHealth) => {
      this.healthBar.updateHealth(health, maxHealth);
    });

    // Configure the oxygen bar
    this.oxygenBar = new OxygenBar(this, 5, 30);
    this.oxygenBar.updateOxygen(this.currentOxygen, this.maxOxygen);

    // Configure the treasure tracker
    this.treasure = new TreasureTracker(this, 15, 65);

    // Scene title
    this.add
      .text(this.player.x, -48, 'Treasure Hunter Scene', {
        color: '#ffffff',
        fontSize: '32px',
      })
      .setOrigin(0.5);
  }

  update() {
    const isPlayerAboveGround = isAboveGround(this.player);
    const deltaTime = this.game.loop.delta / 1000; // Convert to seconds

    this.player.update();

    if (isPlayerAboveGround) {
      // Refill oxygen when above ground
      this.currentOxygen = Math.min(
        this.maxOxygen,
        this.currentOxygen + this.oxygenRefillRate * deltaTime
      );
      this.cameras.main.setBackgroundColor(SKY_COLOUR_ACTIVE);

      if (this.cursors.space.isDown && this.player.body?.blocked.down) {
        const playerTileX = Math.floor(this.player.getCenter().x / TILE_WIDTH);
        const playerTileY = 0; // TODO This is a lazy assumption the 0th tile row is always at the above-ground level, but it'll work for now
        const groundTile = this.map.getTileAt(
          playerTileX,
          playerTileY,
          false,
          'ground'
        );
        if (groundTile && groundTile.index === 0) {
          this.map.putTileAt(1, playerTileX, playerTileY, true, 'ground');
          this.add.sprite(
            playerTileX * TILE_WIDTH + TILE_WIDTH / 2,
            playerTileY * TILE_HEIGHT + TILE_HEIGHT / 2,
            'ladder'
          );
        }
      }
    } else {
      // Deplete oxygen when below ground
      this.currentOxygen = Math.max(
        0,
        this.currentOxygen - this.oxygenDepletionRate * deltaTime
      );

      // If oxygen is depleted, player takes damage
      if (this.currentOxygen <= 0) {
        this.player.takeDamage(1); // Damage per frame when out of oxygen
      }

      this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);
    }

    // Update oxygen bar
    this.oxygenBar.updateOxygen(this.currentOxygen, this.maxOxygen);

    // Check if player is dead
    if (this.player.getHealth() <= 0) {
      this.triggerGameOver();
      return;
    }
  }

  /**
   * Handles collision between player and zombies
   */
  private handlePlayerZombieCollision(
    _player:
      | Phaser.GameObjects.GameObject
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    _zombie:
      | Phaser.GameObjects.GameObject
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile
  ): void {
    // Since we're using overlap with Player and Zombie instances, we can safely cast them
    const player = _player as unknown as Player;
    const zombie = _zombie as unknown as Zombie;

    // Only apply damage every second to prevent rapid damage
    const now = this.time.now;
    if (
      !zombie.getData('lastDamageTime') ||
      now - zombie.getData('lastDamageTime') > 1000
    ) {
      // Apply damage to player
      player.takeDamage(10);

      // Set the last damage time
      zombie.setData('lastDamageTime', now);

      // Flash the player red to indicate damage
      this.tweens.add({
        targets: player,
        tint: 0xff0000,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          player.clearTint();
        },
      });

      this.healthBar?.updateHealth(
        this.player.getHealth(),
        this.player.getMaxHealth()
      );
    }
  }

  private triggerGameOver(): void {
    // Pause the current scene
    this.scene.pause();

    // Launch the game over scene
    this.scene.launch('GameOverScene', {
      sceneToLaunch: this.scene.key,
    });
  }
}
