import type { IDirection2D } from "./interfaces";

const Dir = {
  NONE: null,
  LEFT: null,
  RIGHT: null,
  UP: null,
  DOWN: null,
};

export const Direction = {
  POSITIVE: 1,
  ZERO: 0,
  NEGATIVE: -1,
};

// based on 0, 0 at top left
const SnakeDirection: {
  [K in keyof typeof Dir]: IDirection2D;
} = {
  NONE: { x: Direction.ZERO, y: Direction.ZERO },
  UP: { x: Direction.ZERO, y: Direction.NEGATIVE },
  DOWN: { x: Direction.ZERO, y: Direction.POSITIVE },
  LEFT: { x: Direction.NEGATIVE, y: Direction.ZERO },
  RIGHT: { x: Direction.POSITIVE, y: Direction.ZERO },
};

export default SnakeDirection;
