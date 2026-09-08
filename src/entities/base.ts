import type { IVec2 } from "../interfaces.ts";
import type { ICollider, IEntity } from "./interface.ts";

export abstract class Entity implements IEntity, ICollider {
  public readonly position: IVec2 = { x: 0, y: 0 };

  public setPosition(pos: IVec2): void {
    this.position.x = pos.x;
    this.position.y = pos.y;
  }

  public isCollide(collider: ICollider): boolean {
    return collider.position.x === this.position.x && collider.position.y === this.position.y;
  }
}
