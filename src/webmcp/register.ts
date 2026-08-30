import { WebMcpTool } from './types';
import { queryTools } from './tools/queryTools';
import { assetTools } from './tools/assetTools';
import { animationTools } from './tools/animationTools';
import { frameTools } from './tools/frameTools';
import { pixelTools } from './tools/pixelTools';
import { paletteTools } from './tools/paletteTools';
import { exportTools } from './tools/exportTools';

export const ALL_WEBMCP_TOOLS: WebMcpTool[] = [
  ...queryTools,
  ...assetTools,
  ...animationTools,
  ...frameTools,
  ...pixelTools,
  ...paletteTools,
  ...exportTools,
];

/**
 * Returns all WebMCP tool definitions registered by Game Asset Studio.
 */
export function getAllWebMcpTools(): WebMcpTool[] {
  return ALL_WEBMCP_TOOLS;
}

/**
 * Registers all Game Asset Studio tools with the browser's native WebMCP modelContext.
 * 
 * - Feature-detected via `document.modelContext`.
 * - Uses AbortController signal so tools can be cleanly unregistered on lifecycle teardown / HMR.
 * - Returns a cleanup function `() => void` or `null` if WebMCP is not supported in the current environment.
 */
export function registerWebMcpTools(): (() => void) | null {
  if (typeof document === 'undefined' || !('modelContext' in document) || !document.modelContext) {
    return null; // WebMCP not available in this browser context — app continues normally
  }

  const controller = new AbortController();

  for (const tool of ALL_WEBMCP_TOOLS) {
    try {
      document.modelContext.registerTool(tool, { signal: controller.signal });
    } catch (err) {
      console.warn(`[WebMCP] Failed to register tool "${tool.name}":`, err);
    }
  }

  console.info(`[WebMCP] Successfully registered ${ALL_WEBMCP_TOOLS.length} studio tools with document.modelContext`);

  return () => {
    try {
      controller.abort();
      console.info('[WebMCP] Unregistered all studio tools');
    } catch (err) {
      console.warn('[WebMCP] Error aborting tool registration signal:', err);
    }
  };
}
