# Judging & Scoring Criteria Breakdown

Submissions will be scored on a **1 to 5 scale** across four equally weighted dimensions (25% each):

---

### 1. WebMCP Leverage (25%)
*How thoroughly and skillfully does the project use WebMCP?*
- **Key Questions:**
  - Does the project register meaningful, well-structured tools via `document.modelContext`?
  - Are tool schemas expressive, well-documented, and robust?
  - Does the code reflect non-trivial engineering effort rather than a superficial wrapper?
- **Winning Strategy:** Expose rich, bidirectional tools that allow the agent to read complex state, mutate the UI canvas/data model, and provide real-time feedback.

---

### 2. Execution & Product Polish (25%)
*Does the project deliver a complete, cohesive product experience?*
- **Key Questions:**
  - Is the web app fully functional and reliable on the live URL?
  - Is the UI intuitive, fast, and visually appealing?
  - Does the human-agent interaction flow smoothly without errors or confusing state lags?
- **Winning Strategy:** Ensure the live URL never throws unhandled errors. Polish the UI styling, handle loading/error states gracefully, and ensure tools respond in `< 500ms`.

---

### 3. Potential Impact & Real-World Utility (25%)
*Does the project solve a real problem for a real audience?*
- **Key Questions:**
  - Is there a clear, credible problem being addressed?
  - Does having an agent drive the web app significantly accelerate the task?
  - Can users accomplish things that were previously painful, slow, or impossible with pure manual UI clicks?
- **Winning Strategy:** Target a high-leverage domain (design, coding, visual canvas editing, complex data analysis, workflow automation) where agent tool-calling provides an order-of-magnitude speedup.

---

### 4. Creativity & Ambition (25%)
*How novel and forward-thinking is the concept?*
- **Key Questions:**
  - Does the app pioneer a new interaction paradigm for the agentic web?
  - Does it go beyond standard chatbot text boxes into interactive co-creation?
- **Winning Strategy:** Blend direct manipulation (drag-and-drop, interactive canvas, live preview) with agentic execution (agent editing elements simultaneously with the human).
