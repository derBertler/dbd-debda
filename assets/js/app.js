const defaultTeams = [
  {
    id: "truemmer-truppe",
    name: "Trümmer-Truppe",
    shorthand: "T-T",
    captain: "Fricky",
    players: ["Absolon", "m4k4n1", "plague.rat", "derbertler"]
  },
  {
    id: "best-of-the-67",
    name: "Best of the 67",
    shorthand: "BOT67",
    captain: "NYX",
    players: ["Nazukii", "Styx", "MST", "Jamiro", "Fuzzy?"],
    notes: ["Not: Texa"]
  },
  {
    id: "die-doenertiere",
    name: "Die Döner Tiere",
    shorthand: "DDT",
    captain: "Nubbelchen",
    players: ["VystraxX", "Luna", "GreenPhoenix200", "Nexize"]
  },
  {
    id: "cookie-gmbh",
    name: "Cookie GmbH",
    shorthand: "C㏓",
    captain: "Yasou_Kazuto",
    players: ["xSilverNeon", "takeo_psycho_of_death", "TheFrechkitty", "SoHoshiko"]
  },
  {
    id: "fruity-cocktails",
    name: "Fruity COCKtails",
    shorthand: "FCT",
    captain: "Perplexicorn",
    players: ["TheRaidenLena", "Nezumi", "Oni", "snipes0375"],
    substitutes: ["AkiraPhantom", "LensSeranity", "Nookyzu"]
  },
  {
    id: "tankstellen-vierer",
    name: "Tankstellen-Vierer",
    shorthand: "T-V",
    captain: "Babyteufel1988",
    players: ["IcySascha", "Malaconpain", "Silent", "CrazySamanda", "Noppi10", "Silkamcfly", "Forestglider"]
  },
  {
    id: "lullaby-for-a-trap",
    name: "Lullaby for a Trap",
    shorthand: "LFAT",
    captain: "RathZa",
    players: ["Choke me Springtrap", "♡~Fiona~♡", "FummelKirsche", "Kingswiss91_TTV"]
  },
  {
    id: "mystery-team",
    name: "???",
    shorthand: "???",
    captain: "...",
    players: []
  }
];

const staffGroups = [
  {
    id: "not-surv",
    title: "Allgemeiner Not-Surv",
    people: ["Arkiy"],
    socials: []
  },
  {
    id: "refs-killer-surv",
    title: "Schiedsrichter - Killer und Surv",
    people: ["LordofDarkness", "RRattenmesser"],
    socials: []
  },
  {
    id: "refs-surv",
    title: "Schiedsrichter - Only Surv",
    people: ["Xaiux", "Hood"],
    socials: []
  },
  {
    id: "notnagel",
    title: "Notnagel",
    people: ["Texa", "Arkiy", "JJ"],
    socials: []
  }
];

const ruleSections = [
  {
    id: "perks",
    title: "Perks",
    blocks: [
      {
        items: [
          "NOED ist verboten.",
          "Survivor und Killer dürfen nur charaktereigene sowie allgemeine Perks spielen.",
          "Suchleiste: General/Allgemein plus Survivor-/Killer-eigene Perks.",
          "Allgemeine Perks sind erlaubt, auch wenn dort ein Charaktername wie Myers angezeigt wird.",
          "In einem Team dürfen keine Überlebenden zur selben Zeit mehrfach vorkommen.",
          "Perkbuilds können vor Abnahme durch den Schiedsrichter jederzeit gewechselt werden.",
          "Nach der Abnahme sind sie für diese Hin-/Rückrunde fest. Danach darf wieder gewechselt werden."
        ]
      }
    ]
  },
  {
    id: "items-stream",
    title: "Items & Stream",
    blocks: [
      {
        heading: "Items und Addons",
        items: [
          "Opfergaben: Maps und Mori sind verboten.",
          "Rote Addons für Survivor und Killer sind verboten.",
          "Lila Gegenstände sind verboten."
        ]
      },
      {
        heading: "Übertragung",
        items: [
          "Discord-Übertragung und/oder YouTube-/Twitch-Stream ist verpflichtend.",
          "Darüber werden Punkte gezählt und Regeln gewährleistet.",
          "Fullmute im Channel ist für Spielende verboten, damit Orga und Schiedsrichter euch erreichen können."
        ]
      }
    ]
  },
  {
    id: "scoring",
    title: "Punkte",
    blocks: [
      {
        heading: "Killer",
        table: [
          ["Killer pro Tötung", "0,5", "2"]
        ]
      },
      {
        heading: "Survivor",
        table: [
          ["Generator", "1", "5"],
          ["Totems", "0,25", "1,25 + 1 wenn alle 5"],
          ["Am Haken", "-0,5", "-6"],
          ["Unhook", "0,5", "4"],
          ["Self-Unhook", "+0,5", "2"],
          ["Entkommen", "1", "4"],
          ["Luke", "0,5", "0,5"]
        ]
      },
      {
        heading: "Tod/Haken",
        items: [
          "Maximum: 17,75 Punkte.",
          "Haken, Haken, Tod = -1,5.",
          "Haken, Tod = -1.",
          "Tod = -0,5."
        ]
      },
      {
        heading: "Pentimento / Totems",
        items: [
          "Wenn der Killer ein Totem wieder aufstellt, werden am Ende Totems gegengerechnet.",
          "Beispiel: 10 gemachte zu 5 neu gemachte Totems = 2,25 Punkte für die Survivor.",
          "Beispiel: 9 gemachte zu 4 neu entfachte Totems = 1,00 Punkte, also kein Extra-Punkt."
        ]
      }
    ]
  },
  {
    id: "bracket",
    title: "Turnierbaum",
    blocks: [
      {
        items: [
          "Gewöhnlicher Turnierbaum mit Achtelfinale, Halbfinale und Finale.",
          "Jedes Aufeinandertreffen besteht aus Doppelrunden.",
          "Hin: Team 1 spielt 4 Survivor, Team 2 spielt 1 Killer.",
          "Rück: Team 2 spielt 4 Survivor, Team 1 spielt 1 Killer.",
          "Wer in der Hinrunde spielt, kann nicht an der Rückrunde teilnehmen.",
          "Nach der ersten Hin- und Rückrunde kann die Konstellation der Survivor- und Killer-Spieler für die zweite Hin- und Rückrunde geändert werden."
        ]
      }
    ]
  },
  {
    id: "schedule-flow",
    title: "Tagesabläufe",
    blocks: [
      {
        items: [
          "Insgesamt sind 4 Sonntage geplant.",
          "Tag 1: 1. vs 2. + 3. vs 4. = 8 Matches, ca. 4h.",
          "Tag 2: 5. vs 6. + 7. vs 8. = 8 Matches, ca. 4h.",
          "Tag 3: 2. vs 4. + 6. vs 8. = 8 Matches, ca. 4h + Loser-Finale mit 2 Matches, ca. 1h.",
          "Tag 4: 1. vs 3. + 5. vs 7. = 8 Matches, ca. 4h + Winner-Finale mit 4 Matches, ca. 2h.",
          "Pro Aufeinandertreffen sind 2h eingeplant."
        ]
      }
    ]
  },
  {
    id: "conduct",
    title: "Tunneln / Sluggen / Campen",
    blocks: [
      {
        heading: "Tunneln",
        items: [
          "Direkt nach einer Rettung vom Haken denselben Survivor erneut jagen und ausschalten.",
          "Singularität: Der zuletzt hängende Survivor darf nicht durch die Cam beschossen werden.",
          "Ein Survivor, der sich unklug anstellt oder bodyblocked, darf dennoch gedowned werden."
        ]
      },
      {
        heading: "Sluggen",
        items: [
          "Bis zu 3 Survivor dürfen gedowned werden.",
          "Bevor es zum 4. Down kommt, muss einer aufgehangen werden.",
          "Bei 3 überlebenden Survivor: 2 Downs vor dem 3.",
          "Bei nur noch 2 überlebenden Survivor entfällt die Regel."
        ]
      },
      {
        heading: "Campen",
        items: [
          "Dem Haken Aufmerksamkeit geben, statt nach einem anderen Survivor zu suchen."
        ]
      },
      {
        heading: "Wichtig",
        items: [
          "Bei allen Matches schaut dauerhaft ein Schiedsrichter beim Killer zu.",
          "Regelhinweise des Schiedsrichters sind sofort zu beachten."
        ]
      }
    ]
  },
  {
    id: "maps-bans",
    title: "Maps & Banns",
    blocks: [
      {
        heading: "Maps",
        items: [
          "Die Ober-Kategorie wird mit einem Glücksrad ermittelt.",
          "Beispiele: Das McMillan-Anwesen, Springwood, Verkümmerte Insel.",
          "Danach wird ein Rad mit Zahlen von 1-10 gedreht.",
          "Mit dieser Zahl wird ingame abgezählt, welche Map genau gespielt wird.",
          "Beispiel: Bei einer 7 wäre es bei McMillan Kohlelager I.",
          "Beispiel: Bei Coldwind Farm wäre die 7 Das Thompson-Haus."
        ]
      },
      {
        heading: "Banns",
        items: [
          "Jedes Team kann 2 Killer und 2 Ober-Kategorien bannen.",
          "Diese Banns gelten für das ganze Turnier.",
          "Gebannte Killer sind auch vom eigenen Team nicht spielbar.",
          "Banns bitte vor Turnierstart an @RRattenmeser weitergeben."
        ]
      }
    ]
  },
  {
    id: "team-signup",
    title: "Team & Anmeldung",
    blocks: [
      {
        items: [
          "Twitch-gerechter Teamname ist wichtig.",
          "5er Teams werden bei der Anmeldung priorisiert.",
          "4er Teams sind möglich, falls es nicht genug 5er Teams gibt.",
          "Es wird nur 8 Teams geben; schnelle Anmeldung kann helfen.",
          "Anmeldung bis 27.06. 22 Uhr per DM an @RRattenmeser."
        ]
      }
    ]
  },
  {
    id: "dates",
    title: "Termine",
    blocks: [
      {
        items: [
          "Jeden Sonntag des 7. Monats.",
          "Juli: 05. + 12. + 19. + 26.",
          "Zeit: 14/15 Uhr - 19/20/21 Uhr.",
          "Spielzeiten bitte immer am Mo/Di der Woche mit @RRattenmeser absprechen.",
          "Notfall-Termin Finale: 02.08."
        ]
      }
    ]
  }
];

const defaultGameDays = [
  {
    id: "2026-07-05",
    title: "05.07.",
    matches: [
      createMatch("2026-07-05-match-1", "cookie-gmbh", "fruity-cocktails", "15 - 17 Uhr"),
      createMatch("2026-07-05-match-2", "die-doenertiere", "best-of-the-67", "17 - 19/20 Uhr")
    ]
  },
  {
    id: "2026-07-12",
    title: "12.07.",
    matches: [
      createMatch("2026-07-12-match-1", "tankstellen-vierer", "mystery-team", "14/15 - 16/17 Uhr"),
      createMatch("2026-07-12-match-2", "lullaby-for-a-trap", "truemmer-truppe", "16/17 - 18/19/20 Uhr")
    ]
  },
  {
    id: "2026-07-19",
    title: "19.07.",
    note: "not known yet",
    matches: []
  },
  {
    id: "2026-07-26",
    title: "26.07.",
    note: "not known yet",
    matches: []
  }
];

const TEAMS_STORAGE_KEY = "tournament-teams-v1";
const SCHEDULE_STORAGE_KEY = "tournament-schedule-v2";
const PREVIOUS_TEAMS_STORAGE_KEY = "tournament-lineup-v3";
const LEGACY_STORAGE_KEYS = ["tournament-lineup-v2", "tournament-lineup-v1"];

let teams = loadTeams();
let gameDays = loadGameDays();
let selectedTeamId = teams[0]?.id ?? null;
let selectedStaffGroupId = staffGroups[0]?.id ?? null;
let selectedRuleSectionId = ruleSections[0]?.id ?? null;

const gameDaysList = document.querySelector("#gameDaysList");
const teamsList = document.querySelector("#teamsList");
const staffList = document.querySelector("#staffList");
const rulesList = document.querySelector("#rulesList");
const standingsTable = document.querySelector("#standingsTable");

const teamsModal = document.querySelector("#teamsModal");
const staffModal = document.querySelector("#staffModal");
const rulesModal = document.querySelector("#rulesModal");

document.querySelector("#openTeams").addEventListener("click", () => {
  selectedTeamId = selectedTeamId ?? sortTeamsByName(teams)[0]?.id ?? null;
  renderTeamsModal();
  teamsModal.showModal();
});

document.querySelector("#openStaff").addEventListener("click", () => {
  renderStaffModal();
  staffModal.showModal();
});

document.querySelector("#openRules").addEventListener("click", () => {
  renderRulesModal();
  rulesModal.showModal();
});

document.querySelector("#resetScores").addEventListener("click", () => {
  gameDays = cloneGameDays(defaultGameDays);
  saveGameDays();
  render();
});

gameDaysList.addEventListener("input", (event) => {
  const scoreInput = event.target.closest("[data-match-id][data-score-side]");

  if (!scoreInput) {
    return;
  }

  updateMatchScore(scoreInput.dataset.matchId, scoreInput.dataset.scoreSide, scoreInput.value);
  saveGameDays();
  renderStandings();
});

teamsList.addEventListener("click", (event) => {
  const teamButton = event.target.closest("[data-team-id]");

  if (!teamButton) {
    return;
  }

  selectedTeamId = teamButton.dataset.teamId;
  renderTeamsModal();
});

staffList.addEventListener("click", (event) => {
  const staffButton = event.target.closest("[data-staff-group-id]");

  if (!staffButton) {
    return;
  }

  selectedStaffGroupId = staffButton.dataset.staffGroupId;
  renderStaffModal();
});

rulesList.addEventListener("click", (event) => {
  const ruleButton = event.target.closest("[data-rule-section-id]");

  if (!ruleButton) {
    return;
  }

  selectedRuleSectionId = ruleButton.dataset.ruleSectionId;
  renderRulesModal();
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

function createMatch(id, homeTeamId, awayTeamId, time = "", homeScore = "", awayScore = "") {
  return {
    id,
    time,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore
  };
}

function cloneTeams(list) {
  return list.map((team) => ({
    ...team,
    players: [...team.players],
    substitutes: [...(team.substitutes ?? [])],
    notes: [...(team.notes ?? [])]
  }));
}

function cloneGameDays(list) {
  return list.map((gameDay) => ({
    ...gameDay,
    matches: gameDay.matches.map((match) => ({ ...match }))
  }));
}

function loadTeams() {
  try {
    const saved = localStorage.getItem(TEAMS_STORAGE_KEY)
      ?? localStorage.getItem(PREVIOUS_TEAMS_STORAGE_KEY)
      ?? LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const parsed = saved ? JSON.parse(saved) : null;

    if (!Array.isArray(parsed)) {
      return cloneTeams(defaultTeams);
    }

    return parsed.map((team, index) => normalizeTeam(team, index));
  } catch {
    return cloneTeams(defaultTeams);
  }
}

function loadGameDays() {
  try {
    const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;

    if (!Array.isArray(parsed)) {
      return cloneGameDays(defaultGameDays);
    }

    return parsed.map((gameDay, index) => normalizeGameDay(gameDay, index));
  } catch {
    return cloneGameDays(defaultGameDays);
  }
}

function normalizeTeam(team, index) {
  const defaultTeam = defaultTeams[index] ?? {};

  return {
    id: team.id ?? defaultTeam.id,
    name: defaultTeam.name ?? team.name,
    shorthand: defaultTeam.shorthand ?? team.shorthand,
    captain: defaultTeam.captain ?? team.captain ?? team.team_leader,
    players: Array.isArray(defaultTeam.players) ? defaultTeam.players : team.players ?? [],
    substitutes: Array.isArray(defaultTeam.substitutes) ? defaultTeam.substitutes : team.substitutes ?? [],
    notes: Array.isArray(defaultTeam.notes) ? defaultTeam.notes : team.notes ?? []
  };
}

function normalizeGameDay(gameDay, index) {
  const defaultGameDay = defaultGameDays[index] ?? {};
  const defaultMatches = defaultGameDay.matches ?? [];

  return {
    id: gameDay.id ?? defaultGameDay.id,
    title: gameDay.title ?? defaultGameDay.title,
    note: gameDay.note ?? defaultGameDay.note ?? "",
    matches: Array.isArray(gameDay.matches)
      ? gameDay.matches.map((match, matchIndex) => normalizeMatch(match, defaultMatches[matchIndex]))
      : defaultMatches.map((match) => ({ ...match }))
  };
}

function normalizeMatch(match, defaultMatch = {}) {
  return {
    id: match.id ?? defaultMatch.id,
    time: match.time ?? defaultMatch.time ?? "",
    homeTeamId: match.homeTeamId ?? defaultMatch.homeTeamId,
    awayTeamId: match.awayTeamId ?? defaultMatch.awayTeamId,
    homeScore: normalizeScore(match.homeScore),
    awayScore: normalizeScore(match.awayScore)
  };
}

function saveGameDays() {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(gameDays));
}

function normalizeScore(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortTeamsByName(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

function getTeam(teamId) {
  return teams.find((team) => team.id === teamId);
}

function getTeamLabel(teamId) {
  const team = getTeam(teamId);
  return team ? `${team.name} [${team.shorthand}]` : "TBD";
}

function renderPersonChips(people) {
  if (!people.length) {
    return `<div class="empty-state">not known yet</div>`;
  }

  return people.map((person) => `<div class="player-chip">${escapeHtml(person)}</div>`).join("");
}

function updateMatchScore(matchId, side, value) {
  gameDays = gameDays.map((gameDay) => ({
    ...gameDay,
    matches: gameDay.matches.map((match) => {
      if (match.id !== matchId) {
        return match;
      }

      return {
        ...match,
        [side === "home" ? "homeScore" : "awayScore"]: normalizeScore(value)
      };
    })
  }));
}

function calculateStandings() {
  const totals = new Map(teams.map((team) => [team.id, 0]));

  gameDays.forEach((gameDay) => {
    gameDay.matches.forEach((match) => {
      totals.set(match.homeTeamId, (totals.get(match.homeTeamId) ?? 0) + Number(match.homeScore || 0));
      totals.set(match.awayTeamId, (totals.get(match.awayTeamId) ?? 0) + Number(match.awayScore || 0));
    });
  });

  return teams
    .map((team) => ({
      ...team,
      points: totals.get(team.id) ?? 0
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function renderGameDays() {
  gameDaysList.innerHTML = gameDays.map((gameDay) => `
    <section class="game-day">
      <div class="game-day-header">
        <p class="section-label">Schedule</p>
        <h3>${escapeHtml(gameDay.title)}</h3>
      </div>
      <div class="match-list">
        ${gameDay.matches.length > 0
          ? gameDay.matches.map((match) => renderMatch(match)).join("")
          : `<div class="empty-state">${escapeHtml(gameDay.note || "not known yet")}</div>`}
      </div>
    </section>
  `).join("");
}

function renderMatch(match) {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);

  return `
    <article class="match-card">
      ${match.time ? `<div class="match-time">${escapeHtml(match.time)}</div>` : ""}
      <div class="match-team">
        <span class="match-team-name">${escapeHtml(getTeamLabel(match.homeTeamId))}</span>
        <input
          class="score-input"
          type="number"
          min="0"
          inputmode="numeric"
          value="${escapeHtml(match.homeScore)}"
          aria-label="${escapeHtml(homeTeam?.name ?? "Home team")} score"
          data-match-id="${escapeHtml(match.id)}"
          data-score-side="home"
        />
      </div>
      <div class="match-divider">vs</div>
      <div class="match-team">
        <span class="match-team-name">${escapeHtml(getTeamLabel(match.awayTeamId))}</span>
        <input
          class="score-input"
          type="number"
          min="0"
          inputmode="numeric"
          value="${escapeHtml(match.awayScore)}"
          aria-label="${escapeHtml(awayTeam?.name ?? "Away team")} score"
          data-match-id="${escapeHtml(match.id)}"
          data-score-side="away"
        />
      </div>
    </article>
  `;
}

function renderTeamsModal() {
  const sortedTeams = sortTeamsByName(teams);
  const selectedTeam = sortedTeams.find((team) => team.id === selectedTeamId) ?? sortedTeams[0];
  selectedTeamId = selectedTeam?.id ?? null;

  teamsList.innerHTML = `
    <div class="team-picker">
      ${sortedTeams.map((team) => `
        <button
          class="team-picker-button ${team.id === selectedTeamId ? "is-selected" : ""}"
          type="button"
          data-team-id="${escapeHtml(team.id)}"
        >
          ${escapeHtml(team.name)} [${escapeHtml(team.shorthand)}]
        </button>
      `).join("")}
    </div>
    ${selectedTeam ? `
      <article class="selected-team-panel">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">${escapeHtml(selectedTeam.shorthand)}</p>
            <h3 class="mt-1 text-xl font-black">${escapeHtml(selectedTeam.name)}</h3>
          </div>
        </div>
        <p class="text-sm text-slate-400">Captain: ${escapeHtml(selectedTeam.captain)}</p>
        <p class="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Players</p>
        <div class="mt-4 grid gap-2">
          ${renderPersonChips(selectedTeam.players)}
        </div>
        ${selectedTeam.substitutes.length ? `
          <p class="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Substitutes</p>
          <div class="mt-3 grid gap-2">
            ${renderPersonChips(selectedTeam.substitutes)}
          </div>
        ` : ""}
        ${selectedTeam.notes.length ? `
          <p class="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Notes</p>
          <div class="mt-3 grid gap-2">
            ${selectedTeam.notes.map((note) => `<div class="note-chip">${escapeHtml(note)}</div>`).join("")}
          </div>
        ` : ""}
      </article>
    ` : ""}
  `;
}

function renderStaffModal() {
  const selectedGroup = staffGroups.find((group) => group.id === selectedStaffGroupId) ?? staffGroups[0];
  selectedStaffGroupId = selectedGroup?.id ?? null;

  staffList.innerHTML = `
    <div class="team-picker">
      ${staffGroups.map((group) => `
        <button
          class="team-picker-button ${group.id === selectedStaffGroupId ? "is-selected" : ""}"
          type="button"
          data-staff-group-id="${escapeHtml(group.id)}"
        >
          ${escapeHtml(group.title)}
        </button>
      `).join("")}
    </div>
    ${selectedGroup ? `
      <article class="selected-team-panel">
        <div class="mb-4">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Staff</p>
          <h3 class="mt-1 text-xl font-black">${escapeHtml(selectedGroup.title)}</h3>
        </div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">People</p>
        <div class="mt-3 grid gap-2">
          ${renderPersonChips(selectedGroup.people)}
        </div>
        <p class="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Socials</p>
        <div class="mt-3 grid gap-2">
          ${selectedGroup.socials.length
            ? selectedGroup.socials.map((social) => `<a class="social-link" href="${escapeHtml(social.url)}" target="_blank" rel="noreferrer">${escapeHtml(social.label)}</a>`).join("")
            : `<div class="empty-state">Socials can be added here.</div>`}
        </div>
      </article>
    ` : ""}
  `;
}

function renderRulesModal() {
  const selectedSection = ruleSections.find((section) => section.id === selectedRuleSectionId) ?? ruleSections[0];
  selectedRuleSectionId = selectedSection?.id ?? null;

  rulesList.innerHTML = `
    <div class="team-picker">
      ${ruleSections.map((section) => `
        <button
          class="team-picker-button ${section.id === selectedRuleSectionId ? "is-selected" : ""}"
          type="button"
          data-rule-section-id="${escapeHtml(section.id)}"
        >
          ${escapeHtml(section.title)}
        </button>
      `).join("")}
    </div>
    ${selectedSection ? `
      <article class="selected-team-panel rules-panel">
        <div class="mb-4">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Rules</p>
          <h3 class="mt-1 text-xl font-black">${escapeHtml(selectedSection.title)}</h3>
        </div>
        ${selectedSection.blocks.map((block) => renderRuleBlock(block)).join("")}
      </article>
    ` : ""}
  `;
}

function renderRuleBlock(block) {
  return `
    <section class="rule-block">
      ${block.heading ? `<p class="rule-heading">${escapeHtml(block.heading)}</p>` : ""}
      ${block.items ? `<div class="rule-list">${block.items.map((item) => `<div class="rule-item">${escapeHtml(item)}</div>`).join("")}</div>` : ""}
      ${block.table ? renderRuleTable(block.table) : ""}
    </section>
  `;
}

function renderRuleTable(rows) {
  return `
    <table class="rule-table">
      <thead>
        <tr>
          <th>Aktion</th>
          <th>Punkte</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(row[0])}</td>
            <td class="${getPointValueClass(row[1])}">${escapeHtml(row[1])}</td>
            <td class="${getPointValueClass(row[2])}">${escapeHtml(row[2])}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function getPointValueClass(value) {
  return String(value).trim().startsWith("-") ? "is-negative" : "is-positive";
}

function renderStandings() {
  const rows = calculateStandings().map((team, index) => `
    <tr>
      <td class="font-black text-rose-200">${index + 1}</td>
      <td>
        <div class="font-bold">${escapeHtml(team.name)}</div>
        <div class="text-xs text-slate-500">${escapeHtml(team.shorthand)}</div>
      </td>
      <td class="text-right font-black text-emerald-200">${team.points}</td>
    </tr>
  `).join("");

  standingsTable.innerHTML = `
    <table class="standings-table">
      <thead class="text-left">
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th class="text-right">Points</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function render() {
  renderGameDays();
  renderTeamsModal();
  renderStaffModal();
  renderRulesModal();
  renderStandings();
}

render();
