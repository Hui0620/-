import { SIGN_VOCABULARY } from '../data/vocabulary';
import type { RecognizedGesture, SignItem, SignSample } from '../types';
import { extractFeatures, LM, euclidean } from './features';
import type { HandLandmarks } from './gestureEngineTypes';

export type { HandLandmark, HandLandmarks } from './gestureEngineTypes';

/**
 * 对外暴露的规则识别入口（供识别页调用）。
 * 输入由 MediaPipe 结果整理出的双手数据，输出稳定手势。
 */
export function classifyGesture(hands: HandInfo[]): RecognizedGesture | null {
  return classifyByRule(hands);
}

/** 由归一化特征判断五指是否伸展：使用指尖-中节-掌指三点夹角余弦 */
function extensionScores(hand: HandLandmarks): number[] {
  const chains: Array<[number, number, number]> = [
    [LM.THUMB_MCP, LM.THUMB_IP, LM.THUMB_TIP],
    [LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_TIP],
    [LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_TIP],
    [LM.RING_MCP, LM.RING_PIP, LM.RING_TIP],
    [LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_TIP],
  ];
  // 参考长度：手腕到中指掌指关节
  const ref = dist2(hand[LM.WRIST], hand[LM.MIDDLE_MCP]) || 1e-6;

  return chains.map(([mcp, mid, tip]) => {
    const a = hand[mcp];
    const b = hand[mid];
    const c = hand[tip];
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const d1 = Math.hypot(v1.x, v1.y) || 1e-6;
    const d2 = Math.hypot(v2.x, v2.y) || 1e-6;
    const cos = (v1.x * v2.x + v1.y * v2.y) / (d1 * d2);
    // 伸直时 cos 接近 -1（三点共线且方向相反），弯曲时接近 0 或正值
    const straight = (-cos + 1) / 2; // 映射到 0..1，1 表示最直
    // 同时考虑指尖相对手腕的距离
    const reach = dist2(hand[0], c) / ref;
    return straight * 0.5 + Math.min(1, reach / 1.9) * 0.5;
  });
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function fingerStates(hand: HandLandmarks, threshold = 0.52): boolean[] {
  return extensionScores(hand).map((s) => s > threshold);
}

function getSign(id: string): SignItem {
  const s = SIGN_VOCABULARY.find((x) => x.id === id);
  if (!s) throw new Error(`unknown sign id: ${id}`);
  return s;
}

/**
 * 规则引擎识别。
 * @param hands 检测到的双手数组（含 handedness）
 */
export function classifyByRule(
  hands: Array<{ landmarks: HandLandmarks; handedness: string }>,
): RecognizedGesture | null {
  if (hands.length === 0) return null;

  const primary = hands[0];
  const ext = fingerStates(primary.landmarks);
  const n = ext.filter(Boolean).length;
  const wristY = primary.landmarks[0].y;
  const hand = primary.landmarks;
  const ref = dist2(hand[LM.WRIST], hand[LM.MIDDLE_MCP]) || 1e-6;

  // 指尖横向张开程度
  const spread =
    (dist2(hand[LM.INDEX_TIP], hand[LM.PINKY_TIP]) / ref) *
    (ext[1] && ext[4] ? 1 : 0.6);

  // 手指并拢程度：四指指尖两两距离之和
  const tips = [LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP];
  let tipSpan = 0;
  for (let i = 0; i < tips.length - 1; i++) tipSpan += dist2(hand[tips[i]], hand[tips[i + 1]]);
  const together = tipSpan / ref < 0.9;

  const thumbUp = ext[0] && hand[LM.THUMB_TIP].y < hand[LM.THUMB_MCP].y - 0.02;
  const thumbDown = ext[0] && hand[LM.THUMB_TIP].y > hand[LM.THUMB_MCP].y + 0.02;

  // ---------- 数字（单手，最稳定） ----------
  if (hands.length === 1) {
    if (n === 0) return { sign: getSign('num0'), confidence: 0.94, source: 'rule' };
    if (n === 1 && ext[1] && !ext[0]) return { sign: getSign('num1'), confidence: 0.93, source: 'rule' };
    if (n === 2 && ext[1] && ext[2] && !ext[4]) return { sign: getSign('num2'), confidence: 0.93, source: 'rule' };
    if (n === 3 && ext[1] && ext[2] && ext[3] && !ext[0] && !ext[4])
      return { sign: getSign('num3'), confidence: 0.92, source: 'rule' };
    if (n === 4 && !ext[0]) return { sign: getSign('num4'), confidence: 0.92, source: 'rule' };
    if (ext[0] && ext[1] && ext[2] && !ext[3] && !ext[4])
      return { sign: getSign('num3'), confidence: 0.88, source: 'rule' };
    if (ext[0] && ext[1] && ext[2] && ext[3] && !ext[4])
      return { sign: getSign('num4'), confidence: 0.86, source: 'rule' };
    if (ext[0] && !ext[1] && !ext[2] && !ext[3] && ext[4])
      return { sign: getSign('num6'), confidence: 0.9, source: 'rule' };
    if (ext[0] && ext[1] && !ext[2] && !ext[3] && !ext[4]) return { sign: getSign('num8'), confidence: 0.88, source: 'rule' };
    if (ext[0] && ext[1] && ext[2] && ext[3] && ext[4]) {
      // 5 与其他五指张开的词区分
      if (spread > 1.6 && wristY > 0.5) return { sign: getSign('num5'), confidence: 0.88, source: 'rule' };
    }
  }

  // ---------- 拇指类：是 / 不是 / 厕所 ----------
  if (ext[0] && n === 1) {
    if (thumbUp) return { sign: getSign('yes'), confidence: 0.9, source: 'rule' };
    if (thumbDown) return { sign: getSign('no'), confidence: 0.9, source: 'rule' };
    return { sign: getSign('toilet'), confidence: 0.8, source: 'rule' };
  }

  // ---------- ILY：爱 ----------
  if (ext[0] && ext[1] && ext[4] && !ext[2] && !ext[3])
    return { sign: getSign('love'), confidence: 0.92, source: 'rule' };

  // ---------- 电话 / 水（拇指+小指） ----------
  if (ext[0] && !ext[1] && !ext[2] && !ext[3] && ext[4]) {
    const ear = Math.abs(hand[LM.THUMB_TIP].y - wristY) < 0.12;
    return { sign: getSign(ear ? 'phone' : 'water'), confidence: 0.82, source: 'rule' };
  }

  // ---------- 医院：食指中指交叉 ----------
  if (ext[1] && ext[2] && !ext[3] && !ext[4]) {
    const d = dist2(hand[LM.INDEX_TIP], hand[LM.MIDDLE_TIP]) / ref;
    if (d < 0.45) return { sign: getSign('hospital'), confidence: 0.85, source: 'rule' };
  }

  // ---------- 五指全伸：你好 / 再见 / 危险 / 紧急 / 停止 ----------
  if (n === 5) {
    if (wristY < 0.42) return { sign: getSign('goodbye'), confidence: 0.82, source: 'rule' };
    if (together) return { sign: getSign('stop'), confidence: 0.8, source: 'rule' };
    return { sign: getSign('hello'), confidence: 0.85, source: 'rule' };
  }

  // ---------- 拳 / 少指：谢谢 / 吃饭 / 对不起 / 睡觉 / 家 / 疼 ----------
  if (n <= 1) {
    if (wristY < 0.36) return { sign: getSign('thanks'), confidence: 0.76, source: 'rule' };
    if (wristY > 0.62) return { sign: getSign('sorry'), confidence: 0.72, source: 'rule' };
    return { sign: getSign('eat'), confidence: 0.7, source: 'rule' };
  }

  if (n === 2 && ext[1] && ext[2] && !ext[3] && !ext[4] && hands.length === 1) {
    if (wristY < 0.4) return { sign: getSign('sleep'), confidence: 0.7, source: 'rule' };
  }

  return null;
}

// ------------------------------------------------------------------
// KNN 分类器：基于用户采集或导入的数据集
// ------------------------------------------------------------------
export interface KnnMatch {
  label: string;
  score: number;
  distance: number;
}

export class KnnClassifier {
  private samples: SignSample[] = [];

  constructor(samples: SignSample[] = []) {
    this.samples = samples;
  }

  setSamples(samples: SignSample[]) {
    this.samples = samples;
  }

  get size(): number {
    return this.samples.length;
  }

  /** 返回距离最近的 k 个标签的加权投票 */
  predict(feature: number[], k = 5): KnnMatch | null {
    if (this.samples.length === 0) return null;

    const kk = Math.min(k, this.samples.length);
    const scored = this.samples.map((s) => ({ label: s.label, d: euclidean(feature, s.features) }));
    scored.sort((a, b) => a.d - b.d);

    const votes = new Map<string, number>();
    for (let i = 0; i < kk; i++) {
      const { label, d } = scored[i];
      // 距离越小权重越大
      const w = 1 / (d + 1e-6);
      votes.set(label, (votes.get(label) || 0) + w);
    }

    let best: KnnMatch | null = null;
    let total = 0;
    for (const w of votes.values()) total += w;
    for (const [label, w] of votes) {
      const score = w / total;
      if (!best || score > best.score) {
        best = { label, score, distance: scored.find((s) => s.label === label)!.d };
      }
    }
    return best;
  }
}

/** 由 MediaPipe handedness 结果整理出双手数据 */
export interface HandInfo {
  landmarks: HandLandmarks;
  handedness: 'Left' | 'Right';
}

export function pickHands(hands: HandInfo[]) {
  const right = hands.find((h) => h.handedness === 'Right')?.landmarks ?? null;
  const left = hands.find((h) => h.handedness === 'Left')?.landmarks ?? null;
  return { right, left };
}

export function buildFeature(hands: HandInfo[]): number[] {
  const { right, left } = pickHands(hands);
  return extractFeatures(right, left);
}

// ------------------------------------------------------------------
// 时序平滑：避免识别结果抖动
// ------------------------------------------------------------------
export class GestureSmoother {
  private buffer: Array<string | null> = [];
  private readonly size: number;

  constructor(size = 8) {
    this.size = size;
  }

  update(gestureId: string | null): string | null {
    this.buffer.push(gestureId);
    if (this.buffer.length > this.size) this.buffer.shift();
    if (this.buffer.length < Math.max(3, Math.floor(this.size * 0.5))) return null;

    const counts = new Map<string, number>();
    let empty = 0;
    for (const id of this.buffer) {
      if (!id) empty++;
      else counts.set(id, (counts.get(id) || 0) + 1);
    }

    if (empty > this.buffer.length / 2) return null;

    let bestId: string | null = null;
    let bestCount = 0;
    for (const [id, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }

    if (!bestId || bestCount < this.size * 0.5) return null;
    return bestId;
  }

  reset() {
    this.buffer = [];
  }
}
