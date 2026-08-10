import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ThemePreset, AccentColor, BorderRadiusPreset, CardStylePreset, FontFamilyPreset, AmbientEffectPreset } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import {
  Palette,
  X,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Flame,
  Zap,
  Check,
  RotateCcw,
  Sliders,
  LayoutGrid,
  Type,
  Sparkle
} from 'lucide-react';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { theme, updateTheme, resetTheme, accentClasses } = useTheme();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const presets: { id: ThemePreset; name: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dark', name: 'Dark Slate', icon: <Moon className="w-4 h-4 text-blue-400" />, desc: 'Modern enterprise dark mode' },
    { id: 'light', name: 'Light Pristine', icon: <Sun className="w-4 h-4 text-amber-400" />, desc: 'Clean, high-contrast light mode' },
    { id: 'glassmorphism', name: 'Glassmorphism', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, desc: 'Translucent cards & deep blur' },
    { id: 'neon', name: 'Cyber Neon', icon: <Zap className="w-4 h-4 text-fuchsia-400" />, desc: 'Obsidian dark with glowing accents' },
    { id: 'amoled', name: 'Pure AMOLED', icon: <Flame className="w-4 h-4 text-rose-400" />, desc: 'True #000000 black background' },
    { id: 'system', name: 'System Sync', icon: <Laptop className="w-4 h-4 text-slate-400" />, desc: 'Syncs with OS preferences' },
  ];

  const accentColors: { id: AccentColor; name: string; bg: string }[] = [
    { id: 'blue', name: 'Royal Blue', bg: 'bg-blue-500' },
    { id: 'indigo', name: 'Electric Indigo', bg: 'bg-indigo-500' },
    { id: 'emerald', name: 'Mint Emerald', bg: 'bg-emerald-500' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-500' },
    { id: 'rose', name: 'Sunset Rose', bg: 'bg-rose-500' },
    { id: 'violet', name: 'Deep Violet', bg: 'bg-violet-500' },
    { id: 'cyan', name: 'Cyber Cyan', bg: 'bg-cyan-500' },
  ];

  const cardStyles: { id: CardStylePreset; name: string; desc: string }[] = [
    { id: 'glass', name: 'Glass Backdrop', desc: 'Subtle backdrop blur and semi-transparent borders' },
    { id: 'border-glow', name: 'Border Glow', desc: 'Glowing hover borders using accent color' },
    { id: 'solid', name: 'Solid Enterprise', desc: 'Opaque dark container card layout' },
    { id: 'minimal', name: 'Minimal Frameless', desc: 'Frameless subtle dividers' },
  ];

  const ambientEffects: { id: AmbientEffectPreset; name: string }[] = [
    { id: 'blobs', name: 'Gradient Blobs' },
    { id: 'aurora', name: 'Aurora Waves' },
    { id: 'particles', name: 'Floating Particles' },
    { id: 'grid', name: 'Subtle Tech Grid' },
    { id: 'none', name: 'Disabled' },
  ];

  const fontFamilies: { id: FontFamilyPreset; name: string; sample: string }[] = [
    { id: 'sans', name: 'Plus Jakarta Sans', sample: 'Modern, clean & scannable' },
    { id: 'mono', name: 'JetBrains Code', sample: 'Monospaced engineering font' },
    { id: 'serif', name: 'Playfair Display', sample: 'Editorial serif headings' },
  ];

  const handleSave = () => {
    showToast({
      title: 'Theme Preferences Saved',
      description: `Applied ${theme.preset} theme with ${theme.accentColor} accent.`,
      type: 'success'
    });
    onClose();
  };

  return (
    <div id="theme-customizer-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="theme-customizer-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden my-6 transform transition-all flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${accentClasses.bg} text-white shadow-lg`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Theme & UI Customization Studio</h3>
              <p className="text-xs text-slate-400">Personalize color palettes, card styling, typography and motion effects</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Live Preview Card */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Real-Time Card Preview
            </label>

            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              theme.cardStyle === 'border-glow'
                ? `${accentClasses.border} shadow-xl ${accentClasses.glow}`
                : theme.cardStyle === 'glass'
                ? 'bg-slate-900/60 backdrop-blur-md border-slate-800'
                : theme.cardStyle === 'solid'
                ? 'bg-slate-950 border-slate-800'
                : 'bg-transparent border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${accentClasses.bg}`} />
                  <span className="text-sm font-bold text-white">Cloud Microservices Mesh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status="DEPLOYED" size="sm" />
                  <ApprovalBadge status="APPROVED" size="sm" />
                </div>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Live interactive theme preview showing custom accent colors, badge styling, and card borders.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-mono">94% test coverage</span>
                <button className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white ${accentClasses.bg} ${accentClasses.bgHover} shadow-md`}>
                  Primary Button Action
                </button>
              </div>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" /> Select Theme Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => updateTheme({ preset: p.id })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    theme.preset === p.id
                      ? `bg-slate-800 ${accentClasses.border} ring-2 ${accentClasses.ring} shadow-md`
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>
                    {theme.preset === p.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" /> Accent Color Palette
            </label>
            <div className="flex flex-wrap gap-2.5">
              {accentColors.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateTheme({ accentColor: c.id })}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    theme.accentColor === c.id
                      ? 'bg-slate-800 border-white text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                  <span>{c.name}</span>
                  {theme.accentColor === c.id && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Motion & Animation Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Motion & Interactive FX Controls
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Master Motion Switch */}
              <button
                type="button"
                onClick={() => updateTheme({ enableAnimations: theme.enableAnimations === false })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  theme.enableAnimations !== false
                    ? 'bg-blue-950/40 border-blue-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Enable Motion Effects</div>
                  <div className="text-[10px] text-slate-500">60 FPS transitions & micro-interactions</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme.enableAnimations !== false ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${theme.enableAnimations !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Floating Cards */}
              <button
                type="button"
                onClick={() => updateTheme({ floatingCards: theme.floatingCards === false })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  theme.floatingCards !== false
                    ? 'bg-purple-950/40 border-purple-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Floating Cards Idle Loop</div>
                  <div className="text-[10px] text-slate-500">Subtle vertical hover float animation</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme.floatingCards !== false ? 'bg-purple-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${theme.floatingCards !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* 3D Parallax Tilt */}
              <button
                type="button"
                onClick={() => updateTheme({ parallax3DTilt: theme.parallax3DTilt === false })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  theme.parallax3DTilt !== false
                    ? 'bg-amber-950/40 border-amber-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">3D Parallax Tilt</div>
                  <div className="text-[10px] text-slate-500">Tilt cards dynamically on mouse cursor hover</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme.parallax3DTilt !== false ? 'bg-amber-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${theme.parallax3DTilt !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Spotlight Glow */}
              <button
                type="button"
                onClick={() => updateTheme({ spotlightFollow: theme.spotlightFollow === false })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  theme.spotlightFollow !== false
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Mouse Spotlight Follow</div>
                  <div className="text-[10px] text-slate-500">Radial cursor tracking light effect</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme.spotlightFollow !== false ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${theme.spotlightFollow !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Card Style & Border Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" /> Card Style
              </label>
              <div className="space-y-2">
                {cardStyles.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => updateTheme({ cardStyle: cs.id })}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      theme.cardStyle === cs.id
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{cs.name}</div>
                      <div className="text-[10px] text-slate-500">{cs.desc}</div>
                    </div>
                    {theme.cardStyle === cs.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkle className="w-3.5 h-3.5 text-amber-400" /> Ambient FX Background
              </label>
              <div className="space-y-2">
                {ambientEffects.map(ae => (
                  <button
                    key={ae.id}
                    onClick={() => updateTheme({ ambientEffect: ae.id })}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      theme.ambientEffect === ae.id
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200">{ae.name}</span>
                    {theme.ambientEffect === ae.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={resetTheme}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${accentClasses.bg} ${accentClasses.bgHover} shadow-lg cursor-pointer transition-all`}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
