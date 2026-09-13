<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import { GameLoseEvent, GameWinEvent } from "./events/gameover";
import Game from "./game";
import InitKeyboardControl from "./inputs/keyboard";
import { type IGame, type IVec2 } from "./interfaces";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvasElement = useTemplateRef("canvasElementRef");

onMounted(() => {
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
  light.position.set(5, 5, -5);

  const shadowSize = row;
  light.shadow.camera.left = -shadowSize;
  light.shadow.camera.right = shadowSize;
  light.shadow.camera.top = shadowSize;
  light.shadow.camera.bottom = -shadowSize;

  // // Ensure near/far planes encompass the ground and snake depth
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 100;

  const ambientLight = new THREE.AmbientLight(0x404040, 6);
  // ambientLight.position.set(5, 5, -5);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(THREE.Color.NAMES.skyblue);

  function getGroundMesh(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({
      color: THREE.Color.NAMES.burlywood,
    });
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  function getPlayerMesh(maxSegments: number): THREE.InstancedMesh {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({ color: THREE.Color.NAMES.aquamarine });
    const mesh = new THREE.InstancedMesh(geometry, material, maxSegments);
    mesh.frustumCulled = false;
    geometry.translate(0.5, 0, 0.5);

    return mesh;
  }

  function getFoodMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({ color: THREE.Color.NAMES.coral });
    const mesh = new THREE.Mesh(geometry, material);
    geometry.translate(0.5, 0, 0.5);

    return mesh;
  }

  function updatePlayerIndices(
    playerMesh: THREE.InstancedMesh,
    positions: IVec2[],
    oldPositions: IVec2[],
  ) {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]!;
      const oldpos = oldPositions[i + 1];

      const targetPos = new THREE.Vector3(pos.x - column / 2, 0, pos.y - row / 2);

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

  // const grid = new THREE.GridHelper(row);
  const orbit = new OrbitControls(camera, canvas);
  orbit.update();

  const playerMesh = getPlayerMesh(row * column);
  const foodMesh = getFoodMesh();
  const groundMesh = getGroundMesh(row, 1, column);
  playerMesh.castShadow = true;
  foodMesh.castShadow = true;
  groundMesh.receiveShadow = true;
  light.castShadow = true;
  playerMesh.position.set(0, 0, 0);
  foodMesh.position.set(0, 0, 0);
  groundMesh.position.set(0, -1, 0);

  scene.add(playerMesh, foodMesh, light, groundMesh, ambientLight);

  const renderer = new THREE.WebGLRenderer({
    canvas,
  });

  renderer.shadowMap.enabled = true;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  const cameraOffset = new THREE.Vector3(10, 10, 10);
  camera.position.copy(cameraOffset);
  camera.lookAt(0, 0, 0);

  let oldPos: IVec2[] = [];
  function run(now: number) {
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

    foodMesh.position.lerp(
      new THREE.Vector3(food.x - grid.column / 2, 0, food.y - grid.row / 2),
      0.3,
    );

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
