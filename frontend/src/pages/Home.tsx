import { ScanLine, BookOpen, AlertTriangle, MessageSquare, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstallCard } from '../components/InstallCard';
import type { AppSettings } from '../types';

interface HomeProps {
  settings: AppSettings;
}

export function Home({ settings }: HomeProps) {
  const fs = settings.fontSize;
  const titleClass = fs === 'extra' ? 'text-3xl' : fs === 'large' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className={`font-bold text-slate-800 ${titleClass}`}>手语即时通</h1>
            <p className="text-slate-500 text-sm">全离线中文手语识别助手</p>
          </div>
        </div>
      </header>

      <section
        className={`rounded-2xl p-5 mb-6 ${
          settings.highContrast ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
        }`}
      >
        <h2 className="text-xl font-bold mb-2">无障碍沟通，从这里开始</h2>
        <p className="text-primary-50 text-sm leading-relaxed opacity-95">
          打开摄像头，用手势表达需求。识别结果支持大字显示、语音朗读与震动反馈。
        </p>
        <Link
          to="/recognize"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <ScanLine size={18} />
          开始识别
        </Link>
      </section>

      <nav className="grid grid-cols-2 gap-4">
        <Link
          to="/recognize"
          className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
            <ScanLine size={20} />
          </div>
          <span className="font-bold text-slate-800">实时识别</span>
          <span className="text-xs text-slate-400 mt-1">摄像头即时翻译</span>
        </Link>

        <Link
          to="/voice-to-sign"
          className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-warm-50 text-warm-500 flex items-center justify-center mb-3">
            <Mic size={20} />
          </div>
          <span className="font-bold text-slate-800">语音转手语</span>
          <span className="text-xs text-slate-400 mt-1">说话查对应手势</span>
        </Link>

        <Link
          to="/vocabulary"
          className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-safe-50 text-safe-600 flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <span className="font-bold text-slate-800">手语词库</span>
          <span className="text-xs text-slate-400 mt-1">学习标准手势</span>
        </Link>

        <Link
          to="/emergency"
          className="flex flex-col items-start p-4 rounded-2xl bg-white border border-alert-50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-alert-50 text-alert-600 flex items-center justify-center mb-3">
            <AlertTriangle size={20} />
          </div>
          <span className="font-bold text-slate-800">紧急求助</span>
          <span className="text-xs text-slate-400 mt-1">一键发送求助信息</span>
        </Link>
      </nav>

      <InstallCard />
    </div>
  );
}
