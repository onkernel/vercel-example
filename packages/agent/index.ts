import { Kernel, type KernelContext } from "@onkernel/sdk";
import { z } from "zod/v3";
import { chromium } from "playwright";

const kernel = new Kernel();
const app = kernel.app("browser-tool");

const browserSchema = z.object({
  browserId: z.string(),
});

const clickSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  browserInfo: browserSchema,
});

const getBrowser = async (browserId: string) => {
  const browsers = await kernel.browsers.list();
  console.log("Browsers", browsers);
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
    console.log(
      "Created browser",
      browser.replay_view_url || browser.browser_live_view_url
    );
    return browser;
  }
  console.log(
    "Found browser",
    persistentBrowser.replay_view_url || persistentBrowser.browser_live_view_url
  );

  return persistentBrowser;
};

app.action<unknown, unknown>(
  "click",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = clickSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, x, y } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];
    if (!page) {
      throw new Error("No page found");
    }

    await page.mouse.click(x, y);
  }
);

const typeSchema = z.object({
  text: z.string(),
  browserInfo: browserSchema,
});

app.action<unknown, unknown>(
  "type",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = typeSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, text } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];

    if (!page) {
      throw new Error("No page found");
    }

    await page.keyboard.type(text);
  }
);

const scrollSchema = z.object({
  direction: z.enum(["up", "down"]),
  browserInfo: browserSchema,
});

app.action<unknown, unknown>(
  "scroll",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = scrollSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo, direction } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];
    if (!page) {
      throw new Error("No page found");
    }

    if (direction === "up") {
      await page.mouse.wheel(0, -100);
      return "success";
    } else {
      await page.mouse.wheel(0, 100);
      return "success";
    }
  }
);

const screenshotSchema = z.object({
  browserInfo: browserSchema,
});

app.action<unknown, unknown>(
  "screenshot",
  async (requestContext: KernelContext, payload) => {
    const payloadResult = screenshotSchema.safeParse(payload);

    // handle parsing failing
    if (!payloadResult.success) {
      throw new Error(
        `Invalid payload: ${JSON.stringify(payloadResult.error.issues)}`
      );
    }

    const { browserInfo } = payloadResult.data;

    const persistentBrowser = await getBrowser(browserInfo.browserId);

    const browser = await chromium.connectOverCDP(persistentBrowser.cdp_ws_url);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];
    if (!page) {
      throw new Error("No page found");
    }

    const screenshot = await page.screenshot();

    return screenshot.toString("base64");
  }
);

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
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];
    if (!page) {
      throw new Error("No page found");
    }

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
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("No context found");
    }
    const page = context.pages()[0];
    if (!page) {
      throw new Error("No page found");
    }

    await page.goto(`https://www.google.com/search?q=${query}`);
  }
);
