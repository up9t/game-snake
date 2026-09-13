import type { IVec2 } from "./interfaces";

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

export function getCanvasMiddlePosition(canvas: HTMLCanvasElement): IVec2 {
  return {
    x: Math.floor(canvas.width / 2),
    y: Math.floor(canvas.height / 2),
  };
}
