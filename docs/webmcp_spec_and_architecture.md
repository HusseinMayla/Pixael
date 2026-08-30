# WebMCP Architecture & Tool Specification

---

## What is WebMCP?

WebMCP (Web Model Context Protocol) is an emerging open standard designed for the client-side web. It allows web applications to register structured tools into the browser runtime (`document.modelContext`), enabling AI agents running in the browser (or in-app browsers like ChatGPT) to inspect, call, and interact directly with the web application state.

---

## Core API: `document.modelContext.registerTool`

### Basic Tool Registration Signature

```javascript
document.modelContext.registerTool({
  name: "tool_name",
  description: "Clear, concise description of what the tool does and when to call it.",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description of parameter"
      },
      param2: {
        type: "number",
        description: "Numeric parameter"
      }
    },
    required: ["param1"]
  },
  execute: async (input) => {
    // 1. Process the input
    // 2. Perform DOM updates, state modifications, or API calls
    // 3. Return a JSON-serializable result object
    return {
      status: "success",
      data: { /* return data for the LLM agent */ }
    };
  }
});
```

---

## React Integration Pattern

Using the official React hook (`use-webmcp-tool`):

```bash
npm install use-webmcp-tool
```

```tsx
import React, { useState } from 'react';
import { useWebMCPTool } from 'use-webmcp-tool';

export function ProductCanvas() {
  const [items, setItems] = useState([]);

  useWebMCPTool({
    name: "add_canvas_element",
    description: "Adds an element to the interactive canvas with specified coordinates and properties",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["sprite", "shape", "text"] },
        x: { type: "number", description: "X coordinate (0-1000)" },
        y: { type: "number", description: "Y coordinate (0-1000)" },
        label: { type: "string", description: "Label or caption" }
      },
      required: ["type", "x", "y"]
    },
    execute: async ({ type, x, y, label }) => {
      const newItem = { id: Date.now(), type, x, y, label };
      setItems((prev) => [...prev, newItem]);
      return { success: true, itemId: newItem.id };
    }
  });

  return (
    <div>
      {/* Canvas rendering code */}
    </div>
  );
}
```

---

## Tool Design Best Practices

1. **Explicit, Self-Contained Descriptions:**
   - LLMs rely entirely on the `description` and parameter descriptions to decide when and how to invoke a tool.
   - State constraints, valid value ranges, and side effects explicitly in the schema.

2. **Idempotency & State Integrity:**
   - When tools modify the UI or canvas state, ensure operations can handle repeat calls without crashing or corrupting state.
   - Return clear error messages if input parameters fail validation.

3. **Security & Prompt Injection Boundaries:**
   - Never directly `eval()` or unsafely interpolate tool inputs into raw DOM (`innerHTML`).
   - Treat tool arguments as untrusted user input. Validate schemas strictly.
   - For destructive actions (e.g. deletion, purchases, sending messages), return a confirmation request or require user UI verification.

---

## Debugging WebMCP Tools

- **Chrome DevTools:**  
  In Google Chrome 149+, open DevTools (`F12`) -> **Application** panel -> **WebMCP** section to inspect registered tools, parameters, and invocation history.
- **Console Inspection:**  
  You can check `window.document.modelContext` in the DevTools console to inspect currently active tool definitions.
