import { FINGER_ALPHABET_MAP } from '../data/fingerspelling';
import type { SignItem } from '../types';

interface Props {
  /** 手指状态 [拇指,食指,中指,无名指,小指]，1 伸直 0 弯曲 */
  shape?: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * 根据手指状态编码渲染手形示意图。
 * 编码为 5 位字符串，如 "01000" 表示仅食指伸直。
 */
export function HandShapeIcon({ shape = '11111', size = 72, color = '#0ea5e9', className }: Props) {
  const s = (shape ?? '11111').padEnd(5, '0').slice(0, 5).split('').map((c) => c === '1');
  const [thumb, index, middle, ring, pinky] = s;

  const fingerX = [26, 40, 54, 68];
  const states = [index, middle, ring, pinky];

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 100 115"
      className={className}
      role="img"
      aria-label="手形示意图"
    >
      {/* 手掌 */}
      <path
        d="M24 58 Q22 52 28 50 L72 50 Q78 52 76 58 L78 92 Q78 106 64 108 L36 108 Q22 106 22 92 Z"
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* 四指 */}
      {states.map((up, i) => {
        const x = fingerX[i];
        const top = up ? 12 + i * 1.5 : 40;
        const h = 50 - top;
        return (
          <rect
            key={i}
            x={x}
            y={top}
            width="11"
            height={h}
            rx="5.5"
            fill={color}
            fillOpacity={up ? 0.9 : 0.35}
            stroke={color}
            strokeWidth="2"
          />
        );
      })}

      {/* 拇指 */}
      {thumb ? (
        <path
          d="M24 70 L8 58 Q4 55 6 50 Q9 46 14 49 L28 58"
          fill={color}
          fillOpacity="0.9"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M26 66 Q20 68 22 76 Q24 82 30 80"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      )}

      {/* 手腕 */}
      <path
        d="M38 108 L38 113 M50 108 L50 113 M62 108 L62 113"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** 词条手形图示：优先用词条的 handshape，缺省时用手指字母兜底 */
export function SignShapeIcon({ sign, size = 72 }: { sign: SignItem; size?: number }) {
  const shape = sign.handshape ?? '11111';
  return <HandShapeIcon shape={shape} size={size} />;
}

/** 手指字母图示 */
export function FingerLetterIcon({ letter, size = 72 }: { letter: string; size?: number }) {
  const info = FINGER_ALPHABET_MAP[letter.toUpperCase()];
  if (!info) return null;
  return <HandShapeIcon shape={info.shape.join('')} size={size} color="#8b5cf6" />;
}
