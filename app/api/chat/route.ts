import { openai } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText, tool } from "ai";
import { z } from "zod";
import { Kernel } from "@onkernel/sdk";

const kernel = new Kernel({
  apiKey: process.env.KERNEL_API_KEY,
  baseURL: process.env.KERNEL_BASE_URL,
});

export const runtime = "edge";
export const maxDuration = 30;

const browser_persistent_id = "kernel-example-id";

const click = tool({
  description: "Click on the screen at the given coordinates",
  parameters: z.object({
    x: z.number(),
    y: z.number(),
  }),
  execute: async ({ x, y }) => {
    await kernel.invocations.create({
      action_name: "click",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        x: 100,
        y: 100,
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return "success";
  },
});

const type = tool({
  description: "Type the given text into the given input field",
  parameters: z.object({
    text: z.string(),
  }),
  execute: async ({ text }) => {
    await kernel.invocations.create({
      action_name: "type",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        text,
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return "success";
  },
});

const scroll = tool({
  description: "Scroll the page in a specific direction",
  parameters: z.object({
    direction: z.enum(["up", "down", "left", "right"]),
  }),
  execute: async ({ direction }) => {
    await kernel.invocations.create({
      action_name: "scroll",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        direction,
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return "success";
  },
});

const wait = tool({
  description: "Wait for a specified number of seconds",
  parameters: z.object({
    seconds: z.number().min(0.1).max(30),
  }),
  execute: async ({ seconds }) => {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

    return `Waited for ${seconds} seconds`;
  },
});

const screenshot = tool({
  description: "Take a screenshot of the current page",
  parameters: z.object({}),
  execute: async () => {
    const result = await kernel.invocations.create({
      action_name: "screenshot",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return result;
  },
});

const goToUrl = tool({
  description: "Go to the given URL",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async ({ url }) => {
    await kernel.invocations.create({
      action_name: "goToUrl",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        url,
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return "success";
  },
});

const googleSearch = tool({
  description: "Search Google for the given query",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    await kernel.invocations.create({
      action_name: "googleSearch",
      app_name: "browser-tool",
      version: "latest",
      async: false,
      payload: JSON.stringify({
        query,
        browserInfo: {
          browserId: browser_persistent_id,
        },
      }),
    });

    return "success";
  },
});

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const today = new Date().toISOString().split("T")[0];
  const result = streamText({
    model: openai("gpt-4.1"),
    system: `Today is ${today}. You are an autonomous web-browsing agent. You MUST rely exclusively on the provided tools—click, type, scroll, screenshot, goToUrl, googleSearch, and wait—to gather fresh information from the live web. Do NOT answer questions from your internal knowledge or training corpus. If the requested information cannot be retrieved with the available tools, reply with, "I don't have enough information to answer that." Always decide which tool (or sequence of tools) to invoke first, wait for their results, then craft your final answer based solely on that data. Take a screenshot after every action to see the screen and plan your next action.

IMPORTANT: When you encounter captchas, loading states, or pages that appear to be processing, use the wait tool to pause for 3-5 seconds before proceeding. This helps ensure the page has fully loaded and any dynamic content has appeared. If you see a captcha, wait for it to fully load before attempting to interact with it.

At the end of your response, always provide a brief summary of what you found or accomplished during your web browsing session. This summary should highlight the key information, data, or actions that were relevant to the user's request.`,
    messages: messages,
    // forward system prompt and tools from the frontend
    // toolCallStreaming: true,
    tools: {
      ...frontendTools(tools),
      click,
      type,
      scroll,
      wait,
      screenshot,
      goToUrl,
      googleSearch,
    },
    onError: console.log,
    maxSteps: 100,
  });

  // Create a filtered stream that excludes screenshot tool results
  const filteredStream = new ReadableStream({
    async start(controller) {
      const reader = result.toDataStreamResponse().body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          // Parse the stream chunk to check if it's a screenshot tool result
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;

            try {
              // Check if this is a data line (starts with "data: ")
              if (line.startsWith("data: ")) {
                const data = line.slice(6); // Remove "data: " prefix
                if (data === "[DONE]") {
                  controller.enqueue(value);
                  continue;
                }
              }

              // Check if this is a tool result line (starts with "a:")
              if (line.startsWith("a:")) {
                const toolResultData = line.slice(2); // Remove "a:" prefix
                const parsed = JSON.parse(toolResultData);

                // Check if this is a screenshot tool result (has toolCallId and result with output)
                if (
                  parsed.toolCallId &&
                  parsed.result &&
                  typeof parsed.result === "object" &&
                  parsed.result.output
                ) {
                  // This looks like a screenshot result with base64 image
                  const omittedResult = {
                    ...parsed,
                    result: "result omitted due to size",
                  };
                  controller.enqueue(
                    new TextEncoder().encode(
                      "a:" + JSON.stringify(omittedResult) + "\n"
                    )
                  );
                  continue;
                }
              }

              // Send all other chunks through
              controller.enqueue(new TextEncoder().encode(line + "\n"));
            } catch (error) {
              // If parsing fails, just pass through the original chunk
              controller.enqueue(new TextEncoder().encode(line + "\n"));
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(filteredStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
