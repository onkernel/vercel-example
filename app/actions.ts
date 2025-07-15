"use server";

import { Kernel } from "@onkernel/sdk";

const kernel = new Kernel({
  apiKey: process.env.ONKERNEL_API_KEY,
});

const getPersistentBrowserFromPersistenceId = async (browserId: string) => {
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

    return browser.browser_live_view_url;
  }
  console.log(
    "Found browser",
    persistentBrowser.replay_view_url || persistentBrowser.browser_live_view_url
  );

  return persistentBrowser.browser_live_view_url;
};

export async function getBrowser() {
  const browser = await getPersistentBrowserFromPersistenceId(
    "kernel-example-id"
  );
  return browser;
}

export async function resetBrowser() {
  await kernel.browsers.delete({
    persistent_id: "kernel-example-id",
  });

  const browser = await kernel.browsers.create({
    persistence: {
      id: "kernel-example-id",
    },
    stealth: true,
  });

  return browser.browser_live_view_url;
}
