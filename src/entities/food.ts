import type Grid from "../grid.ts";
import type { IColor, IDrawable, IVec2 } from "../interfaces.ts";
import { isUndefined } from "../utils.ts";
import { Entity } from "./base.ts";
import type { IFood } from "./interface.ts";

export default class Food extends Entity implements IFood, IDrawable {
  public readonly color;
  private hasChanged = false;
  private vbo: WebGLBuffer | undefined;
  private vao: WebGLVertexArrayObject | undefined;
  private readonly grid;

  public override readonly position = new Proxy<IVec2>(
    { x: 0, y: 0 },
    {
      get: (target, prop) => Reflect.get(target, prop),
      set: (target, prop, value) => {
        const ok = Reflect.set(target, prop, value);
        this.hasChanged = ok;

        return ok;
      },
    },
  );

  public constructor(color: IColor, positionInGrid: IVec2, grid: Grid) {
    super();
    this.color = color;
    this.grid = grid;

    this.setPosition(positionInGrid);
  }

  public setup(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    const vao = gl.createVertexArray();

    this.vbo = vbo;
    this.vao = vao;

    const column = this.grid.getColumnCount();
    const row = this.grid.getRowCount();

    const x1 = (this.position.x / column) * 2 - 1;
    const x2 = ((this.position.x + 1) / column) * 2 - 1;
    const y1 = 1 - (this.position.y / row) * 2;
    const y2 = 1 - ((this.position.y + 1) / row) * 2;

    const color: [number, number, number, number] = [
      this.color.r,
      this.color.g,
      this.color.b,
      this.color.a,
    ];

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

    const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);

    gl.bindVertexArray(vao);

    const posLoc = gl.getAttribLocation(program, "aPos");
    const colorLoc = gl.getAttribLocation(program, "aColor");

    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, (2 + 4) * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(
      colorLoc,
      4,
      gl.FLOAT,
      false,
      (2 + 4) * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.enableVertexAttribArray(posLoc);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
  }

  public draw(gl: WebGL2RenderingContext): void {
    if (isUndefined(this.vbo) || isUndefined(this.vao)) {
      throw new TypeError("failed to draw with undefined vertex buffer or vertex array");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindVertexArray(this.vao);

    if (this.hasChanged) {
      this.hasChanged = false;

      const column = this.grid.getColumnCount();
      const row = this.grid.getRowCount();

      const x1 = (this.position.x / column) * 2 - 1;
      const x2 = ((this.position.x + 1) / column) * 2 - 1;
      const y1 = 1 - (this.position.y / row) * 2;
      const y2 = 1 - ((this.position.y + 1) / row) * 2;

      const color: [number, number, number, number] = [
        this.color.r,
        this.color.g,
        this.color.b,
        this.color.a,
      ];

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

      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);

      return;
    }

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}
