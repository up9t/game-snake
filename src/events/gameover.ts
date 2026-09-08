export class GameWinEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "game-win";
  public constructor() {
    super(GameWinEvent.EVENT_NAME);
  }
}

export class GameLoseEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "game-lose";
  public constructor() {
    super(GameLoseEvent.EVENT_NAME);
  }
}
