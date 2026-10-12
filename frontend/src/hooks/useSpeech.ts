import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings } from '../types';

export function useSpeech(settings: AppSettings) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 部分手机浏览器 / 应用内 WebView 不提供语音合成接口，不能直接调用
    const synth = window.speechSynthesis;
    if (!synth) return;
    synthRef.current = synth;

    const loadVoices = () => {
      try {
        const available = synth.getVoices();
        if (available.length) setVoices(available);
      } catch {
        /* 某些浏览器读取语音列表会抛错，忽略 */
      }
    };

    loadVoices();
    try {
      synth.addEventListener('voiceschanged', loadVoices);
    } catch {
      /* 忽略不支持事件监听的实现 */
    }
    return () => {
      try {
        synth.removeEventListener('voiceschanged', loadVoices);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!settings.voiceEnabled || !synthRef.current) return;
      try {
        const synth = synthRef.current;
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 0.95;
        utter.pitch = 1.05;
        // Prefer a Chinese female voice if available
        const zhVoices = voices.filter((v) => v.lang.startsWith('zh'));
        const femaleVoice = zhVoices.find(
          (v) => v.name.includes('Female') || v.name.includes('女'),
        );
        utter.voice = femaleVoice || zhVoices[0] || voices[0] || null;
        synth.speak(utter);
      } catch {
        /* 语音合成不可用时静默跳过，不影响页面 */
      }
    },
    [settings.voiceEnabled, voices],
  );

  const vibrate = useCallback(
    (pattern: number | number[] = 80) => {
      if (!settings.vibrationEnabled || typeof navigator === 'undefined') return;
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
    [settings.vibrationEnabled],
  );

  const feedback = useCallback(
    (text: string) => {
      speak(text);
      vibrate([60, 40, 60]);
    },
    [speak, vibrate],
  );

  return { speak, vibrate, feedback, voices };
}
