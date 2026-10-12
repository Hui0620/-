import { useState } from 'react';
import { AlertTriangle, Phone, MessageSquare, Send, User, MapPin } from 'lucide-react';
import type { AppSettings } from '../types';
import {
  callPhone,
  sendSms,
  buildSmsBody,
  getLocation,
  isMobileDevice,
  copyText,
  notifyWebhook,
} from '../utils/emergencyActions';

interface EmergencyProps {
  settings: AppSettings;
  onSpeak: (text: string) => void;
  onVibrate: (pattern?: number | number[]) => void;
}

const QUICK_MESSAGES = [
  '我遇到紧急情况，请快来帮我。',
  '我现在身体不舒服，需要去医院。',
  '我迷路了，能来接我吗？',
  '我需要帮助，请和我联系。',
];

export function Emergency({ settings, onSpeak, onVibrate }: EmergencyProps) {
  const primary = settings.emergency.contacts[0];
  const contactName = primary?.name?.trim() || '紧急联系人';
  const contactPhone = primary?.phone?.trim() || '';
  const [message, setMessage] = useState(settings.emergency.message);
  const [sent, setSent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState('');

  const canSend = contactPhone.length > 0;
  const mobile = isMobileDevice();

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(''), 4000);
  };

  const doSend = async (text: string) => {
    onVibrate([100, 50, 100, 50, 200]);
    onSpeak(text);

    let coord = null;
    if (settings.emergency.includeLocation) {
      setLocating(true);
      coord = await getLocation();
      setLocating(false);
    }
    const body = buildSmsBody(text, settings.emergency.includeLocation, coord);

    // 如有 Webhook（Server 酱 / 企业微信机器人 / 自建接口），先兜底推送
    let pushed = false;
    if (settings.emergency.webhookUrl) {
      pushed = await notifyWebhook(settings.emergency.webhookUrl, {
        text: '【手语即时通·紧急求助】',
        desp: body,
        ...(coord ? { location: coord } : {}),
      });
    }

    // 手机 / 平板：拉起系统短信 App 并预填内容（真正可发送）
    if (mobile) {
      sendSms(contactPhone, body);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      if (pushed) showToast('已同时推送到远程');
      return;
    }

    // 桌面（Windows / macOS）：系统没有短信应用，复制内容供手动转发，避免弹「选取应用」
    const copied = await copyText(body);
    if (pushed) {
      showToast('电脑无短信功能，已推送到远程，内容也已复制');
    } else if (copied) {
      showToast('电脑无法发短信，求助内容已复制，请在手机上粘贴发送');
    } else {
      showToast('电脑无法发短信，请在手机上打开本应用发送');
    }
  };

  const doCall = (num: string) => {
    if (mobile) {
      callPhone(num);
      return;
    }
    void copyText(num).then((ok) =>
      showToast(ok ? `电脑无法拨号，号码 ${num} 已复制` : `电脑无法拨号，请用手机拨打 ${num}`),
    );
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-24">
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 max-w-[90%] px-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-sm text-center shadow-lg">
          {toast}
        </div>
      )}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-alert-100 text-alert-600 flex items-center justify-center mb-3">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">紧急求助</h1>
        <p className="text-sm text-slate-500 mt-1">一键拨打或发送求助信息给预设联系人</p>
      </div>

      <div
        className={`rounded-2xl p-4 mb-5 ${
          settings.highContrast ? 'bg-slate-900 text-white' : 'bg-alert-50 border border-alert-100'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <User size={18} className={settings.highContrast ? 'text-white' : 'text-alert-600'} />
          <label className="text-sm font-semibold">预设联系人</label>
        </div>
        {canSend ? (
          <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{contactName}</p>
              <p className="text-xs text-slate-500">{contactPhone}</p>
            </div>
            <button
              onClick={() => doCall(contactPhone)}
              className="shrink-0 ml-2 px-3 py-1.5 rounded-xl bg-alert-500 text-white text-sm font-semibold active:scale-95 transition-transform flex items-center gap-1"
            >
              <Phone size={14} />
              拨打
            </button>
          </div>
        ) : (
          <p className="text-xs text-alert-600">
            尚未设置联系人，请到「设置 → 紧急求助」填写姓名与手机号。
          </p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          {mobile
            ? '拨号 / 短信将拉起系统电话或短信 App 并预填内容。'
            : '电脑没有电话与短信功能，这里的拨号 / 短信会复制号码与内容，请在手机上完成发送。'}
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={18} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">求助内容</span>
          {settings.emergency.includeLocation && (
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <MapPin size={12} />
              {locating ? '定位中…' : '附定位'}
            </span>
          )}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
        />
        <button
          onClick={() => doSend(message)}
          disabled={!canSend}
          className={`mt-3 w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
            canSend ? 'bg-alert-500 active:scale-[0.98]' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          <Send size={18} />
          {mobile ? (sent ? '已拉起短信' : '发送求助短信') : '发送求助消息'}
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">快捷求助语</h2>
        <div className="space-y-3">
          {QUICK_MESSAGES.map((msg, i) => (
            <button
              key={i}
              onClick={() => {
                setMessage(msg);
                void doSend(msg);
              }}
              disabled={!canSend}
              className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <p className="text-slate-700 text-sm leading-relaxed">{msg}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
          <Phone size={16} />
          <span>紧急电话</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => doCall('120')}
            className="flex-1 py-2.5 rounded-xl bg-alert-500 text-white text-center text-sm font-semibold active:scale-95 transition-transform"
          >
            120 急救
          </button>
          <button
            onClick={() => doCall('110')}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-center text-sm font-semibold active:scale-95 transition-transform"
          >
            110 报警
          </button>
        </div>
      </div>
    </div>
  );
}
