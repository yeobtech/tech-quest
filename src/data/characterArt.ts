export type Student = 'boy' | 'girl';
export const students = { boy: '남학생', girl: '여학생' };
export const studentActions = ['idle','run','attack','jump','fall','climb','hurt','death'] as const;
export type StudentAction = typeof studentActions[number];
export const studentArt = (id: Student, action: StudentAction) =>
  './art/students/' + id + '/' + action + '.png';

export const characterArt = {
  width: 80, height: 64, foot: { x: 40, y: 60 }, facesLeft: false,
  idle: { layers: [] as string[], count: 4, fps: 3 },
  run: { layers: [] as string[], count: 8, fps: 14 },
  jump: { layers: [] as string[], count: 2, fps: 6 },
  fall: { layers: [] as string[], count: 2, fps: 6 },
  climb: { layers: [] as string[], count: 4, fps: 10 },
  hurt: { layers: [] as string[], count: 2, fps: 12 },
  death: { layers: [] as string[], count: 6, fps: 10 },
  attack: { layers: [] as string[], count: 6, impactFrame: 3 }
};

// Layer lists are unrestricted URLs in back-to-front drawing order.
// Student presets share the same combat and physical configuration.
export let currentStudent: Student = 'boy';
export function equipStudent(id: Student) {
  currentStudent = id;
  for (const action of studentActions)
    characterArt[action].layers = [studentArt(id, action)];
}
