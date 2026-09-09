import { InputDownEvent, InputLeftEvent, InputRightEvent, InputUpEvent } from "../events/input";

export default function InitKeyboardControl(target: EventTarget) {
  addEventListener("keydown", (event: KeyboardEvent): void => {
    switch (event.key) {
      case "ArrowLeft":
      case "a":
        target.dispatchEvent(new InputLeftEvent());
        break;

      case "ArrowRight":
      case "d":
        target.dispatchEvent(new InputRightEvent());
        break;

      case "ArrowUp":
      case "w":
        target.dispatchEvent(new InputUpEvent());
        break;

      case "ArrowDown":
      case "s":
        target.dispatchEvent(new InputDownEvent());
        break;
    }
  });
}
