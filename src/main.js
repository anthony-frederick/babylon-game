import {
  Engine,
  Scene,
  FreeCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  DefaultRenderingPipeline
} from "@babylonjs/core";

import "@babylonjs/loaders";
import "./style.css";
import {Inspector} from "@babylonjs/inspector";
import {Viewer} from "@babylonjs/viewer"


// CANVAS + ENGINE

const canvas = document.getElementById("renderCanvas");

const engine = new Engine(
  canvas,
  true
);

// SCENE

const scene = new Scene(engine);

scene.clearColor = new Color4(
  0,
  0,
  0,
  1
);

// CAMERA

const camera = new FreeCamera(
  "camera",
  new Vector3(0, 0, 0),
  scene
);

camera.attachControl(
  canvas,
  true
);

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

arenaMaterial.alpha = 0;
arenaMaterial.backFaceCulling = false;

arena.material = arenaMaterial;

// STARS

const starCount = 300;

const starDistance =
  arenaRadius * 0.9;

const starMaterial = new StandardMaterial(
  "starMaterial",
  scene
);

starMaterial.diffuseColor =
  new Color3(1, 1, 1);

starMaterial.emissiveColor =
  new Color3(1, 1, 1);


for (let i = 0; i < starCount; i++) {

  const theta =
    Math.random() * Math.PI * 2;

  const phi =
    Math.acos(
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


  const star =
    MeshBuilder.CreateSphere(
      "star",
      {
        diameter: 0.08
      },
      scene
    );


  star.position =
    new Vector3(
      x * starDistance,
      y * starDistance,
      z * starDistance
    );

  star.material =
    starMaterial;
}

// BLOOM / GLOW

const pipeline =
  new DefaultRenderingPipeline(
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

// DEV HOTKEYS

window.addEventListener("keydown", (event) => {
  if (event.key === "0") {
    Inspector.Show(scene, {
      embedMode: true
    });
  }
 });
 
// BULLET SETTINGS

const bulletSpeed = 40;

const bulletLifetime = 2;

const bullets = [];

// METEOR SETTINGS

const meteorCount = 10;

const meteorSpeedMin = 2;

const meteorSpeedMax = 6;

const meteors = [];

// METEOR MATERIAL

const meteorMaterial =
  new StandardMaterial(
    "meteorMaterial",
    scene
  );

meteorMaterial.diffuseColor =
  new Color3(
    0.35,
    0.35,
    0.35
  );

// CREATE METEOR

function createMeteor(
  size,
  position,
  velocity = null
) {

  let diameter;


  // BIG
  if (size === "big") {

    diameter = 4;

  }


  // MEDIUM
  else if (size === "medium") {

    diameter = 2.5;

  }


  // SMALL
  else {

    diameter = 1.3;

  }


  // CREATE SPHERE
  const meteor =
    MeshBuilder.CreateSphere(
      "meteor",
      {
        diameter: diameter,
        segments: 12
      },
      scene
    );


  meteor.material =
    meteorMaterial;


  // POSITION
  meteor.position =
    position.clone();


  // STORE SIZE
  meteor.size =
    size;


  // STORE RADIUS
  meteor.radius =
    diameter / 2;

  // VELOCITY

  if (velocity) {

    meteor.velocity =
      velocity.clone();

  }

  else {

    const direction =
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();


    const speed =
      meteorSpeedMin +
      Math.random() *
      (
        meteorSpeedMax -
        meteorSpeedMin
      );


    meteor.velocity =
      direction.scale(speed);
  }


  // ADD TO ARRAY
  meteors.push(
    meteor
  );


  return meteor;
}

// CREATE INITIAL RANDOM METEORS

for (
  let i = 0;
  i < meteorCount;
  i++
) {

  let position;


  do {

    position =
      new Vector3(
        (Math.random() * 2 - 1)
          * arenaRadius,

        (Math.random() * 2 - 1)
          * arenaRadius,

        (Math.random() * 2 - 1)
          * arenaRadius
      );

  }
  while (
    position.length() >
      arenaRadius - 3 ||

    position.length() < 10
  );


  // Randomly choose a size
  const randomNumber =
    Math.random();

  let size;


  if (randomNumber < 0.33) {

    size = "small";

  }
  else if (randomNumber < 0.66) {

    size = "medium";

  }
  else {

    size = "big";

  }


  createMeteor(
    size,
    position
  );
}

// DESTROY / SPLIT METEOR

function destroyMeteor(
  meteor
) {

  const position =
    meteor.position.clone();

  const velocity =
    meteor.velocity.clone();


  // FIND METEOR
  const index =
    meteors.indexOf(
      meteor
    );


  // REMOVE FROM ARRAY
  if (index !== -1) {

    meteors.splice(
      index,
      1
    );
  }


  // REMOVE FROM SCENE
  meteor.dispose();

  // BIG → 2 MEDIUM

  if (
    meteor.size === "big"
  ) {

    const direction1 =
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();


    const direction2 =
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();


    createMeteor(
      "medium",
      position,
      velocity.add(
        direction1.scale(2)
      )
    );


    createMeteor(
      "medium",
      position,
      velocity.add(
        direction2.scale(2)
      )
    );
  }

  // MEDIUM → 2 SMALL

  else if (
    meteor.size === "medium"
  ) {

    const direction1 =
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();


    const direction2 =
      new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();


    createMeteor(
      "small",
      position,
      velocity.add(
        direction1.scale(2)
      )
    );


    createMeteor(
      "small",
      position,
      velocity.add(
        direction2.scale(2)
      )
    );
  }


  // SMALL → NOTHING
}

// SHOOT

function shoot() {

  const direction =
    camera
      .getDirection(
        Vector3.Forward()
      )
      .normalize();


  // CREATE BULLET
  const bullet =
    MeshBuilder.CreateCylinder(
      "bullet",
      {
        height: 1.2,
        diameter: 0.18,
        tessellation: 12
      },
      scene
    );


  // START IN FRONT OF PLAYER
  bullet.position =
    camera.position.add(
      direction.scale(2)
    );


  // POINT BULLET FORWARD
  bullet.alignWithNormal(
    direction
  );


  // BULLET MATERIAL

  const material =
    new StandardMaterial(
      "bulletMaterial",
      scene
    );


  material.diffuseColor =
    new Color3(
      1,
      0,
      0
    );


  material.emissiveColor =
    new Color3(
      1,
      0,
      0
    );

    // Don't let lighting change the bullet's color
  material.disableLighting = true;

  bullet.material = material;


  bullet.material =
    material;


  // BULLET VARIABLES

  bullet.direction =
    direction;

  bullet.life =
    bulletLifetime;


  // ADD BULLET
  bullets.push(
    bullet
  );
}

// CLICK TO SHOOT

canvas.addEventListener(
  "click",
  () => {

    if (
      document.pointerLockElement !==
      canvas
    ) {

      canvas.requestPointerLock();
    }


    shoot();
  }
);


// MAIN UPDATE LOOP

scene.onBeforeRenderObservable.add(
  () => {

    const deltaTime =
      engine.getDeltaTime() /
      1000;

    // BULLETS

    for (
      let i = bullets.length - 1;
      i >= 0;
      i--
    ) {

      const bullet =
        bullets[i];


      // MOVE BULLET
      bullet.position.addInPlace(
        bullet.direction.scale(
          bulletSpeed *
          deltaTime
        )
      );


      // REDUCE LIFETIME
      bullet.life -=
        deltaTime;

      // BULLET → METEOR COLLISION

      for (
        let j = meteors.length - 1;
        j >= 0;
        j--
      ) {

        const meteor =
          meteors[j];


        const distance =
          Vector3.Distance(
            bullet.position,
            meteor.position
          );


        if (
          distance <
          meteor.radius + 0.15
        ) {

          // SPLIT / DESTROY METEOR
          destroyMeteor(
            meteor
          );


          // DESTROY BULLET
          bullet.dispose();


          bullets.splice(
            i,
            1
          );


          // Stop checking this bullet
          break;
        }
      }

      // BULLET LIFETIME

      if (
        bullet.life <= 0 &&
        bullets.includes(
          bullet
        )
      ) {

        bullet.dispose();


        bullets.splice(
          i,
          1
        );
      }
    }

    // METEORS

    for (
      const meteor of meteors
    ) {

      // MOVE METEOR
      meteor.position.addInPlace(
        meteor.velocity.scale(
          deltaTime
        )
      );

      // CHECK ARENA WALL

      const distance =
        meteor.position.length();


      const maxDistance =
        arenaRadius -
        meteor.radius;


      if (
        distance >=
        maxDistance
      ) {

        const normal =
          meteor.position.normalize();


        // Only bounce if moving
        // toward the wall
        if (
          Vector3.Dot(
            meteor.velocity,
            normal
          ) > 0
        ) {

          meteor.velocity =
            Vector3.Reflect(
              meteor.velocity,
              normal
            );
        }


        // Keep meteor inside arena
        meteor.position =
          normal.scale(
            maxDistance
          );
      }
    }
  }
);


// RENDER LOOP

engine.runRenderLoop(
  () => {

    scene.render();

  }
);

// WINDOW RESIZE

window.addEventListener(
  "resize",
  () => {

    engine.resize();

  }
);