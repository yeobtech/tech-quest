import { installWorkshop } from './ui/Workshop';
import Phaser from 'phaser';
import './style.css';
import { Hud } from './ui/Hud';
import { GameScene } from './scenes/GameScene';
import { WORLD_GRAVITY } from './data/config';
const hud = new Hud();
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1280, height: 720, pixelArt: true, roundPixels: true, antialias: false, physics: { default: 'arcade', arcade: { gravity: { x: 0, y: WORLD_GRAVITY }, debug: new URLSearchParams(location.search).has('debug') } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [new GameScene(hud)] });

installWorkshop(() => game.scene.pause('forest'), () => { game.scene.resume('forest'); game.canvas.focus(); });
