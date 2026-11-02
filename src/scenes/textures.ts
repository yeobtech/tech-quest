import Phaser from 'phaser';
export function createTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const playerFrame = (pose: 'idle' | 'run-1' | 'run-2' | 'jump' | 'attack-1' | 'attack-2' | 'fall' | 'hurt' | 'death') => {
    if (pose === 'death') {
      g.fillStyle(0x142e35).fillRect(19, 48, 24, 9);
      g.fillStyle(0x6bbeb0).fillRect(36, 41, 20, 16);
      g.fillStyle(0xe8b783).fillRect(54, 42, 13, 15);
      g.fillStyle(0xe9d581).fillRect(64, 38, 6, 20);
      g.generateTexture('player-death', 80, 60); g.clear(); return;
    }
    const running = pose.startsWith('run'); const jumping = pose === 'jump'; const attacking = pose.startsWith('attack');
    const stride = pose === 'run-1' ? 7 : pose === 'run-2' ? -7 : jumping ? 5 : pose === 'fall' ? -4 : 0;
    g.fillStyle(0x142e35).fillRect(29 - stride, 39, 9, jumping ? 15 : 19).fillRect(44 + stride, 39, 9, jumping ? 15 : 19);
    g.fillStyle(pose === 'hurt' ? 0xf18678 : 0x6bbeb0).fillRect(26, 24, 30, 23);
    g.fillStyle(0xe8b783).fillRect(31, 8, 24, 19).fillRect(21 + (running ? stride : 0), 29, 7, 14);
    if (attacking) {
      const high = pose === 'attack-1';
      g.fillRect(54, high ? 22 : 31, 14, 7);
      g.fillStyle(0x6d5439).fillRect(64, high ? 14 : 25, 5, 15);
      g.fillStyle(0xe4f5df).fillRect(68, high ? 4 : 26, 9, high ? 16 : 6);
      g.fillStyle(0xa8d3ca).fillRect(69, high ? 4 : 31, 8, 3);
    } else { g.fillRect(55 - (running ? stride : 0), pose === 'fall' ? 17 : pose === 'hurt' ? 22 : jumping ? 25 : 29, 7, 14); }
    g.fillStyle(0xe9d581).fillRect(26, 4, 32, 9).fillRect(33, 0, 20, 9);
    g.fillStyle(0x203e42).fillRect(48, 15, 4, 4); g.fillStyle(0xc9e0ce).fillRect(35, 28, 13, 5);
    g.generateTexture(`player-${pose}`, 80, 60); g.clear();
  };
  (['idle', 'run-1', 'run-2', 'jump', 'attack-1', 'attack-2', 'fall', 'hurt', 'death'] as const).forEach(playerFrame);
  g.fillStyle(0x4eab79).fillRoundedRect(2, 8, 42, 30, 12); g.fillStyle(0x9cde89).fillRoundedRect(5, 5, 36, 27, 12); g.fillStyle(0x24493e).fillRect(11, 17, 4, 5).fillRect(29, 17, 4, 5); g.fillStyle(0xd5f3ab).fillRect(15, 8, 9, 4); g.fillStyle(0x68b66a).fillTriangle(22, 8, 17, 0, 30, 1); g.generateTexture('slime', 46, 40); g.clear();
  g.fillStyle(0x4b6563).fillRect(5, 27, 10, 12).fillRect(29, 27, 10, 12); g.fillStyle(0xcea66b).fillRoundedRect(3, 6, 39, 26, 4); g.fillStyle(0x234d53).fillRect(8, 12, 29, 12); g.fillStyle(0xa3e5dd).fillRect(12, 15, 6, 5).fillRect(27, 15, 6, 5); g.fillStyle(0xf1d495).fillRect(20, 0, 5, 7); g.generateTexture('bot', 46, 40); g.clear();
  g.fillStyle(0xffffff).fillRect(0, 0, 32, 32); g.generateTexture('platform', 32, 32); g.destroy();
}
