import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Power, History } from 'lucide-react';
import type { Results } from '@mediapipe/hands';
import type { AppSettings, RecognizedGesture } from '../types';
import { useMediaPipe, toHandLandmarks } from '../hooks/useMediaPipe';
import { classifyGesture, GestureSmoother } from '../utils/gestureEngine';
import { VOCABULARY_BY_ID } from '../data/vocabulary';
import { GestureCanvas } from '../components/GestureCanvas';
import { ResultCard } from '../components/ResultCard';

interface RecognizerProps {
  settings: AppSettings;
  onSpeak: (text: string) => void;
  onVibrate: (pattern?: number | number[]) => void;
}

export function Recognizer({ settings, onSpeak, onVibrate }: RecognizerProps) {
  const [active, setActive] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [recognized, setRecognized] = useState<RecognizedGesture | null>(null);
  const smootherRef = useRef(new GestureSmoother(8));
  const lastSpokenRef = useRef<string>('');
  const [history, setHistory] = useState<RecognizedGesture[]>([]);
  const { videoRef, error } = useMediaPipe({
    onResults: useCallback(
      (r: Results) => {
        setResults(r);
        const landmarks = toHandLandmarks(r);
        const raw = classifyGesture(landmarks);
        const stableId = smootherRef.current.update(raw?.sign.id ?? null);
        const stable: RecognizedGesture | null = stableId
          ? { sign: VOCABULARY_BY_ID[stableId], confidence: 1, source: 'rule' }
          : null;
        setRecognized(stable);
      },
      [],
    ),
    enabled: active,
    resolution: settings.resolution,
    sensitivity: settings.sensitivity,
  });

  // Auto-speak and update history when recognition stabilizes
  useEffect(() => {
    if (!recognized) return;
    if (recognized.sign.word !== lastSpokenRef.current) {
      setHistory((prev) => {
        const next = [recognized, ...prev.filter((h) => h.sign.id !== recognized.sign.id)];
        return next.slice(0, 8);
      });
      if (settings.autoSpeak) {
        onSpeak(recognized.sign.word);
      }
      onVibrate([50, 30, 50]);
      lastSpokenRef.current = recognized.sign.word;
    }
  }, [recognized, settings.autoSpeak, onSpeak, onVibrate]);

  const toggle = () => {
    if (active) {
      setActive(false);
      setResults(null);
      setRecognized(null);
      smootherRef.current.reset();
      lastSpokenRef.current = '';
    } else {
      setActive(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">实时手语识别</h1>
        <div className="flex items-center gap-2">
          {active && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe-50 text-safe-600 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-safe-500 animate-pulse" />
              识别中
            </span>
          )}
          <button
            onClick={toggle}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              active ? 'bg-alert-100 text-alert-600' : 'bg-primary-500 text-white'
            }`}
            aria-label={active ? '停止识别' : '开始识别'}
          >
            {active ? <Power size={18} /> : <Camera size={18} />}
          </button>
        </div>
      </div>

      <div className="relative shrink-0 bg-black aspect-[4/3] overflow-hidden">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${active ? 'opacity-100' : 'opacity-0'}`}
          playsInline
          muted
        />
        {active && <GestureCanvas results={results} isMirrored />}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
            <Camera size={48} className="mb-3 opacity-60" />
            <p className="text-lg font-medium">摄像头已关闭</p>
            <p className="text-sm opacity-70 mt-1">点击右上角按钮开始识别</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center">
            <div>
              <p className="text-lg font-medium mb-2">无法启动摄像头</p>
              <p className="text-sm opacity-80">{error}</p>
              <p className="text-xs opacity-60 mt-3">请检查浏览器权限设置，并使用 HTTPS 或 localhost 访问</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
        <ResultCard result={recognized} settings={settings} onSpeak={onSpeak} />

        {history.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-sm">
              <History size={16} />
              <span>最近识别</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {history.map((h, i) => (
                <button
                  key={`${h.sign.id}-${i}`}
                  onClick={() => onSpeak(h.sign.word)}
                  className="shrink-0 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-sm font-medium text-slate-700 active:scale-95 transition-transform"
                >
                  {h.sign.word}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
            {settings.voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            <span>多模态反馈</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {settings.voiceEnabled ? '已开启语音朗读' : '语音朗读已关闭'}，
            {settings.vibrationEnabled ? '已开启震动提示' : '震动提示已关闭'}。
            可在设置中调整。
          </p>
        </div>
      </div>
    </div>
  );
}
