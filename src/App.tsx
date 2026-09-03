import { useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { useEditorStore } from './store/editorStore';
import { usePlaybackStore } from './store/playbackStore';
import { ToastProvider } from './components/ui/Toast';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Statusbar } from './components/layout/Statusbar';
import { PixelCanvas } from './components/canvas/PixelCanvas';
import { CanvasToolbar } from './components/canvas/CanvasToolbar';
import { CanvasControls } from './components/canvas/CanvasControls';
import { PalettePanel } from './components/palette/PalettePanel';
import { AnimationPreview } from './components/preview/AnimationPreview';
import { AnimationTimeline } from './components/timeline/AnimationTimeline';
import { NewAssetModal } from './components/modals/NewAssetModal';
import { ResizeSpriteModal } from './components/modals/ResizeSpriteModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ExportModal } from './components/preview/ExportModal';
import { ImportModal } from './components/modals/ImportModal';
import { registerWebMcpTools } from './webmcp';
import { trackMilestone } from './utils/telemetry';

function StudioWorkspace() {
  const { isLoaded, initializeProject } = useProjectStore();
  const {
    activeModal,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useEditorStore();

  // Initialize Project from IndexedDB on startup
  useEffect(() => {
    initializeProject();
    const isReload = window.performance?.navigation?.type === 1 || 
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'reload';
    
    trackMilestone(isReload ? 'APP_REFRESHED' : 'APP_OPENED');
  }, [initializeProject]);

  // Register WebMCP Tools with browser modelContext on mount
  useEffect(() => {
    if (!isLoaded) return;
    const unregister = registerWebMcpTools();
    return () => {
      unregister?.();
    };
  }, [isLoaded]);

  // Auto-open sidebars when transitioning to desktop breakpoints
  useEffect(() => {
    let wasLg = window.innerWidth >= 1024;
    let wasXl = window.innerWidth >= 1280;

    const handleResize = () => {
      const isLg = window.innerWidth >= 1024;
      const isXl = window.innerWidth >= 1280;

      const store = useEditorStore.getState();
      if (isLg && (!wasLg || !store.isLeftSidebarOpen)) {
        store.toggleLeftSidebar(true);
      }
      if (isXl && (!wasXl || !store.isRightSidebarOpen)) {
        store.toggleRightSidebar(true);
      }

      wasLg = isLg;
      wasXl = isXl;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Drag & Drop Handler for images and JSON files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
        const isJson = file.type === 'application/json' || file.name.endsWith('.json');
        if (isImage || isJson) {
          useEditorStore.getState().setPendingImportFile(file);
          useEditorStore.getState().openModal('import');
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Global Keyboard Shortcuts (Static listener with zero-lag store access)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys if focused on text input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        if (e.key === 'Escape') useEditorStore.getState().closeModal();
        return;
      }

      const editor = useEditorStore.getState();
      const project = useProjectStore.getState();
      const playback = usePlaybackStore.getState();

      // Modals
      if (e.key === 'Escape') {
        editor.closeModal();
        return;
      }

      // History
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        project.undo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        project.redo();
        return;
      }

      // Export & Import shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        editor.openModal('export');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        editor.openModal('import');
        return;
      }

      // Tool selection shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          editor.setTool('pan');
          break;
        case 'b':
          editor.setTool('pencil');
          break;
        case 'e':
          editor.setTool('eraser');
          break;
        case 'g':
          editor.setTool('bucket');
          break;
        case 'i':
          editor.setTool('eyedropper');
          break;
        case 'l':
          editor.setTool('line');
          break;
        case 'r':
          editor.setTool('rectangle');
          break;
        case 'x':
          editor.swapColors();
          break;
        case 'h':
          editor.toggleGrid();
          break;
        case 'o':
          editor.toggleOnionSkinning();
          break;
        case '[':
          editor.setBrushSize(Math.max(1, editor.brushSize - 1));
          break;
        case ']':
          editor.setBrushSize(Math.min(4, editor.brushSize + 1));
          break;
        case ' ': {
          e.preventDefault();
          const activeState = project.getActiveState();
          playback.togglePlay(activeState?.frames.length || 0);
          break;
        }
        case ',':
        case '<': {
          e.preventDefault();
          const state = project.getActiveState();
          if (state) {
            const nextIdx = Math.max(0, project.project.activeFrameIndex - 1);
            project.selectFrame(nextIdx);
            playback.stepFrame(-1, state.frames.length);
          }
          break;
        }
        case '.':
        case '>': {
          e.preventDefault();
          const state = project.getActiveState();
          if (state) {
            const nextIdx = Math.min(state.frames.length - 1, project.project.activeFrameIndex + 1);
            project.selectFrame(nextIdx);
            playback.stepFrame(1, state.frames.length);
          }
          break;
        }
        case '+':
        case '=':
          editor.setZoom((z) => Math.min(64, z + 4));
          break;
        case '-':
        case '_':
          editor.setZoom((z) => Math.max(4, z - 4));
          break;
        case '0':
          editor.resetView();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-studio-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Sprites...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-studio-950 text-slate-100 font-sans">
      {/* 1. Header */}
      <Header />

      {/* 2. Main Studio Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Left Drawer Backdrop */}
        {isLeftSidebarOpen && (
          <div
            onClick={() => toggleLeftSidebar(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
          />
        )}

        {/* Mobile Left Drawer Container */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-studio-900 border-r border-studio-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
            isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Desktop Left Sidebar (Docked) */}
        {isLeftSidebarOpen && (
          <div className="hidden lg:flex w-64 shrink-0 h-full border-r border-studio-800">
            <Sidebar />
          </div>
        )}

        {/* Center Canvas Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-studio-950 min-w-0">
          {/* Floating Left Toolbar */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[31]">
            <CanvasToolbar />
          </div>

          {/* Floating Top Controls (Zoom, Brush, Grid) */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[31]">
            <CanvasControls />
          </div>

          {/* Center Pixel Canvas */}
          <PixelCanvas />

          {/* Bottom Timeline Strip */}
          <AnimationTimeline />
        </main>

        {/* Mobile/Tablet Right Drawer Backdrop */}
        {isRightSidebarOpen && (
          <div
            onClick={() => toggleRightSidebar(false)}
            className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm animate-in fade-in duration-200"
          />
        )}

        {/* Mobile/Tablet Right Drawer Container */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] bg-studio-900 border-l border-studio-800 shadow-2xl p-3 flex flex-col gap-3 overflow-y-auto transition-transform duration-300 ease-in-out xl:hidden scrollbar-thin ${
            isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <AnimationPreview />
          <PalettePanel />
        </div>

        {/* Desktop Right Sidebar: Preview & Palette Panel (Docked) */}
        {isRightSidebarOpen && (
          <aside className="hidden xl:flex w-72 bg-studio-900/90 border-l border-studio-800 p-3 flex-col gap-3 overflow-y-auto z-20 backdrop-blur-md shrink-0 scrollbar-thin">
            <AnimationPreview />
            <PalettePanel />
          </aside>
        )}
      </div>

      {/* 3. Bottom Status Bar */}
      <Statusbar />

      {/* 4. Modals */}
      {activeModal === 'new-asset' && <NewAssetModal />}
      {activeModal === 'resize' && <ResizeSpriteModal />}
      {activeModal === 'shortcuts' && <ShortcutsModal />}
      {activeModal === 'export' && <ExportModal />}
      {activeModal === 'import' && <ImportModal />}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <StudioWorkspace />
    </ToastProvider>
  );
}

export default App;
