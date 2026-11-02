import Phaser from 'phaser';
import { PLAYER } from '../data/config';
import { characterArt } from '../data/characterArt';
import layout from '../data/apprentice.json';

export const APPRENTICE = 'apprentice';
const clips = layout.clips;
type Clip = keyof typeof clips;
const fps: Record<Clip, number> = { idle: 2, walk: 9, run: 14, jump: 6, fall: 6, attack: 24, hurt: 12, death: 10, climb: 10 };

export function preloadApprentice(scene: Phaser.Scene) {
  for (const state of ['idle', 'run', 'attack'] as const) {
    characterArt[state].layers.forEach((url, i) => {
      const key = externalKey(state, i);
      if (!scene.textures.exists(key)) scene.load.image(key, url);
    });
  }
  for (const layer of layout.layers) {
    const key = APPRENTICE + '-' + layer;
    if (!scene.textures.exists(key)) scene.load.image(key, './art/apprentice/' + layer + '.png');
  }
}

function externalKey(state: string, layer: number) { return 'hero-art-' + state + '-' + layer; }

function externalFrames(scene: Phaser.Scene, state: 'idle' | 'run' | 'attack') {
  const { width, height, foot, facesLeft } = characterArt;
  const { count, layers } = characterArt[state];
  if (!layers.length) return;
  const keys = layers.map((_, i) => externalKey(state, i));
  if (!Number.isInteger(count) || count < 1 || width <= 0 || height <= 0 ||
      foot.x <= 0 || foot.x >= width || foot.y <= 0 || foot.y > height ||
      (state === 'attack' && (characterArt.attack.impactFrame < 1 || characterArt.attack.impactFrame >= count)) ||
      keys.some(key => !scene.textures.exists(key))) return;
  const images = keys.map(key => scene.textures.get(key).getSourceImage() as HTMLImageElement);
  if (images.some(im => im.width !== width * count || im.height !== height)) return;

  // Normalize artwork onto the existing physics sprite's frame and foot anchor.
  const [ax, ay] = layout.foot;
  const pivot = facesLeft ? width - foot.x : foot.x;
  const scale = Math.min(ax / pivot, (layout.width - ax) / (width - pivot),
    ay / foot.y, (layout.height - ay) / (height - foot.y), 1);
  const key = 'hero-clip-' + state;
  const sheet = scene.textures.createCanvas(key, count * layout.width, layout.height)!;
  const ctx = sheet.context;
  ctx.imageSmoothingEnabled = false;
  const frames = Array.from({ length: count }, (_, i) => {
    ctx.save();
    ctx.translate(i * layout.width + ax, ay);
    ctx.scale(facesLeft ? -scale : scale, scale);
    for (const image of images) ctx.drawImage(image, i * width, 0, width, height, -foot.x, -foot.y, width, height);
    ctx.restore();
    sheet.add(i, 0, i * layout.width, 0, layout.width, layout.height);
    return { key, frame: i };
  });
  sheet.refresh().setFilter(Phaser.Textures.FilterMode.NEAREST);
  return frames;
}

export function assembleApprentice(scene: Phaser.Scene) {
  if (scene.textures.exists(APPRENTICE)) return;
  const first = scene.textures.get(APPRENTICE + '-' + layout.layers[0]).getSourceImage();
  const sheet = scene.textures.createCanvas(APPRENTICE, first.width, first.height)!;
  for (const state of ['idle', 'run', 'attack'] as const) {
    characterArt[state].layers.forEach((url, i) => {
      const key = externalKey(state, i);
      if (!scene.textures.exists(key)) scene.load.image(key, url);
    });
  }
  for (const layer of layout.layers) {
    sheet.context.drawImage(scene.textures.get(APPRENTICE + '-' + layer).getSourceImage() as HTMLImageElement, 0, 0);
  }
  sheet.refresh().setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const state of Object.keys(clips) as Clip[]) {
    const { row, count } = clips[state];
    const replacement = state === 'idle' || state === 'run' || state === 'attack' ? externalFrames(scene, state) : undefined;
    const frames = replacement ?? Array.from({ length: count }, (_, i) => {
      const frame = state + '-' + i;
      sheet.add(frame, 0, i * layout.width, row * layout.height, layout.width, layout.height);
      return { key: APPRENTICE, frame };
    });
    if (state === 'attack') {
      const impact = replacement ? characterArt.attack.impactFrame : 3;
      scene.anims.create({ key: 'tech-windup', frames: frames.slice(0, impact), frameRate: impact * 1000 / PLAYER.windup });
      scene.anims.create({ key: 'tech-impact', frames: frames.slice(impact), frameRate: (frames.length - impact) * 1000 / (PLAYER.swing - PLAYER.windup) });
    } else {
      scene.anims.create({ key: 'tech-' + state, frames, frameRate: replacement && (state === 'idle' || state === 'run') ? characterArt[state].fps : fps[state],
        repeat: ['hurt','death'].includes(state) ? 0 : -1 });
    }
  }
}
