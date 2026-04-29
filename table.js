import * as THREE from "three";

export const TABLE_DEFAULTS = {
  tableLength: 274,
  tableThickness: 2.5,
  tableWidth: 152.5,
  tableHeight: 76,
  roomLength: 800,
  roomWidth: 700,
  roomHeight: 500,
  legRadius: 3,
  netHeight: 15.25,
};

export const ROOM_POSTER_DEFAULTS = [
  { texturePath: "./textures/SSBU.jpeg", wall: "back", slot: 0, y: 250 },
  { texturePath: "./textures/siliconvalley.jpeg", wall: "back", slot: 2, y: 250 },
  { texturePath: "./textures/sewaneetigers.png", wall: "front", slot: 1, y: 250, maxWidth: 280, maxHeight: 180 },
  { texturePath: "./textures/pong.jpeg", wall: "left", slot: 0, y: 245, maxWidth: 130, maxHeight: 175 },
  { texturePath: "./textures/pong2.jpeg", wall: "left", slot: 2, y: 245, maxWidth: 130, maxHeight: 175 },
  { texturePath: "./textures/luffy.jpeg", wall: "right", slot: 0, y: 245 },
  { texturePath: "./textures/zoro.jpeg", wall: "right", slot: 2, y: 245 },
];

/**
 * Create a room centered on the x/z axes with the floor on y = 0.
 *
 * Frame:
 * - +x points along the table length.
 * - +y points upward.
 * - +z points across the table width.
 * - The room origin is on the center of the floor.
 *
 * Natural size:
 * - x extent: [-roomLength / 2, roomLength / 2]
 * - y extent: [0, roomHeight]
 * - z extent: [-roomWidth / 2, roomWidth / 2]
 *
 * @param {Object} params configuration values
 * @param {number} [params.roomLength=674] room size along x
 * @param {number} [params.roomWidth=352.5] room size along z
 * @param {number} [params.roomHeight=500] room size along y
 * @param {THREE.Material} [params.material] material for the room walls
 * @returns {THREE.Mesh} room mesh
 */
export function createRoom(params = {}) {
  const {
    roomLength = TABLE_DEFAULTS.roomLength,
    roomWidth = TABLE_DEFAULTS.roomWidth,
    roomHeight = TABLE_DEFAULTS.roomHeight,
    posters = ROOM_POSTER_DEFAULTS,
    material = new THREE.MeshPhongMaterial({
      color: 0xF5DABA,
      side: THREE.BackSide,
      // transparent: true,
      // opacity: 0.5
    }),
  } = params;

  const group = new THREE.Group();

  const geometry = new THREE.BoxGeometry(roomLength, roomHeight, roomWidth);
  const room = new THREE.Mesh(geometry, material);
  room.position.y = roomHeight / 2;
  room.receiveShadow = true;
  group.add(room);

  const floorTexture = new THREE.TextureLoader().load("./textures/Woodfloor.jpeg");
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(6, 6);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomLength, roomWidth),
    new THREE.MeshPhongMaterial({ map: floorTexture })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.5;
  floor.receiveShadow = true;
  group.add(floor);

  const loader = new THREE.TextureLoader();

  function addPoster({
    texturePath,
    width,
    height,
    position,
    rotation = new THREE.Euler(),
  }) {
    const frame = new THREE.Group();

    const frameMaterial = new THREE.MeshPhongMaterial({color: 0x3b2a1f, side: THREE.FrontSide});    
    const border = 5;
    const thickness = 4;
    
    // Top side
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(width + border * 2, border, thickness),
      frameMaterial
    );
    top.position.y = height / 2 + border / 2;
    
    // Bottom side
    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(width + border * 2, border, thickness),
      frameMaterial
    );
    bottom.position.y = -height / 2 - border / 2;
    
    // Left side
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(border, height, thickness),
      frameMaterial
    );
    left.position.x = -width / 2 - border / 2;
    
    // Right side
    const right = new THREE.Mesh(
      new THREE.BoxGeometry(border, height, thickness),
      frameMaterial
    );
    right.position.x = width / 2 + border / 2;
    
    frame.add(top, bottom, left, right);
    frame.position.copy(position);
    frame.rotation.copy(rotation);
    group.add(frame);

    const posterTexture = loader.load(texturePath);
    posterTexture.colorSpace = THREE.SRGBColorSpace;

    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshPhongMaterial({ map: posterTexture, side: THREE.FrontSide, transparent: true,})
    );

    const depthOffset = 2.1;
    poster.position.copy(position);
    poster.rotation.copy(rotation);

    if (Math.abs(rotation.y) < 0.01) {
      poster.position.z += depthOffset;
    } else if (Math.abs(Math.abs(rotation.y) - Math.PI) < 0.01) {
      poster.position.z -= depthOffset;
    } else if (rotation.y > 0) {
      poster.position.x += depthOffset;
    } else {
      poster.position.x -= depthOffset;
    }

    group.add(poster);
  }

  function fitPosterSize(image, maxWidth = 110, maxHeight = 150) {
    const aspectRatio = image && image.height ? image.width / image.height : 1;

    let width = maxWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  }

  function addWallPoster({
    texturePath,
    wall,
    slot,
    y = 245,
    maxWidth = 110,
    maxHeight = 150,
  }) {
    const wallPositions = {
      back: {
        position: new THREE.Vector3(-160 + slot * 160, y, -roomWidth / 2 + 2),
        rotation: new THREE.Euler(0, 0, 0),
      },
      front: {
        position: new THREE.Vector3(-160 + slot * 160, y, roomWidth / 2 - 2),
        rotation: new THREE.Euler(0, Math.PI, 0),
      },
      left: {
        position: new THREE.Vector3(-roomLength / 2 + 2, y, -170 + slot * 170),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
      },
      right: {
        position: new THREE.Vector3(roomLength / 2 - 2, y, -170 + slot * 170),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      },
    };

    const placement = wallPositions[wall];
    if (!placement) return;

    loader.load(texturePath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const { width, height } = fitPosterSize(texture.image, maxWidth, maxHeight);

      addPoster({
        texturePath,
        width,
        height,
        position: placement.position,
        rotation: placement.rotation,
      });
    });
  }

  for (const poster of posters) {
    addWallPoster(poster);
  }

  return group;
}

/**
 * Create a hanging lamp plus ambient, directional, and spotlight sources.
 *
 * Frame:
 * - Built to hang above the table center at x = 0, z = 0.
 * - The lamp geometry is centered over the table.
 *
 * Natural size:
 * - Lamp shade reaches roughly from y = 137.5 to y = 162.5.
 * - String reaches from y = 150 to y = 300.
 *
 * Colors:
 * - Shade is black.
 * - String is white.
 * - Lights are white unless replaced via parameters.
 *
 * @param {Object} params configuration values
 * @param {number} [params.tableHeight=76] table surface height
 * @param {THREE.ColorRepresentation} [params.ambientColor=0xffffff]
 * @param {number} [params.ambientIntensity=1]
 * @param {THREE.ColorRepresentation} [params.directionalColor=0xffffff]
 * @param {number} [params.directionalIntensity=1]
 * @param {THREE.Vector3} [params.directionalPosition]
 * @param {THREE.ColorRepresentation} [params.spotColor=0xffffff]
 * @param {number} [params.spotIntensity=5]
 * @returns {{group: THREE.Group, ambientLight: THREE.AmbientLight, directionalLight: THREE.DirectionalLight, spotLight: THREE.SpotLight}}
 */
export function createTableLight(params = {}) {
  const {
    tableHeight = TABLE_DEFAULTS.tableHeight,
    roomHeight = TABLE_DEFAULTS.roomHeight,
    lampDrop = 300,
    ambientColor = 0xffffff,
    ambientIntensity = 0.6,
    directionalColor = 0xffffff,
    directionalIntensity = 0.3,
    directionalPosition = new THREE.Vector3(50, 100, 50),
    spotColor = 0xffffff,
    spotIntensity = 5,
  } = params;

  const lampY = roomHeight - lampDrop;
  const stringHeight = lampDrop;

  const group = new THREE.Group();

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(25, 25, 20),
    new THREE.MeshPhongMaterial({ color: 0x000000 })
  );
  cone.position.set(0, lampY, 0);
  group.add(cone);



  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, stringHeight, 16),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  string.position.set(0, roomHeight - stringHeight / 2, 0);
  group.add(string);

  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  group.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    directionalColor,
    directionalIntensity
  );
  directionalLight.position.copy(directionalPosition);
  group.add(directionalLight);

  const spotLight = new THREE.SpotLight(spotColor, spotIntensity);
  spotLight.position.set(0, lampY, 0);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.1;
  spotLight.decay = 0;
  spotLight.distance = 200;

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024; 

  spotLight.target.position.set(0, tableHeight, 0);
  group.add(spotLight);
  group.add(spotLight.target);

  return { group, ambientLight, directionalLight, spotLight };
}

/**
 * Create a table-tennis table with legs, center line, and net hitbox.
 *
 * Frame:
 * - The table is centered on x = 0 and z = 0.
 * - The floor is at y = 0.
 * - The tabletop top surface is at y = tableHeight + tableThickness / 2.
 *
 * Natural size:
 * - x extent: [-tableLength / 2, tableLength / 2]
 * - z extent: [-tableWidth / 2, tableWidth / 2]
 * - y extent: [0, tableHeight + tableThickness / 2 + netHeight]
 *
 * Colors:
 * - Tabletop is green by default.
 * - Center line and net border are white.
 * - Legs are brown.
 * - Net grid is black.
 *
 * @param {Object} params configuration values
 * @param {number} [params.tableLength=274] official table length in cm
 * @param {number} [params.tableWidth=152.5] official table width in cm
 * @param {number} [params.tableThickness=2.5] tabletop thickness in cm
 * @param {number} [params.tableHeight=76] tabletop base height in cm
 * @param {number} [params.legRadius=3] leg radius in cm
 * @param {number} [params.netHeight=15.25] official net height in cm
 * @returns {{group: THREE.Group, netHitbox: THREE.Mesh, dimensions: Object}}
 */
export function createTable(params = {}) {
  const {
    tableLength = TABLE_DEFAULTS.tableLength,
    tableWidth = TABLE_DEFAULTS.tableWidth,
    tableThickness = TABLE_DEFAULTS.tableThickness,
    tableHeight = TABLE_DEFAULTS.tableHeight,
    legRadius = TABLE_DEFAULTS.legRadius,
    netHeight = TABLE_DEFAULTS.netHeight,
    lampDrop = 100,
  } = params;

  const group = new THREE.Group();

  const tabletop = new THREE.Mesh(
    new THREE.BoxGeometry(tableLength, tableThickness, tableWidth),
    new THREE.MeshPhongMaterial({ color: 0x0b6623 })
  );
  tabletop.position.y = tableHeight;
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  group.add(tabletop);

  const centerLine = new THREE.Mesh(
    new THREE.BoxGeometry(tableLength, 0.2, 1),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  centerLine.position.y = tableHeight + tableThickness / 2 + 0.1;
  group.add(centerLine);

  const legGeometry = new THREE.CylinderGeometry(
    legRadius,
    legRadius,
    tableHeight,
    32
  );
  const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5a2b });
  const legX = tableLength / 2 - 5;
  const legZ = tableWidth / 2 - 5;
  const legY = tableHeight / 2;
  const legPositions = [
    [legX, legY, legZ],
    [-legX, legY, legZ],
    [legX, legY, -legZ],
    [-legX, legY, -legZ],
  ];

  for (const position of legPositions) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(...position);
    group.add(leg);
  }

  const netGroup = new THREE.Group();
  const segmentsX = 40;
  const segmentsY = 10;
  const lineRadius = 0.2;
  const netMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const dx = tableWidth / segmentsX;
  const dy = netHeight / segmentsY;

  for (let i = 0; i <= segmentsX; i += 1) {
    const x = -tableWidth / 2 + i * dx;
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(lineRadius, lineRadius, netHeight, 8),
      netMaterial
    );
    line.position.set(x, tableHeight + netHeight / 2, 0);
    netGroup.add(line);
  }

  for (let j = 0; j <= segmentsY; j += 1) {
    const y = tableHeight + j * dy;
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(lineRadius, lineRadius, tableWidth, 8),
      netMaterial
    );
    line.rotation.z = Math.PI / 2;
    line.position.set(0, y, 0);
    netGroup.add(line);
  }

  netGroup.rotation.y = Math.PI / 2;

  const borderMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const borderRadius = lineRadius * 3;

  const topBorder = new THREE.Mesh(
    new THREE.CylinderGeometry(borderRadius, borderRadius, tableWidth, 16),
    borderMaterial
  );
  topBorder.rotation.z = Math.PI / 2;
  topBorder.position.set(0, tableHeight + netHeight, 0);
  netGroup.add(topBorder);

  const leftBorder = new THREE.Mesh(
    new THREE.CylinderGeometry(borderRadius, borderRadius, netHeight, 16),
    borderMaterial
  );
  leftBorder.position.set(-tableWidth / 2, tableHeight + netHeight / 2, 0);
  netGroup.add(leftBorder);

  const rightBorder = new THREE.Mesh(
    new THREE.CylinderGeometry(borderRadius, borderRadius, netHeight, 16),
    borderMaterial
  );
  rightBorder.position.set(tableWidth / 2, tableHeight + netHeight / 2, 0);
  netGroup.add(rightBorder);

  group.add(netGroup);

  const netHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(2, netHeight, tableWidth),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  netHitbox.position.set(0, tableHeight + netHeight / 2, 0);
  group.add(netHitbox);

  return {
    group,
    netHitbox,
    dimensions: {
      tableLength,
      tableWidth,
      tableThickness,
      tableHeight,
      netHeight,
    },
  };
}
