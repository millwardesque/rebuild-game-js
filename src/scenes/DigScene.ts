/**
 * @TODO DigScene
 * - Change player sprite above-ground, and use flip for left / right
 * - Add time (and animation) to break dirt
 * - Pan with camera
 * - Bug: Player placing dirt on partially occupied tile allows the player to break out of bounds
 *
 * From Ziya:
 * - Show current action snapped to tile (e.g. dirt, ladder, or ground centered on tile)
 * - Player action is always space
 * - Monsters above ground
 * - Game sprite
 * - Health bar
 */

const ABOVE_GROUND_GRAVITY = 800;
const ABOVE_GROUND_POSITION_Y = 0;
const CAMERA_Y_OFFSET = -80;
const SKY_COLOUR_ACTIVE = '#87CEEB';
const SKY_COLOUR_MUTED = '#4A4A4A';
const PLAYER_HORIZONTAL_DRAG = 0.85;
const PLAYER_JUMP_VELOCITY = -200;
const PLAYER_SPEED = 200;
const PLAYER_START_TILE_X = 12;
const PLAYER_TOOL_OFFSET = 24;
const TILE_MAP_WIDTH = 32;
const TILE_MAP_HEIGHT = 20;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;

export class DigScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerTool!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private map!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super({ key: 'DigScene' });
  }

  preload() {
    this.load.image('dirt', '/src/assets/wip-dirt.png');
    this.load.image('player', '/src/assets/wip-player.png');
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
    this.player = this.physics.add.sprite(
      PLAYER_START_TILE_X * TILE_WIDTH,
      ABOVE_GROUND_POSITION_Y,
      'player'
    );
    this.player.y -= this.player.height / 2;
    this.player.setBounce(0);
    this.player.setDepth(1);
    this.physics.add.collider(this.player, groundLayer);

    this.playerTool = this.add.container(0, 0);
    this.playerTool.setPosition(PLAYER_TOOL_OFFSET, 0);
    const playerToolSprite = this.add.graphics();
    playerToolSprite.lineStyle(1, 0xffffff);
    playerToolSprite.strokeCircle(0, 0, 1);
    this.playerTool.add(playerToolSprite);

    // Configure the camera
    this.cameras.main.setScroll(0, CAMERA_Y_OFFSET);
    this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);

    this.add
      .text(400, -48, 'Dig Scene', {
        color: '#ffffff',
        fontSize: '32px',
      })
      .setOrigin(0.5);
  }

  update() {
    const aboveGround = isAboveGround(this.player);

    if (aboveGround) {
      this.player.setGravityY(ABOVE_GROUND_GRAVITY);
      this.cameras.main.setBackgroundColor(SKY_COLOUR_ACTIVE);

      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-PLAYER_SPEED);
        this.player.setAngle(180);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(PLAYER_SPEED);
        this.player.setAngle(0);
      } else {
        this.player.setVelocityX(
          (this.player.body?.velocity.x ?? 0) * PLAYER_HORIZONTAL_DRAG
        );
      }

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

      if (this.cursors.up.isDown && this.player.body?.blocked.down) {
        this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
      }
    } else {
      this.player.setGravityY(0);
      this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);

      // Player movement
      this.player.setVelocity(0);

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
        this.player.setAngle(angle);

        this.player.setVelocityX(PLAYER_SPEED * dx);
        this.player.setVelocityY(PLAYER_SPEED * dy);
      }

      const toolX =
        this.player.x + Math.cos(this.player.rotation) * PLAYER_TOOL_OFFSET;
      const toolY =
        this.player.y + Math.sin(this.player.rotation) * PLAYER_TOOL_OFFSET;
      this.playerTool.setPosition(toolX, toolY);

      // Player action
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        // Can we replace this with this.map.getTileAtWorldXY?
        const toolTileX = Math.floor(this.playerTool.x / TILE_WIDTH);
        const toolTileY = Math.floor(this.playerTool.y / TILE_HEIGHT);

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
          this.playerTool.x,
          this.playerTool.y,
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

/**
 * Checks if a gameObject is in the above-ground space.
 * @param gameObject The game object to check.
 * @returns True if the gameObject is above ground, else false.
 */
function isAboveGround(gameObject: Phaser.Physics.Arcade.Sprite) {
  return gameObject.y + gameObject.height / 2 <= ABOVE_GROUND_POSITION_Y;
}
