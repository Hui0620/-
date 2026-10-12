// 生成词库扩充补丁并产出完整可部署目录
// 用法: node patch.mjs
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { pathToFileURL, pathToFileURL as _u } from 'url';
import { join, dirname } from 'path';

const ROOT = 'C:/Users/19145/WorkBuddy/手语';
const SRC_DIR = join(ROOT, 'site');                       // 原站完整副本
const OUT_DIR = join(ROOT, '手语即时通_词库扩充版');        // 补丁后可部署目录
const DATA_MJS = join(ROOT, '手语词库_新增60词.js');

// 1. 载入 60 词数据
const { default: batch } = await import(pathToFileURL(DATA_MJS).href);
if (!Array.isArray(batch) || batch.length !== 60) {
  throw new Error(`词库应为 60 条，实际 ${batch?.length}`);
}

// 2. 载入现有词库做查重（id 与 word 均不可重复）
const bundleSrc = readFileSync(join(SRC_DIR, 'assets/index-DN2gg5Q1.js'), 'utf8');
const existingIds = new Set();
const existingWords = new Set();
for (const m of bundleSrc.matchAll(/\{id:`([a-zA-Z_0-9]+)`,word:`([^`]+)`/g)) {
  existingIds.add(m[1]); existingWords.add(m[2]);
}
const seenId = new Set(), seenWord = new Set();
for (const e of batch) {
  if (seenId.has(e.id)) throw new Error(`新增词 id 重复: ${e.id}`);
  if (seenWord.has(e.word)) throw new Error(`新增词 word 重复: ${e.word}`);
  if (existingIds.has(e.id)) throw new Error(`id 与现有词库冲突: ${e.id}`);
  if (existingWords.has(e.word)) throw new Error(`词与现有词库冲突: ${e.word}`);
  if (!/^[a-z0-9_]+$/.test(e.id)) throw new Error(`id 非法: ${e.id}`);
  if (!/^[01]{5}$/.test(e.handshape)) throw new Error(`handshape 非法: ${e.id} ${e.handshape}`);
  if (!/^[a-z ]+$/.test(e.pinyin)) throw new Error(`pinyin 非法: ${e.id} ${e.pinyin}`);
  if (!Array.isArray(e.tips) || e.tips.length !== 3) throw new Error(`tips 应为3条: ${e.id}`);
  if (!['emergency','basic','social','number','time','medical','family','emotion','traffic'].includes(e.category))
    throw new Error(`category 非法: ${e.id} ${e.category}`);
  seenId.add(e.id); seenWord.add(e.word);
}
console.log('校验通过: 60 条新词，无 id/word 冲突');

// 3. 序列化为与压缩包完全一致的字面量风格
console.log('STEP3 serialize');
const bt = (s) => '`' + s + '`';
const toEntry = (e) => {
  let s = `{id:${bt(e.id)},word:${bt(e.word)},pinyin:${bt(e.pinyin)},aliases:[${e.aliases.map(bt).join(',')}],category:${bt(e.category)},description:${bt(e.description)},tips:[${e.tips.map(bt).join(',')}],handshape:${bt(e.handshape)}`;
  if (e.twoHanded) s += ',twoHanded:!0';
  s += `,location:${bt(e.location)},movement:${bt(e.movement)}`;
  if (e.recognizable) s += ',recognizable:!0';
  return s + '}';
};
const entriesStr = batch.map(toEntry).join(',');

// 4. 打补丁
console.log('STEP4 patch');
const anchor = 'movement:`平行前推`}],ei=Object.fromEntries';
if (!bundleSrc.includes(anchor)) throw new Error('未找到词库数组锚点');
const count = (bundleSrc.match(/movement:`平行前推`\}/g) || []).length;
if (count !== 1) throw new Error(`锚点出现 ${count} 次，中止`);
let patched = bundleSrc.replace(anchor, 'movement:`平行前推`},' + entriesStr + '],ei=Object.fromEntries');

// 4b. 修复语音页快捷示例（原示例如「我需要帮助」永远无法匹配任何词条）
const chipsOld = '[`你好`,`谢谢`,`我需要帮助`,`我饿了`,`我想喝水`,`不舒服`]';
const chipsNew = '[`你好`,`谢谢`,`帮助`,`水`,`不舒服`,`慢慢说`]';
if (!patched.includes(chipsOld)) throw new Error('未找到快捷示例锚点');
patched = patched.replace(chipsOld, chipsNew);

// 5. 产出可部署目录（目录复制由外部 shell 完成，这里只写补丁文件）
console.log('STEP5 write files');
mkdirSync(join(OUT_DIR, 'assets'), { recursive: true });
const NEW_NAME = 'index-VocabPlus60.js';
writeFileSync(join(OUT_DIR, 'assets', NEW_NAME), patched);

// 5b. index.html 指向新 bundle
let html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
html = html.replace('./assets/index-DN2gg5Q1.js', `./assets/${NEW_NAME}`);
if (html.includes('index-DN2gg5Q1.js')) throw new Error('index.html 替换失败');
writeFileSync(join(OUT_DIR, 'index.html'), html);
// 5c. sw.js 预缓存清单指向新 bundle（老用户 SW 更新后自动刷新）
let sw = readFileSync(join(OUT_DIR, 'sw.js'), 'utf8');
if (!sw.includes('{url:"assets/index-DN2gg5Q1.js",revision:null}')) throw new Error('sw.js 锚点未找到');
sw = sw.replace('{url:"assets/index-DN2gg5Q1.js",revision:null}', `{url:"assets/${NEW_NAME}",revision:null}`);
writeFileSync(join(OUT_DIR, 'sw.js'), sw);

// 6. 统计验证
const finalWords = (patched.match(/word:`/g) || []).length;
console.log(`补丁完成: 词库 word 字段总数 = ${finalWords}（原 108 + 新 60 = 168）`);
console.log('输出目录:', OUT_DIR);
