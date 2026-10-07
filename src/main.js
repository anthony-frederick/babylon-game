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
  DefaultRenderingPipeline,
  VertexBuffer,
  Sound
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  Control
} from "@babylonjs/gui";

import "@babylonjs/loaders";
import "./style.css";
import { Inspector } from "@babylonjs/inspector";
import { Viewer } from "@babylonjs/viewer";


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


// PLAYER HEALTH


let playerHealth = 100;

const maxHealth = 100;

const damageCooldown = 0.5;

let damageTimer = 0;

const reboundSoundCooldown = 0.15;
let reboundSoundTimer = 0;


// GAME STATE

let gameOver = false;
let playerWon = false;


// GUI

const gui =
  AdvancedDynamicTexture.CreateFullscreenUI(
    "UI"
  );


// HEALTH BAR BACKGROUND

const healthBarBackground =
  new Rectangle();

healthBarBackground.width = "300px";
healthBarBackground.height = "30px";
healthBarBackground.cornerRadius = 5;
healthBarBackground.color = "white";
healthBarBackground.thickness = 2;
healthBarBackground.background = "black";

healthBarBackground.horizontalAlignment =
  Control.HORIZONTAL_ALIGNMENT_CENTER;

healthBarBackground.verticalAlignment =
  Control.VERTICAL_ALIGNMENT_BOTTOM;

healthBarBackground.top = "-40px";

gui.addControl(
  healthBarBackground
);

// HEALTH BAR

const healthBar =
  new Rectangle();

healthBar.width = "296px";
healthBar.height = "26px";
healthBar.cornerRadius = 4;
healthBar.color = "transparent";
healthBar.thickness = 0;
healthBar.background = "red";

healthBar.horizontalAlignment =
  Control.HORIZONTAL_ALIGNMENT_LEFT;

healthBar.verticalAlignment =
  Control.VERTICAL_ALIGNMENT_CENTER;

healthBar.left = "0px";

healthBarBackground.addControl(
  healthBar
);

// HEALTH TEXT

const healthText =
  new TextBlock();

healthText.text =
  "100 / 100";

healthText.color =
  "white";

healthText.fontSize =
  18;

healthBarBackground.addControl(
  healthText
);


// UPDATE HEALTH BAR

function updateHealthBar() {

  const healthPercent =
    playerHealth / maxHealth;

  healthBar.width =
    `${296 * healthPercent}px`;

  healthText.text =
    `${Math.max(0, Math.ceil(playerHealth))} / ${maxHealth}`;
}

// GAME OVER TEXT

const gameOverText =
  new TextBlock();

gameOverText.text =
  "GAME OVER\n\nPress R to Retry";

gameOverText.color =
  "red";

gameOverText.fontSize =
  60;

gameOverText.fontWeight =
  "bold";

gameOverText.textHorizontalAlignment =
  Control.HORIZONTAL_ALIGNMENT_CENTER;

gameOverText.textVerticalAlignment =
  Control.VERTICAL_ALIGNMENT_CENTER;

gameOverText.textWrapping =
  true;

gameOverText.isVisible =
  false;

gui.addControl(
  gameOverText
);

// YOU WIN TEXT

const youWinText =
  new TextBlock();

youWinText.text =
  "YOU WIN!\n\nPress R to Retry";

youWinText.color =
  "lime";

youWinText.fontSize =
  60;

youWinText.fontWeight =
  "bold";

youWinText.textHorizontalAlignment =
  Control.HORIZONTAL_ALIGNMENT_CENTER;

youWinText.textVerticalAlignment =
  Control.VERTICAL_ALIGNMENT_CENTER;

youWinText.textWrapping =
  true;

youWinText.isVisible =
  false;

gui.addControl(
  youWinText
);

// SOUNDS

const shootSound = new Audio("sounds/shoot.wav");
shootSound.volume = 0.5;
const hitSound = new Audio("sounds/hit_Ship.mp3");
hitSound.volume = 0.5;
const loseSound = new Audio("sounds/lose.wav");
loseSound.volume = 0.5;
const splitSound = new Audio("sounds/split.wav");
splitSound.volume = 0.5;
const winSound = new Audio("sounds/win.wav");
winSound.volume = 1;
const reboundSound = new Audio("sounds/rebound.mp3");
reboundSound.volume = 0.5;

// LIGHT

const light =
  new HemisphericLight(
    "light",
    new Vector3(0, 1, 0),
    scene
  );

light.intensity = 0.5;

// SPHERICAL ARENA

const arenaRadius = 50;

const arena =
  MeshBuilder.CreateSphere(
    "arena",
    {
      diameter: arenaRadius * 2,
      segments: 32
    },
    scene
  );

const arenaMaterial =
  new StandardMaterial(
    "arenaMaterial",
    scene
  );

arenaMaterial.alpha = 0;
arenaMaterial.backFaceCulling = false;

arena.material =
  arenaMaterial;

// STARS

const starCount = 300;

const starDistance =
  arenaRadius * 0.9;

const starMaterial =
  new StandardMaterial(
    "starMaterial",
    scene
  );

starMaterial.diffuseColor =
  new Color3(1, 1, 1);

starMaterial.emissiveColor =
  new Color3(1, 1, 1);


for (
  let i = 0;
  i < starCount;
  i++
) {

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
pipeline.bloomKernel = 32;
pipeline.bloomScale = 0.5;


// DEV HOTKEYS


window.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "0") {

      Inspector.Show(scene, {
        embedMode: true
      });

    }

  }
);

// BULLET SETTINGS

const bulletSpeed = 90;

const bulletLifetime = 2;

const maxBullets = 3;

const shootCooldown = 0.5;

let shootTimer = 0;

const bullets = [];


// METEOR SETTINGS


const meteorCount = 10;

const meteorSpeedMin = 2;

const meteorSpeedMax = 6;

const meteors = [];

const splitSoundCooldown = 0.6;
let splitSoundTimer = 0;

// METEOR MATERIAL

const meteorMaterial =
  new StandardMaterial(
    "meteorMaterial",
    scene
  );

  meteorMaterial.diffuseColor =
  new Color3(
    0.28,
    0.22,
    0.17
  );

meteorMaterial.emissiveColor =
  new Color3(
    0.12,
    0.08,
    0.05
  );

meteorMaterial.specularColor =
  new Color3(
    0.1,
    0.1,
    0.1
  );

// CREATE METEOR

function createMeteor(
  size,
  position,
  velocity = null
) {

  let diameter;


  if (size === "big") {

    diameter = 5;

  }
  else if (size === "medium") {

    diameter = 3.7;

  }
  else {

    diameter = 2;

  }

  // CREATE SPHERE

  const meteor =
    MeshBuilder.CreateSphere(
      "meteor",
      {
        diameter: 2,
        segments: 8
      },
      scene
    );


  // ===================================
  // MAKE METEOR IRREGULAR
  // ===================================

  const positions =
    meteor.getVerticesData(
      VertexBuffer.PositionKind
    );


  for (
    let i = 0;
    i < positions.length;
    i += 3
  ) {

    const x =
      positions[i];

    const y =
      positions[i + 1];

    const z =
      positions[i + 2];


    const distance =
      Math.sqrt(
        x * x +
        y * y +
        z * z
      );


    const deformation =
      0.75 +
      Math.random() * 0.5;


    const scale =
      deformation / distance;


    positions[i] *= scale;

    positions[i + 1] *= scale;

    positions[i + 2] *= scale;
  }


  meteor.setVerticesData(
    VertexBuffer.PositionKind,
    positions
  );

  meteor.refreshBoundingInfo();


  // ===================================
  // APPLY SIZE
  // ===================================

  meteor.scaling =
    new Vector3(
      diameter / 2,
      diameter / 2,
      diameter / 2
    );


  // ===================================
  // MATERIAL
  // ===================================

  meteor.material =
    meteorMaterial;


  // ===================================
  // POSITION
  // ===================================

  meteor.position =
    position.clone();


  // ===================================
  // STORE SIZE
  // ===================================

  meteor.size =
    size;


  // ===================================
  // COLLISION RADIUS
  // ===================================

  meteor.radius =
    diameter / 2;


  // ===================================
  // VELOCITY
  // ===================================

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


  // ===================================
  // ADD TO ARRAY
  // ===================================

  meteors.push(
    meteor
  );


  return meteor;
}


// ===================================
// CREATE INITIAL RANDOM METEORS
// ===================================

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

    position.length() <
      10
  );


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


// ===================================
// DESTROY / SPLIT METEOR
// ===================================

function destroyMeteor(
  meteor
) {

    if (splitSoundTimer <= 0) {
    splitSound.currentTime = 0;
    splitSound.play();
    splitSoundTimer = splitSoundCooldown;
    }

  const position =
    meteor.position.clone();

  const velocity =
    meteor.velocity.clone();


  const index =
    meteors.indexOf(
      meteor
    );


  if (index !== -1) {

    meteors.splice(
      index,
      1
    );
  }


  meteor.dispose();


  // ===================================
  // BIG → 2 MEDIUM
  // ===================================

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


    const position1 =
      position.add(
        direction1.scale(1)
      );

    const position2 =
      position.add(
        direction2.scale(1)
      );


    createMeteor(
      "medium",
      position1,
      velocity.add(
        direction1.scale(2)
      )
    );


    createMeteor(
      "medium",
      position2,
      velocity.add(
        direction2.scale(2)
      )
    );
  }


  // ===================================
  // MEDIUM → 2 SMALL
  // ===================================

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


    const position1 =
      position.add(
        direction1.scale(0.7)
      );

    const position2 =
      position.add(
        direction2.scale(0.7)
      );


    createMeteor(
      "small",
      position1,
      velocity.add(
        direction1.scale(2)
      )
    );


    createMeteor(
      "small",
      position2,
      velocity.add(
        direction2.scale(2)
      )
    );
  }


  // ===================================
  // CHECK FOR WIN
  // ===================================

  if (meteors.length === 0) {

    winSound.currentTime = 0;
    winSound.play();
    playerWon = true;
    gameOver = true;

    youWinText.isVisible =
      true;

    camera.detachControl(
      canvas
    );

    if (
      document.pointerLockElement ===
      canvas
    ) {

      document.exitPointerLock();

    }

    console.log(
      "YOU WIN!"
    );
  }
}


// ===================================
// SHOOT
// ===================================
const bulletMaterial =
  new StandardMaterial(
    "bulletMaterial",
    scene
  );

bulletMaterial.diffuseColor =
  new Color3(1, 0, 0);

bulletMaterial.emissiveColor =
  new Color3(1, 0, 0);

bulletMaterial.disableLighting = true;

function shoot() {

  if (gameOver) {
    return;
  }


  // Maximum bullets
  if (
    bullets.length >=
    maxBullets
  ) {

    return;
  }


  // Shooting cooldown
  if (
    shootTimer > 0
  ) {

    return;
  }


  shootSound.currentTime = 0;
  shootSound.play();
  shootTimer = shootCooldown;
  // ===================================
  // SHOOT DIRECTION
  // ===================================

  const direction =
    camera
      .getDirection(
        Vector3.Forward()
      )
      .normalize();


  // ===================================
  // CREATE BULLET
  // ===================================

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


  // ===================================
  // BULLET POSITION
  // ===================================

  bullet.position =
    camera.position.add(
      direction.scale(2)
    );


  // ===================================
  // POINT BULLET FORWARD
  // ===================================

  bullet.alignWithNormal(
    direction
  );


  // ===================================
  // BULLET MATERIAL
  // ===================================

  bullet.material = bulletMaterial;


  // ===================================
  // BULLET VARIABLES
  // ===================================

  bullet.direction =
    direction;

  bullet.life =
    bulletLifetime;


  // ===================================
  // ADD BULLET
  // ===================================

  bullets.push(
    bullet
  );
}


// ===================================
// CLICK TO SHOOT
// ===================================

canvas.addEventListener(
  "click",
  () => {

    if (gameOver) {
      return;
    }


    if (
      document.pointerLockElement !==
      canvas
    ) {

      canvas.requestPointerLock();

    }


    shoot();
  }
);


// ===================================
// RESET GAME
// ===================================

function resetGame() {

  if (!gameOver) {
    return;
  }


  // ===================================
  // REMOVE ALL METEORS
  // ===================================

  while (
    meteors.length > 0
  ) {

    const meteor =
      meteors.pop();

    meteor.dispose();
  }


  // ===================================
  // REMOVE ALL BULLETS
  // ===================================

  while (
    bullets.length > 0
  ) {

    const bullet =
      bullets.pop();

    bullet.dispose();
  }


  // ===================================
  // RESET PLAYER
  // ===================================

  playerHealth =
    maxHealth;

  damageTimer =
    0;

  shootTimer =
    0;

  updateHealthBar();


  // ===================================
  // RESET GAME STATE
  // ===================================

  gameOver =
    false;

  playerWon =
    false;


  gameOverText.isVisible =
    false;

  youWinText.isVisible =
    false;


  // ===================================
  // RECONNECT CAMERA
  // ===================================

  camera.attachControl(
    canvas,
    true
  );


  // ===================================
  // CREATE NEW METEORS
  // ===================================

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

      position.length() <
        10
    );


    const randomNumber =
      Math.random();

    let size;


    if (
      randomNumber < 0.33
    ) {

      size = "small";

    }
    else if (
      randomNumber < 0.66
    ) {

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


  console.log(
    "GAME RESET"
  );
}


// ===================================
// R KEY = RETRY
// ===================================

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key.toLowerCase() === "r" &&
      gameOver
    ) {

      resetGame();

    }
  }
);


// ===================================
// MAIN UPDATE LOOP
// ===================================

scene.onBeforeRenderObservable.add(
  () => {

    // Stop game logic when game is over
    if (gameOver) {
      return;
    }


    const deltaTime =
      engine.getDeltaTime() /
      1000;


    // ===================================
    // DAMAGE COOLDOWN
    // ===================================

    if (
      damageTimer > 0
    ) {

      damageTimer -=
        deltaTime;
    }

    if (reboundSoundTimer > 0) {
      reboundSoundTimer -= deltaTime;
    }


    // ===================================
    // SHOOT COOLDOWN
    // ===================================

    if (
      shootTimer > 0
    ) {

      shootTimer -=
        deltaTime;
    }

    if (splitSoundTimer > 0) {
      splitSoundTimer -= deltaTime;
    }



    // ===================================
    // BULLETS
    // ===================================

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


      // ===================================
      // BULLET → METEOR COLLISION
      // ===================================

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

          destroyMeteor(
            meteor
          );


          bullet.dispose();


          bullets.splice(
            i,
            1
          );


          break;
        }
      }


      // ===================================
      // BULLET LIFETIME
      // ===================================

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


    // ===================================
    // METEORS
    // ===================================

    for (
      const meteor of meteors
    ) {

      // ===================================
      // MOVE METEOR
      // ===================================

      meteor.position.addInPlace(
        meteor.velocity.scale(
          deltaTime
        )
      );


      // ===================================
      // METEOR → ARENA WALL
      // ===================================

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


        // Only bounce if moving toward wall

        if (
          Vector3.Dot(
            meteor.velocity,
            normal
          ) > 0
        ) {
          if (reboundSoundTimer <= 0) {
            reboundSound.currentTime = 0;
            reboundSound.play();
            reboundSoundTimer = reboundSoundCooldown;
          }
          // Bounce off the wall
          meteor.velocity =
            Vector3.Reflect(
              meteor.velocity,
              normal
            );
        
          // Speed up by 10% after hitting the wall
          meteor.velocity =
            meteor.velocity.scale(1.1);
        
          // Maximum meteor speed
          const maxMeteorSpeed = 12;
        
          if (
            meteor.velocity.length() >
            maxMeteorSpeed
          ) {
        
            meteor.velocity =
              meteor.velocity.normalize().scale(
                maxMeteorSpeed
              );
          }
        }


        // Keep meteor inside arena

        meteor.position =
          normal.scale(
            maxDistance
          );
      }


// ===================================
// METEOR → PLAYER
// ===================================

const distanceToPlayer =
  Vector3.Distance(
    meteor.position,
    camera.position
  );

const playerCollisionDistance =
  meteor.radius + 4;


// ===================================
// PLAYER COLLISION
// ===================================

if (
  distanceToPlayer <
  playerCollisionDistance
) {

  // ===================================
  // BOUNCE METEOR OFF PLAYER
  // ===================================

  const bounceNormal =
    meteor.position.subtract(
      camera.position
    );

  if (
    bounceNormal.lengthSquared() > 0
  ) {

    bounceNormal.normalize();

    // Move meteor outside the player
    meteor.position =
      camera.position.add(
        bounceNormal.scale(
          meteor.radius + 1.5
        )
      );

    // Calculate how much the meteor is
    // moving toward the player
    const velocityIntoPlayer =
      Vector3.Dot(
        meteor.velocity,
        bounceNormal
      );

    // Only reflect velocity if it is
    // actually moving toward the player
    if (
      velocityIntoPlayer < 0
    ) {

      meteor.velocity =
        meteor.velocity.subtract(
          bounceNormal.scale(
            2 * velocityIntoPlayer
          )
        );
    }
  }


  // ===================================
  // DAMAGE PLAYER
  // ===================================

  if (
    damageTimer <= 0
  ) {

    let damage;

    if (
      meteor.size === "big"
    ) {

      damage = 40;

    }
    else if (
      meteor.size === "medium"
    ) {

      damage = 20;

    }
    else {

      damage = 10;

    }


    playerHealth -=
      damage;

    playerHealth =
      Math.max(
        0,
        playerHealth
      );


    updateHealthBar();

    hitSound.currentTime = 0;
    hitSound.play();

    damageTimer =
      damageCooldown;


    // ===================================
    // GAME OVER
    // ===================================

    if (
      playerHealth <= 0
    ) {

      loseSound.currentTime = 0;
      loseSound.play();

      gameOver =
        true;

      playerWon =
        false;

      gameOverText.isVisible =
        true;


      camera.detachControl(
        canvas
      );


      if (
        document.pointerLockElement ===
        canvas
      ) {

        document.exitPointerLock();

      }


      console.log(
        "GAME OVER"
      );

      return;
    }
  }
}

    }

  });


// ===================================
// RENDER LOOP
// ===================================

engine.runRenderLoop(
  () => {

    scene.render();

  }
);


// ===================================
// WINDOW RESIZE
// ===================================

window.addEventListener(
  "resize",
  () => {

    engine.resize();

  }
);