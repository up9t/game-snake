import SnakeDirection from "./direction";
import Food from "./entities/food";
import type { IEntity } from "./entities/interface";
import Snake from "./entities/snake";
import { GameLoseEvent } from "./events/gameover";
import { InputDownEvent, InputLeftEvent, InputRightEvent, InputUpEvent } from "./events/input";
import Grid from "./grid";
import type { IDirection2D, IGame, IVec2 } from "./interfaces";
import { getRandomInt } from "./utils";

export default class Game extends EventTarget implements IGame {
  private score: number = 0;
  private lastTime: number = 0;

  private snake;
  private food;
  private grid;
  private finalDirection: IDirection2D = SnakeDirection.NONE;

  /**
   * [x, y, x, y, ...]
   */
  private availablePositions: number[];
  private static readonly SCORE_PER_FOOD = 10;

  public getState() {
    return {
      player: this.snake.getPositions(),
      food: this.food.position,
      grid: this.grid,
    };
  }

  public constructor(row: number, column: number) {
    super();

    this.grid = new Grid(row, column);

    const snakeInitialPos = {
      x: this.grid.column / 2,
      y: this.grid.row / 2,
    };

    this.availablePositions = this.calculateAvailablePositions([snakeInitialPos]);

    this.snake = new Snake(0xffffff, snakeInitialPos);

    this.food = new Food(0xffffff, this.getRandomAvailablePosition());

    this.registerInputs();
  }

  private isOppositeDirection(aDir: IVec2, bDir: IVec2) {
    return aDir.x === -bDir.x && aDir.y === -bDir.y;
  }

  private registerInputs() {
    this.addEventListener(InputLeftEvent.EVENT_NAME, () => {
      this.finalDirection = SnakeDirection.LEFT;
    });

    this.addEventListener(InputRightEvent.EVENT_NAME, () => {
      this.finalDirection = SnakeDirection.RIGHT;
    });

    this.addEventListener(InputUpEvent.EVENT_NAME, () => {
      this.finalDirection = SnakeDirection.UP;
    });

    this.addEventListener(InputDownEvent.EVENT_NAME, () => {
      this.finalDirection = SnakeDirection.DOWN;
    });
  }

  private calculateAvailablePositions(positions: IVec2[]) {
    const availableGridPositions = Array.from(
      { length: this.grid.row * this.grid.column },
      (_, i) => i,
    );

    for (const position of positions) {
      const s = position.x + position.y * this.grid.column;
      availableGridPositions[s] = -1;
    }

    return availableGridPositions.filter((pos) => pos >= 0);
  }

  private getRandomAvailablePosition(): IVec2 {
    const position = this.availablePositions.at(getRandomInt(0, this.availablePositions.length));

    if (typeof position === "undefined") {
      throw new TypeError("failed to get random available position", {
        cause: "position undefined",
      });
    }

    const x = position % this.grid.column;
    const y = Math.floor(position / this.grid.column);

    return { x, y };
  }

  public addScore(add: number): void {
    this.score += add;
  }

  public onUpdate(now: number): void {
    // run every 100 miliseconds
    if (now - this.lastTime <= 100) {
      return;
    }

    const isOpposite = this.isOppositeDirection(this.snake.direction, this.finalDirection);

    if (!isOpposite) {
      this.snake.setDirection(this.finalDirection);
    }

    this.lastTime = now;

    this.snake.move();
    this.availablePositions = this.calculateAvailablePositions(this.snake.getPositions());

    if (this.snake.isSelfCollide()) {
      this.dispatchEvent(new GameLoseEvent());
      return;
    }

    if (this.isOutside(this.snake)) {
      this.dispatchEvent(new GameLoseEvent());
      return;
    }

    if (this.isCollide(this.snake, this.food)) {
      this.addScore(Game.SCORE_PER_FOOD);
      this.food.setPosition(this.getRandomAvailablePosition());
      this.snake.grow();
    }
  }

  private isOutside(entity: IEntity) {
    return (
      entity.position.x >= this.grid.column ||
      this.snake.position.x < 0 ||
      entity.position.y >= this.grid.row ||
      this.snake.position.y < 0
    );
  }

  private isCollide(a: IEntity, b: IEntity): boolean {
    return a.position.x === b.position.x && a.position.y === b.position.y;
  }
}
