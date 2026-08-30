import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

const SHORTCUT_GROUPS = [
  {
    title: 'Tools & Drawing',
    items: [
      { key: 'V', desc: 'Hand / Pan Tool' },
      { key: 'B', desc: 'Pencil Tool' },
      { key: 'E', desc: 'Eraser Tool' },
      { key: 'G', desc: 'Paint Bucket Fill' },
      { key: 'I', desc: 'Color Picker (Eyedropper)' },
      { key: 'L', desc: 'Line Tool' },
      { key: 'R', desc: 'Rectangle Tool' },
      { key: 'X', desc: 'Swap Primary / Secondary Color' },
      { key: '[ / ]', desc: 'Decrease / Increase Brush Size' },
    ],
  },
  {
    title: 'Canvas Navigation',
    items: [
      { key: 'Space + Drag', desc: 'Pan Viewport' },
      { key: '+ / -', desc: 'Zoom In / Out' },
      { key: 'Mouse Wheel', desc: 'Zoom Canvas' },
      { key: '0', desc: 'Reset View & Center' },
      { key: 'H', desc: 'Toggle Pixel Grid' },
      { key: 'O', desc: 'Toggle Onion Skinning' },
    ],
  },
  {
    title: 'Animation & History',
    items: [
      { key: 'Space', desc: 'Play / Pause Animation' },
      { key: '← / →', desc: 'Previous / Next Frame' },
      { key: ', / .', desc: 'Step Frame Back / Forward' },
      { key: 'Ctrl + Z', desc: 'Undo' },
      { key: 'Ctrl + Y', desc: 'Redo' },
      { key: 'Ctrl + E', desc: 'Export Sprite Sheet' },
    ],
  },
];

export const ShortcutsModal: React.FC = () => {
  const { closeModal } = useEditorStore();

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-studio-900 border border-studio-750 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-800 bg-studio-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/15 border border-accent-500/30 text-accent-500">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Keyboard Shortcuts Guide</h2>
              <p className="text-xs text-slate-400">Quick keys for studio productivity</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 60 FPS hardware accelerated scroll container */}
        <div
          className="p-6 overflow-y-auto space-y-6 overscroll-contain scrollbar-thin"
          style={{ contain: 'content', transform: 'translateZ(0)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h3 className="text-xs font-semibold text-accent-500 uppercase tracking-wider border-b border-studio-800 pb-1.5">
                  {group.title}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-studio-850 border border-studio-750/70"
                    >
                      <span className="text-xs text-slate-300 pr-2">{item.desc}</span>
                      <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-studio-950 border border-studio-700 rounded text-accent-cyan shrink-0">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-studio-800 bg-studio-850/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-studio-950 border border-studio-700 rounded text-slate-300">Esc</kbd> or click outside to close</span>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-white font-medium text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
