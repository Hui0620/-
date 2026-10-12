import { Type, Contrast, Volume2, Vibrate, MessageSquare, MapPin } from 'lucide-react';
import type { AppSettings, EmergencyConfig, EmergencyContact } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export function Settings({ settings, onChange }: SettingsProps) {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateEmergency = (patch: Partial<EmergencyConfig>) => {
    onChange({ ...settings, emergency: { ...settings.emergency, ...patch } });
  };

  const updateContact = (patch: Partial<EmergencyContact>) => {
    const contacts: EmergencyContact[] = [...settings.emergency.contacts];
    if (contacts.length === 0) {
      contacts.push({ id: 'primary', name: '', phone: '' });
    }
    contacts[0] = { ...contacts[0], ...patch };
    updateEmergency({ contacts });
  };

  const Toggle = ({
    label,
    icon: Icon,
    checked,
    onChange: onToggle,
  }: {
    label: string;
    icon: typeof Volume2;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          <Icon size={18} />
        </div>
        <span className="text-slate-700 font-medium text-sm">{label}</span>
      </div>
      <button
        onClick={() => onToggle(!checked)}
        className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-primary-500' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
      <h1 className="text-lg font-bold text-slate-800 mb-5">设置</h1>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">显示</h2>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Type size={18} />
            </div>
            <span className="text-slate-700 font-medium text-sm">字体大小</span>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['normal', 'large', 'extra'] as const).map((size) => (
              <button
                key={size}
                onClick={() => update('fontSize', size)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.fontSize === size ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {size === 'normal' ? '标准' : size === 'large' ? '大' : '特大'}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="高对比度模式"
          icon={Contrast}
          checked={settings.highContrast}
          onChange={(v) => update('highContrast', v)}
        />
      </section>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">反馈</h2>
        <Toggle
          label="语音朗读"
          icon={Volume2}
          checked={settings.voiceEnabled}
          onChange={(v) => update('voiceEnabled', v)}
        />
        <Toggle
          label="震动提示"
          icon={Vibrate}
          checked={settings.vibrationEnabled}
          onChange={(v) => update('vibrationEnabled', v)}
        />
        <Toggle
          label="识别后自动朗读"
          icon={MessageSquare}
          checked={settings.autoSpeak}
          onChange={(v) => update('autoSpeak', v)}
        />
      </section>

      <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">紧急求助</h2>
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm text-slate-600 block mb-1.5">联系人姓名</label>
              <input
                type="text"
                value={settings.emergency.contacts[0]?.name ?? ''}
                onChange={(e) => updateContact({ name: e.target.value })}
                placeholder="如：妈妈"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-600 block mb-1.5">手机号</label>
              <input
                type="tel"
                value={settings.emergency.contacts[0]?.phone ?? ''}
                onChange={(e) => updateContact({ phone: e.target.value })}
                placeholder="如：13800000000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1.5">默认求助信息</label>
            <textarea
              value={settings.emergency.message}
              onChange={(e) => updateEmergency({ message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1.5">
              Webhook 地址（可选，Server 酱 / 企业微信机器人 / 自建接口）
            </label>
            <input
              type="url"
              value={settings.emergency.webhookUrl}
              onChange={(e) => updateEmergency({ webhookUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin size={16} className="text-slate-400" />
              <span>求助短信附带我的定位</span>
            </div>
            <button
              onClick={() => updateEmergency({ includeLocation: !settings.emergency.includeLocation })}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settings.emergency.includeLocation ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.emergency.includeLocation ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed">
        <p>设置会自动保存在浏览器本地存储中。</p>
        <p className="mt-1">当前版本：手语即时通 v1.0.0 · 全离线演示版</p>
      </div>
    </div>
  );
}
