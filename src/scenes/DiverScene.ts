import { ABOVE_GROUND_POSITION_Y } from '../constants';
import { isAboveGround } from '../utils';
import { Player } from '../entities/Player';
import { MONSTER_TINT, Zombie } from '../entities/zombie';
import { HealthBar } from '../entities/HealthBar';
import { OxygenBar } from '../entities/OxygenBar';
import { Treasure } from '../entities/Treasure';
import { TreasureSpawner } from '../entities/TreasureSpawner';
import { TreasureTracker } from '../entities/TreasureTracker';
import { Rock } from '../entities/Rock';

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

export class DiverScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private map!: Phaser.Tilemaps.Tilemap;
  private healthBar!: HealthBar;
  private oxygenBar!: OxygenBar;
  private treasureSpawner!: TreasureSpawner;
  private treasureTracker!: TreasureTracker;

  private currentOxygen: number = 100;
  private maxOxygen: number = 100;
  private oxygenDepletionRate: number = 10; // Units per second
  private oxygenRefillRate: number = 10; // Units per second

  private zombies: Zombie[] = [];
  private rocks: Rock[] = [];
  private rockThrowCooldown: number = 0;
  private rockDamage: number = 10; // Damage dealt by each rock

  constructor() {
    super({ key: 'DiverScene' });
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
    this.load.image('treasure', '/src/assets/wip-jewel.png');
    this.load.image('rock', '/src/assets/wip-rock.png');
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
    for (
      let x = Math.floor(TILE_MAP_WIDTH / 3);
      x < TILE_MAP_WIDTH - Math.floor(TILE_MAP_WIDTH / 3) - 1;
      x++
    ) {
      if (x % 12 !== 1 && x % 12 !== 0) {
        groundLayer.putTileAt(DIRT_TILE_INDEX, x, 0, true);
        groundLayer.putTileAt(DIRT_TILE_INDEX, x, 1, true);
      }
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
    this.setupZombie(zombie);
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
    this.setupZombie(zombie2);
    this.zombies.push(zombie2);

    // Add collisions between player and zombies
    this.physics.add.overlap(
      this.player,
      this.zombies,
      this.handlePlayerZombieCollision,
      undefined,
      this
    );

    // Treasure
    this.treasureSpawner = new TreasureSpawner(
      this,
      2000,
      10,
      new Phaser.Geom.Rectangle(
        this.player.x - TILE_WIDTH * 32,
        ABOVE_GROUND_POSITION_Y - 1,
        TILE_WIDTH * 64,
        1
      ),
      1.0,
      'treasure'
    );

    // Add collisions between player and treasure
    this.physics.add.overlap(
      this.player,
      this.treasureSpawner.getTreasuresGroup(),
      this._handlePlayerTreasureCollision,
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
    this.treasureTracker = new TreasureTracker(this, 15, 65);
    this.treasureTracker.updateTreasure(0);

    this.debugDrawHorizon();

    // Scene title
    this.add
      .text(this.player.x, -48, 'Diver Scene', {
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

      // Rock throwing mechanics
      if (this.cursors.space.isDown && this.rockThrowCooldown <= 0) {
        this.throwRock();
        // Add cooldown to prevent spam throwing
        this.rockThrowCooldown = 500; // 500ms cooldown
      }

      // Update rock throw cooldown
      if (this.rockThrowCooldown > 0) {
        this.rockThrowCooldown -= this.sys.game.loop.delta;
      }

      // Process rock collisions with zombies
      this.physics.overlap(
        this.rocks,
        this.zombies,
        this.handleRockZombieCollision,
        undefined,
        this
      );
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

  private _handlePlayerTreasureCollision(
    _player:
      | Phaser.GameObjects.GameObject
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    _treasure:
      | Phaser.GameObjects.GameObject
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile
  ): void {
    const treasure = _treasure as unknown as Treasure;

    this.treasureTracker.updateTreasure(treasure.getValue());

    // Remove the treasure from the scene
    treasure.destroy();
  }

  private triggerGameOver(): void {
    // Pause the current scene
    this.scene.pause();

    // Launch the game over scene
    this.scene.launch('GameOverScene', {
      sceneToLaunch: this.scene.key,
    });
  }

  /**
   * Handles collision between rocks and zombies
   */
  private handleRockZombieCollision(
    _rock:
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
    const rock = _rock as Rock;
    const zombie = _zombie as Zombie;

    // Apply damage to zombie
    zombie.takeDamage(this.rockDamage);

    // Destroy the rock
    rock.destroy();

    // Remove from our tracking array
    this.rocks = this.rocks.filter((r) => r !== rock);
  }

  /**
   * Sets up zombie callbacks and event listeners
   */
  private setupZombie(zombie: Zombie): void {
    // Set death callback to remove zombie from tracking array
    zombie.setDeathListener(() => {
      this.zombies = this.zombies.filter((z) => z !== zombie);
    });
  }

  /**
   * Creates and throws a rock in the direction the player is facing
   */
  private throwRock(): void {
    // Get player position and facing direction
    const playerCenter = this.player.getCenter();

    // Determine throw direction based on player facing
    let dirX = 0;
    let dirY = 0;

    // This is a simple implementation - you might want to enhance it to use the actual facing angle
    if (this.player.anims.currentAnim) {
      const anim = this.player.anims.currentAnim.key;
      if (anim.includes('left')) {
        dirX = -1;
      } else if (anim.includes('right')) {
        dirX = 1;
      } else if (anim.includes('up')) {
        dirY = -1;
      } else if (anim.includes('down')) {
        dirY = 1;
      } else {
        // Default to right if no animation is playing
        dirX = 1;
      }
    } else {
      // Default to right if no animation is playing
      dirX = 1;
    }

    // If no direction determined (player is idle), use a default
    if (dirX === 0 && dirY === 0) {
      dirX = 1; // Default throw to the right
    }

    // Create the rock
    const rock = new Rock(this, playerCenter.x, playerCenter.y, dirX, dirY);

    // Add to our tracking array
    this.rocks.push(rock);

    // Add collisions with the ground layer
    const groundLayer = this.map.getLayer('ground');
    if (groundLayer && groundLayer.tilemapLayer) {
      this.physics.add.collider(
        rock,
        groundLayer.tilemapLayer,
        (rock) => {
          (rock as Rock).destroy();
          this.rocks = this.rocks.filter((r) => r !== rock);
        },
        undefined,
        this
      );
    }
  }

  private debugDrawHorizon(): void {
    // Draw horizontal line at y=0 (ground level)
    const groundLine = this.add.graphics();
    groundLine.lineStyle(1, 0xffffff, 0.8); // 2px wide white line with 80% opacity
    groundLine.beginPath();
    groundLine.moveTo(-10000, 0); // Start far to the left
    groundLine.lineTo(10000, 0); // End far to the right
    groundLine.closePath();
    groundLine.strokePath();
  }
}
