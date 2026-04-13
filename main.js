import * as THREE from "three";
import { TW } from "tw";
import {
  TABLE_DEFAULTS,
  createRoom,
  createTable,
  createTableLight,
} from "./table.js";
import { createBallShooter } from "./ballshooter.js";
import { loadCheeringFan } from "./fan.js";

console.log(`Loaded Three.js version ${THREE.REVISION}`);

globalThis.THREE = THREE;
globalThis.TW = TW;

const scene = new THREE.Scene();
globalThis.scene = scene;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
TW.mainInit(renderer, scene);

const cameraState = TW.cameraSetup(renderer, scene, {
  minx: -100,
  maxx: 100,
  miny: 0,
  maxy: 50,
  minz: -100,
  maxz: 100,
});

scene.add(createRoom());

const tableResult = createTable();
scene.add(tableResult.group);

const lightResult = createTableLight({
  tableHeight: TABLE_DEFAULTS.tableHeight,
});
scene.add(lightResult.group);

const shooterResult = createBallShooter({
  netHitbox: tableResult.netHitbox,
  tableLength: tableResult.dimensions.tableLength,
  tableWidth: tableResult.dimensions.tableWidth,
  tableHeight: tableResult.dimensions.tableHeight,
});
scene.add(shooterResult.group);

loadCheeringFan({
  position: new THREE.Vector3(0, 0, -150),
  scale: new THREE.Vector3(1, 1, 1),
}).then((fan) => {
  scene.add(fan);
}).catch((error) => {
  console.error("Failed to load cheering fan model", error);
});

function animate() {
  requestAnimationFrame(animate);
  shooterResult.animate();
  renderer.render(scene, cameraState.camera);
}

animate();
