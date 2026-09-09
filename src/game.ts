import SnakeDirection from "./direction";
import Food from "./entities/food";
import type { IEntity } from "./entities/interface";
import Snake from "./entities/snake";
import { GameLoseEvent } from "./events/gameover";
import { InputDownEvent, InputLeftEvent, InputRightEvent, InputUpEvent } from "./events/input";
import Grid from "./grid";
import type { IDirection2D, IGame, IVec2 } from "./interfaces";
import fragmentSource from "./shaders/fragment.glsl?raw";
import vertexSource from "./shaders/vertex.glsl?raw";
import { getRandomInt, isUndefined } from "./utils";

export default class Game extends EventTarget implements IGame {
  private score: number = 0;
  private lastTime: number = 0;

  private snake;
  private food;
  private grid;
  private finalDirection: IDirection2D = SnakeDirection.NONE;

  private gl: WebGL2RenderingContext;

  private availableGridPositions: number[];
  private static readonly SCORE_PER_FOOD = 10;

  public constructor(private readonly canvas: HTMLCanvasElement) {
    super();

    const gl = canvas.getContext("webgl2");

    if (!gl) {
      throw new Error("Your browser does not support webgl2");
    }

    this.gl = gl;
    this.grid = new Grid(canvas, 20);

    const snakeInitialPos: IVec2 = {
      x: Math.floor(this.grid.getColumnCount() / 2),
      y: Math.floor(this.grid.getRowCount() / 2),
    };

    this.availableGridPositions = this.refreshAndTakeAvailablePosition([snakeInitialPos]);

    const foodInitialPos: IVec2 = this.getRandomAvailablePosition();

    this.snake = new Snake(
      [{ r: 94 / 255, g: 116 / 255, b: 255 / 255, a: 1 }],
      snakeInitialPos,
      this.grid,
    );

    this.food = new Food(
      { r: 245 / 255, g: 61 / 255, b: 101 / 255, a: 1 },
      foodInitialPos,
      this.grid,
    );

    const program = this.initShader();
    this.registerInputs();

    // grid setup sets new width and height to the canvas element
    for (const drawable of [this.grid, this.snake, this.food]) {
      drawable.setup(gl, program);
    }
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

  private initShader() {
    const gl = this.gl;
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = this.createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    return program;
  }

  private refreshAndTakeAvailablePosition(positions: IVec2[]) {
    const availableGridPositions = Array.from<unknown, number | null>(
      { length: this.grid.getRowCount() * this.grid.getColumnCount() },
      (_, i) => i,
    );

    for (const position of positions) {
      const s = position.x + position.y * this.grid.getColumnCount();
      availableGridPositions[s] = null;
    }

    this.availableGridPositions = availableGridPositions.filter((pos) => pos !== null);

    return this.availableGridPositions;
  }

  private getRandomAvailablePosition(): IVec2 {
    const position = this.availableGridPositions.at(
      getRandomInt(0, this.availableGridPositions.length),
    );

    if (isUndefined(position)) {
      throw new TypeError("failed to get random available position", {
        cause: "position undefined",
      });
    }

    const x = position % this.grid.getColumnCount();
    const y = Math.floor(position / this.grid.getColumnCount());

    return { x, y };
  }

  private createShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type);

    if (shader === null) {
      throw new Error("failed to create shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const isCompileOk = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!isCompileOk) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "unknown error while compile shader");
    }

    return shader;
  }

  private createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!ok) {
      throw new Error(gl.getProgramInfoLog(program) ?? "unknown error while linking shader");
    }

    return program;
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
    this.refreshAndTakeAvailablePosition(this.snake.getPositions());

    if (this.snake.isSelfCollide()) {
      this.dispatchEvent(new GameLoseEvent());
      return;
    }

    if (this.isOutside(this.snake)) {
      this.dispatchEvent(new GameLoseEvent());
      return;
    }

    if (this.snake.isCollide(this.food)) {
      this.addScore(Game.SCORE_PER_FOOD);
      this.food.setPosition(this.getRandomAvailablePosition());
      this.snake.grow();
    }

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.render();
  }

  private isOutside(entity: IEntity) {
    return (
      entity.position.x >= this.grid.getColumnCount() ||
      this.snake.position.x < 0 ||
      entity.position.y >= this.grid.getRowCount() ||
      this.snake.position.y < 0
    );
  }

  private render() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    for (const drawable of [this.grid, this.snake, this.food]) {
      drawable.draw(this.gl);
    }
  }
}
