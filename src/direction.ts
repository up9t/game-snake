import type { IDirection2D } from "./interfaces";

export const Direction = {
  POSITIVE: 1,
  ZERO: 0,
  NEGATIVE: -1,
} as const;

// based on 0, 0 at top left
const SnakeDirection = {
  NONE: { x: Direction.ZERO, y: Direction.ZERO },
  UP: { x: Direction.ZERO, y: Direction.NEGATIVE },
  DOWN: { x: Direction.ZERO, y: Direction.POSITIVE },
  LEFT: { x: Direction.NEGATIVE, y: Direction.ZERO },
  RIGHT: { x: Direction.POSITIVE, y: Direction.ZERO },
} as const satisfies Record<string, IDirection2D>;

export default SnakeDirection;
