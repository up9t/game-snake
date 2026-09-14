<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import { GameLoseEvent, GameWinEvent } from "./events/gameover";
import Game from "./game";
import InitKeyboardControl from "./inputs/keyboard";
import { type IVec2 } from "./interfaces";
import * as THREE from "three";
import { GLTFLoader, OrbitControls } from "three/addons";
import appleModel from "@/assets/apple.glb?url";

const canvasElement = useTemplateRef("canvasElementRef");

onMounted(async () => {
  const canvas = canvasElement.value;

  if (canvas === null) {
    throw new Error("canvas element not found");
  }

  let requestId: number | undefined = undefined;

  const row = 20;
  const column = 20;
  const game = new Game(row, column);
  InitKeyboardControl(game);

  let isFinish = false;

  const light = new THREE.DirectionalLight(THREE.Color.NAMES.aliceblue, 4);
  light.castShadow = true;

  const shadowSize = row;
  light.shadow.camera.left = -shadowSize;
  light.shadow.camera.right = shadowSize;
  light.shadow.camera.top = shadowSize;
  light.shadow.camera.bottom = -shadowSize;

  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 100;
  light.position.set(5, 5, -5);

  const ambientLight = new THREE.AmbientLight(0x404040, 6);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(THREE.Color.NAMES.skyblue);

  function getGroundMesh(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({
      color: 0x72b369,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.geometry.translate(-0.5, 0, -0.5);

    return mesh;
  }

  function getPlayerMesh(maxSegments: number): THREE.InstancedMesh {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({
      color: 0x5e525a,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, maxSegments);

    mesh.frustumCulled = false;
    mesh.castShadow = true;

    return mesh;
  }

  async function getFoodScene(): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(appleModel);
    const scene = gltf.scene;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });

    return gltf.scene;
  }

  function updatePlayerIndices(
    playerMesh: THREE.InstancedMesh,
    positions: IVec2[],
    oldPositions: IVec2[],
  ) {
    const dummy = new THREE.Object3D();

    // direction
    const changex = 0b10;
    const changey = 0b01;
    let changexy = 0b00;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]!;
      const pos1 = positions[i - 1];
      const oldpos = oldPositions[i + 1];

      if (typeof pos1 !== "undefined") {
        if (pos.x !== pos1.x) {
          changexy |= changex;
        }
        if (pos.y !== pos1.y) {
          changexy |= changey;
        }
      }

      const targetPos = new THREE.Vector3(pos.x - column / 2, 0, pos.y - row / 2);

      const progress = Math.max((positions.length - i) / positions.length, 0.2);

      let scalex = 1;
      let scalez = 1;

      if (changexy ^ changex) {
        scalex = progress;
      }
      if (changexy ^ changey) {
        scalez = progress;
      }

      dummy.scale.set(scalex, progress, scalez);
      changexy = 0b00;

      if (typeof oldpos !== "undefined" && i > 0) {
        dummy.position.set(oldpos.x - column / 2, 0, oldpos.y - row / 2);
      } else {
        dummy.position.copy(targetPos);
      }

      dummy.position.lerp(targetPos, 0.75);
      dummy.updateMatrix();

      playerMesh.setMatrixAt(i, dummy.matrix);
    }

    playerMesh.count = positions.length;
    playerMesh.instanceMatrix.needsUpdate = true;
  }

  const aspect = canvas.clientWidth / canvas.clientHeight;
  const frustumSize = 10;

  const camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000,
  );

  const orbit = new OrbitControls(camera, canvas);
  orbit.update();

  const playerMesh = getPlayerMesh(row * column);
  const foodScene = await getFoodScene();
  const groundMesh = getGroundMesh(row, 1, column);
  light.castShadow = true;
  playerMesh.position.set(0, 0, 0);
  foodScene.position.set(0, 0, 0);
  groundMesh.position.set(0, -1, 0);

  scene.add(playerMesh, foodScene, light, groundMesh, ambientLight);

  const renderer = new THREE.WebGLRenderer({
    canvas,
  });

  renderer.shadowMap.enabled = true;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  const cameraOffset = new THREE.Vector3(10, 10, 10);
  camera.position.copy(cameraOffset);
  camera.lookAt(0, 0, 0);

  let oldPos: IVec2[] = [];
  let foodTime = 0;
  let oldFoodPos: IVec2 = { x: 0, y: 0 };

  let lastTime = 0;

  function run(now: number) {
    if (lastTime === 0) {
      lastTime = now;
    }

    const deltaTime = now - lastTime;
    lastTime = now;

    if (isFinish) {
      if (typeof requestId === "number") cancelAnimationFrame(requestId);

      return;
    }

    game.onUpdate(now);

    const { player, food, grid } = game.getState();

    updatePlayerIndices(playerMesh, player, oldPos);
    oldPos = player;

    const head = player[0]!;
    const targetCameraPos = new THREE.Vector3(head.x - column / 2, 0, head.y - row / 2).add(
      cameraOffset,
    );

    camera.position.lerp(targetCameraPos, 0.1);

    if (oldFoodPos.x !== food.x || oldFoodPos.y !== food.y) {
      oldFoodPos.x = food.x;
      oldFoodPos.y = food.y;
      foodTime = 0;
    }

    foodTime += deltaTime;
    foodScene.position.lerp(
      new THREE.Vector3(
        food.x - grid.column / 2,
        Math.sin(foodTime / 200) / 5,
        food.y - grid.row / 2,
      ),
      0.3,
    );
    foodScene.rotation.y += deltaTime / 300;

    renderer.render(scene, camera);

    requestId = requestAnimationFrame(run);
  }

  requestId = requestAnimationFrame(run);

  game.addEventListener(GameLoseEvent.EVENT_NAME, () => {
    isFinish = true;
    alert("you lose!");
  });

  game.addEventListener(GameWinEvent.EVENT_NAME, () => {
    isFinish = true;
    alert("you win!");
  });
});
</script>

<template>
  <canvas ref="canvasElementRef"></canvas>
</template>

<style scoped>
canvas {
  min-width: 100%;
}
</style>
