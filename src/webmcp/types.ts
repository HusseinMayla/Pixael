/**
 * WebMCP Types & Protocols for Game Asset Studio
 * Designed according to Chrome's native document.modelContext WebMCP specification.
 */

export type ToolResult =
  | { status: 'success'; [key: string]: unknown }
  | { status: 'error'; message: string };

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
}

export interface WebMcpToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: WebMcpToolInputSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (input: any) => Promise<string>;
}

/**
 * Compact Run-Length Encoded (RLE) pixel payload.
 * Index 0 is always transparent / empty background color ("").
 * pixelsRle is flat array of pairs [colorIndex, runLength, colorIndex, runLength, ...]
 * in row-major order (top-left to bottom-right).
 */
export interface FramePixelsPayload {
  width: number;
  height: number;
  palette: string[]; // hex colors, index-aligned with pixel color indices (index 0 = "")
  pixelsRle: number[]; // flat array of [colorIndex, runLength, ...]
}

declare global {
  interface ModelContext {
    registerTool: (
      tool: WebMcpTool,
      options?: { signal?: AbortSignal }
    ) => Promise<void> | void;
    getTools?: () => Promise<WebMcpTool[]> | WebMcpTool[];
    unregisterTool?: (toolName: string) => Promise<void> | void;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
