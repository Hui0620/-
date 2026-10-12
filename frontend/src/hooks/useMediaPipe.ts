import { useCallback, useEffect, useRef, useState } from 'react';
import type { Results } from '@mediapipe/hands';
import type { HandInfo, HandLandmarks } from '../utils/gestureEngine';
import { ensureMediaPipe, type LoadSource } from '../utils/mediapipeLoader';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DiagnosticsInfo {
  status: EngineStatus;
  source?: LoadSource;
  loadMs?: number;
  error?: string;
  /** 是否支持 SIMD（影响 WASM 推理速度） */
  simd?: boolean;
  secureContext: boolean;
  cameraPermission?: PermissionState | 'unknown';
  fps: number;
}

export interface UseMediaPipeOptions {
  onResults?: (results: Results) => void;
  onHands?: (hands: HandInfo[]) => void;
  enabled: boolean;
  maxNumHands?: number;
  resolution: 'low' | 'medium' | 'high';
  sensitivity: number;
}

const RESOLUTIONS = {
  low: { width: 320, height: 240 },
  medium: { width: 640, height: 480 },
  high: { width: 960, height: 720 },
} as const;

/** 检测浏览器是否支持 WASM SIMD */
async function detectSimd(): Promise<boolean> {
  try {
    await WebAssembly.instantiate(
      // SIMD 检测的最小 wasm 模块
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0,
        253, 15, 253, 98, 11,
      ]),
    );
    return true;
  } catch {
    return false;
  }
}

/** 将 MediaPipe 原始结果转换为 HandInfo[]（含左右手判定） */
export function toHandLandmarks(results: Results): HandInfo[] {
  const lm = results.multiHandLandmarks ?? [];
  const hd = results.multiHandedness ?? [];
  const out: HandInfo[] = [];
  for (let i = 0; i < lm.length; i++) {
    out.push({
      landmarks: lm[i] as unknown as HandLandmarks,
      handedness: (hd[i]?.label as 'Left' | 'Right') ?? 'Right',
    });
  }
  return out;
}

export function useMediaPipe({
  onResults,
  onHands,
  enabled,
  maxNumHands = 2,
  resolution,
  sensitivity,
}: UseMediaPipeOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<HandsInstance | null>(null);
  const cameraRef = useRef<CameraInstance | null>(null);
  const runningRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastFpsAtRef = useRef(0);

  const [diag, setDiag] = useState<DiagnosticsInfo>({
    status: 'idle',
    secureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    fps: 0,
  });

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  const onHandsRef = useRef(onHands);
  useEffect(() => {
    onHandsRef.current = onHands;
  }, [onHands]);

  // FPS 统计
  useEffect(() => {
    if (!enabled) return;
    lastFpsAtRef.current = performance.now();
    frameCountRef.current = 0;
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastFpsAtRef.current) / 1000;
      if (elapsed > 0) {
        const fps = Math.round(frameCountRef.current / elapsed);
        setDiag((d) => ({ ...d, fps }));
      }
      lastFpsAtRef.current = now;
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  // 查询摄像头权限状态
  useEffect(() => {
    if (!navigator.permissions?.query) {
      setDiag((d) => ({ ...d, cameraPermission: 'unknown' }));
      return;
    }
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((res) => setDiag((d) => ({ ...d, cameraPermission: res.state })))
      .catch(() => setDiag((d) => ({ ...d, cameraPermission: 'unknown' })));
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    try {
      cameraRef.current?.stop();
    } catch {
      /* 忽略停止异常 */
    }
    try {
      handsRef.current?.close();
    } catch {
      /* 忽略关闭异常 */
    }
    cameraRef.current = null;
    handsRef.current = null;
    setDiag((d) => ({ ...d, status: 'idle', fps: 0 }));
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    runningRef.current = true;
    setDiag((d) => ({ ...d, status: 'loading', error: undefined }));

    try {
      if (!window.isSecureContext) {
        throw new Error('当前不是安全上下文（需 HTTPS 或 localhost），浏览器禁止访问摄像头');
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持摄像头接口，请更换 Chrome / Edge / Safari 新版本');
      }

      const load = await ensureMediaPipe();
      setDiag((d) => ({ ...d, source: load.source, loadMs: load.ms }));
      if (!runningRef.current) return;

      const simd = await detectSimd();
      setDiag((d) => ({ ...d, simd }));

      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const hands = new window.Hands!({
        locateFile: (file: string) => {
          // 本地优先：部署包内已自带模型与 WASM；缺失时回退 CDN
          return `${base}/mediapipe/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands,
        modelComplexity: 1,
        minDetectionConfidence: sensitivity,
        minTrackingConfidence: sensitivity,
        selfieMode: false,
      });

      hands.onResults((results: Results) => {
        frameCountRef.current += 1;
        onResultsRef.current?.(results);
        if (onHandsRef.current) {
          onHandsRef.current(toHandLandmarks(results));
        }
      });

      const { width, height } = RESOLUTIONS[resolution];
      const camera = new window.Camera!(video, {
        onFrame: async () => {
          if (!runningRef.current) return;
          await hands.send({ image: video });
        },
        width,
        height,
      });

      handsRef.current = hands;
      cameraRef.current = camera;

      await camera.start();
      if (!runningRef.current) {
        stop();
        return;
      }
      setDiag((d) => ({ ...d, status: 'ready', error: undefined }));
    } catch (err) {
      runningRef.current = false;
      const msg = err instanceof Error ? err.message : String(err);
      setDiag((d) => ({ ...d, status: 'error', error: msg }));
    }
  }, [maxNumHands, resolution, sensitivity, stop]);

  useEffect(() => {
    if (enabled) {
      void start();
    } else {
      stop();
    }
    return () => stop();
  }, [enabled, start, stop]);

  return { videoRef, error: diag.error, diagnostics: diag, start, stop };
}
