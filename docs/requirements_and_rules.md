# Submission Requirements & Project Rules

---

## 1. Project Requirements

### Core Mandate
Build a WebMCP-powered web application where humans and AI agents interact, collaborate, and execute tasks together using structured, client-side exposed tools.

### Functionality & Reliability
- The project must run consistently on the live URL provided.
- Tools registered with the browser model context must execute reliably and match what is demonstrated in the demo video.
- The UI should remain responsive while tools are invoked.

### New vs. Pre-Existing Projects
- **New Projects:** Fully built during the submission window (August 25 – September 3, 2026).
- **Pre-Existing Projects:** If modifying an existing codebase, it must be **meaningfully extended with WebMCP** during the submission window.
  - Work done before August 25 does not count towards judging.
  - You must document timestamped git commit history or clear documentation delineating pre-existing code from new WebMCP additions.

---

## 2. Submission Deliverables

### A. Live Hosted URL
- Must be deployed to a reliable public host (Cloudflare Pages/Workers, Vercel, Netlify, Render, Shopify, ChatGPT Sites, AWS, etc.).
- Must be accessible without paywalls or non-public VPNs.
- If credentials are required, you must provide functional demo credentials in the Devpost submission text.

### B. Public Code Repository
- Must be hosted on GitHub, GitLab, or Bitbucket.
- **License Requirement:** Must include a standard, detectable open-source license file (e.g., `LICENSE` with MIT, Apache-2.0, BSD, etc.).
- **Code Completeness:** Must include all frontend code, tool definitions, schemas, execution handlers, and dependencies necessary to build/run the project.
- **WebMCP Integration:** Code must include `document.modelContext.registerTool(...)` or standard WebMCP bindings.

### C. Demonstration Video
- **Length:** Strictly **under 3 minutes** (judges are not required to watch beyond 3:00).
- **Platform:** Public YouTube link.
- **Content:**
  - Show the working app in action.
  - Demonstrate an AI agent discovering and calling your WebMCP tools.
  - Include clear audio commentary explaining the problem, the agent interaction, and the technical architecture.

### D. Text Narrative
Answer the four mandatory prompt areas:
1. **Use Case Fit:** Why WebMCP was essential vs traditional UI or server APIs.
2. **User Experience:** How human-agent co-piloting improves productivity and user workflow.
3. **Capabilities Unlocked:** What tasks are now possible or significantly faster.
4. **Implementation Details:** How the tools, schemas, and state synchronization are structured.

---

## 3. Submission Modification Rules

- **Pre-Deadline:** You may edit, update, and re-deploy your project and Devpost submission as many times as you like before **September 3, 2026 at 1:00 PM PT**.
- **Post-Deadline Code Freeze:** Once the submission window closes:
  - **DO NOT push commits** to the submitted repository branch.
  - **DO NOT deploy changes** to the live production URL.
  - **DO NOT edit** the Devpost submission details.
  - Making changes during the judging period (Sept 4 – Sept 21) risks disqualification. If you want to continue building, create a new branch or repository fork.
