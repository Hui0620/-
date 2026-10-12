/**
 * 紧急求助的动作封装：拨号、发短信、获取定位、Webhook 兜底。
 *
 * 说明：
 * - 浏览器 / 已安装的 PWA（添加到主屏幕）中，tel: / sms: 由系统直接接管；
 * - 打包成 Capacitor 安卓 App 后，需要原生层（MainActivity）把这类 scheme
 *   转成 Intent，详见 capacitor 配置与 android/ 工程里的 WebView 覆盖。
 * - 真正的「后台静默发送」被安卓权限限制，这里采用「拉起拨号盘 / 短信 App
 *   并预填内容」的方式，用户点一下即可发出，这是最通用、最可靠的方案。
 */

export interface GeoCoord {
  lat: number;
  lng: number;
}

/** 拨打电话（拉起系统拨号盘，预填号码） */
export function callPhone(phone: string): void {
  const num = phone.trim();
  if (!num) return;
  // 仅保留号码字符，避免注入
  const safe = num.replace(/[^\d+#*()-]/g, '');
  window.location.href = `tel:${safe}`;
}

/** 构造带定位的短信正文 */
export function buildSmsBody(message: string, includeLocation: boolean, coord?: GeoCoord | null): string {
  let body = message.trim();
  if (includeLocation && coord) {
    body += `\n我的位置：https://maps.google.com/?q=${coord.lat},${coord.lng}`;
  }
  return body;
}

/** 发送短信（拉起短信 App 并预填收件人与内容） */
export function sendSms(phone: string, body: string): void {
  const num = phone.trim();
  if (!num) return;
  const safe = num.replace(/[^\d+#*()-]/g, '');
  const encoded = encodeURIComponent(body);
  // Android 使用 ?body=；iOS 使用 &body=，这里优先 Android（APK 目标端）
  window.location.href = `sms:${safe}?body=${encoded}`;
}

/** 获取当前定位（失败/超时返回 null） */
export function getLocation(timeoutMs = 5000): Promise<GeoCoord | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, enableHighAccuracy: false },
    );
  });
}

/**
 * 通过 Webhook 兜底发送（Server 酱 / 企业微信机器人 / 自建接口）。
 * 适用于没有短信权限、或希望在网页端也能真正「送达」的场景。
 */
export async function notifyWebhook(url: string, payload: Record<string, unknown>): Promise<boolean> {
  const target = url.trim();
  if (!target) return false;
  try {
    await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 是否为移动端（手机 / 平板）。
 * 只有移动端才有系统电话、短信 App，tel: / sms: 才能被真正处理；
 * 桌面（Windows / macOS）打开 tel:/sms: 会弹出「选取应用」框而无法发送。
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS 13+ 默认伪装成 macOS，用触控点判断
  const isIPad =
    /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
  return /Android|iPhone|iPad|iPod|Windows Phone|HarmonyOS|Mobile/i.test(ua) || isIPad;
}

/** 复制文本到剪贴板（桌面端兜底：把求助内容/号码复制出来手动转发） */
export async function copyText(text: string): Promise<boolean> {
  const value = text ?? '';
  if (!value) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* 降级到 execCommand */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
