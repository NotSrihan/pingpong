import * as THREE from "three";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm";

/**
 * Create a table-tennis ball shooter that can launch one ball at a time.
 *
 * Frame:
 * - The machine sits near the negative x side of the table.
 * - The returned group origin stays at world origin; individual parts are placed
 *   in world coordinates to match the table module.
 *
 * Natural size:
 * - Base radius is 5, head is 20x20x20, barrel length is 20.
 * - Ball radius is 2.5.
 *
 * Colors:
 * - Base gray, head black, barrel light gray, ball orange.
 *
 * @param {Object} params configuration values
 * @param {THREE.Mesh} params.netHitbox invisible collision box for the net
 * @param {number} params.tableLength table length used for bounds
 * @param {number} params.tableWidth table width used for bounce checks
 * @param {number} params.tableHeight table top height used for bounce checks
 * @param {Object} [params.initialState] optional shooter overrides
 * @param {boolean} [params.debugNetHitbox=false] whether to show the net hitbox
 * @returns {{group: THREE.Group, gui: GUI, shooter: Object, update: Function, animate: Function, shootBall: Function, resetBall: Function}}
 */
export function createBallShooter(params) {
  const {
    netHitbox,
    tableLength,
    tableWidth,
    tableHeight,
    debugNetHitbox = false,
    initialState = {},
  } = params;

  const shooter = {
    x: -tableLength / 2 + 13,
    machineHeight: tableHeight + 30,
    angle: 8,
    power: 5,
    gravity: 0.05,
    bounceFactor: 0.7,
    ...initialState,
  };

  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 10, 32),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  group.add(base);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshPhongMaterial({ color: 0x000000 })
  );
  group.add(head);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 20, 32),
    new THREE.MeshPhongMaterial({ color: 0xa0a0a0 })
  );
  group.add(barrel);

  if (debugNetHitbox && netHitbox) {
    netHitbox.material.opacity = 0.25;
  }

  let ball = null;
  let isShooting = false;
  let velocityX = 0;
  let velocityY = 0;
  const ballRadius = 2.5;

  function update() {
    const launcherY = shooter.machineHeight;
    const angleRad = THREE.MathUtils.degToRad(shooter.angle);

    base.scale.y = launcherY / 10;
    base.position.set(shooter.x - 20, launcherY / 2, 0);

    head.position.set(shooter.x - 10, launcherY, 0);

    barrel.position.set(shooter.x, launcherY, 0);
    barrel.rotation.set(0, 0, -Math.PI / 2 + angleRad);
  }

  function resetBall() {
    if (!ball) {
      return;
    }

    group.remove(ball);
    ball.geometry.dispose();
    ball.material.dispose();
    ball = null;
    isShooting = false;
    velocityX = 0;
    velocityY = 0;
  }

  function shootBall() {
    if (isShooting) {
      return;
    }

    ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xf06400 })
    );

    const angleRad = THREE.MathUtils.degToRad(shooter.angle);
    ball.position.set(shooter.x, shooter.machineHeight, 0);
    group.add(ball);

    velocityX = shooter.power * Math.cos(angleRad);
    velocityY = shooter.power * Math.sin(angleRad);
    isShooting = true;
  }

  function animate() {
    if (!isShooting || !ball) {
      return;
    }

    ball.position.x += velocityX;
    velocityY -= shooter.gravity;
    ball.position.y += velocityY;

    const overTableX = Math.abs(ball.position.x) <= tableLength / 2;
    const overTableZ = Math.abs(ball.position.z) <= tableWidth / 2;

    if (overTableX && overTableZ && ball.position.y <= tableHeight + ballRadius) {
      ball.position.y = tableHeight + ballRadius;
      velocityY = Math.abs(velocityY) > 0.1 ? -velocityY * shooter.bounceFactor : 0;
    }

    if (netHitbox) {
      const ballBox = new THREE.Box3().setFromObject(ball);
      const netBox = new THREE.Box3().setFromObject(netHitbox);

      if (ballBox.intersectsBox(netBox)) {
        velocityX *= -0.5;
        velocityY *= 0.5;
        ball.position.x -= 5;
      }
    }

    const outOfBounds =
      ball.position.x > tableLength / 2 + ballRadius ||
      ball.position.x < -tableLength / 2 - ballRadius ||
      ball.position.y < -ballRadius;

    if (outOfBounds) {
      resetBall();
    }
  }

  const gui = createShooterGUI(shooter, update, shootBall, resetBall, tableHeight);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      shootBall();
    }
  });

  update();

  return { group, gui, shooter, update, animate, shootBall, resetBall };
}

/**
 * Build the GUI controls for the ball shooter.
 *
 * @param {Object} shooter mutable shooter settings
 * @param {Function} update callback for mesh transforms
 * @param {Function} shootBall callback for launching the ball
 * @param {Function} resetBall callback for clearing the current ball
 * @param {number} tableHeight used to clamp machine height
 * @returns {GUI} GUI instance
 */
export function createShooterGUI(
  shooter,
  update,
  shootBall,
  resetBall,
  tableHeight
) {
  const gui = new GUI();

  gui.add(shooter, "angle", -30, 80, 1).name("Launch Angle").onChange(update);
  gui
    .add(shooter, "machineHeight", tableHeight + 5, 180, 1)
    .name("Machine Height")
    .onChange(update);
  gui.add(shooter, "power", 1, 15, 0.1).name("Power");
  gui.add(shooter, "gravity", 0.01, 0.3, 0.01).name("Gravity");
  gui.add(shooter, "bounceFactor", 0, 1, 0.01).name("Bounce");

  return gui;
}
