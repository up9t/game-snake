import type { ColorHex, IDirection2D, IVec2 } from "../interfaces";

export interface IEntity {
  position: IVec2;

  setPosition(pos: IVec2): void;
}

export interface IFood extends IEntity {
  color: ColorHex;
}

export interface ISnake extends IEntity {
  color: ColorHex;
  setDirection(direction: IDirection2D): void;
  move(): void;
  grow(): void;
  getPositions(): IVec2[];
  isSelfCollide(): boolean;
}
