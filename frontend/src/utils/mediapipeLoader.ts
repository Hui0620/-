export type LoadSource = 'local' | 'jsdelivr' | 'unpkg' | 'cdnjs';

export interface LoadResult {
  source: LoadSource;
  ms: number;
}

const REQUIRED_GLOBALS = ['Hands', 'Camera', 'drawConnectors', 'drawLandmarks'] as const;

function hasAll(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return REQUIRED_GLOBALS.every((g) => typeof w[g] !== 'undefined');
}

function loadScript(url: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.crossOrigin = 'anonymous';
    s.async = false;
    const timer = setTimeout(() => {
      s.remove();
      reject(new Error(`加载超时: ${url}`));
    }, timeoutMs);
    s.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    s.onerror = () => {
      clearTimeout(timer);
      s.remove();
      reject(new Error(`加载失败: ${url}`));
    };
    document.head.appendChild(s);
  });
}

async function loadFrom(base: string): Promise<void> {
  const files = ['camera_utils.js', 'control_utils.js', 'drawing_utils.js', 'hands.js'];
  for (const f of files) {
    await loadScript(`${base}/${f}`);
  }
}

/** 依次尝试各来源，直到 MediaPipe 全局变量就绪 */
export async function ensureMediaPipe(): Promise<LoadResult> {
  if (hasAll()) return { source: 'local', ms: 0 };

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const sources: Array<{ name: LoadSource; base: string }> = [
    { name: 'local', base: `${base}/mediapipe` },
    { name: 'jsdelivr', base: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands' },
    { name: 'unpkg', base: 'https://unpkg.com/@mediapipe/hands' },
    { name: 'cdnjs', base: 'https://cdnjs.cloudflare.com/ajax/libs/mediapipe/hands' },
  ];

  const errors: string[] = [];
  for (const s of sources) {
    const t0 = performance.now();
    try {
      // camera_utils / drawing_utils 在 @mediapipe/hands 路径下不存在，需要单独处理
      if (s.name === 'local') {
        await loadFrom(s.base);
      } else {
        const prefix = s.name === 'cdnjs' ? 'https://cdnjs.cloudflare.com/ajax/libs/mediapipe' : s.base.replace('@mediapipe/hands', '@mediapipe');
        await loadScript(`${prefix}/camera_utils/camera_utils.js`);
        await loadScript(`${prefix}/drawing_utils/drawing_utils.js`);
        await loadScript(`${s.base}/hands.js`);
      }
      if (hasAll()) {
        return { source: s.name, ms: Math.round(performance.now() - t0) };
      }
      errors.push(`${s.name}: 全局变量未就绪`);
    } catch (e) {
      errors.push(`${s.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`MediaPipe 加载失败。已尝试全部来源：\n${errors.join('\n')}`);
}
