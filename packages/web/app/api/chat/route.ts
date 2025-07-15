import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText, tool } from "ai";
import { z } from "zod";
import { Kernel } from "@onkernel/sdk";
import { anthropic } from "@ai-sdk/anthropic";

const kernel = new Kernel({
  apiKey: process.env.KERNEL_API_KEY,
  baseURL: process.env.KERNEL_BASE_URL,
});

export const maxDuration = 60 * 10;

const browser_persistent_id = "kernel-example-id";

const wait = tool({
  description: "Wait for a specified number of seconds",
  parameters: z.object({
    seconds: z.number().min(5).max(30),
  }),
  execute: async ({ seconds }) => {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

    return `Waited for ${seconds} seconds`;
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

const browserAgentTool = tool({
  description: "Use the browser agent to perform actions",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const result = await kernel.invocations.create({
      action_name: "browserAgentTool",
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

    return result.output;
  },
});

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const today = new Date().toISOString().split("T")[0];
  const result = streamText({
    model: anthropic("claude-4-sonnet-20250514"),
    system: `Today is ${today}. You are an autonomous web-browsing agent. You MUST rely on the tools provided to you to perform actions on the web to answer the user's question. Answer the user's question based on the information you find on the web and summarize your findings.`,
    messages: messages,
    // forward system prompt and tools from the frontend
    // toolCallStreaming: true,
    tools: {
      ...frontendTools(tools),
      wait,
      goToUrl,
      browserAgentTool,
    },
    onError: console.log,
    maxSteps: 25,
  });

  return result.toDataStreamResponse();
}
