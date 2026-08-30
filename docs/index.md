# WebMCP Challenge — Developer Quick Reference & Guide

> Focused technical guide for building, testing, deploying, and submitting a WebMCP project.

---

## ⚡ Key Milestones & Timing
- **Submission Deadline:** September 3, 2026 at 1:00 PM PT (4:00 PM ET)
- **Hard Rule:** Once submitted and past the deadline, **do not touch** the code repository, live deployment, or Devpost submission until judging completes (September 21, 2026). If you continue developing, work on a separate fork.

---

## 📋 Core Submission Checklist

Before the deadline, ensure all 4 components are ready:

1. **Live Working URL:**
   - Publicly hosted and reachable.
   - Tested in **ChatGPT in-app browser** and/or **Google Chrome 149+** with `chrome://flags/#enable-webmcp-testing` enabled.
   - If behind login/authentication, working test credentials must be included on the Devpost form.

2. **Public Git Repository (GitHub, GitLab, or Bitbucket):**
   - Must contain a valid, detectable **Open Source License** (MIT, Apache 2.0, etc.) in the root.
   - Must contain clean source code, assets, and a clear `README.md` with setup/usage instructions.
   - Must implement active tool registration using `document.modelContext.registerTool(...)`.

3. **Demo Video:**
   - **Under 3 minutes (`< 3:00`)**, uploaded publicly to YouTube.
   - Must have clear audio commentary and visual demonstration of the working WebMCP tools and human-agent interaction.

4. **Written Project Description:**
   - **Why WebMCP:** Why this use case is uniquely suited for WebMCP.
   - **User Experience:** How human-agent co-piloting creates a superior UX.
   - **New Capabilities:** What users and agents can now do together that was previously difficult/impossible.
   - **Technical Implementation:** Clear summary of how WebMCP tools were registered and executed.

---

## 📑 Documentation Index

- [**Submission Requirements & Project Rules**](file:///c:/Users/Abbas/dev/SpritesCanvas/docs/requirements_and_rules.md): Detailed rules on repos, licenses, videos, and existing vs new code.
- [**Devpost Submission Narrative**](file:///c:/Users/Abbas/dev/SpritesCanvas/SUBMISSION_NARRATIVE.md): Official written narrative addressing the 4 mandatory prompt areas.
- [**Demo & Judge Evaluation Walkthrough**](file:///c:/Users/Abbas/dev/SpritesCanvas/DEMO_WALKTHROUGH.md): Copy-pasteable WebMCP test scenarios and video script.
- [**WebMCP Tool Reference**](file:///c:/Users/Abbas/dev/SpritesCanvas/WEBMCP_TOOL_REFERENCE.md): Full schema & contract for all 36 tools.
- [**Technical Architecture & Project Docs**](file:///c:/Users/Abbas/dev/SpritesCanvas/DOCUMENTATION.md): Deep-dive system architecture.
- [**Deployment & Testing Guide**](file:///c:/Users/Abbas/dev/SpritesCanvas/docs/deployment_and_testing.md): Hosting options (Cloudflare, Vercel, Netlify, Render) and browser testing environments.
- [**Judging & Scoring Criteria**](file:///c:/Users/Abbas/dev/SpritesCanvas/docs/judging_criteria.md): The 4 evaluation pillars and scoring rubric.
- [**Developer Resources & Templates**](file:///c:/Users/Abbas/dev/SpritesCanvas/docs/resources_and_templates.md): Starter codebases, React hooks, Chrome labs demos, and official documentation.
- [**Technical FAQ & AI Usage**](file:///c:/Users/Abbas/dev/SpritesCanvas/docs/faq.md): Practical answers on repositories, hosting, auth, and AI assistance.
