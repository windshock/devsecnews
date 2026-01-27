import process from "node:process";

export const CONTENT_DIR = "content";
export const DIST_DIR = "dist";

export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const cur = argv[i];
    if (cur.startsWith("--")) {
      const key = cur.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (cur === "-m") {
      const next = argv[i + 1];
      if (next) {
        flags.month = next;
        i++;
      }
    } else {
      positionals.push(cur);
    }
  }
  return { flags, positionals };
}

export function getMonth(flags, fallback = "2026-01") {
  return String(flags.month || process.env.DEVSECNEWS_MONTH || fallback).trim();
}

export function defaultBaseName(month) {
  return `devsecnews-${month}-node-java`;
}

export function defaultInput(month) {
  return `${CONTENT_DIR}/${defaultBaseName(month)}.md`;
}

export function defaultCardsHtml(month) {
  return `cards/${defaultBaseName(month)}/cards.html`;
}

export function defaultHtml(month) {
  return `${DIST_DIR}/${defaultBaseName(month)}.html`;
}

export function defaultSplitMd(month, kind) {
  return `${CONTENT_DIR}/devsecnews-${month}-${kind}.md`;
}
