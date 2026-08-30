import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

const SHORTCUT_GROUPS = [
  {
    title: 'Tools',
    items: [
      { key: 'V', desc: 'Hand / Pan Tool (Move & Zoom)' },
      { key: 'B', desc: 'Pencil Tool' },
      { key: 'E', desc: 'Eraser Tool' },
      { key: 'G', desc: 'Bucket Fill Tool' },
      { key: 'I', desc: 'Eyedropper / Color Picker' },
      { key: 'L', desc: 'Line Tool' },
      { key: 'R', desc: 'Rectangle Tool' },
      { key: 'X', desc: 'Swap Primary / Secondary Color' },
      { key: '[ / ]', desc: 'Decrease / Increase Brush Size' },
    ],
  },
  {
    title: 'Canvas & Navigation',
    items: [
      { key: 'Space + Drag', desc: 'Pan Canvas' },
      { key: '+ / -', desc: 'Zoom In / Zoom Out' },
      { key: '0', desc: 'Reset Canvas View' },
      { key: 'H', desc: 'Toggle Pixel Grid' },
      { key: 'O', desc: 'Toggle Onion Skinning' },
    ],
  },
  {
    title: 'Animation & History',
    items: [
      { key: 'Space', desc: 'Play / Pause Animation' },
      { key: ', / .', desc: 'Previous / Next Frame' },
      { key: 'Ctrl + Z', desc: 'Undo' },
      { key: 'Ctrl + Y', desc: 'Redo' },
      { key: 'Ctrl + E', desc: 'Export Sprite Sheet' },
    ],
  },
];

export const ShortcutsModal: React.FC = () => {
  const { closeModal } = useEditorStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-studio-900 border border-studio-700/80 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-800 bg-studio-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-500">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-accent-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-studio-800/40 border border-studio-700/40"
                  >
                    <span className="text-xs text-slate-300">{item.desc}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono font-semibold bg-studio-950 border border-studio-700 rounded text-accent-cyan">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
