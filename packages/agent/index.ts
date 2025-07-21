import { Kernel, type KernelContext } from "@onkernel/sdk";
import { z } from "zod/v3";
import { chromium, type Browser } from "playwright";
import { ComputerUseAgent } from "@onkernel/cu-playwright";

const kernel = new Kernel();
const app = kernel.app("browser-tool");

const browserSchema = z.object({
  browserId: z.string(),
});

const getBrowser = async (browserId: string) => {
  const browsers = await kernel.browsers.list();

  const persistentBrowser = browsers?.find(
    (browser) => browser.persistence?.id === browserId
  );

  if (!persistentBrowser) {
    const browser = await kernel.browsers.create({
      persistence: {
        id: browserId,
      },
      stealth: true,
    });
    return browser;
  }

  return persistentBrowser;
};

const getDefaultPage = async (browser: Browser) => {
  const context = browser.contexts()[0];
  if (!context) {
    throw new Error("No context found");
  }
  const page = context.pages()[0];
  if (!page) {
    throw new Error("No page found");
  }

  page.setViewportSize({
    width: 1920,
    height: 1080,
  });

  return page;
};

const goToUrlSchema = z.object({
  browserInfo: browserSchema,
  url: z.string(),
});

app.action<unknown, unknown>(
  "goToUrl",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = goToUrlSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, url } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const page = await getDefaultPage(browser);

    await page.goto(url);
  }
);

const googleSearchSchema = z.object({
  browserInfo: browserSchema,
  query: z.string(),
});

app.action<unknown, unknown>(
  "googleSearch",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = googleSearchSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, query } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const page = await getDefaultPage(browser);

    await page.goto(`https://www.duckduckgo.com/search?q=${query}`);
  }
);

const browserAgentToolSchema = z.object({
  browserInfo: browserSchema,
  query: z.string(),
});

app.action<unknown, unknown>(
  "browserAgentTool",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = browserAgentToolSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, query } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const page = await getDefaultPage(browser);

    const agent = new ComputerUseAgent({
      apiKey: process.env.ANTHROPIC_API_KEY,
      page,
    });

    const answer = await agent.execute(query);

    return answer;
  }
);
