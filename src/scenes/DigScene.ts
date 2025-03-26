/**
 * @TODO DigScene
 * - Change player sprite below-ground to be top-down
 * - Add time (and animation) to break dirt
 * - Bug: Player placing dirt on partially occupied tile allows the player to break out of bounds
 * - Bug: Putting dirt on top layer of tiles doens't erase the ladder
 * - Bug: Can dig diagonally even if tile is surrounded by other dirt tiles
 * - Camera bounds on edges of tilemap
 * - Unpassable player boundaries at edges of tilemap
 * - Show current action snapped to tile (e.g. dirt, ladder, or ground centered on tile)
 * - Player action is always space
 *
 * From Ziya:
 * - Health bar and monster damage
 * - Show weapon / tool
 */

import { ABOVE_GROUND_POSITION_Y } from '../constants';
import { isAboveGround } from '../utils';
import { Player } from '../entities/player';
import { Zombie } from '../entities/zombie';

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

export class DigScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private map!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super({ key: 'DigScene' });
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

    groundLayer.fill(0);
    this.map.setCollision([0]);

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

    const zombie = new Zombie(
      this,
      (PLAYER_START_TILE_X - 20) * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      'player',
      this.player
    );
    zombie.y -= (zombie.scaleY * zombie.height) / 2;
    this.physics.add.collider(zombie, groundLayer);

    const zombie2 = new Zombie(
      this,
      (PLAYER_START_TILE_X + 20) * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      'player',
      this.player
    );
    zombie2.y -= (zombie2.scaleY * zombie2.height) / 2;
    this.physics.add.collider(zombie2, groundLayer);

    // Configure the camera
    this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);

    this.cameras.main.startFollow(this.player, true, 0.9, 0.9);
    this.cameras.main.setDeadzone(CAMERA_DEADZONE_X, CAMERA_DEADZONE_Y);

    this.add
      .text(400, -48, 'Dig Scene', {
        color: '#ffffff',
        fontSize: '32px',
      })
      .setOrigin(0.5);
  }

  update() {
    const isPlayerAboveGround = isAboveGround(this.player);

    this.player.update();

    if (isPlayerAboveGround) {
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
      this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);

      // Player action
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        // Can we replace this with this.map.getTileAtWorldXY?
        const toolTileX = Math.floor(
          this.player.getToolPosition().x / TILE_WIDTH
        );
        const toolTileY = Math.floor(
          this.player.getToolPosition().y / TILE_HEIGHT
        );

        const groundTile = this.map.getTileAt(
          toolTileX,
          toolTileY,
          false,
          'ground'
        );
        if (groundTile && groundTile.index === 0) {
          this.map.putTileAt(1, toolTileX, toolTileY, true, 'ground');

          if (toolTileY === 0) {
            this.add.sprite(
              toolTileX * TILE_WIDTH + TILE_WIDTH / 2,
              toolTileY * TILE_HEIGHT + TILE_HEIGHT / 2,
              'ladder'
            );
          }
        }
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.shift)) {
        const toolTile = this.map.getTileAtWorldXY(
          this.player.getToolPosition().x,
          this.player.getToolPosition().y,
          undefined,
          undefined,
          'ground'
        );

        if (toolTile) {
          const playerBounds = this.player.getBounds();
          const tileBounds = new Phaser.Geom.Rectangle(
            toolTile.getLeft(),
            toolTile.getTop(),
            toolTile.width,
            toolTile.height
          );
          const playerOverlapsTile = Phaser.Geom.Rectangle.Overlaps(
            playerBounds,
            tileBounds
          );

          if (toolTile.index === 1 && !playerOverlapsTile) {
            this.map.putTileAt(0, toolTile.x, toolTile.y, true);
          }
        }
      }
    }
  }
}
