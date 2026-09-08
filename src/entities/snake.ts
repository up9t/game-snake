import SnakeDirection from "../direction.ts";
import type Grid from "../grid.ts";
import type { IColor, IDirection2D, IDrawable, IVec2 } from "../interfaces.ts";
import { isUndefined } from "../utils.ts";
import { Entity } from "./base.ts";
import type { ISnake } from "./interface.ts";

interface SnakePart {
  /**
   * Grid position not the actual pixel, for example 0, 1, 2, 3
   */
  position: IVec2;

  color: IColor;
}

export default class Snake extends Entity implements ISnake, IDrawable {
  public direction: IDirection2D = SnakeDirection.NONE;
  public readonly colors;
  // public speed: number = 1;

  private vao: WebGLVertexArrayObject | undefined;
  private vbo: WebGLBuffer | undefined;
  private readonly grid;

  /**
   * parts[0] is a referenced to this.position and this.colors[0]
   */
  private parts: SnakePart[] = [];

  public constructor(colors: IColor[], positionInGrid: IVec2, grid: Grid) {
    super();
    this.colors = colors;
    this.grid = grid;
    this.setPosition(positionInGrid);

    this.parts.push({
      position: this.position,
      color: this.colors[0],
    });
  }

  public isSelfCollide(): boolean {
    const head = this.parts[0];

    for (let i = 1; i < this.parts.length; i++) {
      const body = this.parts[i];
      if (head.position.x === body.position.x && head.position.y === body.position.y) {
        return true;
      }
    }

    return false;
  }

  public grow(): void {
    const index = this.colors.length % (this.parts.length + 1);
    const color: IColor = this.colors[index - 1];

    this.parts.push({
      position: {
        x: this.parts.at(-1)?.position.x ?? this.position.x,
        y: this.parts.at(-1)?.position.y ?? this.position.y,
      },
      color,
    });
  }

  public setup(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.grid.getRowCount() * this.grid.getColumnCount() * 4 * 6 * Float32Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      this.grid.getRowCount() * this.grid.getColumnCount() * 6 * Uint16Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );

    for (const [i, part] of this.parts.entries()) {
      const color: [number, number, number, number] = [
        part.color.r,
        part.color.g,
        part.color.b,
        part.color.a,
      ];

      const column = this.grid.getColumnCount();
      const row = this.grid.getRowCount();

      const x1 = (part.position.x / column) * 2 - 1;
      const y1 = 1 - (part.position.y / row) * 2;
      const x2 = ((part.position.x + 1) / column) * 2 - 1;
      const y2 = 1 - ((part.position.y + 1) / row) * 2;

      const vertices = new Float32Array([
        x1,
        y1,
        ...color,
        x1,
        y2,
        ...color,
        x2,
        y1,
        ...color,
        x2,
        y2,
        ...color,
      ]);

      gl.bufferSubData(gl.ARRAY_BUFFER, i * vertices.byteLength, vertices);

      const indices = new Uint16Array([
        i * 4,
        i * 4 + 2,
        i * 4 + 1,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 3,
      ]);

      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, i * indices.byteLength, indices);
    }

    const posLoc = gl.getAttribLocation(program, "aPos");
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(posLoc);

    const colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(
      colorLoc,
      4,
      gl.FLOAT,
      false,
      6 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(colorLoc);

    gl.bindVertexArray(null);

    this.vao = vao;
    this.vbo = vbo;
  }

  public draw(gl: WebGL2RenderingContext): void {
    if (isUndefined(this.vbo) || isUndefined(this.vao)) {
      throw new TypeError("failed to draw with undefined vertex buffer or vertex array");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindVertexArray(this.vao);

    for (const [i, part] of this.parts.entries()) {
      const color: [number, number, number, number] = [
        part.color.r,
        part.color.g,
        part.color.b,
        part.color.a,
      ];

      const column = this.grid.getColumnCount();
      const row = this.grid.getRowCount();

      const x1 = (part.position.x / column) * 2 - 1;
      const y1 = 1 - (part.position.y / row) * 2;
      const x2 = ((part.position.x + 1) / column) * 2 - 1;
      const y2 = 1 - ((part.position.y + 1) / row) * 2;

      const vertices = new Float32Array([
        x1,
        y1,
        ...color,
        x1,
        y2,
        ...color,
        x2,
        y1,
        ...color,
        x2,
        y2,
        ...color,
      ]);

      gl.bufferSubData(gl.ARRAY_BUFFER, i * vertices.byteLength, vertices);

      const indices = new Uint16Array([
        i * 4,
        i * 4 + 2,
        i * 4 + 1,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 3,
      ]);

      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, i * indices.byteLength, indices);
    }

    gl.drawElements(gl.TRIANGLES, this.parts.length * 6, gl.UNSIGNED_SHORT, 0);
  }

  public move(): void {
    const nextPos = this.getNextPosition();
    const head = this.parts[0].position;

    for (let i = this.parts.length - 1; i > 0; i--) {
      const nextBody = this.parts[i - 1].position;
      const body = this.parts[i].position;

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
    return this.parts.map((part) => part.position);
  }
}
