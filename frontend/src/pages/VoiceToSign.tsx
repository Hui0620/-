import { useEffect, useMemo, useState } from 'react';
import { Mic, MicOff, Search, Volume2, Keyboard, Hand } from 'lucide-react';
import { SIGN_VOCABULARY, CATEGORY_LABELS } from '../data/vocabulary';
import type { AppSettings, SignItem } from '../types';

interface VoiceToSignProps {
  settings: AppSettings;
  onSpeak: (text: string) => void;
}

export function VoiceToSign({ settings, onSpeak }: VoiceToSignProps) {
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [selected, setSelected] = useState<SignItem | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const matches = useMemo(() => {
    const term = input.trim();
    if (!term) return [];
    return SIGN_VOCABULARY.filter(
      (s) => s.word.includes(term) || s.pinyin.includes(term.toLowerCase()),
    );
  }, [input]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return;
    }
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof SpeechRecognition;
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setRecognition(rec);
  }, []);

  const toggleListen = () => {
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      setInput('');
      setListening(true);
      recognition.start();
    }
  };

  const quickPhrases = ['你好', '谢谢', '我需要帮助', '我饿了', '我想喝水', '不舒服'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-800 mb-3">语音转手语</h1>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入文字或点击麦克风说话..."
            className="w-full pl-10 pr-12 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <button
            onClick={toggleListen}
            disabled={!recognition}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              listening ? 'bg-alert-100 text-alert-600 animate-pulse' : 'bg-primary-50 text-primary-600'
            } ${!recognition ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={listening ? '停止录音' : '语音输入'}
          >
            {listening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickPhrases.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-medium active:scale-95 transition-transform"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mb-4">
              <Keyboard size={28} />
            </div>
            <p className="text-slate-500">输入文字或语音，查看对应手语手势</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">找到 {matches.length} 个匹配手势</p>
            {matches.map((sign) => {
              const cat = CATEGORY_LABELS[sign.category];
              return (
                <button
                  key={sign.id}
                  onClick={() => {
                    setSelected(sign);
                    onSpeak(sign.word);
                  }}
                  className={`w-full text-left p-4 rounded-2xl bg-white border transition-all active:scale-[0.98] ${
                    settings.highContrast ? 'border-slate-800' : 'border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                        <Hand size={20} />
                      </div>
                      <div>
                        <p
                          className="font-bold text-slate-800"
                          style={{
                            fontSize: settings.fontSize === 'extra' ? '1.75rem' : settings.fontSize === 'large' ? '1.5rem' : '1.25rem',
                          }}
                        >
                          {sign.word}
                        </p>
                        <p className="text-xs text-slate-400">{sign.pinyin}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed pl-[52px]">{sign.description}</p>
                </button>
              );
            })}
          </div>
        )}
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
              style={{
                fontSize: settings.fontSize === 'extra' ? '3rem' : settings.fontSize === 'large' ? '2.5rem' : '2rem',
              }}
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
              className="mt-5 w-full py-3 bg-primary-500 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Volume2 size={18} />
              朗读
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
