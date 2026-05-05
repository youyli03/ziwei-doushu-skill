---
name: ziwei-doushu
description: 紫微斗数排盘与格局分析，基于倪海夏《天纪》体系，支持命盘生成、十二宫解读、格局识别、大限推算
---

# 紫微斗数排盘

## 概述

本 skill 通过在仓库目录执行 `npx tsx cli.ts` 进行排盘，保留 lib/ziwei 全套算法（算法、格局 1100+ 条、四化、大限）。

仓库地址：https://github.com/youyli03/ziwei-doushu-skill

## 安装与运行

```bash
git clone https://github.com/youyli03/ziwei-doushu-skill.git
cd ziwei-doushu-skill
npm install
npx tsx cli.ts --year 1990 --month 8 --day 15 --hour 3 --gender male
```

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `--year` | ✅ | 公历出生年份 |
| `--month` | ✅ | 公历出生月份 |
| `--day` | ✅ | 公历出生日期 |
| `--hour` | ✅ | 时辰序号（见下表） |
| `--gender` | ✅ | `male` 或 `female` |
| `--name` | ❌ | 姓名（显示用） |
| `--city` | ❌ | 城市（可选） |
| `--format` | ❌ | `text`（默认）或 `json` |

## 时辰对照表

| 序号 | 时辰 | 时间段 |
|------|------|--------|
| 0 | 子 | 23:00–01:00 |
| 1 | 丑 | 01:00–03:00 |
| 2 | 寅 | 03:00–05:00 |
| 3 | 卯 | 05:00–07:00 |
| 4 | 辰 | 07:00–09:00 |
| 5 | 巳 | 09:00–11:00 |
| 6 | 午 | 11:00–13:00 |
| 7 | 未 | 13:00–15:00 |
| 8 | 申 | 15:00–17:00 |
| 9 | 酉 | 17:00–19:00 |
| 10 | 戌 | 19:00–21:00 |
| 11 | 亥 | 21:00–23:00 |

## JSON 输出

```bash
npx tsx cli.ts --year 1990 --month 8 --day 15 --hour 3 --gender male --format json
```

返回 `{ chart, patterns, summary }` 完整结构，可做进一步解析。

## 注意事项

- 用户说"几点出生"需先换算为时辰序号
- 性别影响大限顺序（男顺/女逆），必须确认
- 排盘前请先确认用户提供的是公历还是农历日期
