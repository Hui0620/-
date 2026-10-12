import { useState } from 'react';
import { Search, Volume2, AlertTriangle, Heart, MessageCircle, Hand } from 'lucide-react';
import { SIGN_VOCABULARY, CATEGORY_LABELS } from '../data/vocabulary';
import type { AppSettings, Category, SignItem } from '../types';

interface VocabularyProps {
  settings: AppSettings;
  onSpeak: (text: string) => void;
}

type Filter = Category | 'all';

const filters: { key: Filter; label: string; icon: typeof AlertTriangle; color: string }[] = [
  { key: 'all', label: '全部', icon: Hand, color: '#64748b' },
  { key: 'emergency', label: '紧急求助', icon: AlertTriangle, color: '#ef4444' },
  { key: 'basic', label: '基础需求', icon: Heart, color: '#0ea5e9' },
  { key: 'social', label: '社交问候', icon: MessageCircle, color: '#22c55e' },
];

export function Vocabulary({ settings, onSpeak }: VocabularyProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SignItem | null>(null);

  const list = SIGN_VOCABULARY.filter((s) => {
    const matchesFilter = filter === 'all' || s.category === filter;
    const matchesSearch = s.word.includes(search) || s.pinyin.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-800 mb-3">手语词库</h1>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索手势..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key ? 'text-white' : 'bg-slate-50 text-slate-600'
              }`}
              style={filter === key ? { backgroundColor: color } : undefined}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {list.map((sign) => {
            const cat = CATEGORY_LABELS[sign.category];
            return (
              <button
                key={sign.id}
                onClick={() => {
                  setSelected(sign);
                  onSpeak(sign.word);
                }}
                className={`text-left p-4 rounded-2xl bg-white border transition-all active:scale-[0.98] ${
                  settings.highContrast ? 'border-slate-800' : 'border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-3xl font-bold text-slate-800"
                    style={{ fontSize: settings.fontSize === 'extra' ? '2.25rem' : settings.fontSize === 'large' ? '1.875rem' : '1.5rem' }}
                  >
                    {sign.word}
                  </span>
                  <Volume2 size={16} className="text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 mb-2">{sign.pinyin}</p>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${CATEGORY_LABELS[selected.category].color}15`,
                  color: CATEGORY_LABELS[selected.category].color,
                }}
              >
                {CATEGORY_LABELS[selected.category].label}
              </span>
              <button onClick={() => setSelected(null)} className="text-slate-400 text-sm">
                关闭
              </button>
            </div>
            <h2
              className="font-bold text-slate-800 mb-1"
              style={{ fontSize: settings.fontSize === 'extra' ? '3rem' : settings.fontSize === 'large' ? '2.5rem' : '2rem' }}
            >
              {selected.word}
            </h2>
            <p className="text-slate-500 text-lg mb-4">{selected.pinyin}</p>
            <p className="text-slate-700 leading-relaxed mb-5">{selected.description}</p>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">动作要点</p>
              <ul className="space-y-1.5">
                {selected.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onSpeak(selected.word)}
              className="mt-5 w-full py-3 bg-primary-500 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              朗读
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
