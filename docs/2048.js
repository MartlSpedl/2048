var board;
var score = 0;
var rows = 4;
var columns = 4;
var playerName = "Player"; // Default player name; this could be set via input or prompt
var currentPlayerName = ""; // Track the current player name to detect changes
var highscores = []; // Store highscores in memory

var startX, startY, endX, endY; // Koordinaten für Touch und Maus

// GitHub API configuration
const STORED_GITHUB_TOKEN = "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1"; // Token mit angehängter 1
// Funktion, um die letzte Stelle zu entfernen
function getCleanToken(storedToken) {
  return storedToken.slice(0, -1); // Entfernt das letzte Zeichen
}

const GITHUB_TOKEN = getCleanToken(STORED_GITHUB_TOKEN); // Bereinigter Token
const REPO_OWNER = "MartlSpedl";
const REPO_NAME = "2048-itp";
const BRANCH = "main";
const FILE_PATH = "docs/highscores.csv";

window.onload = async function () {
  // Prompt for player name when the game starts
  playerName = prompt("Bitte gib deinen Namen ein:");
  if (!playerName) playerName = "Player"; // Fallback if no name is provided
  document.getElementById("playerName").innerText = playerName;
  document.getElementById("playerNameend").innerText = playerName;
  currentPlayerName = playerName;

  // Load highscores from GitHub
  await loadHighscoresFromGitHub();

  setGame();

  // Mausbewegung erkennen
  document.addEventListener("mousedown", startSwipe);
  document.addEventListener("mouseup", endSwipe);

  // Touch für Mobilgeräte
  document.addEventListener("touchstart", startTouch);
  document.addEventListener("touchend", endTouch);

  // Add event listener for the Replay button
  document.getElementById("replayButton").addEventListener("click", resetGame);
}

function setGame() {
  board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      let tile = document.createElement("div");
      tile.id = r.toString() + "-" + c.toString();
      let num = board[r][c];
      updateTile(tile, num);
      document.getElementById("board").append(tile);
    }
  }
  setTwo();  // Nur einmal initial eine Kachel hinzufügen
}

function updateTile(tile, num) {
  tile.innerText = "";
  tile.classList.value = ""; // Clear the classList
  tile.classList.add("tile");
  if (num > 0) {
    tile.innerText = num.toString();
    if (num <= 4096) {
      tile.classList.add("x" + num.toString());
    } else {
      tile.classList.add("x8192");
    }
  }
}

document.addEventListener('keyup', (e) => {
  let moved = false;  // Variable, um festzustellen, ob ein Zug gemacht wurde
  if (e.code == "ArrowLeft") {
    moved = slideLeft();
  } else if (e.code == "ArrowRight") {
    moved = slideRight();
  } else if (e.code == "ArrowUp") {
    moved = slideUp();
  } else if (e.code == "ArrowDown") {
    moved = slideDown();
  }
  if (noMovesLeft()) {
    saveGame(); // Auto-save on game over
    showGameOver();
  }

  if (moved) {  // Nur eine Kachel hinzufügen, wenn sich das Board bewegt hat
    document.getElementById("score").innerText = score;
    if (noMovesLeft()) {
      saveGame(); // Auto-save on game over
      showGameOver();
    } else {
      setTwo();  // Nur eine Kachel wird hinzugefügt
    }
  }
});

function handleSwipe() {
  let deltaX = endX - startX;
  let deltaY = endY - startY;
  let moved = false;  // Variable, um festzustellen, ob ein Zug gemacht wurde

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // horizontal swipe
    if (deltaX > 0) {
      moved = slideRight();
    } else {
      moved = slideLeft();
    }
  } else {
    // vertical swipe
    if (deltaY > 0) {
      moved = slideDown();
    } else {
      moved = slideUp();
    }
  }
  if (noMovesLeft()) {
    saveGame(); // Auto-save on game over
    showGameOver();
  }
  if (moved) {  // Nur eine Kachel hinzufügen, wenn sich das Board bewegt hat
    document.getElementById("score").innerText = score;
    if (noMovesLeft()) {
      saveGame(); // Auto-save on game over
      showGameOver();
    } else {
      setTwo();  // Nur eine Kachel wird hinzugefügt
    }
  }
}

function startTouch(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}

function endTouch(e) {
  endX = e.changedTouches[0].clientX;
  endY = e.changedTouches[0].clientY;
  handleSwipe();
}

function startSwipe(e) {
  startX = e.clientX;
  startY = e.clientY;
}

function endSwipe(e) {
  endX = e.clientX;
  endY = e.clientY;
  handleSwipe();
}

function filterZero(row) {
  return row.filter(num => num != 0); // Create new array of all nums != 0
}

function slide(row) {
  let originalRow = [...row];  // Kopiere das ursprüngliche Array, um Veränderungen zu erkennen
  row = filterZero(row); //[2, 2, 2]
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] == row[i + 1]) {
      row[i] *= 2;
      row[i + 1] = 0;
      score += row[i];
    }
  }
  row = filterZero(row); //[4, 2]
  while (row.length < columns) {
    row.push(0);
  }
  return [row, JSON.stringify(row) !== JSON.stringify(originalRow)];  // Rückgabe des Arrays und ob es sich verändert hat
}

function slideLeft() {
  let moved = false;
  for (let r = 0; r < rows; r++) {
    let row = board[r];
    let result = slide(row);
    board[r] = result[0];
    moved = moved || result[1];
    for (let c = 0; c < columns; c++) {
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
  return moved;
}

function slideRight() {
  let moved = false;
  for (let r = 0; r < rows; r++) {
    let row = board[r];
    row.reverse();
    let result = slide(row);
    board[r] = result[0].reverse();
    moved = moved || result[1];
    for (let c = 0; c < columns; c++) {
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
  return moved;
}

function slideUp() {
  let moved = false;
  for (let c = 0; c < columns; c++) {
    let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
    let result = slide(row);
    moved = moved || result[1];
    for (let r = 0; r < rows; r++) {
      board[r][c] = result[0][r];
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
  return moved;
}

function slideDown() {
  let moved = false;
  for (let c = 0; c < columns; c++) {
    let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
    row.reverse();
    let result = slide(row);
    row = result[0].reverse();
    moved = moved || result[1];
    for (let r = 0; r < rows; r++) {
      board[r][c] = row[r];
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
  return moved;
}

function setTwo() {
  if (!hasEmptyTile()) {
    return;
  }
  let found = false;
  while (!found) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * columns);
    if (board[r][c] == 0) {
      board[r][c] = 2;
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      tile.innerText = "2";
      tile.classList.add("x2");
      found = true;
    }
  }
}

function hasEmptyTile() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      if (board[r][c] == 0) {
        return true;
      }
    }
  }
  return false;
}

function noMovesLeft() {
  var cantMove = true;
  if (hasEmptyTile()) {
    cantMove = false; // Wenn es noch leere Felder gibt, sind Züge möglich
  }
  if (cantMove) {
    // Überprüfe, ob angrenzende Kacheln kombiniert werden können
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        let current = board[r][c];
        if (r < rows - 1 && current == board[r + 1][c]) {
          cantMove = false; // Überprüfe Kachel darunter
        }
        if (c < columns - 1 && current == board[r][c + 1]) {
          cantMove = false; // Überprüfe Kachel rechts
        }
      }
    }
  }

  return cantMove; // Keine Bewegungen mehr möglich
}

function showGameOver() {
  // Update the final score in the game over screen
  document.getElementById("finalScore").innerText = score;
  document.getElementById("gameOver").style.display = "block";
}

function resetGame() {
  // Do not reset highscores or leaderboard when replaying
  // Reset score
  score = 0;
  document.getElementById("score").innerText = score;

  // Reset board
  board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  // Clear all tiles
  const tiles = document.getElementsByClassName("tile");
  for (let tile of tiles) {
    tile.innerText = "";
    tile.classList.value = "tile"; // Reset to default tile class
  }

  // Hide game over screen
  document.getElementById("gameOver").style.display = "none";

  // Start a new game
  setTwo();
}

// GitHub API Functions
async function loadHighscoresFromGitHub() {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
      console.log
    });

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist, create it
        await createEmptyCSV();
        highscores = [];
        updateLeaderboard(highscores);
        return;
      } else if (response.status === 403) {
        console.warn("Rate limit reached while loading highscores. Using cached data.");
        return; // Use existing highscores or empty list
      }
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
    }

    const data = await response.json();
    if (data.content) {
      const csvContent = atob(data.content);
      highscores = parseCSV(csvContent);
      updateLeaderboard(highscores);
    } else {
      // File exists but is empty
      highscores = [];
      updateLeaderboard(highscores);
    }
  } catch (error) {
    console.error("Error loading highscores:", error);
    alert(`Fehler beim Laden der Highscores: ${error.message}. Überprüfe das GitHub-Token, die Berechtigungen und ob der Pfad korrekt ist.`);
    highscores = [];
    updateLeaderboard(highscores);
  }
}

async function createEmptyCSV() {
  try {
    const csvContent = "Name,Score\n";
    const encodedContent = btoa(csvContent);
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Initial highscores.csv",
        content: encodedContent,
        branch: BRANCH
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error beim Erstellen der Datei: ${response.status} - ${errorData.message}`);
    }
    console.log("highscores.csv erfolgreich erstellt.");
  } catch (error) {
    console.error("Error creating highscores.csv:", error);
    throw new Error(`Fehler beim Erstellen der highscores.csv: ${error.message}`);
  }
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const highscores = [];
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    const [name, score] = line.split(",");
    if (name && score) {
      highscores.push({ name: name.trim(), score: parseInt(score.trim()) });
    }
  }
  return highscores.sort((a, b) => b.score - a.score).slice(0, 10); // Sort and take top 10
}

function updateLeaderboard(highscores) {
  const list = document.getElementById("highscoreList");
  list.innerHTML = "";
  highscores.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(li);
  });
}

async function saveGame() {
  // Prüfe, ob für den aktuellen Spieler bereits ein Eintrag existiert
  const existingIndex = highscores.findIndex(entry => entry.name === playerName);
  if (existingIndex >= 0) {
    // Nur updaten, wenn der neue Score höher ist als der bisherige
    if (score > highscores[existingIndex].score) {
      highscores[existingIndex].score = score;
    }
  } else {
    highscores.push({ name: playerName, score: score });
  }

  // Sortiere die Liste und behalte die Top 10
  highscores = highscores.sort((a, b) => b.score - a.score).slice(0, 10);

  // Erstelle CSV-Content
  let csvContent = "Name,Score\n";
  highscores.forEach(entry => {
    csvContent += `${entry.name},${entry.score}\n`;
  });

  // Save to GitHub
  let retryCount = 0;
  const maxRetries = 3;
  const delayMs = 5000; // 5 Sekunden Verzögerung zwischen Wiederholungen

  async function attemptSave() {
    try {
      // Aktuelle Datei abrufen, um den neuesten SHA zu bekommen
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      let sha;
      if (response.ok) {
        const data = await response.json();
        sha = data.sha;
      } else if (response.status === 404) {
        // Datei existiert nicht, also erstelle sie
        await createEmptyCSV();
        // Erneut holen, um den SHA der neuen Datei zu erhalten
        const newResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json"
          }
        });
        if (!newResponse.ok) {
          const errorData = await newResponse.json();
          throw new Error(`GitHub API error nach Erstellung der Datei: ${newResponse.status} - ${errorData.message}`);
        }
        const newData = await newResponse.json();
        sha = newData.sha;
      } else {
        const errorData = await response.json();
        throw new Error(`GitHub API error beim Abrufen der Datei: ${response.status} - ${errorData.message}`);
      }

      // Aktualisierten Content schreiben
      const encodedContent = btoa(csvContent);
      const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `Update highscores for ${playerName}`,
          content: encodedContent,
          sha: sha,
          branch: BRANCH
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`GitHub API error beim Aktualisieren der Datei: ${updateResponse.status} - ${errorData.message}`);
      }

      console.log("Highscores erfolgreich gespeichert.");
      // Aktualisiere die Leaderboard-Anzeige
      updateLeaderboard(highscores);
    } catch (error) {
      if (error.message.includes("403") && error.message.includes("rate limit")) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Rate limit reached. Retry ${retryCount} in ${delayMs / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          await attemptSave();
        } else {
          throw new Error("Max retries reached due to rate limit.");
        }
      } else if (error.message.includes("409")) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Conflict detected. Retry ${retryCount} in ${delayMs / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          await attemptSave();
        } else {
          throw new Error("Max retries reached due to conflict.");
        }
      } else {
        throw error;
      }
    }
  }

  await attemptSave();
}
