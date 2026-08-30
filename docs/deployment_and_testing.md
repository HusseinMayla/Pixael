# Deployment & Testing Guide

---

## Supported Deployment Platforms

You may host your application on any modern web platform. Common supported options:

| Provider | Best Suited For | Key Advantages |
|---|---|---|
| **Cloudflare Pages / Workers** | Edge apps, static frontends, full-stack edge functions | Global low latency, fast cold starts, free tier available |
| **Vercel** | Next.js, React, Svelte, AI SDK integrations | Seamless git deploys, preview URLs, built-in edge runtime |
| **Netlify** | Static sites, Single Page Apps, serverless functions | Quick setup, instant rollbacks, free tier available |
| **Render** | Full-stack web apps, background workers, Node/Python backends | Automatic SSL, custom services |
| **Shopify** | E-commerce / storefront applications | Headless Storefront API, Shopify WebMCP support |
| **ChatGPT Sites** | Embedded ChatGPT applications | Built directly into ChatGPT ecosystem |

---

## Testing Environments

To verify that your WebMCP tools function as expected, test using either or both methods:

### Method 1: Google Chrome with WebMCP Experimental Flag (Recommended for local dev)

1. Ensure you have **Google Chrome version 149 or later** (or Chrome Canary/Dev).
2. Open Chrome and navigate to:
   ```text
   chrome://flags/#enable-webmcp-testing
   ```
3. Set the flag to **Enabled**.
4. Click **Relaunch** to restart the browser.
5. Open your local (`http://localhost:...`) or deployed application URL.
6. Open DevTools (`F12`) -> Check the **Application** panel -> **WebMCP** tab to inspect and test registered tools.

### Method 2: ChatGPT Desktop In-App Browser

1. Download and open the **ChatGPT desktop application** (macOS or Windows).
2. Use the in-app browser interface to navigate to your deployed public URL.
3. WebMCP is supported natively out of the box in this environment.
4. Interact with ChatGPT and ask it to perform tasks on your open web app to observe tool execution.

---

## Authentication & Access Guidelines for Judges

- If your app requires user accounts or authentication:
  - Provide pre-configured, tested demo credentials (e.g., username/password or direct demo token) on the Devpost submission form.
  - Ensure the credentials have appropriate permissions to test all features.
  - Do not use SMS 2FA or CAPTCHA on the demo account that could block automated or rapid judge evaluations.
