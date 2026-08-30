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

function StudioWorkspace() {
  const { isLoaded, initializeProject } = useProjectStore();
  const { activeModal } = useEditorStore();

  // Initialize Project from IndexedDB on startup
  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

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

      // Export
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        editor.openModal('export');
        return;
      }

      // Tools
      if (e.key === 'v' || e.key === 'V') editor.setTool('pan');
      if (e.key === 'b' || e.key === 'B') editor.setTool('pencil');
      if (e.key === 'e' || e.key === 'E') editor.setTool('eraser');
      if (e.key === 'g' || e.key === 'G') editor.setTool('bucket');
      if (e.key === 'i' || e.key === 'I') editor.setTool('eyedropper');
      if (e.key === 'l' || e.key === 'L') editor.setTool('line');
      if (e.key === 'r' || e.key === 'R') editor.setTool('rectangle');
      if (e.key === 'x' || e.key === 'X') editor.swapColors();

      // Brush size
      if (e.key === '[') editor.setBrushSize(Math.max(1, editor.brushSize - 1));
      if (e.key === ']') editor.setBrushSize(Math.min(4, editor.brushSize + 1));

      // View & Controls
      if (e.key === 'h' || e.key === 'H') editor.toggleGrid();
      if (e.key === 'o' || e.key === 'O') editor.toggleOnionSkinning();
      if (e.key === '0') editor.resetView();
      if (e.key === '=' || e.key === '+') editor.setZoom((z) => Math.min(64, z + 4));
      if (e.key === '-' || e.key === '_') editor.setZoom((z) => Math.max(4, z - 4));

      // Animation playback & frame step
      if (e.code === 'Space') {
        e.preventDefault();
        const activeState = project.getActiveState();
        playback.togglePlay(activeState?.frames.length || 0);
      }

      // Frame stepping with , / . / ArrowLeft / ArrowRight
      if (
        (e.key === ',' || e.key === '<' || (!e.shiftKey && e.key === 'ArrowLeft'))
      ) {
        e.preventDefault();
        const state = project.getActiveState();
        if (state) {
          const newIdx = Math.max(0, project.project.activeFrameIndex - 1);
          project.selectFrame(newIdx);
          playback.stepFrame(-1, state.frames.length);
        }
      }
      if (
        (e.key === '.' || e.key === '>' || (!e.shiftKey && e.key === 'ArrowRight'))
      ) {
        e.preventDefault();
        const state = project.getActiveState();
        if (state) {
          const newIdx = Math.min(state.frames.length - 1, project.project.activeFrameIndex + 1);
          project.selectFrame(newIdx);
          playback.stepFrame(1, state.frames.length);
        }
      }

      // Pan shortcut scrolling with Shift + Arrows
      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        editor.setPan(editor.panX + 30, editor.panY);
      }
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        editor.setPan(editor.panX - 30, editor.panY);
      }
      if (e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        editor.setPan(editor.panX, editor.panY + 30);
      }
      if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        editor.setPan(editor.panX, editor.panY - 30);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-studio-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Game Asset Studio...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-studio-950 text-slate-100 font-sans">
      {/* 1. Header */}
      <Header />

      {/* 2. Main Studio Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Sidebar */}
        <Sidebar />

        {/* Center Canvas Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-studio-950">
          {/* Floating Left Toolbar */}
          <div className="absolute top-4 left-4 z-20">
            <CanvasToolbar />
          </div>

          {/* Floating Top Controls (Zoom, Brush, Grid) */}
          <div className="absolute top-4 right-4 z-20">
            <CanvasControls />
          </div>

          {/* Center Pixel Canvas */}
          <PixelCanvas />

          {/* Bottom Timeline Strip */}
          <AnimationTimeline />
        </main>

        {/* Right Sidebar: Preview & Palette Panel */}
        <aside className="w-72 bg-studio-900/90 border-l border-studio-800 p-3 flex flex-col gap-3 overflow-y-auto z-20 backdrop-blur-md shrink-0 scrollbar-thin">
          <AnimationPreview />
          <PalettePanel />
        </aside>
      </div>

      {/* 3. Bottom Status Bar */}
      <Statusbar />

      {/* 4. Modals */}
      {activeModal === 'new-asset' && <NewAssetModal />}
      {activeModal === 'resize' && <ResizeSpriteModal />}
      {activeModal === 'shortcuts' && <ShortcutsModal />}
      {activeModal === 'export' && <ExportModal />}
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
