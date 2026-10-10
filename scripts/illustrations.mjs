// Hand-built vector "stickers" for the profile panels. Every function returns
// SVG markup drawn around (0,0); callers position it with sticker(). Colors are
// passed in so the palette stays defined in generate-readme-assets.mjs.

// Filter that gives any shape a die-cut sticker look: cream border, thin red
// edge and a soft drop shadow. Include once per SVG (in <defs>).
export const STICKER_FILTER = `
<filter id="stk" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d1"/>
  <feFlood flood-color="#fbf7ee"/><feComposite in2="d1" operator="in" result="cream"/>
  <feMorphology in="SourceAlpha" operator="dilate" radius="6.3" result="d2"/>
  <feFlood flood-color="#e05a3f"/><feComposite in2="d2" operator="in" result="edge"/>
  <feGaussianBlur in="d2" stdDeviation="3.5"/><feOffset dx="3" dy="5" result="b"/>
  <feFlood flood-color="#0d0f0e" flood-opacity="0.28"/><feComposite in2="b" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="edge"/><feMergeNode in="cream"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

// `loose` is drawn on top without the die-cut outline (steam, motion trails).
export const sticker = (art, x, y, rot = 0, scale = 1, loose = "") =>
  `<g transform="translate(${x},${y}) rotate(${rot}) scale(${scale})">${loose}<g filter="url(#stk)">${art}</g></g>`;

// ---- mechanical keyboard ----------------------------------------------------
export function keyboard(C) {
  const u = 15, pad = 8;
  // [width in units, color key] per row; every row sums to 15u
  const rows = [
    [[1, "r"], ...Array(12).fill([1]), [2]],
    [[1.5], ...Array(12).fill([1]), [1.5]],
    [[1.75], ...Array(11).fill([1]), [2.25, "r"]],
    [[2.25, "b"], ...Array(10).fill([1]), [1.75, "b"], [1, "b"]],
    [[1.25], [1.25], [1.25], [7], [1.25], [1, "b"], [1, "b"], [1, "b"]],
  ];
  const W = 15 * u + pad * 2, H = rows.length * u + pad * 2;
  const tone = { r: [C.red, "#8f3626"], b: [C.blue, "#233f9e"], _: ["#efe8d8", "#cfc5b0"] };
  let keys = "";
  rows.forEach((row, ri) => {
    let x = -W / 2 + pad;
    const y = -H / 2 + pad + ri * u;
    for (const [w, c] of row) {
      const [top, side] = tone[c || "_"];
      keys += `<rect x="${x + 0.8}" y="${y + 0.8}" width="${w * u - 1.6}" height="${u - 1.6}" rx="2.6" fill="${side}"/>`;
      keys += `<rect x="${x + 2.2}" y="${y + 1.4}" width="${w * u - 4.4}" height="${u - 5}" rx="2" fill="${top}"/>`;
      x += w * u;
    }
  });
  return `<rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="${H}" rx="9" fill="#2a2c2b"/>
    <rect x="${-W / 2 + 3}" y="${-H / 2 + 3}" width="${W - 6}" height="${H - 6}" rx="7" fill="#1c1e1c"/>${keys}
    <text x="${-W / 2 + pad + 7.5}" y="${-H / 2 + pad + 9}" text-anchor="middle" font-family="Arial" font-size="4" font-weight="700" fill="#fbf7ee">ESC</text>`;
}

// ---- phone showing a screen-time dashboard (ReThink) -----------------------
export function phone(C) {
  const bars = [14, 22, 9, 28, 18, 32, 12];
  const barSvg = bars.map((h, i) =>
    `<rect x="${-24 + i * 7}" y="${40 - h}" width="4.6" height="${h}" rx="1.5" fill="${i === 5 ? C.red : C.ink}" fill-opacity="${i === 5 ? 1 : 0.75}"/>`).join("");
  return `<rect x="-36" y="-70" width="72" height="140" rx="13" fill="${C.ink}"/>
    <rect x="-32" y="-66" width="64" height="132" rx="10" fill="#f7f2e7"/>
    <rect x="-10" y="-62" width="20" height="5" rx="2.5" fill="${C.ink}"/>
    <text x="-24" y="-40" class="m" font-size="5.5" fill="${C.muted}" letter-spacing="0.5">SCREEN TIME</text>
    <text x="-25" y="-24" class="d" font-size="15" fill="${C.ink}" letter-spacing="-0.5">2h 14m</text>
    <text x="-24" y="-14" class="m" font-size="5" fill="${C.red}">↓ 38% vs last week</text>
    ${barSvg}
    <line x1="-25" y1="40.5" x2="25" y2="40.5" stroke="${C.ink}" stroke-opacity="0.3" stroke-width="0.6"/>
    <rect x="-24" y="48" width="48" height="10" rx="5" fill="${C.blue}"/>
    <text x="0" y="55" text-anchor="middle" class="m" font-size="5" fill="#fbf7ee">LIMIT SET ✓</text>`;
}

// ---- small code window (sits inline between headline words) ---------------
export function codeCard(C) {
  const lines = [
    [`<tspan fill="${C.blue}">const</tspan> ship = <tspan fill="${C.blue}">async</tspan> () =&gt; {`],
    [`  <tspan fill="${C.blue}">await</tspan> build();`],
    [`  <tspan fill="${C.blue}">await</tspan> test();`],
    [`  <tspan fill="${C.blue}">return</tspan> <tspan fill="${C.red}">users</tspan>;`],
    [`}`],
  ];
  return `<rect x="-74" y="-46" width="148" height="92" rx="4" fill="#fbf7ee" stroke="${C.ink}" stroke-width="3"/>
    <text x="-64" y="-30" font-family="Georgia,serif" font-size="8" fill="${C.ink}">ship.js, a short history</text>
    <line x1="-64" y1="-24" x2="64" y2="-24" stroke="${C.ink}" stroke-opacity="0.2"/>
    <g class="m" font-size="7.4" fill="${C.ink}" xml:space="preserve">${lines.map((l, i) =>
      `<text x="-64" y="${-10 + i * 11}">${l[0]}</text>`).join("")}</g>
    <rect x="-28" y="30" width="4" height="8" fill="${C.red}"><animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1s" repeatCount="indefinite"/></rect>`;
}

// ---- coffee mug with animated steam ---------------------------------------
export function mugSteam(C) {
  return [-14, 0, 14].map((x, i) =>
    `<path d="M${x},-48 c-6,-8 6,-14 0,-22 c-6,-8 6,-14 0,-20" fill="none" stroke="${C.muted}" stroke-width="2.4" stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0;0.6;0" dur="3s" begin="${i * 0.8}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0,6;0,-4" dur="3s" begin="${i * 0.8}s" repeatCount="indefinite"/></path>`).join("");
}

export function mug(C) {
  return `<path d="M30,-22 a20,20 0 1,1 0,40" fill="none" stroke="${C.red}" stroke-width="9"/>
    <path d="M-36,-38 h72 v62 a14,14 0 0 1 -14,14 h-44 a14,14 0 0 1 -14,-14 z" fill="${C.red}"/>
    <ellipse cx="0" cy="-38" rx="36" ry="7" fill="#9e3c2c"/>
    <ellipse cx="0" cy="-37" rx="31" ry="5" fill="#3b2418"/>
    <rect x="-24" y="-16" width="48" height="26" rx="4" fill="#fbf7ee"/>
    <text x="0" y="2" text-anchor="middle" class="m" font-size="13" fill="${C.ink}">&lt;/&gt;</text>`;
}

// ---- rubber debugging duck -------------------------------------------------
export function duck(C) {
  return `<path d="M-46,8 c0,-26 24,-34 48,-26 c14,4 26,2 38,-6 c4,18 -2,48 -40,52 h-22 c-16,0 -24,-8 -24,-20 z" fill="#f6c844"/>
    <path d="M-14,4 c10,-10 30,-8 36,4 c-10,8 -26,8 -36,-4 z" fill="#e2ad2b"/>
    <circle cx="-22" cy="-30" r="24" fill="#f6c844"/>
    <path d="M-46,-30 c-10,-2 -18,2 -20,8 c8,4 18,2 22,-2 z" fill="#ef7f2d"/>
    <circle cx="-30" cy="-36" r="4.2" fill="${C.ink}"/><circle cx="-31.4" cy="-37.4" r="1.4" fill="#fff"/>`;
}

// ---- sticky note: the honest todo list ------------------------------------
export function stickyNote(C) {
  const items = [["build", true], ["ship", true], ["sleep", false]];
  return `<path d="M-48,-46 h96 v78 l-16,16 h-80 z" fill="${C.yellow}"/>
    <path d="M48,32 l-16,16 v-16 z" fill="#d9b25e"/>
    <rect x="-14" y="-52" width="28" height="12" fill="#fbf7ee" fill-opacity="0.75" transform="rotate(-4)"/>
    <text x="-38" y="-24" class="m" font-size="11" fill="${C.ink}" letter-spacing="0.5">TODO:</text>
    ${items.map(([t, done], i) => {
      const y = -6 + i * 17;
      return `<rect x="-38" y="${y - 8}" width="9" height="9" rx="1.5" fill="none" stroke="${C.ink}" stroke-width="1.3"/>
        ${done ? `<path d="M-36.5,${y - 4} l2.5,3 l5,-7" fill="none" stroke="${C.red}" stroke-width="2" stroke-linecap="round"/>` : ""}
        <text x="-24" y="${y}" class="m" font-size="10.5" fill="${C.ink}"${done ? ` text-decoration="line-through"` : ""}>${t}</text>`;
    }).join("")}`;
}

// ---- project card art ------------------------------------------------------
export function swapCards(C) {
  const card = (x, y, r, fill, fg, label, glyph) =>
    `<g transform="translate(${x},${y}) rotate(${r})"><rect x="-24" y="-32" width="48" height="64" rx="6" fill="${fill}"/>
      <text y="4" text-anchor="middle" class="d" font-size="20" fill="${fg}">${glyph}</text>
      <text y="22" text-anchor="middle" class="m" font-size="6.5" fill="${fg}" letter-spacing="0.6">${label}</text></g>`;
  return `${card(-18, 0, -10, C.blue, "#fbf7ee", "TEACH", "JS")}${card(18, 4, 9, C.yellow, C.ink, "LEARN", "UI")}`;
}

export function gradCap(C) {
  return `<path d="M-30,-2 v18 c0,10 60,10 60,0 v-18 z" fill="${C.ink2}"/>
    <polygon points="0,-28 52,-8 0,12 -52,-8" fill="${C.ink}"/>
    <circle cx="0" cy="-8" r="3.5" fill="${C.yellow}"/>
    <path d="M0,-8 L38,4 v22" fill="none" stroke="${C.yellow}" stroke-width="2.6"/>
    <path d="M33,26 h10 l2,14 h-14 z" fill="${C.yellow}"/>`;
}

export function chatBubbles(C) {
  const dots = [0, 1, 2].map((i) =>
    `<circle cx="${12 + i * 10}" cy="14" r="3" fill="#fbf7ee"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="${i * 0.2}s" repeatCount="indefinite"/></circle>`).join("");
  return `<path d="M-46,-40 h56 a10,10 0 0 1 10,10 v18 a10,10 0 0 1 -10,10 h-40 l-12,10 v-10 h-4 a10,10 0 0 1 -10,-10 v-18 a10,10 0 0 1 10,-10 z" fill="${C.pink}"/>
    <text x="-38" y="-17" class="s" font-size="11" fill="${C.ink}">you up?</text>
    <path d="M-4,0 h50 a10,10 0 0 1 10,10 v10 a10,10 0 0 1 -10,10 h-4 v10 l-12,-10 h-34 a10,10 0 0 1 -10,-10 v-10 a10,10 0 0 1 10,-10 z" fill="${C.blue}"/>
    ${dots}`;
}

export function editorKey(C) {
  return `<rect x="-50" y="-38" width="100" height="70" rx="6" fill="#1e1f1d"/>
    <circle cx="-41" cy="-30" r="2.4" fill="${C.red}"/><circle cx="-33" cy="-30" r="2.4" fill="${C.yellow}"/><circle cx="-25" cy="-30" r="2.4" fill="#7fb069"/>
    ${[[-40, 46, C.blue], [-34, 30, C.pink], [-34, 52, "#e5dfd2"], [-40, 22, C.yellow], [-34, 40, "#e5dfd2"]].map(([x, w, c], i) =>
      `<rect x="${x}" y="${-18 + i * 9}" width="${w}" height="4" rx="2" fill="${c}" fill-opacity="0.85"/>`).join("")}
    <g transform="translate(30,26) rotate(-8)">
      <rect x="-24" y="-17" width="48" height="34" rx="6" fill="#cfc5b0"/>
      <rect x="-20" y="-15" width="40" height="26" rx="4" fill="#efe8d8"/>
      <text y="3" text-anchor="middle" class="m" font-size="10" fill="${C.ink}">Alt+S</text>
    </g>`;
}

export function planeTrail(C) {
  return `<path d="M-130,46 q40,-10 60,-40 q14,-22 34,-14" fill="none" stroke="${C.ink}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="5 6"/>`;
}

export function paperPlane(C) {
  return `<polygon points="-20,-4 48,-34 10,26" fill="#fbf7ee"/>
    <polygon points="-20,-4 48,-34 4,6" fill="#e9e1cf"/>
    <polygon points="4,6 48,-34 10,26 6,10" fill="#d8ceb8"/>
    <path d="M-20,-4 L48,-34 L10,26 Z M4,6 L48,-34" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

// Polaroid around the GitHub avatar (data URI); falls back to a monogram.
export function polaroid(C, avatar, caption) {
  const photo = avatar
    ? `<clipPath id="ph"><rect x="-52" y="-62" width="104" height="104"/></clipPath><image href="${avatar}" x="-52" y="-62" width="104" height="104" preserveAspectRatio="xMidYMid slice" clip-path="url(#ph)"/>`
    : `<rect x="-52" y="-62" width="104" height="104" fill="${C.blue}"/><text y="4" text-anchor="middle" class="d" font-size="40" fill="#fbf7ee">RV</text>`;
  return `<rect x="-62" y="-72" width="124" height="150" rx="2" fill="#fbf7ee"/>${photo}
    <text y="64" text-anchor="middle" class="m" font-size="9" fill="${C.ink2}">${caption}</text>`;
}
