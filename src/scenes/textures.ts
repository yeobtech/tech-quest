import Phaser from 'phaser';
export function createTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x4eab79).fillRoundedRect(2, 8, 42, 30, 12); g.fillStyle(0x9cde89).fillRoundedRect(5, 5, 36, 27, 12); g.fillStyle(0x24493e).fillRect(11, 17, 4, 5).fillRect(29, 17, 4, 5); g.fillStyle(0xd5f3ab).fillRect(15, 8, 9, 4); g.fillStyle(0x68b66a).fillTriangle(22, 8, 17, 0, 30, 1); g.generateTexture('slime', 46, 40); g.clear();
  g.fillStyle(0x4b6563).fillRect(5, 27, 10, 12).fillRect(29, 27, 10, 12); g.fillStyle(0xcea66b).fillRoundedRect(3, 6, 39, 26, 4); g.fillStyle(0x234d53).fillRect(8, 12, 29, 12); g.fillStyle(0xa3e5dd).fillRect(12, 15, 6, 5).fillRect(27, 15, 6, 5); g.fillStyle(0xf1d495).fillRect(20, 0, 5, 7); g.generateTexture('bot', 46, 40); g.clear();
  g.fillStyle(0xffffff).fillRect(0, 0, 32, 32); g.generateTexture('platform', 32, 32); g.destroy();
}
