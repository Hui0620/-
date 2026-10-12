import { useEffect, useRef } from 'react';
import type { Results } from '@mediapipe/hands';

interface GestureCanvasProps {
  results: Results | null;
  isMirrored?: boolean;
}

export function GestureCanvas({ results, isMirrored = true }: GestureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !results?.multiHandLandmarks || typeof window === 'undefined') return;
    if (!window.drawConnectors || !window.drawLandmarks || !window.HAND_CONNECTIONS) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    for (const landmarks of results.multiHandLandmarks) {
      window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
        color: '#0ea5e9',
        lineWidth: 3,
      });
      window.drawLandmarks(ctx, landmarks, {
        color: '#f97316',
        lineWidth: 2,
        radius: 4,
      });
    }
    ctx.restore();
  }, [results, isMirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  );
}
