import {
  Engine,
  Scene,
  FreeCamera,
  HemisphericLight,
  Vector3,
  Quaternion,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  DefaultRenderingPipeline
} from "@babylonjs/core";

import "@babylonjs/loaders";

import "./style.css";


// CANVAS + ENGINE

const canvas = document.getElementById("renderCanvas");

const engine = new Engine(canvas, true);

// SCENE

const scene = new Scene(engine);

// Black space background
scene.clearColor = new Color4(0, 0, 0, 1);


// DEV HOTKEYS

window.addEventListener("keydown", (event) => {
  if (event.key === "0") {
    Inspector.Show(scene, {
      embedMode: true
    });
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "9") {
    Viewer.Show(scene, {
      embedMode: true
    });
  }
});


// CAMERA

const camera = new FreeCamera(
  "camera",
  new Vector3(0, 0, 0),
  scene
);

camera.attachControl(canvas, true);

// Keep the player in the center
camera.speed = 0;


// LIGHT

const light = new HemisphericLight(
  "light",
  new Vector3(0, 1, 0),
  scene
);

light.intensity = 0.5;


// SPHERICAL ARENA

const arenaRadius = 50;

const arena = MeshBuilder.CreateSphere(
  "arena",
  {
    diameter: arenaRadius * 2,
    segments: 32
  },
  scene
);

const arenaMaterial = new StandardMaterial(
  "arenaMaterial",
  scene
);

// STAR FIELD

const starCount = 300;
const starDistance = arenaRadius * 0.9;

const starMaterial = new StandardMaterial(
  "starMaterial",
  scene
);

starMaterial.diffuseColor = new Color3(1, 1, 1);
starMaterial.emissiveColor = new Color3(1, 1, 1);

for (let i = 0; i < starCount; i++) {

  // Random direction on a sphere
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(
    2 * Math.random() - 1
  );

  const x =
    Math.sin(phi) *
    Math.cos(theta);

  const y =
    Math.cos(phi);

  const z =
    Math.sin(phi) *
    Math.sin(theta);

  const star = MeshBuilder.CreateSphere(
    "star",
    {
      diameter: 0.08
    },
    scene
  );

  star.position = new Vector3(
    x * starDistance,
    y * starDistance,
    z * starDistance
  );

  star.material = starMaterial;
}


// BLOOM / GLOW

const pipeline = new DefaultRenderingPipeline(
  "defaultPipeline",
  true,
  scene,
  [camera]
);

pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.8;
pipeline.bloomWeight = 0.5;
pipeline.bloomKernel = 64;
pipeline.bloomScale = 0.5;


// BULLET SETTINGS

const bulletSpeed = 20;
const bulletLifetime = 5;

const bullets = [];


// SHOOT


function shoot() {
  const direction = camera
    .getDirection(Vector3.Forward())
    .normalize();

  const bullet = MeshBuilder.CreateCylinder(
    "bullet",
    {
      height: 1.2,
      diameter: 0.18,
      tessellation: 12
    },
    scene
  );

  // Spawn in front of camera
  bullet.position = camera.position.add(
    direction.scale(2)
  );

  // Point cylinder in direction of camera
  bullet.alignWithNormal(direction);

  const material = new StandardMaterial(
    "bulletMaterial",
    scene
  );

  material.diffuseColor = new Color3(1, 0, 0);
  material.emissiveColor = new Color3(1, 0, 0);

  bullet.material = material;

  bullet.direction = direction;
  bullet.life = bulletLifetime;

  bullets.push(bullet);
}


// CLICK TO SHOOT

canvas.addEventListener("click", () => {

  // Lock mouse to the game
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }

  shoot();
});


// BULLET MOVEMENT

scene.onBeforeRenderObservable.add(() => {
  const deltaTime = engine.getDeltaTime() / 1000;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    // Move the bullet
    bullet.position.addInPlace(
      bullet.direction.scale(20 * deltaTime)
    );

    // Count down lifetime
    bullet.life -= deltaTime;

    // Delete after 2 seconds
    if (bullet.life <= 0) {
      bullet.dispose();
      bullets.splice(i, 1);
    }
  }
});


// RENDER LOOP

engine.runRenderLoop(() => {

  scene.render();

});

// WINDOW RESIZE

window.addEventListener("resize", () => {

  engine.resize();

});