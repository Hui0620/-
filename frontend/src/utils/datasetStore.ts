import type { SignDataset, SignSample } from '../types';

const STORAGE_KEY = 'slyc_dataset_v1';

const EMPTY: SignDataset = {
  name: '手语即时通数据集',
  version: '1.0',
  source: 'user',
  updatedAt: new Date().toISOString(),
  samples: [],
};

let cache: SignDataset | null = null;

export function loadDataset(): SignDataset {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = { ...EMPTY };
      return cache;
    }
    const parsed = JSON.parse(raw) as SignDataset;
    if (!parsed || !Array.isArray(parsed.samples)) {
      cache = { ...EMPTY };
    } else {
      cache = parsed;
    }
  } catch {
    cache = { ...EMPTY };
  }
  return cache;
}

function persist() {
  if (!cache) return;
  cache.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('数据集保存失败，可能超出存储容量', e);
  }
}

export function addSamples(label: string, featuresList: number[][]) {
  const ds = loadDataset();
  const now = Date.now();
  for (const f of featuresList) {
    ds.samples.push({ label, features: f, ts: now });
  }
  persist();
}

export function removeLabel(label: string) {
  const ds = loadDataset();
  ds.samples = ds.samples.filter((s) => s.label !== label);
  persist();
}

export function clearDataset() {
  cache = { ...EMPTY, samples: [] };
  persist();
}

export function mergeDataset(incoming: SignDataset, mode: 'merge' | 'replace' = 'merge') {
  const ds = loadDataset();
  if (mode === 'replace') {
    ds.samples = [];
  }
  ds.samples.push(...incoming.samples);
  ds.source = incoming.source || ds.source;
  persist();
}

export function labelStats(): Array<{ label: string; count: number }> {
  const ds = loadDataset();
  const map = new Map<string, number>();
  for (const s of ds.samples) map.set(s.label, (map.get(s.label) || 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function exportDataset(): string {
  return JSON.stringify(loadDataset(), null, 2);
}

export function importDataset(json: string, mode: 'merge' | 'replace' = 'merge'): number {
  const parsed = JSON.parse(json) as SignDataset;
  if (!parsed || !Array.isArray(parsed.samples)) throw new Error('文件格式不正确：缺少 samples 数组');
  const valid = parsed.samples.filter(
    (s): s is SignSample =>
      typeof s.label === 'string' && Array.isArray(s.features) && s.features.length > 0,
  );
  if (valid.length === 0) throw new Error('文件中没有有效的样本');
  mergeDataset({ ...parsed, samples: valid }, mode);
  return valid.length;
}

/**
 * 导入 CSV 格式的开放数据集。
 * 支持列名：label 以及 left_lm0_x ... right_lm20_z 或 0..125 的纯特征列。
 */
export function importCsv(text: string): number {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV 至少需要表头和一行数据');

  const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const lower = header.map((h) => h.toLowerCase());
  const labelIdx = lower.findIndex((h) => h === 'label' || h === 'sign' || h === 'word');
  if (labelIdx < 0) throw new Error('CSV 缺少 label 列');

  const featureIdx = header
    .map((_, i) => i)
    .filter((i) => i !== labelIdx);

  const samples: SignSample[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cells.length < 2) continue;
    const label = cells[labelIdx];
    if (!label) continue;
    const features = featureIdx.map((idx) => Number(cells[idx]));
    if (features.some((v) => Number.isNaN(v))) continue;
    samples.push({ label, features, ts: Date.now() });
  }

  if (samples.length === 0) throw new Error('CSV 中没有解析出有效样本');
  mergeDataset({
    name: 'CSV 导入',
    version: '1.0',
    source: 'csv',
    updatedAt: new Date().toISOString(),
    samples,
  });
  return samples.length;
}
