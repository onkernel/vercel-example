<p align="center">
  <img src="static/images/kernel_wordmark.svg" alt="Kernel Logo" width="55%">
</p>

<p align="center">
  <img alt="GitHub License" src="https://img.shields.io/github/license/onkernel/kernel-images">
  <a href="https://discord.gg/FBrveQRcud"><img src="https://img.shields.io/discord/1342243238748225556?logo=discord&logoColor=white&color=7289DA" alt="Discord"></a>
  <a href="https://x.com/onkernel"><img src="https://img.shields.io/twitter/follow/onkernel" alt="Follow @onkernel"></a>
</p>

# Kernel Vercel Template

A web agent chatbot template build with Next.js, Vercel, and Kernel.

<p align="center">
  <img src="https://github.com/user-attachments/assets/c7b212a6-8872-4c82-8f1d-92c9021eb393" alt="kernel-vercel-template">
</p>

## Getting Started

Sign up for a Kernel account [here](https://dashboard.onkernel.com) or integrate with Vercel ( coming soon )

```bash
git clone https://github.com/onkernel/vercel-template.git
cd vercel-template
```

Add your Kernel API key and Anthropic API key to the `.env` file in the `packages/agent` and `packages/web` directories.

```bash
KERNEL_API_KEY=your-api-key
ANTHROPIC_API_KEY=your-api-key
```

Deploy the agent to Kernel

```bash
pnpm run deploy:agent
```

Run the development server for the web app

```bash
pnpm run dev:web
```

You can now access the web app at `http://localhost:3000`

## Project Layout

```bash
kernel-vercel-template/
├── packages/
│   ├── agent/ # Kernel agent
│   ├── web/ # Web app
```

### `packages/agent`

The agent is deployed as an [action](https://docs.onkernel.com/info/concepts#action) in your Kernel app. The action runs our [Claude Computer Use Playwright SDK](https://github.com/onkernel/cu-playwright-ts) to control the browser.

You can tail the logs of the action by running `pnpm run logs` in the `packages/agent` directory.

### `packages/web`

The web app is responsible for the UI. It uses [Next.js](https://nextjs.org/), [AI SDK](https://ai-sdk.dev), and [Assistant-UI](https://github.com/assistant-ui/assistant-ui) to build the chat interface. The chatbot is deployed as a [route](packages/web/app/api/chat/route.ts) in the web app and uses the `browserAgentTool` to control the browser. You can extend this to build a custom chatbot with your own tools.

## What's Kernel?

Kernel provides sandboxed, ready-to-use Chrome browsers for browser automations and web agents. You can connect to the browser using Chrome DevTools-based browser frameworks (Playwright, Puppeteer).

We also provide a remote GUI access (live view streaming) for visual monitoring and remote control.

## What You Can Do With Our Platform

- Run automated browser-based workflows
- Develop and test AI agents that use browsers
- Build custom tools that require controlled browser environments

## Support

For issues, questions, or feedback, please [open an issue](https://github.com/onkernel/kernel-images/issues) on this repository. You can also join our [Discord](https://discord.gg/FBrveQRcud).

## License

See the [LICENSE](./LICENSE) file for details.

Made with ❤️ by the [Kernel team](https://www.onkernel.com).
