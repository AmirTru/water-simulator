import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import waterVertexShader from "./shaders/water/vertex.glsl";
import waterFragmentShader from "./shaders/water/fragment.glsl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 340 });
const debugObject = {};
gui.close();
// gui.hide();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const gltfLoader = new GLTFLoader();

let beachBall = null;

const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material = mesh;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

gltfLoader.load(
  //
  "/beach_ball_free_download.glb",
  (gltf) => {
    beachBall = gltf.scene;
    scene.add(beachBall);
    beachBall.scale.set(0.8, 0.8, 0.8);

    updateAllMaterials();
  }
);

// Lights
const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
directionalLight.position.set(0.25, 3, -2.25);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
scene.add(directionalLight);

//abbient light
const ambientLight = new THREE.AmbientLight("#ffffff", 1);
scene.add(ambientLight);

// const cubeGeometry = new THREE.SphereGeometry(0.5, 12, 12);
// const cubeMaterial = new THREE.MeshBasicMaterial({
//   color: 0xff0000,
//   wireframe: true,
// });
// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// scene.add(cube);
/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(20, 20, 200, 200);
waterGeometry.castShadow = true;
waterGeometry.receiveShadow = true;

// Color
debugObject.depthColor = "#0f5e9c";
debugObject.surfaceColor = "#ffffff";

// Material
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  // wireframe: true,
  uniforms: {
    uTime: { value: 0 },

    uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
    uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
    uColorOffset: { value: -0.093 },
    uColorMultiplier: { value: 0.391 },

    uBigWavesElevation: { value: 0.755 },
    uBigWavesFrequency: { value: new THREE.Vector2(0.743, 0.279) },
    uBigWavesSpeed: { value: 1.101 },

    uSmallWavesElevation: { value: 1.0 },
    uSmallWavesFrequency: { value: 0.275 },
    uSmallWavesSpeed: { value: 0.668 },
    uSmallWavesIterations: { value: 4.0 },
  },
});

// Debug

gui
  .add(waterMaterial.uniforms.uBigWavesElevation, "value")
  .min(0)
  .max(2)
  .step(0.001)
  .name("uBigWavesElevation");
gui
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
  .min(0)
  .max(1.5)
  .step(0.001)
  .name("uBigWavesFrequencyX");
gui
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
  .min(0)
  .max(1.5)
  .step(0.001)
  .name("uBigWavesFrequencyY");
gui
  .add(waterMaterial.uniforms.uBigWavesSpeed, "value")
  .min(0)
  .max(4)
  .step(0.001)
  .name("uBigWavesSpeed");
gui.addColor(debugObject, "depthColor").onChange(() => {
  waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor);
});
gui.addColor(debugObject, "surfaceColor").onChange(() => {
  waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor);
});
gui
  .add(waterMaterial.uniforms.uColorOffset, "value")
  .min(-0.5)
  .max(0.5)
  .step(0.001)
  .name("uColorOffset");
gui
  .add(waterMaterial.uniforms.uColorMultiplier, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uColorMultiplier");
gui
  .add(waterMaterial.uniforms.uSmallWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uSmallWavesElevation");
gui
  .add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uSmallWavesFrequency");
gui
  .add(waterMaterial.uniforms.uSmallWavesSpeed, "value")
  .min(0)
  .max(4)
  .step(0.001)
  .name("uSmallWavesSpeed");
gui
  .add(waterMaterial.uniforms.uSmallWavesIterations, "value")
  .min(0)
  .max(5)
  .step(1)
  .name("uSmallWavesIterations");

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5;
scene.add(water);

function calculateElevation(
  modelPosition,
  uBigWavesFrequency,
  uTime,
  uBigWavesSpeed,
  uBigWavesElevation,
  uSmallWavesFrequency,
  uSmallWavesSpeed,
  uSmallWavesElevation
) {
  let elevation;

  let f = modelPosition.x - uBigWavesSpeed * uTime;
  modelPosition.x += uBigWavesFrequency.x * Math.cos(f);
  elevation = uBigWavesFrequency.y * Math.sin(f);

  // Elevation
  elevation +=
    Math.sin(
      (modelPosition.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) * 0.5
    ) *
    Math.sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) *
    uBigWavesElevation;

  return elevation;
}

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1, 5, 9);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

gsap.from(camera.position, {
  duration: 2,
  y: 20,
  x: 50,
  z: 10,
  ease: "power2.out",
  onComplete: () => {
    controls.enablePan = false;
    controls.maxDistance = 11;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.zoomSpeed = 0.1;
    controls.rotateSpeed = 0.2;
    controls.enableDamping = true;
  },
});
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update water
  waterMaterial.uniforms.uTime.value = elapsedTime;

  if (beachBall) {
    let elevation = calculateElevation(
      beachBall.position,
      waterMaterial.uniforms.uBigWavesFrequency.value,
      waterMaterial.uniforms.uTime.value,
      waterMaterial.uniforms.uBigWavesSpeed.value,
      waterMaterial.uniforms.uBigWavesElevation.value,
      waterMaterial.uniforms.uSmallWavesFrequency.value,
      waterMaterial.uniforms.uSmallWavesSpeed.value,
      waterMaterial.uniforms.uSmallWavesElevation.value
    );
    // beachBall.position.x = elevation - elevation / 2 + Math.sin(elapsedTime);
    // beachBall.position.z = -elevation - elevation / 2 + Math.sin(elapsedTime);
    // beachBall.rotation.z = elevation + Math.sin(elapsedTime) * 0.5;
    // beachBall.rotation.x = -elevation + Math.sin(elapsedTime) * 0.5;

    gsap.to(beachBall.position, {
      duration: 1,
      y: elevation - 0.2,
      z: -elevation - elevation / 2 + Math.sin(elapsedTime),
      x: elevation - elevation / 2 + Math.sin(elapsedTime),
      ease: "power2.out",
    });
    gsap.to(beachBall.rotation, {
      duration: 1,
      z: elevation + Math.sin(elapsedTime) * 0.5,
      x: -elevation + Math.sin(elapsedTime) * 0.5,
      ease: "power2.out",
    });
    // beachBall.position.y = elevation - 0.2;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
