#!/usr/bin/env node
// Generates every profile panel in assets/: the static sections (header,
// about, project cards, stack, links, footer) and the data-driven ones
// (stats.svg, contribution-city.svg). Run by .github/workflows/readme.yml on a
// schedule with a GitHub token. With no token the data panels fall back to
// deterministic demo data so they always render.
//
// Look: editorial "paper & ink": warm paper, near-black ink, brick red and
// blue accents, Montserrat ExtraBold display caps and DM Mono labels. Fonts are
// embedded as base64 woff2 (latin subset) because GitHub serves SVGs through
// <img>, which can't load external fonts.

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as art from "./illustrations.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const USER = process.env.GH_USERNAME || "devrahuljourney";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

// ---- palette ---------------------------------------------------------------
const C = {
  paper: "#ece6d9", paper2: "#e3dccc", line: "#cfc6b3",
  ink: "#0d0f0e", ink2: "#292b28", muted: "#62655e", dim: "#92958b",
  red: "#b94835", blue: "#3457d5", yellow: "#f0cc78", pink: "#ff8b9d", navy: "#154d6b",
};
// contribution-city ramp (top / left / right faces): paper -> red -> ink
const RAMP = [
  ["#ddd6c7", "#cfc6b3", "#c3baa6"],
  ["#eab9a7", "#d9a593", "#c99482"],
  ["#d6846c", "#c3735c", "#b0644f"],
  ["#b94835", "#9e3c2c", "#853224"],
  ["#292b28", "#1c1e1c", "#0d0f0e"],
];
const LANG_SHADES = [C.ink, C.red, C.blue, C.yellow, C.pink];

// ---- fonts -----------------------------------------------------------------
const FONT_FILES = {
  disp: ["Mont", 800, "montserrat-latin-800-normal.woff2"],
  semi: ["Mont", 600, "montserrat-latin-600-normal.woff2"],
  mono: ["DMMono", 400, "dm-mono-latin-400-normal.woff2"],
};
const fontCache = {};
const fontFace = (key) => {
  const [family, weight, file] = FONT_FILES[key];
  fontCache[key] ??= readFileSync(join(ROOT, "scripts", "fonts", file)).toString("base64");
  return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${fontCache[key]}) format('woff2')}`;
};
const DISP = "'Mont','Montserrat','Helvetica Neue',Arial,sans-serif";
const MONO = "'DMMono','DM Mono','Courier New',monospace";
const CLASSES = `.d{font-family:${DISP};font-weight:800}.s{font-family:${DISP};font-weight:600}.m{font-family:${MONO};font-weight:400}`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A rounded paper sheet with the fonts it uses embedded.
function sheet(W, H, body, { fonts = ["disp", "mono"], bg = C.paper, defs = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>${fonts.map(fontFace).join("")}${CLASSES}</style>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter>
    ${art.STICKER_FILTER}
    <clipPath id="sheet"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    ${defs}
  </defs>
  <g clip-path="url(#sheet)">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" filter="url(#grain)"/>
    ${body}
  </g>
</svg>
`;
}

// Greedy word wrap by an average glyph width (em fraction); good enough for
// short fixed copy, verified by rendering.
function wrap(text, maxChars) {
  const lines = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (cur && (cur + " " + w).length > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
const tspans = (lines, x, lh) =>
  lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join("");

// ---- header: sky fading into graph paper, stickers around the headline ----
function renderHeader() {
  const W = 800, H = 500;
  const defs = `
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${C.ink}" stroke-opacity="0.07"/></pattern>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6f98cf"/><stop offset="0.38" stop-color="#a9c0dd"/><stop offset="0.62" stop-color="${C.paper}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="#fff"/><stop offset="0.66" stop-color="#000"/></linearGradient>
    <mask id="fade"><rect width="${W}" height="${H}" fill="url(#fadeG)"/></mask>
    <filter id="clouds" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.012" numOctaves="5" seed="11"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.83  0 0 0 0 0.73  0 0 0 3.4 -1.4"/>
    </filter>
    <filter id="cloudsHi" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="4" seed="4"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.92  0 0 0 3.6 -1.75"/>
    </filter>`;
  const wire = "M-20,170 C110,120 260,170 210,250 C170,320 60,300 90,250 C130,190 260,330 330,420 C380,480 520,470 560,400 C600,330 690,300 740,350 C780,390 760,440 820,420";
  return sheet(W, H, `
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <g mask="url(#fade)">
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect width="${W}" height="${H}" filter="url(#clouds)"/>
      <rect width="${W}" height="${H}" filter="url(#cloudsHi)"/>
    </g>
    <path d="${wire}" fill="none" stroke="${C.ink}" stroke-opacity="0.28" stroke-width="1.4"/>

    ${art.sticker(art.phone(C), 168, 112, -14, 0.92)}
    ${art.sticker(art.keyboard(C), 638, 98, 9, 1)}
    <text x="34" y="42" class="d" font-size="19" fill="${C.ink}" letter-spacing="-0.8"><tspan x="34">rahul</tspan><tspan x="34" dy="17">verma</tspan></text>

    <text x="312" y="272" text-anchor="end" class="d" font-size="86" fill="${C.ink}" letter-spacing="-3">BUILD</text>
    ${art.sticker(art.codeCard(C), 396, 242, -2, 0.92)}
    <text x="480" y="272" class="d" font-size="86" fill="${C.ink}" letter-spacing="-3">SHIP</text>
    <text x="400" y="342" text-anchor="middle" class="d" font-size="46" fill="${C.ink}" letter-spacing="-1">CLEAN CODE, LATE NIGHTS<tspan fill="${C.red}">.</tspan></text>
    <text x="400" y="372" text-anchor="middle" class="m" font-size="11" fill="${C.muted}" letter-spacing="1.5">FULL STACK DEVELOPER · MERN · REACT NATIVE</text>

    ${art.sticker(art.mug(C), 86, 436, -8, 0.9, art.mugSteam(C))}
    ${art.sticker(art.stickyNote(C), 236, 438, 7, 0.85)}
    ${art.sticker(art.duck(C), 712, 440, 8, 0.85)}
    <text x="400" y="482" text-anchor="middle" class="m" font-size="12" fill="${C.ink}" letter-spacing="2">MEET RAHUL <tspan fill="${C.red}">↓</tspan></text>
  `, { defs, fonts: ["disp", "semi", "mono"] });
}

// ---- about ---------------------------------------------------------------
function renderAbout(avatar) {
  const W = 800, H = 330;
  const para = wrap(
    "A full stack developer working across MERN and React Native. I turn ambiguous ideas into products people actually ship and use, from screen-time apps to a VS Code extension 350+ developers rely on.",
    58,
  );
  const now = wrap("Currently building CoSkill and ReThink, and open to freelance work and good collaborations.", 58);
  return sheet(W, H, `
    <text x="36" y="52" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(ABOUT)</text>
    <text x="764" y="52" text-anchor="end" class="m" font-size="12" fill="${C.muted}" letter-spacing="1">01 / 05</text>
    ${art.sticker(art.polaroid(C, avatar, "me, mid-deploy"), 104, 172, -5, 0.98)}
    <g transform="translate(118,268) rotate(5)">
      <rect x="-70" y="-17" width="140" height="34" rx="17" fill="${C.yellow}"/>
      <text text-anchor="middle" y="4.5" class="m" font-size="11.5" fill="${C.ink}" letter-spacing="1">BASED IN INDIA</text>
    </g>
    <text x="216" y="66" class="d" font-size="40" fill="${C.ink}" letter-spacing="-1.2">Hello, I'm Rahul.</text>
    <text x="216" y="110" class="s" font-size="15.5" fill="${C.ink2}">${tspans(para, 216, 24)}</text>
    <text x="216" y="${110 + para.length * 24 + 14}" class="s" font-size="15.5" fill="${C.muted}">${tspans(now, 216, 24)}</text>
    <g transform="translate(216,${110 + (para.length + now.length) * 24 + 34})">
      <rect width="4" height="40" fill="${C.blue}"/>
      <text x="20" y="16" class="m" font-size="13" fill="${C.blue}">“Ship it, watch people use it,</text>
      <text x="20" y="35" class="m" font-size="13" fill="${C.blue}"> then make it better.”</text>
    </g>
  `, { fonts: ["disp", "semi", "mono"] });
}

// ---- section header: small label + giant word + count ----------------------
function renderSection({ label, title, count, index }) {
  const W = 800, H = 150;
  return sheet(W, H, `
    <text x="36" y="44" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(${esc(label)})</text>
    <text x="764" y="44" text-anchor="end" class="m" font-size="12" fill="${C.muted}" letter-spacing="1">${esc(index)}</text>
    <text x="30" y="128" class="d" font-size="88" fill="${C.ink}" letter-spacing="-4">${esc(title)}${count ? `<tspan class="m" font-weight="400" font-size="22" dy="-52" dx="10" fill="${C.red}" letter-spacing="0">${esc(count)}</tspan>` : ""}</text>
  `);
}

// ---- project cards ---------------------------------------------------------
const PROJECTS = [
  {
    file: "card-rethink", art: art.phone, wide: true, n: "01", title: "ReThink", kind: "MOBILE APP", sticker: "BUILDING", accent: C.red,
    line: "Screen time management & control",
    desc: "Track usage, set limits and take back control of your phone habits, built as a real, daily-use app.",
    tags: ["React Native", "Screen Time", "App Control"],
  },
  {
    file: "card-coskill", art: art.swapCards, n: "02", title: "CoSkill", kind: "PLATFORM", sticker: "BUILDING", accent: C.blue,
    line: "Skill swaps that actually work",
    desc: "Connect, teach and learn real skills with people who have what you need.",
    tags: ["React Native", "Node.js", "MongoDB", "Redis"],
  },
  {
    file: "card-edtech", art: art.gradCap, n: "03", title: "EdTech", kind: "FULL STACK", sticker: "SHIPPED", accent: C.yellow,
    line: "A learning platform, end to end",
    desc: "Courses, payments, progress tracking and dashboards for students and instructors.",
    tags: ["React", "Node.js", "MongoDB", "Tailwind"],
  },
  {
    file: "card-friendify", art: art.chatBubbles, n: "04", title: "Friendify", kind: "SOCIAL", sticker: "REAL-TIME", accent: C.pink,
    line: "Chat and presence, live",
    desc: "A social app with real-time chat, live presence and instant notifications.",
    tags: ["React", "Socket.IO", "Node.js", "MongoDB"],
  },
  {
    file: "card-rn-style-injector", art: art.editorKey, n: "05", title: "RN Style Injector", kind: "DEV TOOL", sticker: "350+ USERS", accent: C.navy,
    line: "Missing styles, injected for you",
    desc: "A VS Code extension that auto-fills StyleSheet entries. Trigger with Alt+S.",
    tags: ["TypeScript", "VS Code API", "React Native"],
  },
];

function tagRow(tags, x, y) {
  let cx = x, out = "";
  for (const t of tags) {
    const w = Math.round(t.length * 7.3 + 22);
    out += `<rect x="${cx}" y="${y}" width="${w}" height="24" rx="12" fill="none" stroke="${C.ink}" stroke-opacity="0.35"/><text x="${cx + w / 2}" y="${y + 16}" text-anchor="middle">${esc(t)}</text>`;
    cx += w + 6;
  }
  return `<g class="m" font-size="11" fill="${C.ink}">${out}</g>`;
}

function sticker(text, x, y, rot, fill) {
  const w = Math.round(text.length * 7.4 + 30);
  const fg = fill === C.yellow || fill === C.pink ? C.ink : C.paper;
  return `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="${fill}"/><text text-anchor="middle" y="4.5" class="m" font-size="11.5" fill="${fg}" letter-spacing="1">${esc(text)}</text></g>`;
}

function renderCard(p) {
  const W = p.wide ? 800 : 400, H = p.wide ? 290 : 310;
  const pad = 30;
  const descLines = wrap(p.desc, p.wide ? 60 : 32);
  const titleSize = p.wide ? 52 : p.title.length > 12 ? 30 : 38;
  const titleY = p.wide ? 128 : 112;
  const lineY = titleY + (p.wide ? 30 : 26);
  const descY = lineY + 26;
  const tagsY = H - 60;
  return sheet(W, H, `
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="none" stroke="${C.ink}" stroke-opacity="0.85" stroke-width="1.5"/>
    <text x="${pad}" y="48" class="m" font-size="12" fill="${C.muted}" letter-spacing="1"><tspan fill="${C.red}">${p.n}</tspan> / ${p.kind}</text>
    ${sticker(p.sticker, W - pad - 54, 44, p.n % 2 ? 6 : -6, p.accent)}
    <text x="${pad - 2}" y="${titleY}" class="d" font-size="${titleSize}" fill="${C.ink}" letter-spacing="${p.wide ? -2 : -1.2}">${esc(p.title)}</text>
    <text x="${pad}" y="${lineY}" class="s" font-size="${p.wide ? 16 : 14}" fill="${C.ink2}">${esc(p.line)}</text>
    <text x="${pad}" y="${descY}" class="s" font-size="12.5" fill="${C.muted}">${tspans(descLines, pad, 19)}</text>
    ${p.wide ? art.sticker(p.art(C), 668, 158, 10, 0.92) : art.sticker(p.art(C), 316, 194, p.n % 2 ? 6 : -6, 0.9)}
    ${tagRow(p.tags, pad, tagsY)}
    <text x="${W - pad}" y="${p.wide ? H - 42 : titleY}" text-anchor="end" class="m" font-size="12" fill="${C.red}" letter-spacing="1">${p.wide ? "VIEW PROJECT ↗" : "VIEW ↗"}</text>
  `, { fonts: ["disp", "semi", "mono"] });
}

// ---- featured: inverted ink ticket ----------------------------------------
function renderFeatured() {
  const W = 800, H = 270;
  return sheet(W, H, `
    <text x="36" y="50" class="m" font-size="12" fill="${C.yellow}" letter-spacing="1">(FEATURED) · VS CODE MARKETPLACE</text>
    <text x="764" y="50" text-anchor="end" class="m" font-size="12" fill="${C.dim}" letter-spacing="1">PUBLISHER rahul-dev</text>
    <text x="34" y="118" class="d" font-size="48" fill="${C.paper}" letter-spacing="-2">React Native</text>
    <text x="34" y="166" class="d" font-size="48" fill="${C.paper}" letter-spacing="-2">Style Injector<tspan fill="${C.red}">.</tspan></text>
    <text x="36" y="198" class="s" font-size="14" fill="${C.dim}">Auto-injects missing styles straight into <tspan class="m" fill="${C.yellow}">StyleSheet.create</tspan>. Zero setup.</text>
    <rect x="36" y="216" width="410" height="32" rx="6" fill="${C.ink2}"/>
    <text x="50" y="237" class="m" font-size="12.5" fill="${C.paper}"><tspan fill="${C.red}">$</tspan> ext install rahul-dev.rn-style-injector</text>
    <g transform="translate(560,92)">
      <line x1="0" y1="0" x2="0" y2="150" stroke="${C.paper}" stroke-opacity="0.15"/>
      <text x="28" y="44" class="d" font-size="56" fill="${C.paper}" letter-spacing="-2">350+</text>
      <text x="30" y="70" class="m" font-size="12" fill="${C.dim}" letter-spacing="1">DEVELOPERS</text>
      <text x="30" y="112" class="m" font-size="13" fill="${C.paper}"><tspan fill="${C.yellow}">Alt+S</tspan> to trigger</text>
      <text x="30" y="140" class="m" font-size="12" fill="${C.red}" letter-spacing="1">INSTALL ↗</text>
    </g>
  `, { bg: C.ink, fonts: ["disp", "semi", "mono"] });
}

// ---- stack: numbered list in the style of a services menu -----------------
const STACK = [
  ["Languages", "Java · JavaScript · TypeScript · HTML5 · CSS3"],
  ["Frameworks", "React · React Native · Next.js · Redux · Node.js · Express · Tailwind"],
  ["Databases", "MongoDB · Redis · Supabase"],
  ["Cloud", "AWS · Vercel · Netlify · Hostinger · Cloudinary · Docker"],
  ["Tools", "Git · GitHub · VS Code · Postman · Figma · WebSocket · REST API"],
  ["Coursework", "OOPs · Operating Systems · Computer Networks · DBMS"],
];
function renderStack() {
  const W = 800, top = 128, row = 62, H = top + STACK.length * row + 24;
  let rows = "";
  STACK.forEach(([name, items], i) => {
    const y = top + i * row;
    const lines = wrap(items, 46);
    rows += `
    <line x1="36" y1="${y}" x2="764" y2="${y}" stroke="${C.ink}" stroke-opacity="0.18"/>
    <text x="36" y="${y + 38}" class="m" font-size="13" fill="${C.red}">${String(i + 1).padStart(2, "0")}.</text>
    <text x="76" y="${y + 40}" class="d" font-size="26" fill="${C.ink}" letter-spacing="-0.8">${name}</text>
    <text x="764" y="${y + (lines.length > 1 ? 28 : 37)}" text-anchor="end" class="m" font-size="12" fill="${C.ink2}">${tspans(lines, 764, 17)}</text>`;
  });
  return sheet(W, H, `
    <text x="36" y="44" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(TOOLKIT)</text>
    <text x="764" y="44" text-anchor="end" class="m" font-size="12" fill="${C.muted}" letter-spacing="1">03 / 05</text>
    <text x="34" y="100" class="d" font-size="40" fill="${C.ink}" letter-spacing="-1.4">What I build with</text>
    ${rows}
    <line x1="36" y1="${top + STACK.length * row}" x2="764" y2="${top + STACK.length * row}" stroke="${C.ink}" stroke-opacity="0.18"/>
  `);
}

// ---- connect + links + footer ---------------------------------------------
function renderConnect() {
  const W = 800, H = 230;
  return sheet(W, H, `
    <text x="36" y="44" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(CONNECT)</text>
    <text x="764" y="44" text-anchor="end" class="m" font-size="12" fill="${C.muted}" letter-spacing="1">05 / 05</text>
    <text x="36" y="84" class="m" font-size="13" fill="${C.muted}">A good product starts with a conversation.</text>
    <text x="30" y="150" class="d" font-size="54" fill="${C.ink}" letter-spacing="-2.4">Got an idea?</text>
    <text x="30" y="206" class="d" font-size="54" fill="${C.ink}" letter-spacing="-2.4">Let's <tspan fill="${C.red}">ship it.</tspan></text>
    ${art.sticker(art.paperPlane(C), 660, 112, -4, 1, art.planeTrail(C))}
    ${sticker("FREELANCE · COLLAB", 640, 196, -7, C.blue)}
  `);
}

const LINKS = [
  { file: "website", label: "WEBSITE", handle: "rahulverma.online" },
  { file: "linkedin", label: "LINKEDIN", handle: "devrahuljourney" },
  { file: "twitter", label: "X / TWITTER", handle: "@devrahuljourney" },
  { file: "leetcode", label: "LEETCODE", handle: "devrahuljourney" },
  { file: "github", label: "GITHUB", handle: "devrahuljourney" },
];
function renderLink(l) {
  const W = 160, H = 76;
  return sheet(W, H, `
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="${H / 2 - 6}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>
    <text x="${W / 2}" y="37" text-anchor="middle" class="m" font-size="12" fill="${C.ink}" letter-spacing="1">${esc(l.label)} <tspan fill="${C.red}">↗</tspan></text>
    <text x="${W / 2}" y="53" text-anchor="middle" class="m" font-size="9.5" fill="${C.muted}">${esc(l.handle)}</text>
  `, { fonts: ["mono"] });
}

function renderFooter() {
  const W = 800, H = 150;
  const marquee = "BUILD · SHIP · ITERATE · REAL PRODUCTS, REAL USERS · ";
  const strip = marquee.repeat(4);
  return sheet(W, H, `
    <g class="d" font-size="40" fill="${C.paper}" letter-spacing="-1">
      <text x="0" y="66">${strip}<animateTransform attributeName="transform" type="translate" from="0 0" to="-660 0" dur="22s" repeatCount="indefinite"/></text>
    </g>
    <line x1="36" y1="98" x2="764" y2="98" stroke="${C.paper}" stroke-opacity="0.15"/>
    <g class="m" font-size="11" letter-spacing="1">
      <text x="36" y="128" fill="${C.dim}">© ${new Date().getUTCFullYear()} RAHUL KUMAR VERMA</text>
      <text x="400" y="128" text-anchor="middle" fill="${C.dim}">DESIGNED &amp; CODED IN INDIA</text>
      <text x="764" y="128" text-anchor="end" fill="${C.red}">THANKS FOR SCROLLING ↑</text>
    </g>
  `, { bg: C.ink });
}

// ---- data ------------------------------------------------------------------
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
  const langs = Object.entries(langTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, size]) => ({ name, size }));
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
      { name: "JavaScript", size: 52 }, { name: "TypeScript", size: 24 },
      { name: "Java", size: 12 }, { name: "CSS", size: 8 }, { name: "HTML", size: 4 },
    ],
    days,
  };
}

// ---- stats.svg -------------------------------------------------------------
function renderStats(d) {
  const W = 800, H = 300;
  const tiles = [
    ["stars", d.stars], ["contributions", d.contributions], ["pull requests", d.prs],
    ["followers", d.followers], ["repositories", d.repos], ["forks", d.forks],
  ];
  const colW = (W - 72) / tiles.length;
  let tileSvg = "";
  tiles.forEach(([label, value], i) => {
    const x = 36 + i * colW;
    if (i) tileSvg += `<line x1="${x.toFixed(1)}" y1="96" x2="${x.toFixed(1)}" y2="170" stroke="${C.ink}" stroke-opacity="0.18"/>`;
    tileSvg += `<text x="${(x + (i ? 16 : 0)).toFixed(1)}" y="144" class="d" font-size="38" fill="${C.ink}" letter-spacing="-1.5">${value.toLocaleString("en-US")}</text>
    <text x="${(x + (i ? 16 : 0)).toFixed(1)}" y="166" class="m" font-size="10.5" fill="${C.muted}" letter-spacing="0.6">${label.toUpperCase()}</text>`;
  });

  const total = d.langs.reduce((n, l) => n + l.size, 0) || 1;
  const barX = 36, barY = 212, barW = W - 72;
  let x = barX, segs = "", legend = "";
  d.langs.forEach((l, i) => {
    const shade = LANG_SHADES[i] || C.dim;
    const w = (l.size / total) * barW;
    segs += `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="16" fill="${shade}"/>`;
    const lx = barX + i * 146;
    legend += `<rect x="${lx}" y="${barY + 36}" width="10" height="10" rx="2" fill="${shade}"/><text x="${lx + 17}" y="${barY + 45}" class="m" font-size="11" fill="${C.ink2}">${esc(l.name)} <tspan fill="${C.muted}">${Math.round((l.size / total) * 100)}%</tspan></text>`;
    x += w;
  });

  const synced = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  return sheet(W, H, `
    <text x="36" y="44" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(BY THE NUMBERS)</text>
    <text x="764" y="44" text-anchor="end" class="m" font-size="11" fill="${C.muted}">synced ${synced}</text>
    <line x1="36" y1="66" x2="764" y2="66" stroke="${C.ink}" stroke-opacity="0.18"/>
    ${tileSvg}
    <text x="36" y="200" class="m" font-size="10.5" fill="${C.muted}" letter-spacing="0.6">TOP LANGUAGES</text>
    <clipPath id="barclip"><rect x="${barX}" y="${barY}" width="${barW}" height="16" rx="8"/></clipPath>
    <rect x="${barX}" y="${barY}" width="${barW}" height="16" rx="8" fill="${C.paper2}"/>
    <g clip-path="url(#barclip)">${segs}</g>
    ${legend}
  `);
}

// ---- contribution-city.svg -------------------------------------------------
function renderCity(d) {
  const TW = 11, TH = 4, HMAX = 60, FW = 800;
  const weeks = [];
  for (let i = 0; i < d.days.length; i += 7) weeks.push(d.days.slice(i, i + 7));
  const max = Math.max(1, ...d.days.map((x) => x.count));
  const headerH = 100;

  const polys = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  weeks.forEach((week, gx) => {
    week.forEach((day, gy) => {
      const px = (gx - gy) * TW;
      const py = (gx + gy) * TH;
      const level = day.count === 0 ? 0 : day.count >= max * 0.66 ? 4 : day.count >= max * 0.33 ? 3 : day.count >= max * 0.12 ? 2 : 1;
      const h = day.count === 0 ? 3 : 6 + (day.count / max) * HMAX;
      const [top, left, right] = RAMP[level];
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
  const scale = Math.min(1, (FW - 72) / cityW);
  const H = Math.round(headerH + cityH * scale + 36);
  const tx = (FW - cityW * scale) / 2 - minX * scale;
  const ty = headerH - minY * scale;

  const busiest = d.days.reduce((a, b) => (b.count > a.count ? b : a), { count: -1 });
  const niceDate = busiest.date
    ? new Date(busiest.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : "n/a";

  return sheet(FW, H, `
    <text x="36" y="44" class="m" font-size="12" fill="${C.red}" letter-spacing="1">(CONTRIBUTION CITY)</text>
    <text x="764" y="44" text-anchor="end" class="m" font-size="11" fill="${C.muted}">one building per day · height = commits</text>
    <text x="34" y="86" class="d" font-size="30" fill="${C.ink}" letter-spacing="-1">${d.contributions.toLocaleString("en-US")} contributions<tspan class="m" font-weight="400" font-size="12" fill="${C.muted}" letter-spacing="0" dx="14">busiest ${niceDate} (${busiest.count})</tspan></text>
    <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
      ${polys.join("")}
    </g>
  `);
}

// GitHub avatar as a data URI for the about polaroid; null -> monogram.
async function fetchAvatar() {
  try {
    const res = await fetch(`https://github.com/${USER}.png?size=240`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "image/png";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch (e) {
    console.error("avatar fetch failed, using monogram:", e.message);
    return null;
  }
}

// ---- main ------------------------------------------------------------------
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

  const avatar = await fetchAvatar();
  const outDir = join(ROOT, "assets");
  mkdirSync(join(outDir, "links"), { recursive: true });
  const out = (name, svg) => writeFileSync(join(outDir, name), svg);

  out("header.svg", renderHeader());
  out("about.svg", renderAbout(avatar));
  out("projects.svg", renderSection({ label: "SELECTED WORK", title: "WORKS", count: String(PROJECTS.length).padStart(2, "0"), index: "02 / 05" }));
  for (const p of PROJECTS) out(`${p.file}.svg`, renderCard(p));
  out("featured.svg", renderFeatured());
  out("stack.svg", renderStack());
  out("activity.svg", renderSection({ label: "ON GITHUB", title: "ACTIVITY", index: "04 / 05" }));
  out("connect.svg", renderConnect());
  for (const l of LINKS) out(`links/${l.file}.svg`, renderLink(l));
  out("footer.svg", renderFooter());
  out("stats.svg", renderStats(data));
  out("contribution-city.svg", renderCity(data));
  console.log(`generated all panels; stats + city from ${source}`);
})();
