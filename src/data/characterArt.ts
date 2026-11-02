/** URLs are relative to the game page (public/ is the web root).
 * Provide one horizontal strip per action. Put transparent costume strips
 * after the base strip, back to front, with exactly the same dimensions.
 * Example: layers: ['art/hero/run.png', 'art/hero/run-coat.png'].
 * An empty list selects the bundled apprentice for that action.
 */
export const characterArt = {
  width: 80, height: 64,
  foot: { x: 40, y: 60 }, // source pixel coordinates, measured from top left
  facesLeft: false,      // native facing of the supplied art
  idle: { layers: [] as string[], count: 4, fps: 2 },
  run: { layers: [] as string[], count: 8, fps: 14 },
  attack: { layers: [] as string[], count: 6, impactFrame: 3 } // zero-based
};
