export type Student = 'boy' | 'girl';
export const students = { boy: '남학생', girl: '여학생' };
export const studentArt = (id: Student, action: 'idle' | 'run' | 'attack') =>
  './art/students/' + id + '/' + action + '.png';

export const characterArt = {
  width: 80, height: 64, foot: { x: 40, y: 60 }, facesLeft: false,
  idle: { layers: [] as string[], count: 4, fps: 3 },
  run: { layers: [] as string[], count: 8, fps: 14 },
  attack: { layers: [] as string[], count: 6, impactFrame: 3 }
};

// Layer lists are unrestricted URLs in back-to-front drawing order.
// Student presets share the same combat and physical configuration.
export function equipStudent(id: Student) {
  for (const action of ['idle', 'run', 'attack'] as const)
    characterArt[action].layers = [studentArt(id, action)];
}

export type ToolKind = 'scissors' | 'nippers' | 'stripper' | 'hammer' | 'saw' | 'cutter' | 'glueGun' | 'sandpaper';
export interface ToolAppearance {
  kind: ToolKind;
  attackSheet?: string;
  damage?: number;
  effect?: string;
  requiredSafetyGear?: string[];
}
export const starterTool: ToolAppearance = { kind: 'scissors' };
