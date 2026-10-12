import { useCallback, useEffect, useState } from 'react';

// 浏览器原生安装事件类型（标准里叫 BeforeInstallPromptEvent，TS 未内置）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * 捕获 PWA 安装能力：
 * - Android / Chrome / Edge 等会在满足条件时触发 beforeinstallprompt，可自定义「安装」按钮拉起系统安装框。
 * - iOS Safari 不触发该事件，只能用「分享 → 添加到主屏幕」手动安装，需给出指引文案。
 * - 已安装（standalone 模式）时不再提示。
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      // 阻止浏览器默认的小信息条，保留我们自己的按钮
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setDeferred(null);
    return choice.outcome === 'accepted';
  }, [deferred]);

  // 仅当浏览器主动给出安装入口、且尚未安装时才算「可点按安装」
  const canInstall = !!deferred && !isInstalled;

  return { canInstall, isIOS, isInstalled, promptInstall };
}
