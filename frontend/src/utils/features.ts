import type { HandLandmarks } from './gestureEngineTypes';

export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 单手特征维度：
 *   42 维 归一化+旋转后的 21 个点 (x,y)
 *   5  维 各指尖到手腕的归一化距离
 *   5  维 各手指的弯曲角（指尖-中间关节-掌指关节 三点夹角余弦）
 * 共 52 维。双手拼接为 104 维。
 */
export const HAND_FEATURE_DIM = 52;
export const FEATURE_DIM = HAND_FEATURE_DIM * 2;

const FINGER_CHAINS: Array<{ tip: number; mid: number; mcp: number }> = [
  { tip: LM.THUMB_TIP, mid: LM.THUMB_IP, mcp: LM.THUMB_MCP },
  { tip: LM.INDEX_TIP, mid: LM.INDEX_PIP, mcp: LM.INDEX_MCP },
  { tip: LM.MIDDLE_TIP, mid: LM.MIDDLE_PIP, mcp: LM.MIDDLE_MCP },
  { tip: LM.RING_TIP, mid: LM.RING_PIP, mcp: LM.RING_MCP },
  { tip: LM.PINKY_TIP, mid: LM.PINKY_PIP, mcp: LM.PINKY_MCP },
];

/** 将单手关键点做平移 + 尺度 + 旋转归一化，输出 52 维特征 */
export function extractHandFeatures(hand: HandLandmarks): number[] {
  const pts: Vec2[] = hand.map((p) => ({ x: p.x, y: p.y }));

  // 1) 平移：以手腕为原点
  const origin = pts[LM.WRIST];
  let nx = pts.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y }));

  // 2) 尺度：以中指掌指关节到手腕的距离为基准
  const scaleRef = Math.hypot(nx[LM.MIDDLE_MCP].x, nx[LM.MIDDLE_MCP].y) || 1e-6;
  nx = nx.map((p) => ({ x: p.x / scaleRef, y: p.y / scaleRef }));

  // 3) 旋转：把 手腕->中指MCP 向量旋转到竖直向上 (0, -1)，消除手部倾斜带来的差异
  const ax = nx[LM.MIDDLE_MCP].x;
  const ay = nx[LM.MIDDLE_MCP].y;
  const len = Math.hypot(ax, ay) || 1e-6;
  const cos = -ay / len;
  const sin = ax / len;
  nx = nx.map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));

  const feat: number[] = new Array(HAND_FEATURE_DIM).fill(0);

  // 归一化坐标
  for (let i = 0; i < 21; i++) {
    feat[i * 2] = nx[i].x;
    feat[i * 2 + 1] = nx[i].y;
  }

  // 指尖到手腕距离
  for (let f = 0; f < 5; f++) {
    const tip = nx[FINGER_CHAINS[f].tip];
    feat[42 + f] = Math.hypot(tip.x, tip.y);
  }

  // 手指弯曲度：三点夹角余弦，1 表示完全伸直
  for (let f = 0; f < 5; f++) {
    const { tip, mid, mcp } = FINGER_CHAINS[f];
    const v1 = { x: nx[mcp].x - nx[mid].x, y: nx[mcp].y - nx[mid].y };
    const v2 = { x: nx[tip].x - nx[mid].x, y: nx[tip].y - nx[mid].y };
    const d1 = Math.hypot(v1.x, v1.y) || 1e-6;
    const d2 = Math.hypot(v2.x, v2.y) || 1e-6;
    const c = (v1.x * v2.x + v1.y * v2.y) / (d1 * d2);
    feat[47 + f] = Math.max(-1, Math.min(1, c));
  }

  return feat;
}

/** 缺失手时补零向量 */
export const EMPTY_HAND_FEATURE: number[] = new Array(HAND_FEATURE_DIM).fill(0);

/**
 * 双手特征提取。
 * @param right 右手关键点（可为空）
 * @param left  左手关键点（可为空）
 */
export function extractFeatures(right: HandLandmarks | null, left: HandLandmarks | null): number[] {
  const r = right ? extractHandFeatures(right) : EMPTY_HAND_FEATURE;
  const l = left ? extractHandFeatures(left) : EMPTY_HAND_FEATURE;
  return [...r, ...l];
}

/** 欧氏距离 */
export function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}
