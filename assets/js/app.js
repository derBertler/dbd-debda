const defaultTeams = [
  { id: crypto.randomUUID(), name: "Trümmer-Truppe", shorthand: "TT", seed: 1, wins: 0, losses: 0, team_leader: "Fricky", players: ["Absolon", "m4k4n1", "plague.rat", "derbertler"] },
  { id: crypto.randomUUID(), name: "Best of the 67", shorthand: "Bot67", seed: 2, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Mia", "Noah", "Kai"] },
  { id: crypto.randomUUID(), name: "Die Dönertiere", shorthand: "DDT", seed: 3, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Leo", "Ivy", "Ren"] },
  { id: crypto.randomUUID(), name: "Cookie GmbH", shorthand: "C㏓", seed: 4, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Max", "Zoe", "Ari"] },
  { id: crypto.randomUUID(), name: "Fruity COCKtails", shorthand: "FCT", seed: 5, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Max", "Zoe", "Ari"] },
  { id: crypto.randomUUID(), name: "Tankstellen-Vierer", shorthand: "T-V", seed: 6, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Max", "Zoe", "Ari"] },
  { id: crypto.randomUUID(), name: "Lullaby for a Trap", shorthand: "LFAT", seed: 7, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Max", "Zoe", "Ari"] },
  { id: crypto.randomUUID(), name: "???", shorthand: "???", seed: 8, wins: 0, losses: 0, team_leader: "Yasou_Kazuto", players: ["Max", "Zoe", "Ari"] }
];

const STORAGE_KEY = "tournament-lineup-v1";

let teams = loadTeams();

const lineupGrid = document.querySelector("#lineupGrid");
const teamsList = document.querySelector("#teamsList");
const standingsTable = document.querySelector("#standingsTable");
const standingsEditor = document.querySelector("#standingsEditor");
const teamCount = document.querySelector("#teamCount");

const teamsModal = document.querySelector("#teamsModal");
const standingsModal = document.querySelector("#standingsModal");

document.querySelector("#openTeams").addEventListener("click", () => teamsModal.showModal());
document.querySelector("#editStandings").addEventListener("click", () => {
  renderStandingsEditor();
  standingsModal.showModal();
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelector("#standingsForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  teams = teams.map((team) => ({
    ...team,
    wins: Number(formData.get(`wins-${team.id}`)),
    losses: Number(formData.get(`losses-${team.id}`)),
    seed: Number(formData.get(`seed-${team.id}`))
  }));

  saveTeams();
  render();
  standingsModal.close();
});

document.querySelector("#resetData").addEventListener("click", () => {
  teams = structuredClone(defaultTeams);
  saveTeams();
  render();
  renderStandingsEditor();
});

function loadTeams() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(defaultTeams);
}

function saveTeams() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

function sortTeamsByStanding(list) {
  return [...list].sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed);
}

function renderLineup() {
  lineupGrid.innerHTML = sortTeamsByStanding(teams).map((team, index) => `
    <article class="team-card">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-bold">${team.name}</h3>
        <span class="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200">#${index + 1}</span>
      </div>
      <p class="mb-4 text-sm text-slate-400">Seed ${team.seed} · ${team.wins}-${team.losses}</p>
      <div class="space-y-2">
        ${team.players.map(player => `<div class="rounded-xl bg-slate-950 px-3 py-2 text-sm">${player}</div>`).join("")}
      </div>
    </article>
  `).join("");

  teamCount.textContent = `${teams.length} teams`;
}

function renderTeamsModal() {
  teamsList.innerHTML = teams.map((team) => `
    <article class="team-card">
      <h3 class="text-lg font-bold">${team.name}</h3>
      <p class="mt-1 text-sm text-slate-400">Seed ${team.seed}</p>
      <ul class="mt-4 list-inside list-disc text-sm text-slate-300">
        ${team.players.map(player => `<li>${player}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderStandings() {
  const rows = sortTeamsByStanding(teams).map((team, index) => `
    <tr class="border-t border-slate-800">
      <td class="py-3 pr-3 font-semibold">${index + 1}</td>
      <td class="py-3 pr-3">${team.name}</td>
      <td class="py-3 pr-3 text-right">${team.wins}</td>
      <td class="py-3 text-right">${team.losses}</td>
    </tr>
  `).join("");

  standingsTable.innerHTML = `
    <table class="w-full text-sm">
      <thead class="text-left text-slate-400">
        <tr>
          <th class="pb-3 pr-3">Rank</th>
          <th class="pb-3 pr-3">Team</th>
          <th class="pb-3 pr-3 text-right">W</th>
          <th class="pb-3 text-right">L</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderStandingsEditor() {
  standingsEditor.innerHTML = teams.map((team) => `
    <div class="grid gap-3 rounded-2xl border border-slate-800 p-4 sm:grid-cols-[1fr_90px_90px_90px]">
      <div>
        <label class="text-sm text-slate-400">Team</label>
        <p class="font-semibold">${team.name}</p>
      </div>
      <label class="text-sm text-slate-400">
        Seed
        <input class="input mt-1" type="number" min="1" name="seed-${team.id}" value="${team.seed}" />
      </label>
      <label class="text-sm text-slate-400">
        Wins
        <input class="input mt-1" type="number" min="0" name="wins-${team.id}" value="${team.wins}" />
      </label>
      <label class="text-sm text-slate-400">
        Losses
        <input class="input mt-1" type="number" min="0" name="losses-${team.id}" value="${team.losses}" />
      </label>
    </div>
  `).join("");
}

function render() {
  renderLineup();
  renderTeamsModal();
  renderStandings();
}

render();
