import { ABOVE_GROUND_POSITION_Y } from './constants';

/**
 * Checks if a gameObject is in the above-ground space.
 * @param gameObject The game object to check.
 * @returns True if the gameObject is above ground, else false.
 */
export function isAboveGround(gameObject: Phaser.Physics.Arcade.Sprite) {
  return gameObject.y + gameObject.height / 2 <= ABOVE_GROUND_POSITION_Y;
}
