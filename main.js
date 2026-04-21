import * as THREE from "three";
import { TW } from "tw";
import {
  TABLE_DEFAULTS,
  createRoom,
  createTable,
  createTableLight,
} from "./table.js";
import { createBallShooter } from "./ballshooter.js";
import { makePaddle } from "./paddle.js";

console.log(`Loaded Three.js version ${THREE.REVISION}`);

globalThis.THREE = THREE;
globalThis.TW = TW;

const scene = new THREE.Scene();
globalThis.scene = scene;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
TW.mainInit(renderer, scene);

const params = {
  paddleRadius: 1,
  paddleCircle: 3,

  paddleBaseDepth: 0.1,
  paddleBaseTop: 1.01,
  paddleBaseBottom: 1.01,

  paddleTopRadius: 1.01,

  paddleBottomRadius: 1.01,
  handleHeight: 1,

  ballRadius: 0.5,
};

const cameraState = TW.cameraSetup(renderer, scene, {
  minx: -100,
  maxx: TABLE_DEFAULTS.tableLength / 2 + 60,
  miny: 0,
  maxy: TABLE_DEFAULTS.tableHeight + 80,
  minz: -TABLE_DEFAULTS.tableWidth / 2 - 80,
  maxz: TABLE_DEFAULTS.tableWidth / 2 + 80,
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

var paddle;

// Paddle is locked to the player's end of the table on X
const paddleX = TABLE_DEFAULTS.tableLength / 2;

// Vertical plane at x = paddleX — paddle slides freely in Y and Z
const paddlePlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -paddleX);

const halfWidth = TABLE_DEFAULTS.tableWidth / 2;
const tableTop = TABLE_DEFAULTS.tableHeight;
const paddleScale = 12;
const paddleHalfSize = params.paddleRadius * paddleScale;

function remakePaddle() {
  if (paddle) {
    scene.remove(paddle);
  }

  paddle = makePaddle(params);
  scene.add(paddle);

  paddle.scale.setScalar(paddleScale);
  paddle.position.set(paddleX, tableTop + paddleHalfSize, 0);
  // Face the paddle toward the table (rotate so its face points along -X)
  paddle.rotation.y = Math.PI / 2;
  paddle.rotation.z = 0.2;

  shooterResult.setPaddle(paddle);
}

remakePaddle();


// Had to look up how to do this
function setLogoFromFile(file) {

  const texture = new THREE.TextureLoader().load(
    URL.createObjectURL(file),
    () => {
      const logo = paddle.getObjectByName("paddleLogo");
      if (!logo) return;

      if (logo.material.map) logo.material.map.dispose();

      logo.material.map = texture;
      logo.material.needsUpdate = true;
    }
  );
}

window.addEventListener("dragover", e => e.preventDefault());

window.addEventListener("drop", e => {
  e.preventDefault();
  setLogoFromFile(e.dataTransfer.files[0]);
});
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const hitPoint = new THREE.Vector3();

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const cam = scene.getObjectByProperty('isCamera', true) ?? scene.getObjectByProperty('isPerspectiveCamera', true);
  if (!cam) return;
  raycaster.setFromCamera(mouse, cam);

  if (raycaster.ray.intersectPlane(paddlePlane, hitPoint)) {
    // X is locked to the table edge
    paddle.position.x = paddleX + 2;
    // Clamp Z so paddle stays within table width
    paddle.position.z = THREE.MathUtils.clamp(hitPoint.z, -halfWidth + paddleHalfSize - 30, halfWidth - paddleHalfSize + 30);
    // Clamp Y so paddle doesn't go below the table surface
    paddle.position.y = THREE.MathUtils.clamp(hitPoint.y, tableTop + paddleHalfSize - 25, tableTop + 100);
  }

  // Flips the paddle along the mid-point of the table, makes it look smoother, keeps the logo at the right position
  if (paddle.position.z > 0) {
    paddle.rotation.z = 0.2;
  } else {
    paddle.rotation.z = -0.2;
  }

}

window.addEventListener("mousemove", onMouseMove);

function animate() {
  requestAnimationFrame(animate);
  shooterResult.animate();
  TW.render();
}
animate();

console.log(cameraState);

cameraObject.near = 0.4;
// cameraObject.far = 100;
cameraObject.aspect = window.innerWidth / window.innerHeight;
cameraObject.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);