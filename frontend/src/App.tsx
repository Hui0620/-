import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { InstallBanner } from './components/InstallBanner';
import { useSpeech } from './hooks/useSpeech';
import { Home } from './pages/Home';
import { Recognizer } from './pages/Recognizer';
import { Vocabulary } from './pages/Vocabulary';
import { VoiceToSign } from './pages/VoiceToSign';
import { Emergency } from './pages/Emergency';
import { Settings } from './pages/Settings';
import { DEFAULT_SETTINGS, type AppSettings } from './types';

const STORAGE_KEY = 'sign_language_app_settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function AppContent() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const { speak, vibrate } = useSpeech(settings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* 无痕模式 / 存储受限时写入会抛错，忽略以免影响页面 */
    }
  }, [settings]);

  return (
    <div className="flex flex-col h-full">
      <InstallBanner />
      <Routes>
        <Route path="/" element={<Home settings={settings} />} />
        <Route
          path="/recognize"
          element={<Recognizer settings={settings} onSpeak={speak} onVibrate={vibrate} />}
        />
        <Route path="/vocabulary" element={<Vocabulary settings={settings} onSpeak={speak} />} />
        <Route path="/voice-to-sign" element={<VoiceToSign settings={settings} onSpeak={speak} />} />
        <Route
          path="/emergency"
          element={<Emergency settings={settings} onSpeak={speak} onVibrate={vibrate} />}
        />
        <Route path="/settings" element={<Settings settings={settings} onChange={setSettings} />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
