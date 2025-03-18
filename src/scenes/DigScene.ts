/**
 * @TODO DigScene
 * 3. Dug-space tile
 * 4. Un-dug tile can be dug
 * 4. Player can't leave dug area
 * 5. Player can dig dug area
 */

const PLAYER_SPEED = 200;
const TILE_MAP_WIDTH = 16;
const TILE_MAP_HEIGHT = 16;

export class DigScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'DigScene' });
  }

  preload() {
    // Load assets here
    this.load.image('dirt', '/src/assets/wip-dirt.png');
    this.load.image('player', '/src/assets/wip-player.png');
  }

  create() {
    if (!this.input.keyboard) {
      throw new Error('Unable to create keyboard input');
    }
    this.cursors = this.input.keyboard.createCursorKeys();

    const map = this.make.tilemap({
      tileWidth: 32,
      tileHeight: 32,
      width: TILE_MAP_WIDTH,
      height: TILE_MAP_HEIGHT,
    });

    const tileset = map.addTilesetImage('dirt');
    if (!tileset) {
      throw new Error('Unable to create tileset');
    }

    const layer = map.createBlankLayer('ground', tileset);
    if (!layer) {
      throw new Error('Unable to create ground layer');
    }

    for (let x = 0; x < TILE_MAP_WIDTH; x++) {
      for (let y = 0; y < TILE_MAP_HEIGHT; y++) {
        layer.putTileAt(0, x, y);
      }
    }

    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);

    this.add
      .text(400, 32, 'Dig Scene', {
        color: '#ffffff',
        fontSize: '32px',
      })
      .setOrigin(0.5);
  }

  update() {
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
  }
}
