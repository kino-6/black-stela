import { expect, type Locator } from "@playwright/test";

/**
 * Japanese line-layout gate helper (BS-192).
 *
 * Measures how a message box's text actually wraps in the browser and flags the
 * failures the project treats as blocking: a one-character orphan on the final
 * line, and closing punctuation stranded at the start of a wrapped line
 * (kinsoku violations). This is rendering-truth, not a string check: the same
 * copy can pass in one box width and fail in a narrower one.
 */

// Characters that must never begin a wrapped line (line-start kinsoku).
const KINSOKU_START = [
  "、", "。", "，", "．", ",", ".", "｡", "､",
  "」", "』", "）", ")", "】", "〕", "〉", "》", "”", "’",
  "！", "？", "!", "?", "：", "；", "・", "…", "ー", "—"
];

export interface LineLayoutReport {
  lineCount: number;
  lines: string[];
  orphanTail: boolean;
  strandedPunctuation: string | null;
}

export async function analyzeLineLayout(locator: Locator): Promise<LineLayoutReport> {
  const handle = await locator.elementHandle();
  if (!handle) {
    throw new Error("Line-layout analysis: element not found");
  }

  return handle.evaluate((el, kinsokuStart) => {
    const start = new Set(kinsokuStart);
    const doc = el.ownerDocument;
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const chars: { ch: string; top: number }[] = [];

    let node = walker.nextNode();
    while (node) {
      const text = node.nodeValue ?? "";
      for (let i = 0; i < text.length; i += 1) {
        const range = doc.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        range.detach?.();
        if (rect.width === 0 && rect.height === 0) {
          continue;
        }
        chars.push({ ch: text[i], top: rect.top });
      }
      node = walker.nextNode();
    }

    // Cluster characters into visual lines by their top offset (4px tolerance).
    const centers: number[] = [];
    const lineText: string[] = [];
    for (const { ch, top } of chars) {
      let idx = centers.findIndex((center) => Math.abs(center - top) <= 4);
      if (idx === -1) {
        centers.push(top);
        lineText.push("");
        idx = centers.length - 1;
      }
      lineText[idx] += ch;
    }

    const ordered = centers
      .map((top, idx) => ({ top, text: lineText[idx] }))
      .sort((a, b) => a.top - b.top)
      .map((line) => line.text.replace(/\s+/g, ""))
      .filter((line) => line.length > 0);

    const orphanTail = ordered.length >= 2 && ordered[ordered.length - 1].length === 1;

    let strandedPunctuation: string | null = null;
    for (let i = 1; i < ordered.length; i += 1) {
      const first = ordered[i][0];
      if (start.has(first)) {
        strandedPunctuation = first;
        break;
      }
    }

    return { lineCount: ordered.length, lines: ordered, orphanTail, strandedPunctuation };
  }, KINSOKU_START);
}

export async function assertNoOrphanWrap(locator: Locator, label: string): Promise<LineLayoutReport> {
  const report = await analyzeLineLayout(locator);
  expect(
    report.orphanTail,
    `${label}: 一文字だけが次行に孤立しています。lines=${JSON.stringify(report.lines)}`
  ).toBe(false);
  expect(
    report.strandedPunctuation,
    `${label}: 行頭に句読点「${report.strandedPunctuation}」が孤立しています。lines=${JSON.stringify(report.lines)}`
  ).toBeNull();
  return report;
}
