import {
  Engine,
  Scene,
  FreeCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  Color3,
  Color4
} from "@babylonjs/core";

import "./style.css";
import {Inspector} from "@babylonjs/inspector";
import {Viewer} from "@babylonjs/viewer"
import "@babylonjs/loaders";
import {SceneLoader} from "@babylonjs/core/Loading/sceneLoader";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";


// CANVAS AND ENGINE

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

// SCENE

const scene = new Scene(engine);
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

// FIRST-PERSON CAMERA

const camera = new FreeCamera(
  "camera",
  new Vector3(0, 0, 0),
  scene
);

camera.attachControl(canvas, true);

// No movement for the camera because player is at the center
camera.speed = 0;

// LIGHTING BLOOM

const pipeline = new DefaultRenderingPipeline(
  "defaultPipeline",
  true,
  scene,
  [camera]
);

pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.8; // How bright something needs to be before bloom (0-2+)
pipeline.bloomWeight = 0.3; // How strong the glow is (0-1)
pipeline.bloomKernel = 64; // The size and spread of the glow (Powers of 2)
pipeline.bloomScale = 0.1 // Resolution of the bloom (0-1)

// LIGHT

const light = new HemisphericLight(
  "light",
  new Vector3(0, 1, 0),
  scene
);

light.intensity = 1;

// SPHERICAL ARENA

const arenaRadius = 50;

const arena = MeshBuilder.CreateSphere(
  "arena",
  {
    diameter: arenaRadius * 2,
    segments: 32
  },
  scene);

// Make the sphere a wireframe
const arenaMaterial = new StandardMaterial(
  "arenaMaterial",
  scene
);

arenaMaterial.wireframe = true;
arenaMaterial.alpha = 0.15;

arena.material = arenaMaterial;

// SHOOTING

// How fast the bullets travel
const bulletSpeed = 1;

// How long bullets stay alive
const bulletLifetime = 300;

// Store all active bullets
const bullets = [];

// CREATE A BULLET

function shoot() {
  const bullet = MeshBuilder.CreateCylinder(
    "bullet",
    {
      height: 0.8,
      diameter: 0.15,
      tessellation: 12
    },
    scene
  );

  // Get the direction the camera is looking
  const direction = camera
    .getDirection(Vector3.Forward())
    .normalize();

  // Put the bullet in front of the camera
  bullet.position = camera.position.add(
    direction.scale(1)
  );

  // Make the cylinder point in the direction we're looking
  bullet.rotationQuaternion =
    Quaternion.FromUnitVectors(
      Vector3.Up(),
      direction
    );

  // Make the bullet glow
  const material = new StandardMaterial(
    "bulletMaterial",
    scene
  );

  material.diffuseColor = new Color3(1, 0.1, 0.1);
  material.emissiveColor = new Color3(1, 0.1, 0.1);

  bullet.material = material;

  // Store movement information
  bullet.direction = direction;
  bullet.life = bulletLifetime;

  bullets.push(bullet);
}

  // Put the bullet slightly in front of the camera
  bullet.position = camera.position.add(
    camera.getDirection(Vector3.Forward()).scale(1)
  );

  // Give the bullet a material
  const material = new StandardMaterial(
    "bulletMaterial",
    scene
  );

  material.diffuseColor = new Color3(1, 0.01, 0.01);
  material.emissiveColor = new Color3(1, 0.01, 0.01);

  bullet.material = material;

  // Direction the player is looking
  bullet.direction = camera.getDirection(
    Vector3.Forward()
  ).normalize();

  // Lifetime counter
  bullet.life = bulletLifetime;

  // Add bullet to our list
  bullets.push(bullet);


// CLICK TO SHOOT

canvas.addEventListener("click", () => {

  // Lock the mouse to the game
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }

  shoot();
});

// UPDATE BULLETS

scene.onBeforeRenderObservable.add(() => {

  for (let i = bullets.length - 1; i >= 0; i--) {

    const bullet = bullets[i];

    // Move the bullet forward
    bullet.position.addInPlace(
      bullet.direction.scale(bulletSpeed)
    );

    // Reduce lifetime
    bullet.life--;

    // Delete old bullets
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