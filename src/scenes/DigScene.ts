/**
 * @TODO DigScene
 * 1. Consider making tile size bigger or player smaller
 * 2. Add time (and animation) to break dirt
 * 3. Make full screen
 * 4. Pan with camera
 * 6. Bug: Player placing dirt on partially occupied tile allows the player to break out of bounds
 */

const ABOVE_GROUND_HEIGHT = 80;
const ABOVE_GROUND_POSITION_Y = 0;
const SKY_COLOUR_ACTIVE = '#87CEEB';
const SKY_COLOUR_MUTED = '#4A4A4A';
const PLAYER_SPEED = 200;
const PLAYER_START_TILE_X = 12;
const PLAYER_START_TILE_Y = 7;
const PLAYER_TOOL_OFFSET = 32;
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
      PLAYER_START_TILE_Y * TILE_HEIGHT,
      'player'
    );

    this.physics.add.collider(this.player, groundLayer);

    this.playerTool = this.add.container(0, 0);
    this.playerTool.setPosition(PLAYER_TOOL_OFFSET, 0);
    const playerToolSprite = this.add.graphics();
    playerToolSprite.lineStyle(1, 0xffffff);
    playerToolSprite.strokeCircle(0, 0, 1);
    this.playerTool.add(playerToolSprite);

    // Surround the player with a dug area
    groundLayer.putTileAt(1, PLAYER_START_TILE_X - 1, PLAYER_START_TILE_Y - 1);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X, PLAYER_START_TILE_Y - 1);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X + 1, PLAYER_START_TILE_Y - 1);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X - 1, PLAYER_START_TILE_Y);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X, PLAYER_START_TILE_Y);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X + 1, PLAYER_START_TILE_Y);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X - 1, PLAYER_START_TILE_Y + 1);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X, PLAYER_START_TILE_Y + 1);
    groundLayer.putTileAt(1, PLAYER_START_TILE_X + 1, PLAYER_START_TILE_Y + 1);

    // Configure the camera
    this.cameras.main.setScroll(0, -ABOVE_GROUND_HEIGHT);
    this.cameras.main.setBackgroundColor(SKY_COLOUR_MUTED);

    this.add
      .text(400, 32, 'Dig Scene', {
        color: '#ffffff',
        fontSize: '32px',
      })
      .setOrigin(0.5);
  }

  update() {
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

    // Change the sky colour if the player comes above-ground
    const backgroundColour = isAboveGround(this.player)
      ? SKY_COLOUR_ACTIVE
      : SKY_COLOUR_MUTED;
    this.cameras.main.setBackgroundColor(backgroundColour);
  }
}

/**
 * Checks if a gameObject is in the above-ground space.
 * @param gameObject The game object to check.
 * @returns True if the gameObject is above ground, else false.
 */
function isAboveGround(gameObject: Phaser.GameObjects.Components.Transform) {
  return gameObject.y < ABOVE_GROUND_POSITION_Y;
}
