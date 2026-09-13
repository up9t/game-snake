import type { ColorHex, IVec2 } from "../interfaces";
import type { IFood } from "./interface";

export default class Food implements IFood {
  public constructor(
    public readonly color: ColorHex,
    public readonly position: IVec2,
  ) {}

  public setPosition(pos: IVec2): void {
    this.position.x = pos.x;
    this.position.y = pos.y;
  }
}
