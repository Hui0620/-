import { Volume2 } from 'lucide-react';
import type { RecognizedGesture, AppSettings } from '../types';
import { CATEGORY_LABELS } from '../data/vocabulary';

interface ResultCardProps {
  result: RecognizedGesture | null;
  settings: AppSettings;
  onSpeak: (text: string) => void;
}

const fontSizeClass = {
  normal: 'text-3xl',
  large: 'text-4xl',
  extra: 'text-5xl',
};

const pinyinSizeClass = {
  normal: 'text-base',
  large: 'text-lg',
  extra: 'text-xl',
};

export function ResultCard({ result, settings, onSpeak }: ResultCardProps) {
  if (!result) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center ${
          settings.highContrast ? 'border-slate-800 bg-slate-50' : 'bg-slate-50'
        }`}
      >
        <p className="text-slate-400 text-lg">将手势对准摄像头</p>
        <p className="text-slate-300 text-sm mt-1">识别结果将显示在这里</p>
      </div>
    );
  }

  const { sign, confidence } = result;
  const category = CATEGORY_LABELS[sign.category];

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border transition-all animate-slide-up ${
        settings.highContrast
          ? 'bg-white border-slate-900'
          : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              {category.label}
            </span>
            <span className="text-xs text-slate-400">{Math.round(confidence * 100)}% 置信度</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(confidence * 100)}%`, backgroundColor: category.color }}
            />
          </div>
          <div className={`font-bold text-slate-800 ${fontSizeClass[settings.fontSize]}`}>
            {sign.word}
          </div>
          <div className={`text-slate-500 mt-1 ${pinyinSizeClass[settings.fontSize]}`}>
            {sign.pinyin}
          </div>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">{sign.description}</p>
        </div>
        <button
          onClick={() => onSpeak(sign.word)}
          className="shrink-0 w-11 h-11 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="朗读"
        >
          <Volume2 size={20} />
        </button>
      </div>
    </div>
  );
}
