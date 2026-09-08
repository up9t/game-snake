import type { IColor, IDrawable } from "./interfaces.ts";
import { isUndefined } from "./utils.ts";

/**
 * Create grid pattern for background
 */
export default class Grid implements IDrawable {
  private readonly rowCount: number;
  private readonly columnCount: number;
  private readonly colors: IColor[] = [
    { r: 210, g: 255, b: 133, a: 255 },
    { r: 137, g: 201, b: 117, a: 255 },
  ];
  private vao: WebGLVertexArrayObject | undefined;

  public constructor(canvas: HTMLCanvasElement, gridColumnCount: number) {
    const gridEachSize = Math.floor(canvas.width / gridColumnCount);
    const gridRowCount = Math.floor(canvas.height / gridEachSize);

    canvas.width = gridEachSize * gridColumnCount;
    canvas.height = gridEachSize * gridRowCount;

    this.rowCount = gridRowCount;
    this.columnCount = gridColumnCount;
  }

  public getColumnCount(): number {
    return this.columnCount;
  }

  public getRowCount(): number {
    return this.rowCount;
  }

  public setup(gl: WebGL2RenderingContext, program: WebGLProgram) {
    // x, y and r, g, b, a value
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < this.rowCount; i++) {
      for (let j = 0; j < this.columnCount; j++) {
        const colorIndex = (i + j) % this.colors.length;
        const currColor = this.colors[colorIndex];
        const color: [number, number, number, number] = [
          currColor.r / 255,
          currColor.g / 255,
          currColor.b / 255,
          currColor.a / 255,
        ];

        const x = j;
        const y = i;

        const column = this.getColumnCount();
        const row = this.getRowCount();

        const x1 = (x / column) * 2 - 1;
        const y1 = 1 - (y / row) * 2;
        const x2 = ((x + 1) / column) * 2 - 1;
        const y2 = 1 - ((y + 1) / row) * 2;

        const offset = vertices.length / 6;

        vertices.push(x1, y1, ...color); // top-left
        vertices.push(x2, y1, ...color); // top-right
        vertices.push(x2, y2, ...color); // bottom-right
        vertices.push(x1, y2, ...color); // bottom-left

        indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
      }
    }

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    const posLocation = gl.getAttribLocation(program, "aPos");
    gl.vertexAttribPointer(
      posLocation,
      2,
      gl.FLOAT,
      false,
      (2 + 4) * Float32Array.BYTES_PER_ELEMENT,
      0,
    );
    gl.enableVertexAttribArray(posLocation);

    const colorLocation = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(
      colorLocation,
      4,
      gl.FLOAT,
      false,
      (2 + 4) * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(colorLocation);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.vao = vao;
  }

  public draw(gl: WebGL2RenderingContext): void {
    if (isUndefined(this.vao)) {
      throw new TypeError("failed to draw", {
        cause: "vertex array is undefined",
      });
    }

    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.rowCount * this.columnCount * 6, gl.UNSIGNED_SHORT, 0);
  }
}
