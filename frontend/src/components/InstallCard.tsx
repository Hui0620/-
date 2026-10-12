import { useState } from 'react';
import { Download, MoreVertical, Package, Share, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/** 判断是否跑在 Capacitor 原生壳里（此时本身就是 APK 安装包，无需再下载/添加主屏） */
const isNativeShell =
  typeof window !== 'undefined' && 'Capacitor' in (window as unknown as Record<string, unknown>);

const APK_URL = 'shouyu-app-v1.0.apk';

/**
 * 首页「安装到手机」卡片（常驻）。
 * - 上一行：添加到主屏幕——浏览器支持原生安装时一键弹系统框，否则展开手动步骤。
 * - 下一行：直接下载 APK 安装包（真正的安卓 App，任何浏览器都能下载安装）。
 * 原生壳（APK 内）或已通过 standalone 模式安装时不再显示「添加主屏」部分。
 */
export function InstallCard() {
  const { canInstall, isIOS, isInstalled, promptInstall } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  if (isNativeShell) return null;

  const handleInstall = async () => {
    if (canInstall && (await promptInstall())) return;
    setShowHelp((v) => !v);
  };

  return (
    <section className="mt-4 rounded-2xl bg-white border border-primary-100 shadow-sm overflow-hidden">
      {!isInstalled && (
        <>
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">添加到主屏幕</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                像 App 一样点开即用，离线也能识别
              </div>
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl font-semibold text-sm shadow-sm shadow-primary-200 active:scale-95 transition-transform"
            >
              <Download size={16} />
              安装
            </button>
          </div>

          {showHelp && (
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 text-sm text-slate-600 space-y-2.5 animate-fade-in">
              {isIOS ? (
                <p className="flex items-start gap-2">
                  <Share size={16} className="mt-0.5 shrink-0 text-primary-500" />
                  <span>
                    用 <b>Safari</b> 打开本页，点底部中间的「分享」按钮 →「添加到主屏幕」。
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-2">
                  <MoreVertical size={16} className="mt-0.5 shrink-0 text-primary-500" />
                  <span>
                    点浏览器右上角的「⋮」或「⋯」菜单 →「添加到主屏幕」或「安装应用」。
                  </span>
                </p>
              )}
              <p className="text-xs text-slate-400 leading-relaxed">
                如果是在 <b>微信 / QQ</b> 里点开的，先点右上角「···」→「在浏览器打开」，再按上面的步骤操作。
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3 p-4 border-t border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-safe-50 text-safe-600 flex items-center justify-center shrink-0">
          <Package size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800">下载 APK 安装包</div>
          <div className="text-xs text-slate-400 mt-0.5 leading-snug">
            约 12MB，装完桌面就是独立 App，任何浏览器都能下
          </div>
        </div>
        <a
          href={APK_URL}
          download
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-safe-500 text-white rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <Download size={16} />
          下载
        </a>
      </div>

      <p className="px-4 pb-4 -mt-1 text-xs text-slate-400 leading-relaxed">
        下载后点开安装包，若提示「未知来源应用」允许一次即可安装。
      </p>
    </section>
  );
}
