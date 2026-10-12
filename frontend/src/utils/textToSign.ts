import { pinyin } from 'pinyin-pro';
import { SIGN_VOCABULARY, findSignByWord } from '../data/vocabulary';
import { FINGER_ALPHABET_MAP, COMMON_PINYIN } from '../data/fingerspelling';
import type { FingerLetter, SignItem } from '../types';

export type SignToken =
  | { type: 'sign'; text: string; sign: SignItem }
  | { type: 'spell'; text: string; pinyin: string; letters: FingerLetter[] }
  | { type: 'punct'; text: string };

/** 构建 词 -> 词条 的查找表，并计算最大词长 */
const DICT = new Map<string, SignItem>();
let MAX_LEN = 1;
for (const item of SIGN_VOCABULARY) {
  DICT.set(item.word, item);
  for (const alias of item.aliases ?? []) DICT.set(alias, item);
  MAX_LEN = Math.max(MAX_LEN, item.word.length, ...(item.aliases ?? []).map((a) => a.length));
}

/** 汉字转拼音（无声调）；pinyin-pro 未命中时回退内置常用字表 */
function toPinyin(char: string): string {
  try {
    const arr = pinyin(char, { toneType: 'none', type: 'array' }) as string[];
    const p = (arr ?? []).join('').toLowerCase();
    if (p && /^[a-z]+$/.test(p)) return p;
  } catch {
    /* 回退到内置表 */
  }
  return COMMON_PINYIN[char] ?? '';
}

const PUNCT = /[，。！？、；：""''（）《》,.!?;:()\[\]{}<>~\-—…\s]/;

/**
 * 将中文文本转换为手语表达序列。
 * 采用最大正向匹配：优先匹配词库中的词；未收录的字回退为手指字母拼写。
 */
export function textToSign(raw: string): SignToken[] {
  const text = (raw ?? '').trim();
  if (!text) return [];

  const tokens: SignToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // 标点与空白：作为停顿保留
    if (PUNCT.test(ch)) {
      tokens.push({ type: 'punct', text: ch });
      i += 1;
      continue;
    }

    // 数字直接命中数字词条
    if (/[0-9]/.test(ch)) {
      const sign = DICT.get(ch);
      if (sign) {
        tokens.push({ type: 'sign', text: ch, sign });
        i += 1;
        continue;
      }
    }

    // 英文/拼音字母：直接转为对应手指字母
    if (/[a-zA-Z]/.test(ch)) {
      const letter = FINGER_ALPHABET_MAP[ch.toUpperCase()];
      if (letter) {
        tokens.push({ type: 'spell', text: ch.toUpperCase(), pinyin: ch.toUpperCase(), letters: [letter] });
        i += 1;
        continue;
      }
    }

    // 最大正向匹配
    let matched: { len: number; sign: SignItem } | null = null;
    const upper = Math.min(MAX_LEN, text.length - i);
    for (let len = upper; len >= 1; len--) {
      const frag = text.slice(i, i + len);
      const sign = findSignByWord(frag) ?? DICT.get(frag);
      if (sign) {
        matched = { len, sign };
        break;
      }
    }

    if (matched) {
      tokens.push({ type: 'sign', text: text.slice(i, i + matched.len), sign: matched.sign });
      i += matched.len;
      continue;
    }

    // 未收录：用手指字母拼写该字拼音
    const py = toPinyin(ch);
    if (py) {
      const letters = py
        .toUpperCase()
        .split('')
        .map((c) => FINGER_ALPHABET_MAP[c])
        .filter((l): l is FingerLetter => Boolean(l));
      if (letters.length > 0) {
        tokens.push({ type: 'spell', text: ch, pinyin: py, letters });
        i += 1;
        continue;
      }
    }

    // 完全无法处理：原样作为标点处理
    tokens.push({ type: 'punct', text: ch });
    i += 1;
  }

  return tokens;
}

/** 统计转换结果覆盖率 */
export function tokenStats(tokens: SignToken[]) {
  let signCount = 0;
  let spellCount = 0;
  for (const t of tokens) {
    if (t.type === 'sign') signCount++;
    else if (t.type === 'spell') spellCount++;
  }
  const total = signCount + spellCount;
  return {
    signCount,
    spellCount,
    total,
    /** 词库直接命中率 */
    coverage: total === 0 ? 0 : signCount / total,
  };
}

/** 把整段文本转为可朗读的说明字符串 */
export function tokensToSpeech(tokens: SignToken[]): string {
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === 'sign') parts.push(t.sign.word);
    else if (t.type === 'spell') parts.push(`${t.text}（${t.pinyin}）`);
  }
  return parts.join('，');
}
