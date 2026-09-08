export class InputLeftEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "input-left";

  public constructor() {
    super(InputLeftEvent.EVENT_NAME);
  }
}

export class InputRightEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "input-right";

  public constructor() {
    super(InputRightEvent.EVENT_NAME);
  }
}

export class InputUpEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "input-up";

  public constructor() {
    super(InputUpEvent.EVENT_NAME);
  }
}

export class InputDownEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "input-down";

  public constructor() {
    super(InputDownEvent.EVENT_NAME);
  }
}
