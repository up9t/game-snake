import type { IColor, IDirection2D, IVec2 } from "../interfaces";

export interface IEntity {
  position: IVec2;

  setPosition(pos: IVec2): void;
}

export interface ICollider extends IEntity {
  isCollide(collider: ICollider): boolean;
}

export interface IGrowable {
  grow(): void;
}

export interface IMoveable {
  move(): void;
}

export interface IFood extends IEntity, ICollider {
  color: IColor;
}

export interface ISnake extends IEntity, ICollider, IGrowable, IMoveable {
  /**
   * Correspond with snake size
   */
  colors: IColor[];
  setDirection(direction: IDirection2D): void;
  getPositions(): IVec2[];
  isSelfCollide(): boolean;
}
