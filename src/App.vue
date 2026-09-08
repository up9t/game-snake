<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import { GameLoseEvent, GameWinEvent } from "./events/gameover";
import Game from "./game";
import InitKeyboardControl from "./inputs/keyboard";
import { type IGame } from "./interfaces";

const canvasElement = useTemplateRef("canvasElementRef");

onMounted(() => {
  if (canvasElement.value === null) {
    throw new Error("canvas element not found");
  }

  const game = new Game(canvasElement.value);
  InitKeyboardControl(game);

  let requestId = requestAnimationFrame(() => run(game));
  let isFinish = false;

  function run(game: IGame) {
    if (isFinish) {
      cancelAnimationFrame(requestId);
      return;
    }

    requestId = requestAnimationFrame((now) => {
      game.onUpdate(now);
      run(game);
    });
  }

  game.addEventListener(GameLoseEvent.EVENT_NAME, () => {
    isFinish = true;
    alert("you lose");
  });

  game.addEventListener(GameWinEvent.EVENT_NAME, () => {
    isFinish = true;
    alert("you win");
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
