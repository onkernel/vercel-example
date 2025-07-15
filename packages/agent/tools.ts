import type { Page } from "playwright";
import { z } from "zod/v3";
import { tool } from "ai";

const TYPING_DELAY_MS = 12;

// Define action types
enum Action {
  LEFT_CLICK = "left_click",
  RIGHT_CLICK = "right_click",
  MIDDLE_CLICK = "middle_click",
  DOUBLE_CLICK = "double_click",
  TRIPLE_CLICK = "triple_click",
  MOUSE_MOVE = "mouse_move",
  LEFT_CLICK_DRAG = "left_click_drag",
  LEFT_MOUSE_DOWN = "left_mouse_down",
  LEFT_MOUSE_UP = "left_mouse_up",
  KEY = "key",
  TYPE = "type",
  HOLD_KEY = "hold_key",
  SCREENSHOT = "screenshot",
  CURSOR_POSITION = "cursor_position",
  SCROLL = "scroll",
  WAIT = "wait",
}

// Define types
interface ActionParams {
  action: Action;
  text?: string;
  coordinate?: [number, number];
  scrollDirection?: "up" | "down" | "left" | "right";
  scroll_amount?: number;
  scrollAmount?: number;
  duration?: number;
  [key: string]: unknown;
}

interface ToolResult {
  base64Image?: string;
  output?: string;
}

class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

class KeyboardUtils {
  static getPlaywrightKey(key: string): string {
    // Simplified key mapping
    const keyMap: Record<string, string> = {
      Control: "Control",
      Shift: "Shift",
      Alt: "Alt",
      Meta: "Meta",
      Enter: "Enter",
      Tab: "Tab",
      Escape: "Escape",
      Backspace: "Backspace",
      Delete: "Delete",
      ArrowUp: "ArrowUp",
      ArrowDown: "ArrowDown",
      ArrowLeft: "ArrowLeft",
      ArrowRight: "ArrowRight",
    };
    return keyMap[key] || key;
  }

  static parseKeyCombination(text: string): string[] {
    return text.split("+").map((key) => this.getPlaywrightKey(key.trim()));
  }
}

// Helper functions
function getMouseButton(action: Action): "left" | "right" | "middle" {
  switch (action) {
    case Action.LEFT_CLICK:
    case Action.DOUBLE_CLICK:
    case Action.TRIPLE_CLICK:
    case Action.LEFT_CLICK_DRAG:
    case Action.LEFT_MOUSE_DOWN:
    case Action.LEFT_MOUSE_UP:
      return "left";
    case Action.RIGHT_CLICK:
      return "right";
    case Action.MIDDLE_CLICK:
      return "middle";
    default:
      throw new ToolError(`Invalid mouse action: ${action}`);
  }
}

async function handleMouseAction(
  page: Page,
  action: Action,
  coordinate: [number, number]
): Promise<ToolResult> {
  const [x, y] = coordinate;
  await page.mouse.move(x, y);
  await page.waitForTimeout(100);

  if (action === Action.LEFT_MOUSE_DOWN) {
    await page.mouse.down();
  } else if (action === Action.LEFT_MOUSE_UP) {
    await page.mouse.up();
  } else {
    const button = getMouseButton(action);
    if (action === Action.DOUBLE_CLICK) {
      await page.mouse.dblclick(x, y, { button });
    } else if (action === Action.TRIPLE_CLICK) {
      await page.mouse.click(x, y, { button, clickCount: 3 });
    } else {
      await page.mouse.click(x, y, { button });
    }
  }

  await page.waitForTimeout(500);
  return await takeScreenshot(page);
}

async function handleKeyboardAction(
  page: Page,
  action: Action,
  text: string,
  duration?: number
): Promise<ToolResult> {
  if (action === Action.HOLD_KEY) {
    const key = KeyboardUtils.getPlaywrightKey(text);
    await page.keyboard.down(key);
    await new Promise((resolve) => setTimeout(resolve, duration! * 1000));
    await page.keyboard.up(key);
  } else if (action === Action.KEY) {
    const keys = KeyboardUtils.parseKeyCombination(text);
    for (const key of keys) {
      await page.keyboard.down(key);
    }
    for (const key of keys.reverse()) {
      await page.keyboard.up(key);
    }
  } else {
    await page.keyboard.type(text, { delay: TYPING_DELAY_MS });
  }

  await page.waitForTimeout(500);
  return await takeScreenshot(page);
}

async function takeScreenshot(page: Page): Promise<ToolResult> {
  try {
    console.log("Starting screenshot...");
    await new Promise((resolve) => setTimeout(resolve, 2.0 * 1000));
    const screenshot = await page.screenshot({ type: "png" });
    console.log("Screenshot taken, size:", screenshot.length, "bytes");

    return {
      base64Image: screenshot.toString("base64"),
    };
  } catch (error) {
    throw new ToolError(`Failed to take screenshot: ${error}`);
  }
}

// Vercel AI SDK Tools
export const computerTool = tool({
  description:
    "Control computer actions like mouse clicks, keyboard input, screenshots, and scrolling",
  parameters: z.object({
    action: z.enum([
      "left_click",
      "right_click",
      "middle_click",
      "double_click",
      "triple_click",
      "mouse_move",
      "left_click_drag",
      "left_mouse_down",
      "left_mouse_up",
      "key",
      "type",
      "hold_key",
      "screenshot",
      "cursor_position",
      "scroll",
      "wait",
    ]),
    text: z.string().optional(),
    coordinate: z.tuple([z.number(), z.number()]).optional(),
    scrollDirection: z.enum(["up", "down", "left", "right"]).optional(),
    scrollAmount: z.number().optional(),
    duration: z.number().optional(),
  }),
  execute: async ({
    action,
    text,
    coordinate,
    scrollDirection,
    scrollAmount,
    duration,
  }) => {
    const mouseActions = new Set([
      Action.LEFT_CLICK,
      Action.RIGHT_CLICK,
      Action.MIDDLE_CLICK,
      Action.DOUBLE_CLICK,
      Action.TRIPLE_CLICK,
      Action.MOUSE_MOVE,
      Action.LEFT_CLICK_DRAG,
      Action.LEFT_MOUSE_DOWN,
      Action.LEFT_MOUSE_UP,
    ]);

    const keyboardActions = new Set([Action.KEY, Action.TYPE, Action.HOLD_KEY]);

    if (action === "screenshot") {
      return await takeScreenshot(page);
    }

    if (action === "cursor_position") {
      const position = await page.evaluate(() => {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        return rect ? { x: rect.x, y: rect.y } : null;
      });

      if (!position) {
        throw new ToolError("Failed to get cursor position");
      }

      return { output: `X=${position.x},Y=${position.y}` };
    }

    if (action === "scroll") {
      if (
        !scrollDirection ||
        !["up", "down", "left", "right"].includes(scrollDirection)
      ) {
        throw new ToolError(
          `Scroll direction "${scrollDirection}" must be 'up', 'down', 'left', or 'right'`
        );
      }
      if (typeof scrollAmount !== "number" || scrollAmount < 0) {
        throw new ToolError(
          `Scroll amount "${scrollAmount}" must be a non-negative number`
        );
      }

      if (coordinate) {
        const [x, y] = coordinate;
        await page.mouse.move(x, y);
        await page.waitForTimeout(100);
      }

      const pageDimensions = await page.evaluate(() => {
        return { h: window.innerHeight, w: window.innerWidth };
      });
      const pagePartitions = 25;
      const scrollFactor = (scrollAmount || 10) / pagePartitions;

      if (scrollDirection === "down" || scrollDirection === "up") {
        const amount = pageDimensions.h * scrollFactor;
        await page.mouse.wheel(
          0,
          scrollDirection === "down" ? amount : -amount
        );
      } else {
        const amount = pageDimensions.w * scrollFactor;
        await page.mouse.wheel(
          scrollDirection === "right" ? amount : -amount,
          0
        );
      }

      await page.waitForTimeout(500);
      return await takeScreenshot(page);
    }

    if (action === "wait") {
      await new Promise((resolve) => setTimeout(resolve, duration! * 1000));
      return await takeScreenshot(page);
    }

    if (mouseActions.has(action as Action)) {
      if (!coordinate) {
        throw new ToolError(`coordinate is required for ${action}`);
      }
      return await handleMouseAction(page, action as Action, coordinate);
    }

    if (keyboardActions.has(action as Action)) {
      if (!text) {
        throw new ToolError(`text is required for ${action}`);
      }
      return await handleKeyboardAction(page, action as Action, text, duration);
    }

    throw new ToolError(`Invalid action: ${action}`);
  },
});

// Version-specific tools for backward compatibility
export const computerTool20241022 = tool({
  description:
    "Computer control tool (version 20241022) - limited functionality",
  parameters: z.object({
    action: z.enum([
      "left_click",
      "right_click",
      "middle_click",
      "double_click",
      "triple_click",
      "mouse_move",
      "left_click_drag",
      "left_mouse_down",
      "left_mouse_up",
      "key",
      "type",
      "hold_key",
      "screenshot",
      "cursor_position",
    ]),
    text: z.string().optional(),
    coordinate: z.tuple([z.number(), z.number()]).optional(),
  }),
  execute: async ({ action, text, coordinate }) => {
    // Only allow actions available in 20241022 version
    //@ts-expect-error ???
    if (action === "scroll" || action === "wait") {
      throw new ToolError(`${action} is only available in version 20250124`);
    }

    // return await computerTool.execute({
    //   action,
    //   text,
    //   coordinate,
    //   scrollDirection: undefined,
    //   scrollAmount: undefined,
    //   duration: undefined,
    // });
  },
});

export const computerTool20250124 = tool({
  description: "Computer control tool (version 20250124) - full functionality",
  parameters: z.object({
    action: z.enum([
      "left_click",
      "right_click",
      "middle_click",
      "double_click",
      "triple_click",
      "mouse_move",
      "left_click_drag",
      "left_mouse_down",
      "left_mouse_up",
      "key",
      "type",
      "hold_key",
      "screenshot",
      "cursor_position",
      "scroll",
      "wait",
    ]),
    text: z.string().optional(),
    coordinate: z.tuple([z.number(), z.number()]).optional(),
    scrollDirection: z.enum(["up", "down", "left", "right"]).optional(),
    scrollAmount: z.number().optional(),
    duration: z.number().optional(),
  }),
  execute: async (params) => {
    // return await computerTool.execute(params, { page });
  },
});

// Export all tools
export const computerTools = {
  computer: computerTool,
  computer_20241022: computerTool20241022,
  computer_20250124: computerTool20250124,
};
