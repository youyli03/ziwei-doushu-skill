#!/usr/bin/env tsx
/**
 * 紫微斗数排盘 CLI
 * 用法: tsx cli.ts --year 1990 --month 8 --day 15 --hour 3 --gender male [--name 张三] [--city 上海] [--format text|json]
 *
 * hour: 时辰地支序号 0=子(23-1) 1=丑(1-3) 2=寅(3-5) 3=卯(5-7) 4=辰(7-9) 5=巳(9-11)
 *       6=午(11-13) 7=未(13-15) 8=申(15-17) 9=酉(17-19) 10=戌(19-21) 11=亥(21-23)
 */

import { generateChart } from './lib/ziwei/algorithm.js';
import { detectPatterns, getMingGongSummary } from './lib/ziwei/patterns.js';
import { getSiHuaByStem } from './lib/ziwei/sihua.js';
import { STAR_DESCRIPTIONS } from './lib/ziwei/constants.js';
import { STAR_IN_FUQI_GU, MARRIAGE_STARS_BRIEF } from './lib/ziwei/heming-knowledge.js';
import { STAR_IN_PALACE } from './lib/ziwei/palace-knowledge.js';
import { searchClassics } from './lib/classics/index.js';
import type { BirthInfo } from './lib/ziwei/types.js';

// ─── 解析命令行参数 ────────────────────────────────────────────
function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      result[key] = argv[i + 1] ?? 'true';
      i++;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

if (!args.year || !args.month || !args.day || !args.hour || !args.gender) {
  console.error('用法: tsx cli.ts --year <年> --month <月> --day <日> --hour <时辰0-11> --gender <male|female> [--name 姓名] [--format text|json]');
  console.error('时辰对照: 0=子 1=丑 2=寅 3=卯 4=辰 5=巳 6=午 7=未 8=申 9=酉 10=戌 11=亥');
  process.exit(1);
}

const birthInfo: BirthInfo = {
  year:   parseInt(args.year),
  month:  parseInt(args.month),
  day:    parseInt(args.day),
  hour:   parseInt(args.hour),
  gender: args.gender === 'female' ? 'female' : 'male',
  name:   args.name,
  city:   args.city,
};

const format = args.format ?? 'text';

// ─── 排盘 ────────────────────────────────────────────────────────
const chart = generateChart(birthInfo);
const patterns = detectPatterns(chart);
const summary = getMingGongSummary(chart);

if (format === 'json') {
  console.log(JSON.stringify({ chart, patterns, summary }, null, 2));
  process.exit(0);
}

// ─── 文本输出 ────────────────────────────────────────────────────
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const HOUR_MAP = ['子(23-1)', '丑(1-3)', '寅(3-5)', '卯(5-7)', '辰(7-9)', '巳(9-11)',
                  '午(11-13)', '未(13-15)', '申(15-17)', '酉(17-19)', '戌(19-21)', '亥(21-23)'];
const STEM_NAMES = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

console.log('═══════════════════════════════════════');
console.log(`  紫微斗数命盘  ${args.name ? `— ${args.name}` : ''}`);
console.log('═══════════════════════════════════════');
console.log(`出生: ${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${HOUR_MAP[birthInfo.hour]}时 ${birthInfo.gender === 'male' ? '男' : '女'}命`);
console.log(`农历: ${chart.lunarInfo.lunarYear}年${chart.lunarInfo.lunarMonth}月${chart.lunarInfo.lunarDay}日`);
console.log(`命宫: ${BRANCH_NAMES[chart.mingGongBranch]}宫  身宫: ${BRANCH_NAMES[chart.shenGongBranch]}宫  五行局: ${chart.wuxingJuName}`);
console.log(`年干四化: ${Object.entries(getSiHuaByStem(chart.lunarInfo.yearStem)).map(([k,v])=>`${v}${k}`).join(' ')}`);
console.log('');

// 十二宫
console.log('── 十二宫 ──────────────────────────────');
for (const p of chart.palaces) {
  const label = p.isMingGong ? '【命】' : p.isShenGong ? '【身】' : '      ';
  const daxian = p.isCurrentDaXian ? ` ★大限${p.daXianAge![0]}-${p.daXianAge![1]}` : p.daXianAge ? ` ${p.daXianAge[0]}-${p.daXianAge[1]}` : '';
  const stars = p.stars.filter(s => s.type === 'major' || s.type === 'sha' || s.siHua)
    .map(s => s.name + (s.siHua ? s.siHua : '') + (s.brightness === 'bright' ? '▲' : s.brightness === 'dim' ? '▼' : ''))
    .join(' ');
  const borrowed = p.isEmpty && p.borrowedFromName ? ` (借${p.borrowedFromName}:${p.borrowedStars?.join(',')})` : '';
  console.log(`${label} ${STEM_NAMES[p.stem]}${BRANCH_NAMES[p.branch]} ${p.name.padEnd(4)} ${stars}${borrowed}${daxian}`);
}

// 格局
if (patterns.length > 0) {
  console.log('');
  console.log('── 格局 ──────────────────────────────');
  for (const pat of patterns) {
    const score = '★'.repeat(Math.min(Math.round((pat as any).score ?? 3), 5));
    console.log(`  ${score} ${pat.name}${(pat as any).description ? ' — ' + (pat as any).description : ''}`);
  }
}

// 命宫主星解析
if (summary) {
  console.log('');
  console.log('── 命宫分析 ─────────────────────────');
  if ((summary as any).mainStars) {
    console.log(`  主星: ${(summary as any).mainStars.join('、')}`);
  }
  if ((summary as any).summary) {
    console.log(`  ${(summary as any).summary}`);
  }
}

// 大限
console.log('');
console.log('── 大限 ──────────────────────────────');
for (const dx of chart.daXians) {
  const cur = chart.daXians.indexOf(dx) === chart.currentDaXianIndex ? ' ◀ 当前' : '';
  console.log(`  ${dx.startAge}-${dx.endAge}岁  ${dx.palaceName}(${BRANCH_NAMES[dx.palaceBranch]})${cur}`);
}

// ── 各宫主星知识库断语 ─────────────────────────────────────────
console.log('');
console.log('── 各宫主星解读（知识库） ───────────────');
for (const p of chart.palaces) {
  const majorStars = p.stars.filter(s => s.type === 'major');
  if (majorStars.length === 0) continue;
  for (const star of majorStars) {
    const desc = STAR_DESCRIPTIONS[star.name];
    if (desc) {
      const brightness = star.brightness === 'bright' ? '庙旺' : star.brightness === 'dim' ? '陷落' : '平和';
      console.log(`  【${p.name}】${star.name}(${brightness}) — ${desc.keywords} [${desc.nature}/${desc.element}]`);
    }
    // 通用宫位断语（palace-knowledge 库）
    const palaceEntry = STAR_IN_PALACE[p.name]?.[star.name];
    if (palaceEntry) {
      console.log(`    核心: ${palaceEntry.summary}`);
      console.log(`    吉: ${palaceEntry.good}`);
      console.log(`    凶: ${palaceEntry.bad}`);
      if (palaceEntry.ni_quote) console.log(`    倪师: ${palaceEntry.ni_quote}`);
    }
    // 夫妻宫专项断语（heming-knowledge 更详细）
    if (p.name === '夫妻宫' && STAR_IN_FUQI_GU[star.name]) {
      const fq = STAR_IN_FUQI_GU[star.name];
      console.log(`    配偶性格: ${fq.spouse_traits}`);
      console.log(`    婚期建议: ${fq.timing}`);
      if (fq.ni_quote) console.log(`    倪师补充: ${fq.ni_quote}`);
    } else if (p.name === '夫妻宫' && MARRIAGE_STARS_BRIEF[star.name]) {
      console.log(`    婚姻简述: ${MARRIAGE_STARS_BRIEF[star.name]}`);
    }
    // 古籍相关条目
    const hits = searchClassics(star.name, 3);
    if (hits.length > 0) {
      console.log(`    古籍: ${hits.map(h => `[${h.bookTitle}·${h.chapterTitle}] ${h.text.slice(0, 60)}…`).join('\n          ')}`);
    }
  }
}
