import type { Results } from '@mediapipe/hands';

declare global {
  interface HandsInstance {
    setOptions(options: {
      maxNumHands?: number;
      modelComplexity?: number;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
      selfieMode?: boolean;
    }): void;
    onResults(callback: (results: Results) => void): void;
    send(input: { image: HTMLVideoElement }): Promise<void>;
    close(): void;
  }

  interface HandsConstructor {
    new (config: { locateFile: (file: string) => string }): HandsInstance;
  }

  interface CameraInstance {
    start(): Promise<void>;
    stop(): void;
  }

  interface CameraConstructor {
    new (
      video: HTMLVideoElement,
      options: {
        onFrame: () => Promise<void>;
        width?: number;
        height?: number;
      },
    ): CameraInstance;
  }

  interface Window {
    Hands: HandsConstructor;
    Camera: CameraConstructor;
    drawConnectors: (
      ctx: CanvasRenderingContext2D,
      landmarks: { x: number; y: number; z: number }[],
      connections: [number, number][],
      style?: { color?: string; lineWidth?: number },
    ) => void;
    drawLandmarks: (
      ctx: CanvasRenderingContext2D,
      landmarks: { x: number; y: number; z: number }[],
      style?: { color?: string; lineWidth?: number; radius?: number },
    ) => void;
    HAND_CONNECTIONS: [number, number][];
  }
}

export {};
