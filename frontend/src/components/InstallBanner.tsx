import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const DISMISS_KEY = 'install_banner_dismissed';

/**
 * 顶部安装横幅：仅在浏览器给出原生安装能力（beforeinstallprompt）时出现，
 * 点「安装」直接拉起系统安装框。不支持原生安装的浏览器由首页 InstallCard 提供手动指引。
 */
export function InstallBanner() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (isInstalled || dismissed || !canInstall) return null;

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-600 text-white shadow-sm animate-slide-up">
      <Download size={18} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight">安装到手机，离线随时用</div>
        <div className="text-primary-100 text-xs leading-tight mt-0.5">点右侧按钮即可添加到主屏幕</div>
      </div>
      <button
        onClick={promptInstall}
        className="shrink-0 px-3 py-1.5 bg-white text-primary-600 rounded-lg font-semibold text-xs active:scale-95 transition-transform"
      >
        安装
      </button>
      <button
        onClick={close}
        className="shrink-0 text-primary-100 active:scale-95 transition-transform"
        aria-label="关闭"
      >
        <X size={18} />
      </button>
    </div>
  );
}
