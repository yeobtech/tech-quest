import Phaser from 'phaser';
import { PLAYER } from '../data/config';
import { characterArt, studentActions, type StudentAction } from '../data/characterArt';
import layout from '../data/apprentice.json';
import type { Wardrobe } from '../data/shop';
import { decorate } from './cosmetics';

export const APPRENTICE = 'apprentice';
const clips = layout.clips;
type Clip = keyof typeof clips;
const fps: Record<Clip, number> = { idle: 2, walk: 9, run: 14, jump: 6, fall: 6, attack: 24, hurt: 12, death: 10, climb: 10 };

export function preloadApprentice(scene: Phaser.Scene) {
  for (const state of studentActions) {
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

function externalFrames(scene: Phaser.Scene, state: StudentAction, equipment?:Wardrobe['equipped']) {
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
  const exists=scene.textures.exists(key);
  const sheet = exists ? scene.textures.get(key) as Phaser.Textures.CanvasTexture : scene.textures.createCanvas(key, count * layout.width, layout.height)!;
  const ctx = sheet.context;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0,0,sheet.width,sheet.height);
  const frames = Array.from({ length: count }, (_, i) => {
    ctx.save();
    ctx.translate(i * layout.width + ax, ay);
    ctx.scale(facesLeft ? -scale : scale, scale);
    for (const image of images) ctx.drawImage(image, i * width, 0, width, height, -foot.x, -foot.y, width, height);
    ctx.restore();
    if(equipment) {
      const tile=document.createElement('canvas'); tile.width=layout.width; tile.height=layout.height;
      const brush=tile.getContext('2d')!;
      brush.drawImage(sheet.canvas,i*layout.width,0,layout.width,layout.height,0,0,layout.width,layout.height);
      decorate(brush,state,i,equipment);
      ctx.clearRect(i*layout.width,0,layout.width,layout.height);
      ctx.drawImage(tile,i*layout.width,0);
    }
    if(!exists) sheet.add(i, 0, i * layout.width, 0, layout.width, layout.height);
    return { key, frame: i };
  });
  sheet.refresh().setFilter(Phaser.Textures.FilterMode.NEAREST);
  return frames;
}

export function applyWardrobe(scene:Phaser.Scene,equipment:Wardrobe['equipped']) {
  for(const state of studentActions) externalFrames(scene,state,equipment);
  // Change the visual cadence within each phase; CombatSystem still starts impact at 95 ms.
  const beats:Record<string,number[]>={reinforced:[42,31,22,55,48,32],starlight:[28,39,28,43,59,33],future:[50,29,16,62,35,38]};
  const timing=beats[equipment.WeaponSkin??''];
  for(const [phase,offset] of [['tech-windup',0],['tech-impact',3]] as const) {
    const animation=scene.anims.get(phase);
    animation.frames.forEach((frame,i)=>{frame.duration=timing?.[offset+i]??0});
  }
}
export function preview(scene:Phaser.Scene,item:Wardrobe['equipped'],action:'idle'|'attack'='idle') {
  const c=document.createElement('canvas'); c.width=80;c.height=64;
  const ctx=c.getContext('2d')!, key=externalKey(action,0), i=action==='attack'?3:0;
  if(scene.textures.exists(key)) {
    ctx.drawImage(scene.textures.get(key).getSourceImage() as HTMLImageElement,80*i,0,80,64,0,0,80,64);
    decorate(ctx,action,i,item);
  } else ctx.drawImage(scene.textures.get(APPRENTICE).getSourceImage() as HTMLCanvasElement,i*80,clips[action].row*64,80,64,0,0,80,64);
  return c;
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
    const replacement = state !== 'walk' ? externalFrames(scene, state) : externalFrames(scene,'run');
    const fallback = Array.from({ length: count }, (_, i) => {
      const frame = state + '-' + i;
      sheet.add(frame, 0, i * layout.width, row * layout.height, layout.width, layout.height);
      return { key: APPRENTICE, frame };
    });
    const frames = replacement ?? fallback;
    if (state === 'attack') {
      const impact = replacement ? characterArt.attack.impactFrame : 3;
      scene.anims.create({ key: 'tech-windup', frames: frames.slice(0, impact), frameRate: impact * 1000 / PLAYER.windup });
      scene.anims.create({ key: 'tech-impact', frames: frames.slice(impact), frameRate: (frames.length - impact) * 1000 / (PLAYER.swing - PLAYER.windup) });
    } else {
      scene.anims.create({ key: 'tech-' + state, frames, frameRate: replacement && state !== 'walk' ? characterArt[state].fps : fps[state],
        repeat: ['hurt','death'].includes(state) ? 0 : -1 });
    }
  }
}
