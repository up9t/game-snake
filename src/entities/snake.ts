import SnakeDirection from "../direction";
import type { ColorHex, IDirection2D, IVec2 } from "../interfaces";
import type { ISnake } from "./interface";

interface SnakeFragment {
  /**
   * Grid position not the actual pixel, for example 0, 1, 2, 3
   */
  position: IVec2;
}

export default class Snake implements ISnake {
  public direction: IDirection2D = SnakeDirection.NONE;
  // public speed: number = 1;

  /**
   * parts[0] is a referenced to this.position
   */
  private fragments: SnakeFragment[] = [];

  public constructor(
    public readonly color: ColorHex,
    public readonly position: IVec2,
  ) {
    this.fragments.push({
      position: this.position,
    });
  }

  public isSelfCollide(): boolean {
    const head = this.fragments[0]!;

    for (let i = 1; i < this.fragments.length; i++) {
      const body = this.fragments[i]!;
      if (head.position.x === body.position.x && head.position.y === body.position.y) {
        return true;
      }
    }

    return false;
  }

  public grow(): void {
    this.fragments.push({
      position: {
        x: this.fragments.at(-1)?.position.x ?? this.position.x,
        y: this.fragments.at(-1)?.position.y ?? this.position.y,
      },
    });
  }

  public move(): void {
    const nextPos = this.getNextPosition();
    const head = this.fragments[0]!.position;

    for (let i = this.fragments.length - 1; i > 0; i--) {
      const nextBody = this.fragments[i - 1]!.position;
      const body = this.fragments[i]!.position;

      body.x = nextBody.x;
      body.y = nextBody.y;
    }

    head.x = nextPos.x;
    head.y = nextPos.y;
  }

  private getNextPosition(): IVec2 {
    const head = this.position;

    return {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y,
    };
  }

  public setDirection(direction: IDirection2D): void {
    this.direction.x = direction.x;
    this.direction.y = direction.y;
  }

  public getPositions() {
    return this.fragments.map((frag) => frag.position);
  }

  public setPosition(pos: IVec2): void {
    this.position.x = pos.x;
    this.position.y = pos.y;
  }
}
