let roles = [];
let choices = [];
let numberPlayers = 0;
let playerNames = [];
let hasChosen = [];

function createPlayers() {
  numberPlayers = parseInt(document.getElementById("playerCount").value);
  const game = document.getElementById("game");
  game.innerHTML = ""; // Spielfeld leeren

  roles = new Array(numberPlayers).fill("-");
  choices = new Array(numberPlayers).fill(0);
  hasChosen = new Array(numberPlayers).fill(false);
  updateCalculateButtonVisibility();
  playerNames = new Array(numberPlayers).fill("");

  for (let i = 0; i < numberPlayers; i++) {
    const div = document.createElement("div");
    div.className = "player";
    div.id = `player-${i}`;

    div.innerHTML = `
      <h3>Spieler ${i + 1}</h3>
      <div class="input-wrapper">
        Name: <input type="text" placeholder="Spielername" 
               oninput="playerNames[${i}] = this.value; updateDropdowns();">
      </div>
      <div class="select-wrapper">
        Rolle:
        <div class="select-container">
          <select id="role-${i}" onchange="setRole(${i}, this.value)">
            <option value="-">Normal</option>
            <option value="+">Mediziner</option>
          </select>
          <div class="overlay"></div>
        </div>
      </div>
      <div class="select-wrapper">
        Ziel:
        <div class="select-container">
			<select id="target-${i}"
				onfocus="hasChosen[${i}] = true;updateCalculateButtonVisibility();"
				onchange="choices[${i}] = parseInt(this.value);">
            ${createChoiceOptions(i)}
          </select>
          <div class="overlay"></div>
        </div>
      </div>
    `;
    game.appendChild(div);
  }

  // Overlays dauerhaft sichtbar
  document.querySelectorAll('.overlay').forEach(o => o.style.display = "block");
}

function createChoiceOptions(playerIndex) {
  let html = `<option value="0">Niemand</option>`;
  for (let i = 0; i < numberPlayers; i++) {
    if (i !== playerIndex) {
      const name = playerNames[i] || `Spieler ${i + 1}`;
      html += `<option value="${i + 1}">${name}</option>`;
    }
  }
  return html;
}

function updateDropdowns() {
  for (let i = 0; i < numberPlayers; i++) {
    const select = document.getElementById(`target-${i}`);
    if (select) select.innerHTML = createChoiceOptions(i);
  }
}

function setRole(index, value) {
  if (value === "+") {
    // Es darf nur EINEN Mediziner geben
    for (let i = 0; i < roles.length; i++) {
      if (i !== index && roles[i] === "+") {
        roles[i] = "-";
        const otherSelect = document.getElementById(`role-${i}`);
        if (otherSelect) otherSelect.value = "-";
      }
    }
  }

  // Rolle des Spielers explizit setzen (auch zurück auf "-")
  roles[index] = value;
}

function calculateDamage() {
  // damage_count berechnen (Mediziner erhöhen nicht)
  let damage_count = new Array(numberPlayers).fill(0);
  choices.forEach((c, attacker) => {
    if (c > 0 && roles[attacker] !== "+") damage_count[c - 1]++;
  });

  // Vorläufige Schadensverursacher
  let causesDamage = new Array(numberPlayers).fill(false);
  for (let i = 0; i < numberPlayers; i++) {
    if (roles[i] !== "+" && damage_count[i] === 0) causesDamage[i] = true;
  }

  // Kreisprüfung (nur Spieler ohne Mediziner)
  let visited = new Array(numberPlayers).fill(false);
  for (let i = 0; i < numberPlayers; i++) {
    if (visited[i] || damage_count[i] !== 1 || roles[i] === "+") continue;

    let chain = [];
    let current = i;
    let validCycle = true;

    while (!visited[current]) {
      if (roles[current] === "+" || damage_count[current] !== 1 || choices[current] === 0) {
        validCycle = false;
        break;
      }
      visited[current] = true;
      chain.push(current);
      let next = choices[current] - 1;
      if (chain.includes(next)) break;
      current = next;
    }

    if (validCycle && chain.includes(current)) chain.forEach(p => causesDamage[p] = true);
  }

  // Schaden verteilen
  let damage = new Array(numberPlayers).fill("-");
  const medIndex = roles.findIndex(r => r === "+");
  let protectedByMed = medIndex !== -1 && choices[medIndex] > 0 ? choices[medIndex] - 1 : null;
  let medTargeted = medIndex !== -1 && choices.some((c,j) => c-1 === medIndex && j !== medIndex);

  for (let i = 0; i < numberPlayers; i++) {
    if (!causesDamage[i] || roles[i] === "+") continue;
    const target = choices[i] - 1;
    if (target < 0) continue;
    if (target === protectedByMed && !medTargeted) continue;
    damage[target] = "+";
  }

  // Spieler markieren
  for (let i = 0; i < numberPlayers; i++) {
    const playerDiv = document.getElementById(`player-${i}`);
    if (damage[i] === "+") playerDiv?.classList.add("damaged");
    else playerDiv?.classList.remove("damaged");
  }

  // Ziel-Auswahl zurücksetzen
  for (let i = 0; i < numberPlayers; i++) {
    choices[i] = 0;
    const select = document.getElementById(`target-${i}`);
    if (select) select.value = 0;
  }
  for (let i = 0; i < numberPlayers; i++) {
  hasChosen[i] = false;
  }

updateCalculateButtonVisibility();
}

function updateCalculateButtonVisibility() {
  const btn = document.getElementById("calculateBtn");
  if (!btn) return;

  const allChosen = hasChosen.length > 0 && hasChosen.every(v => v === true);
  btn.style.display = allChosen ? "block" : "none";
}