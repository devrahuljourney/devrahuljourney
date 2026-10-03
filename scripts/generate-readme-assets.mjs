#!/usr/bin/env node
// Regenerates the data-driven profile panels: assets/stats.svg and
// assets/contribution-city.svg. Run by .github/workflows/readme.yml on a
// schedule with a GitHub token. With no token it falls back to deterministic
// demo data so the panels always render (and so the committed defaults match
// this generator exactly).

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const USER = process.env.GH_USERNAME || "devrahuljourney";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

// ---- palette (matches rahulverma.online dark mode) -----------------------
const C = {
  bg: "#090909", panel: "#0e0e0e", tile: "#141414", line: "#232320",
  text: "#f2f2ee", muted: "#8a8a82", dim: "#4c4c46", accent: "#c7f94a",
};
const FONT_SANS = "'Inter','Segoe UI',system-ui,sans-serif";
const FONT_DISP = "'Space Grotesk','Segoe UI',system-ui,sans-serif";
const FONT_MONO = "'JetBrains Mono','Courier New',monospace";
// building intensity ramp (top / left / right faces): dark -> lime
const RAMP = [
  ["#141414", "#101010", "#0c0c0c"],
  ["#3a4a1e", "#2f3d18", "#263112"],
  ["#6f8a2c", "#5c7324", "#4a5d1d"],
  ["#9bbf3a", "#82a130", "#6a8427"],
  ["#c7f94a", "#a9d43e", "#8bb033"],
];
// language-bar shades: lime -> neutral
const LANG_SHADES = ["#c7f94a", "#9bbf3a", "#6f8a2c", "#57564d", "#333330"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- data ----------------------------------------------------------------
async function fetchData() {
  if (!TOKEN) return null;
  const query = `query($login:String!){
    user(login:$login){
      followers{totalCount}
      contributionsCollection{
        totalCommitContributions
        totalPullRequestContributions
        restrictedContributionsCount
        contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
      }
      repositories(first:100, ownerAffiliations:OWNER, isFork:false, orderBy:{field:STARGAZERS, direction:DESC}){
        totalCount
        nodes{ stargazerCount forkCount languages(first:6){ edges{ size node{ name color } } } }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const { data, errors } = await res.json();
  if (errors) throw new Error(JSON.stringify(errors));
  const u = data.user;
  const repos = u.repositories.nodes;
  const stars = repos.reduce((n, r) => n + r.stargazerCount, 0);
  const forks = repos.reduce((n, r) => n + r.forkCount, 0);
  const langTotals = {};
  for (const r of repos)
    for (const e of r.languages.edges)
      langTotals[e.node.name] = (langTotals[e.node.name] || 0) + e.size;
  const langColors = {};
  for (const r of repos) for (const e of r.languages.edges) langColors[e.node.name] = e.node.color;
  const langs = Object.entries(langTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, size]) => ({ name, size, color: langColors[name] || C.blue }));
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  return {
    stars, forks, repos: u.repositories.totalCount, followers: u.followers.totalCount,
    prs: cc.totalPullRequestContributions, commits: cc.totalCommitContributions,
    contributions: cc.contributionCalendar.totalContributions, langs, days,
  };
}

function demoData() {
  // deterministic pseudo-random year so the committed default looks alive
  let seed = 20261003;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const days = [];
  const start = new Date("2025-10-06T00:00:00Z"); // a Monday
  for (let i = 0; i < 371; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dow = d.getUTCDay();
    const base = dow === 0 || dow === 6 ? 0.35 : 1;
    const burst = rnd() < 0.08 ? 10 + Math.floor(rnd() * 20) : 0;
    const count = Math.max(0, Math.round((rnd() * 6) * base) + burst);
    days.push({ date: d.toISOString().slice(0, 10), count });
  }
  return {
    stars: 24, forks: 7, repos: 38, followers: 19, prs: 112, commits: 640,
    contributions: days.reduce((n, d) => n + d.count, 0),
    langs: [
      { name: "JavaScript", size: 52, color: "#F7DF1E" },
      { name: "TypeScript", size: 24, color: "#3178C6" },
      { name: "Java", size: 12, color: "#ED8B00" },
      { name: "CSS", size: 8, color: "#1572B6" },
      { name: "HTML", size: 4, color: "#E34F26" },
    ],
    days,
  };
}

// ---- stats.svg -----------------------------------------------------------
function renderStats(d) {
  const W = 800, H = 230;
  const tiles = [
    { label: "total stars", value: d.stars, color: C.accent },
    { label: "contributions", value: d.contributions, color: C.accent },
    { label: "pull requests", value: d.prs, color: C.accent },
    { label: "followers", value: d.followers, color: C.accent },
    { label: "repositories", value: d.repos, color: C.accent },
    { label: "forks", value: d.forks, color: C.accent },
  ];
  const tw = 120, gap = (W - 52 - tiles.length * tw) / (tiles.length - 1), ty = 66;
  let tileSvg = "";
  tiles.forEach((t, i) => {
    const x = 26 + i * (tw + gap);
    tileSvg += `
    <g>
      <rect x="${x.toFixed(1)}" y="${ty}" width="${tw}" height="78" rx="10" fill="${C.panel}" stroke="${C.line}"/>
      <rect x="${(x + 16).toFixed(1)}" y="${ty + 18}" width="20" height="2" rx="1" fill="${t.color}"/>
      <text x="${(x + tw / 2).toFixed(1)}" y="${ty + 46}" text-anchor="middle" font-family="${FONT_DISP}" font-size="26" font-weight="700" fill="${C.text}">${t.value.toLocaleString()}</text>
      <text x="${(x + tw / 2).toFixed(1)}" y="${ty + 64}" text-anchor="middle" font-family="${FONT_SANS}" font-size="10" fill="${C.muted}">${t.label}</text>
    </g>`;
  });

  // language bar
  const total = d.langs.reduce((n, l) => n + l.size, 0) || 1;
  const barX = 26, barY = 176, barW = W - 52;
  let x = barX, segs = "", legend = "";
  d.langs.forEach((l, i) => {
    const shade = LANG_SHADES[i] || C.muted;
    const w = (l.size / total) * barW;
    segs += `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="12" fill="${shade}"/>`;
    const lx = barX + i * 150;
    legend += `<circle cx="${lx + 5}" cy="203" r="4" fill="${shade}"/><text x="${lx + 16}" y="207" font-family="${FONT_SANS}" font-size="10" fill="${C.muted}">${esc(l.name)} ${Math.round((l.size / total) * 100)}%</text>`;
    x += w;
  });

  const synced = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT_SANS}">
  <rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.line}"/>
  <text x="26" y="40" font-family="${FONT_DISP}" font-size="15" font-weight="600" letter-spacing="2" fill="${C.text}">STATS</text>
  <circle cx="86" cy="35" r="2.5" fill="${C.accent}"/>
  <text x="774" y="40" text-anchor="end" font-family="${FONT_MONO}" font-size="10" fill="${C.dim}">synced ${synced}</text>
  <line x1="26" y1="52" x2="774" y2="52" stroke="${C.line}"/>
  ${tileSvg}
  <rect x="${barX}" y="${barY}" width="${barW}" height="12" rx="6" fill="${C.tile}"/>
  <clipPath id="barclip"><rect x="${barX}" y="${barY}" width="${barW}" height="12" rx="6"/></clipPath>
  <g clip-path="url(#barclip)">${segs}</g>
  ${legend}
</svg>
`;
}

// ---- contribution-city.svg ----------------------------------------------
function renderCity(d) {
  const TW = 11, TH = 4, HMAX = 60, FW = 800;
  const weeks = [];
  for (let i = 0; i < d.days.length; i += 7) weeks.push(d.days.slice(i, i + 7));
  const max = Math.max(1, ...d.days.map((x) => x.count));
  const headerH = 70;

  const polys = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  weeks.forEach((week, gx) => {
    week.forEach((day, gy) => {
      const px = (gx - gy) * TW;
      const py = (gx + gy) * TH;
      const level = day.count === 0 ? 0 : day.count >= max * 0.66 ? 4 : day.count >= max * 0.33 ? 3 : day.count >= max * 0.12 ? 2 : 1;
      const h = day.count === 0 ? 3 : 6 + (day.count / max) * HMAX;
      const [top, left, right] = RAMP[level];
      // diamond top corners
      const tx = px, tyTop = py - h;
      const n = `${tx},${tyTop - TH}`, e = `${tx + TW},${tyTop}`, s = `${tx},${tyTop + TH}`, w = `${tx - TW},${tyTop}`;
      polys.push(`<polygon points="${n} ${e} ${s} ${w}" fill="${top}"/>`);
      polys.push(`<polygon points="${tx - TW},${tyTop} ${tx},${tyTop + TH} ${tx},${py + TH} ${tx - TW},${py}" fill="${left}"/>`);
      polys.push(`<polygon points="${tx},${tyTop + TH} ${tx + TW},${tyTop} ${tx + TW},${py} ${tx},${py + TH}" fill="${right}"/>`);
      minX = Math.min(minX, tx - TW); maxX = Math.max(maxX, tx + TW);
      minY = Math.min(minY, tyTop - TH); maxY = Math.max(maxY, py + TH);
    });
  });

  const cityW = maxX - minX, cityH = maxY - minY;
  const scale = Math.min(1, (FW - 60) / cityW);
  const H = Math.round(headerH + cityH * scale + 30);
  const tx = (FW - cityW * scale) / 2 - minX * scale;
  const ty = headerH - minY * scale;

  const busiest = d.days.reduce((a, b) => (b.count > a.count ? b : a), { count: -1 });
  const niceDate = busiest.date
    ? new Date(busiest.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : "—";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${H}" width="${FW}" height="${H}" font-family="${FONT_SANS}">
  <rect width="${FW}" height="${H}" rx="14" fill="${C.bg}"/>
  <rect x="0.5" y="0.5" width="${FW - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.line}"/>
  <text x="26" y="40" font-family="${FONT_DISP}" font-size="15" font-weight="600" letter-spacing="2" fill="${C.text}">CONTRIBUTION CITY</text>
  <circle cx="214" cy="35" r="2.5" fill="${C.accent}"/>
  <text x="774" y="40" text-anchor="end" font-family="${FONT_MONO}" font-size="11" fill="${C.muted}">${d.contributions.toLocaleString()} contributions · busiest ${niceDate} (${busiest.count})</text>
  <line x1="26" y1="52" x2="774" y2="52" stroke="${C.line}"/>
  <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${polys.join("")}
  </g>
</svg>
`;
}

// ---- main -----------------------------------------------------------------
(async () => {
  let data, source;
  try {
    data = await fetchData();
    source = data ? "github api" : "demo (no token)";
  } catch (e) {
    console.error("live fetch failed, falling back to demo:", e.message);
    data = null;
  }
  if (!data) { data = demoData(); source = source || "demo (fallback)"; }

  const outDir = join(ROOT, "assets");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "stats.svg"), renderStats(data));
  writeFileSync(join(outDir, "contribution-city.svg"), renderCity(data));
  console.log(`generated stats.svg + contribution-city.svg from ${source}`);
})();
