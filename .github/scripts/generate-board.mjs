
const username = process.env.GH_USER;
const token = process.env.GH_TOKEN;

if (!username || !token) {
  throw new Error("Missing GitHub username or token");
}

const query = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query,
    variables: { login: username }
  })
});

const result = await response.json();

if (!response.ok || result.errors || !result.data?.user) {
  throw new Error(JSON.stringify(result.errors || result));
}

const calendar =
  result.data.user.contributionsCollection.contributionCalendar;

const weeks = calendar.weeks;
const cell = 11;
const gap = 4;
const step = cell + gap;
const left = 38;
const top = 42;
const width = left + weeks.length * step + 8;
const height = top + 7 * step + 28;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");

let squares = "";
let index = 0;

for (let col = 0; col < weeks.length; col++) {
  for (let row = 0; row < weeks[col].contributionDays.length; row++) {
    const day = weeks[col].contributionDays[row];
    
const colors = [
  "rgba(255,255,255,0.025)",
  "#0b251b",
  "#10452c",
  "#197440",
  "#27a653"
];

const squareColor =
  day.contributionCount === 0
    ? "rgba(255,255,255,0.025)"
    : colors[
        Math.min(
          4,
          Math.ceil(day.contributionCount / 3)
        )
      ];

    const x = left + col * step;
    const y = top + row * step;
    const delay = (index * 0.012).toFixed(3);

    squares += `
      
squares += `
  <rect x="${x}" y="${y}"
    width="${cell}" height="${cell}"
    rx="2"
    fill="${squareColor}"
    opacity="0">
    <title>${esc(day.date)}: ${day.contributionCount} contributions</title>
    <animate
      attributeName="opacity"
      from="0"
      to="1"
      dur="0.22s"
      begin="${delay}s"
      fill="freeze" />
  </rect>`;

    index++;
  }
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
  width="${width}" height="${height}"
  viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="12" fill="#0d1117"/>
  <g font-family="Arial, sans-serif" fill="#e6edf3">
    <text x="${left}" y="23" font-size="13" font-weight="600">
      ${esc(username)} · ${calendar.totalContributions} contributions
    </text>
    <g fill="#8b949e" font-size="10">
      <text x="4" y="${top + 10}">Mon</text>
      <text x="4" y="${top + 3 * step + 10}">Wed</text>
      <text x="4" y="${top + 5 * step + 10}">Fri</text>
    </g>
  </g>
  ${squares}
  <g font-family="Arial, sans-serif" font-size="10" fill="#8b949e">
    <text x="${left}" y="${height - 8}">Less</text>
    ${["#161b22","#0e4429","#006d32","#26a641","#39d353"]
      .map((color, i) =>
        `<rect x="${left + 32 + i * 15}" y="${height - 17}"
          width="10" height="10" rx="2" fill="${color}"/>`
      ).join("")}
    <text x="${left + 115}" y="${height - 8}">More</text>
  </g>
</svg>`;

await import("node:fs/promises").then(async (fs) => {
  await fs.mkdir("dist", { recursive: true });
  await fs.writeFile("dist/contribution-board.svg", svg);
});

console.log("Animated contribution board generated.");
