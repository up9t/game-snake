import type { Direction } from "./direction";

export interface IDirection2D<T = (typeof Direction)[keyof typeof Direction]> {
  x: T;
  y: T;
}

export interface ISize2D {
  width: number;
  height: number;
}

export interface IVec2 {
  x: number;
  y: number;
}

export interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface IGame {
  /**
   *
   * @param now not a delta time, just the time now.
   */
  onUpdate(now: number): void;
}

export interface IDrawable {
  setup(gl: WebGL2RenderingContext, program: WebGLProgram): void;
  draw(gl: WebGL2RenderingContext): void;
}

export interface IController {
  (target: EventTarget): void;
}
