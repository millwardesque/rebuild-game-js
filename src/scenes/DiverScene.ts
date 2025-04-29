import { ABOVE_GROUND_POSITION_Y } from '../constants';
import { Player } from '../entities/Player';
import { HealthBar } from '../entities/HealthBar';
import { OxygenBar } from '../entities/OxygenBar';
import { Treasure } from '../entities/Treasure';
import { TreasureSpawner } from '../entities/TreasureSpawner';
import { TreasureTracker } from '../entities/TreasureTracker';

const CAMERA_DEADZONE_X = 200;
const CAMERA_DEADZONE_Y = 50;
const SKY_COLOUR_ACTIVE = '#87CEEB';
const SKY_COLOUR_MUTED = '#4A4A4A';
const TILE_MAP_WIDTH = 40;
const TILE_MAP_HEIGHT = 16;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;
const PLAYER_START_TILE_X = Math.floor(TILE_MAP_WIDTH / 2.0);
const PLAYER_SPRITESHEET_WIDTH = 16;
const PLAYER_SPRITESHEET_HEIGHT = 16;
const DIRT_TILE_INDEX = 0;
const WATER_TILE_INDEX = 2;
const OUT_OF_OXYGEN_HEALTH_DECREASE = 1;

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
  private oxygenDepletionRate: number = 5; // Units per second
  private oxygenRefillRate: number = 10; // Units per second

  constructor() {
    super({ key: 'DiverScene' });
  }

  restart() {
    this.scene.restart();

    this.currentOxygen = 100;
  }

  preload() {
    this.load.image('dirt', '/src/assets/wip-dirt.png');
    this.load.spritesheet('player', '/src/assets/wip-player.png', {
      frameWidth: PLAYER_SPRITESHEET_WIDTH,
      frameHeight: PLAYER_SPRITESHEET_HEIGHT,
    });
    this.load.image('treasure', '/src/assets/wip-jewel.png');
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

    // Set the bottom row of the tilemap to dirt
    for (let x = 0; x < TILE_MAP_WIDTH; x++) {
      groundLayer.putTileAt(DIRT_TILE_INDEX, x, TILE_MAP_HEIGHT - 1, true);
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

    // Treasure
    this.treasureSpawner = new TreasureSpawner(
      this,
      2000,
      10,
      new Phaser.Geom.Rectangle(
        0,
        ABOVE_GROUND_POSITION_Y + TILE_HEIGHT,
        TILE_WIDTH * TILE_MAP_WIDTH,
        (TILE_MAP_HEIGHT - 2) * TILE_HEIGHT
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
    this.cameras.main.setBounds(
      0,
      -(TILE_HEIGHT * TILE_MAP_HEIGHT),
      TILE_WIDTH * TILE_MAP_WIDTH,
      TILE_HEIGHT * TILE_MAP_HEIGHT * 2
    );

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
    const isPlayerAboveGround = this.isPlayerAboveGround();
    const deltaTime = this.game.loop.delta / 1000; // Convert to seconds

    this.player.update();

    if (isPlayerAboveGround) {
      // Refill oxygen when above ground
      this.currentOxygen = Math.min(
        this.maxOxygen,
        this.currentOxygen + this.oxygenRefillRate * deltaTime
      );
      this.cameras.main.setBackgroundColor(SKY_COLOUR_ACTIVE);
    } else {
      // Deplete oxygen when below ground
      this.currentOxygen = Math.max(
        0,
        this.currentOxygen - this.oxygenDepletionRate * deltaTime
      );

      // If oxygen is depleted, player takes damage
      if (this.currentOxygen <= 0) {
        this.player.takeDamage(OUT_OF_OXYGEN_HEALTH_DECREASE); // Damage per frame when out of oxygen
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

  private isPlayerAboveGround(): boolean {
    return this.player.getHeadPosition().y <= ABOVE_GROUND_POSITION_Y;
  }
}
