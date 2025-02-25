var board;
var score = 0;
var rows = 4;
var columns = 4;

var startX, startY, endX, endY; // Koordinaten für Touch und Maus

window.onload = function() {
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
    
    if (moved) {  // Nur eine Kachel hinzufügen, wenn sich das Board bewegt hat
        document.getElementById("score").innerText = score;
        if (noMovesLeft()) {
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

    if (moved) {  // Nur eine Kachel hinzufügen, wenn sich das Board bewegt hat
        document.getElementById("score").innerText = score;
        if (noMovesLeft()) {
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
    if (hasEmptyTile()) {
        return false; // Wenn es noch leere Felder gibt, sind Züge möglich
    }

    // Überprüfe, ob angrenzende Kacheln kombiniert werden können
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let current = board[r][c];
            if (r < rows - 1 && current == board[r + 1][c]) {
                return false; // Überprüfe Kachel darunter
            }
            if (c < columns - 1 && current == board[r][c + 1]) {
                return false; // Überprüfe Kachel rechts
            }
        }
    }

    return true; // Keine Bewegungen mehr möglich
}

function showGameOver() {
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOver").style.display = "block";
}

function resetGame() {
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
