import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Load the cheering fan GLB and place it in the scene.
 *
 * Frame:
 * - The loaded model uses its own GLB-local axes.
 * - After loading, the returned root group is positioned in world space.
 *
 * @param {Object} params configuration values
 * @param {string} [params.url="./images/Cheering(1).glb"] path to the GLB file
 * @param {THREE.Vector3} [params.position] world position for the model root
 * @param {THREE.Vector3} [params.scale] scale applied to the model root
 * @param {THREE.Euler} [params.rotation] rotation applied to the model root
 * @returns {Promise<THREE.Group>} promise resolving to the loaded model root
 */
export async function loadCheeringFan(params = {}) {
  const {
    url = "./images/Cheering(1).glb",
    position = new THREE.Vector3(0, 0, -600),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Euler(0,0 , 0),
  } = params;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const fan = gltf.scene;

  fan.position.copy(position);
  fan.scale.copy(scale);
  fan.rotation.copy(rotation);

  fan.traverse((child) => {
    if (child.isSkinnedMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  

  return fan;
}
class Fan {
  constructor(model) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model);
    this.action = null;
  }

  playAnimation(animationName) {
    const clip = THREE.AnimationClip.findByName(this.model.animations, animationName);
    if (clip) {
      this.action = this.mixer.clipAction(clip);
      this.action.play();
    }
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}
Fan.prototype.update = function(deltaTime) {
  if (this.mixer) {
    this.mixer.update(deltaTime);
  }
};
