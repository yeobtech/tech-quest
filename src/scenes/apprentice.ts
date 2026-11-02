import Phaser from 'phaser';
import { PLAYER } from '../data/config';
import layout from '../data/apprentice.json';

export const APPRENTICE = 'apprentice';
const clips = layout.clips;
type Clip = keyof typeof clips;
const fps: Record<Clip, number> = { idle: 4, walk: 9, run: 14, jump: 6, fall: 6, attack: 24, hurt: 12, death: 10, climb: 10 };

export function preloadApprentice(scene: Phaser.Scene) {
  for (const layer of layout.layers) {
    const key = APPRENTICE + '-' + layer;
    if (!scene.textures.exists(key)) scene.load.image(key, './art/apprentice/' + layer + '.png');
  }
}

export function assembleApprentice(scene: Phaser.Scene) {
  if (scene.textures.exists(APPRENTICE)) return;
  const first = scene.textures.get(APPRENTICE + '-' + layout.layers[0]).getSourceImage();
  const sheet = scene.textures.createCanvas(APPRENTICE, first.width, first.height)!;
  for (const layer of layout.layers) {
    sheet.context.drawImage(scene.textures.get(APPRENTICE + '-' + layer).getSourceImage() as HTMLImageElement, 0, 0);
  }
  sheet.refresh().setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const state of Object.keys(clips) as Clip[]) {
    const { row, count } = clips[state];
    const frames = Array.from({ length: count }, (_, i) => {
      const frame = state + '-' + i;
      sheet.add(frame, 0, i * layout.width, row * layout.height, layout.width, layout.height);
      return { key: APPRENTICE, frame };
    });
    if (state === 'attack') {
      scene.anims.create({ key: 'tech-windup', frames: frames.slice(0, 3), frameRate: 3000 / PLAYER.windup });
      scene.anims.create({ key: 'tech-impact', frames: frames.slice(3), frameRate: 3000 / (PLAYER.swing - PLAYER.windup) });
    } else {
      scene.anims.create({ key: 'tech-' + state, frames, frameRate: fps[state],
        repeat: ['hurt','death'].includes(state) ? 0 : -1 });
    }
  }
}
