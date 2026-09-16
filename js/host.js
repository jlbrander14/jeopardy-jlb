(function () {
  "use strict";

  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const FINAL_ANSWER_SECONDS = 30;

  let peer = null;
  let roomCode = "";
  const players = new Map(); // peerId -> { name, score, conn }

  const state = {
    round: "round1",
    board: null, // categories with used flags, for current round
    activeClue: null, // { catIdx, clueIdx, category, value, clue, answer, dailyDouble, controllerId, wager }
    buzzOpen: false,
    buzzWinnerId: null,
    wrongPlayers: new Set(),
    final: { wagers: new Map(), answers: new Map(), order: [], judgeIndex: 0, timer: null, secondsLeft: FINAL_ANSWER_SECONDS }
  };

  // ---------- helpers ----------

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll("body > section").forEach(s => { s.style.display = "none"; });
    $(id).style.display = "flex";
  }

  function genCode() {
    let c = "";
    for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return c;
  }

  function getPlayersArray() {
    return Array.from(players.entries()).map(([id, p]) => ({ id, name: p.name, score: p.score }));
  }

  function broadcast(msg) {
    players.forEach(p => { if (p.conn && p.conn.open) p.conn.send(msg); });
  }

  function sendTo(id, msg) {
    const p = players.get(id);
    if (p && p.conn && p.conn.open) p.conn.send(msg);
  }

  function broadcastPlayers() {
    const arr = getPlayersArray();
    broadcast({ type: "players", players: arr });
    renderScoreboards(arr);
    renderSetupPlayerList(arr);
  }

  function renderScoreboards(arr) {
    const html = arr
      .slice()
      .sort((a, b) => b.score - a.score)
      .map(p => {
        const cls = "score-chip" + (p.score < 0 ? " negative" : "") + (p.id === state.buzzWinnerId ? " active" : "");
        return `<div class="${cls}"><div class="name">${escapeHtml(p.name)}</div><div class="score">${fmtMoney(p.score)}</div></div>`;
      })
      .join("");
    ["scoreboard-board", "scoreboard-clue", "scoreboard-finalcat"].forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = html || "";
    });
  }

  function renderSetupPlayerList(arr) {
    const el = $("setup-player-list");
    if (!arr.length) {
      el.innerHTML = '<li style="opacity:0.6;">Waiting for players…</li>';
    } else {
      el.innerHTML = arr.map(p => `<li>${escapeHtml(p.name)}</li>`).join("");
    }
    $("btn-start-game").disabled = arr.length === 0;
    $("start-hint").style.display = arr.length === 0 ? "block" : "none";
  }

  function fmtMoney(n) {
    return n < 0 ? "-$" + Math.abs(n) : "$" + n;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- peer / networking ----------

  function createRoom() {
    tryCreatePeer(0);
  }

  function tryCreatePeer(attempt) {
    if (attempt > 6) {
      alert("Could not create a room (network issue). Please reload and try again.");
      return;
    }
    roomCode = genCode();
    const id = "jpy-" + roomCode;
    if (peer) { try { peer.destroy(); } catch (e) {} }
    peer = new Peer(id, { debug: 1 });

    peer.on("open", () => {
      onRoomReady();
    });

    peer.on("error", (err) => {
      if (err && err.type === "unavailable-id") {
        tryCreatePeer(attempt + 1);
      } else {
        console.error("Peer error", err);
      }
    });

    peer.on("connection", (conn) => {
      conn.on("open", () => {
        conn.on("data", (data) => handleData(conn, data));
        conn.on("close", () => removePlayer(conn.peer));
      });
    });
  }

  function onRoomReady() {
    $("setup-precreate").style.display = "none";
    $("setup-postcreate").style.display = "block";
    $("room-code").textContent = roomCode;

    const playerUrl = location.href.replace(/host\.html.*$/, "player.html") + "?host=" + encodeURIComponent(peer.id);
    $("player-url").textContent = location.href.replace(/host\.html.*$/, "player.html");

    const qr = qrcode(0, "M");
    qr.addData(playerUrl);
    qr.make();
    $("qr").innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2 });
  }

  function removePlayer(id) {
    if (!players.has(id)) return;
    players.delete(id);
    broadcastPlayers();
    if (state.buzzWinnerId === id) {
      state.buzzWinnerId = null;
      renderCluePanel();
    }
  }

  function handleData(conn, data) {
    if (!data || !data.type) return;
    switch (data.type) {
      case "join": {
        const name = (data.name || "Player").toString().slice(0, 20).trim() || "Player";
        players.set(conn.peer, { name, score: 0, conn });
        conn.send({ type: "joined", id: conn.peer, name });
        broadcastPlayers();
        break;
      }
      case "buzz":
        handleBuzz(conn.peer);
        break;
      case "finalWager":
        state.final.wagers.set(conn.peer, clampWager(conn.peer, Number(data.wager) || 0));
        updateFinalWagerCount();
        break;
      case "finalAnswer":
        state.final.answers.set(conn.peer, (data.answer || "").toString().slice(0, 300));
        updateFinalAnswerCount();
        break;
    }
  }

  function clampWager(playerId, wager) {
    const p = players.get(playerId);
    const max = Math.max(0, p ? p.score : 0);
    if (wager < 0) wager = 0;
    if (wager > max) wager = max;
    return Math.floor(wager);
  }

  // ---------- board / rounds ----------

  function startRound(key) {
    state.round = key;
    const data = JEOPARDY_DATA[key];
    state.board = data.categories.map(cat => ({
      name: cat.name,
      clues: cat.clues.map(c => ({ ...c, used: false }))
    }));
    $("round-name").textContent = data.name;
    broadcast({ type: "roundStart", name: data.name });
    showScreen("screen-board");
    renderBoard();
  }

  function renderBoard() {
    const grid = $("jp-grid");
    grid.innerHTML = "";

    const catRow = document.createElement("div");
    catRow.className = "jp-grid-row";
    state.board.forEach(cat => {
      const el = document.createElement("div");
      el.className = "jp-cat";
      el.textContent = cat.name;
      catRow.appendChild(el);
    });
    grid.appendChild(catRow);

    const numClues = state.board[0].clues.length;
    for (let r = 0; r < numClues; r++) {
      const row = document.createElement("div");
      row.className = "jp-grid-row";
      state.board.forEach((cat, catIdx) => {
        const clue = cat.clues[r];
        const cell = document.createElement("div");
        cell.className = "jp-cell" + (clue.used ? " used" : "");
        cell.textContent = "$" + clue.value;
        if (!clue.used) {
          cell.addEventListener("click", () => selectClue(catIdx, r));
        }
        row.appendChild(cell);
      });
      grid.appendChild(row);
    }

    checkRoundControls();
  }

  function checkRoundControls() {
    const allUsed = state.board.every(cat => cat.clues.every(c => c.used));
    $("btn-goto-round2").style.display = state.round === "round1" && allUsed ? "inline-block" : "none";
    $("btn-goto-final").style.display = state.round === "round2" && allUsed ? "inline-block" : "none";
  }

  function selectClue(catIdx, clueIdx) {
    const cat = state.board[catIdx];
    const clue = cat.clues[clueIdx];
    if (clue.used) return;
    state.activeClue = {
      catIdx, clueIdx,
      category: cat.name,
      value: clue.value,
      clue: clue.clue,
      answer: clue.answer,
      dailyDouble: !!clue.dailyDouble
    };
    state.buzzWinnerId = null;
    state.wrongPlayers = new Set();
    state.buzzOpen = false;

    if (clue.dailyDouble) {
      openDailyDoubleSetup();
    } else {
      broadcast({ type: "clueShown", category: cat.name, value: clue.value });
      showClueScreen();
    }
  }

  function openDailyDoubleSetup() {
    const select = $("dd-controller");
    select.innerHTML = getPlayersArray().map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${fmtMoney(p.score)})</option>`).join("");
    const anyPlayer = getPlayersArray()[0];
    const suggested = Math.max(5, anyPlayer ? anyPlayer.score : 0, state.round === "round1" ? 1000 : 2000);
    $("dd-wager").value = suggested;
    $("dd-hint").textContent = getPlayersArray().length
      ? "Minimum wager $5. Suggested max shown per player above."
      : "No players connected yet — you can still run this clue.";
    broadcast({ type: "dailyDoubleSplash", category: state.activeClue.category });
    showScreen("screen-ddsetup");
  }

  function confirmDailyDouble() {
    const controllerId = $("dd-controller").value;
    let wager = Math.max(5, Math.floor(Number($("dd-wager").value) || 0));
    state.activeClue.controllerId = controllerId || null;
    state.activeClue.wager = wager;
    state.activeClue.value = wager;

    const controllerName = controllerId && players.has(controllerId) ? players.get(controllerId).name : "The host";
    broadcast({
      type: "dailyDouble",
      category: state.activeClue.category,
      wager,
      controllerId,
      controllerName
    });
    showClueScreen();
  }

  function showClueScreen() {
    $("clue-category-label").textContent = state.activeClue.category + " — $" + state.activeClue.value;
    $("clue-text").textContent = state.activeClue.clue;
    $("clue-answer").style.display = "none";
    $("clue-answer").textContent = "Correct response: " + state.activeClue.answer;
    $("buzz-order").textContent = "";
    showScreen("screen-clue");
    renderCluePanel();
  }

  function renderCluePanel() {
    const controls = $("clue-controls");
    const buzzOrderEl = $("buzz-order");
    controls.innerHTML = "";

    if (state.activeClue.dailyDouble) {
      const btnCorrect = mkBtn("✔ Correct", "success", () => judgeDailyDouble(true));
      const btnWrong = mkBtn("✘ Wrong", "danger", () => judgeDailyDouble(false));
      const btnReveal = mkBtn($("clue-answer").style.display === "none" ? "Show Response" : "Hide Response", "secondary", toggleAnswer);
      controls.append(btnReveal, btnCorrect, btnWrong);
      buzzOrderEl.textContent = "Wager: $" + state.activeClue.wager;
      return;
    }

    if (state.buzzWinnerId) {
      const p = players.get(state.buzzWinnerId);
      buzzOrderEl.innerHTML = `<span class="name">${escapeHtml(p ? p.name : "?")}</span> buzzed in!`;
      const btnCorrect = mkBtn("✔ Correct", "success", () => judgeBuzz(true));
      const btnWrong = mkBtn("✘ Wrong", "danger", () => judgeBuzz(false));
      const btnReveal = mkBtn($("clue-answer").style.display === "none" ? "Show Response" : "Hide Response", "secondary", toggleAnswer);
      controls.append(btnReveal, btnCorrect, btnWrong);
    } else if (state.buzzOpen) {
      buzzOrderEl.textContent = "Buzzers open — waiting for a buzz…";
      const btnReveal = mkBtn($("clue-answer").style.display === "none" ? "Show Response" : "Hide Response", "secondary", toggleAnswer);
      const btnSkip = mkBtn("No one buzzed — Back to Board", "secondary", () => closeClue());
      controls.append(btnReveal, btnSkip);
    } else {
      buzzOrderEl.textContent = state.wrongPlayers.size ? "Buzzers re-opening excludes players who already tried." : "";
      const btnOpen = mkBtn("Open Buzzers", "success", openBuzzers);
      const btnReveal = mkBtn($("clue-answer").style.display === "none" ? "Show Response" : "Hide Response", "secondary", toggleAnswer);
      const btnSkip = mkBtn("Back to Board", "secondary", () => closeClue());
      controls.append(btnOpen, btnReveal, btnSkip);
    }
  }

  function mkBtn(label, cls, onClick) {
    const b = document.createElement("button");
    b.className = "jp-btn " + cls;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function toggleAnswer() {
    const el = $("clue-answer");
    el.style.display = el.style.display === "none" ? "block" : "none";
    renderCluePanel();
  }

  function openBuzzers() {
    state.buzzOpen = true;
    state.buzzWinnerId = null;
    broadcast({ type: "buzzOpen" });
    renderCluePanel();
  }

  function handleBuzz(playerId) {
    if (!state.activeClue || state.activeClue.dailyDouble) return;
    if (!state.buzzOpen || state.buzzWinnerId) return;
    if (state.wrongPlayers.has(playerId)) return;
    if (!players.has(playerId)) return;

    state.buzzOpen = false;
    state.buzzWinnerId = playerId;
    broadcast({ type: "buzzWinner", winnerId: playerId, winnerName: players.get(playerId).name });
    renderScoreboards(getPlayersArray());
    renderCluePanel();
  }

  function judgeBuzz(correct) {
    const id = state.buzzWinnerId;
    const p = players.get(id);
    if (!p) return;
    if (correct) {
      p.score += state.activeClue.value;
      broadcastPlayers();
      sendTo(id, { type: "judged", correct: true, delta: state.activeClue.value });
      closeClue();
    } else {
      p.score -= state.activeClue.value;
      sendTo(id, { type: "judged", correct: false, delta: -state.activeClue.value });
      broadcastPlayers();
      state.wrongPlayers.add(id);
      state.buzzWinnerId = null;

      if (state.wrongPlayers.size >= players.size) {
        closeClue();
      } else {
        state.buzzOpen = true;
        broadcast({ type: "buzzOpen", excluding: Array.from(state.wrongPlayers) });
        renderCluePanel();
      }
    }
  }

  function judgeDailyDouble(correct) {
    const id = state.activeClue.controllerId;
    const p = id ? players.get(id) : null;
    if (p) {
      p.score += correct ? state.activeClue.wager : -state.activeClue.wager;
      broadcastPlayers();
      sendTo(id, { type: "judged", correct, delta: correct ? state.activeClue.wager : -state.activeClue.wager });
    }
    closeClue();
  }

  function closeClue() {
    if (state.activeClue) {
      state.board[state.activeClue.catIdx].clues[state.activeClue.clueIdx].used = true;
    }
    broadcast({ type: "clueClosed" });
    state.activeClue = null;
    state.buzzWinnerId = null;
    state.buzzOpen = false;
    state.wrongPlayers = new Set();
    showScreen("screen-board");
    renderBoard();
  }

  // ---------- final jeopardy ----------

  function startFinal() {
    state.final = { wagers: new Map(), answers: new Map(), order: [], judgeIndex: 0, timer: null, secondsLeft: FINAL_ANSWER_SECONDS };
    $("final-category").textContent = JEOPARDY_DATA.final.category;
    renderScoreboards(getPlayersArray());
    updateFinalWagerCount();
    broadcast({ type: "finalCategory", category: JEOPARDY_DATA.final.category });
    showScreen("screen-finalcat");
  }

  function updateFinalWagerCount() {
    const eligible = getPlayersArray().length;
    $("final-wager-count").textContent = `Waiting for wagers… ${state.final.wagers.size}/${eligible}`;
  }

  function revealFinalClue() {
    // default missing wagers to 0
    players.forEach((p, id) => {
      if (!state.final.wagers.has(id)) state.final.wagers.set(id, 0);
    });
    $("final-clue-category").textContent = JEOPARDY_DATA.final.category;
    $("final-clue-text").textContent = JEOPARDY_DATA.final.clue;
    updateFinalAnswerCount();
    broadcast({ type: "finalClue", clue: JEOPARDY_DATA.final.clue, seconds: FINAL_ANSWER_SECONDS });
    showScreen("screen-finalclue");

    state.final.secondsLeft = FINAL_ANSWER_SECONDS;
    $("final-timer").textContent = state.final.secondsLeft;
    clearInterval(state.final.timer);
    state.final.timer = setInterval(() => {
      state.final.secondsLeft--;
      $("final-timer").textContent = Math.max(0, state.final.secondsLeft);
      if (state.final.secondsLeft <= 0) {
        clearInterval(state.final.timer);
        broadcast({ type: "finalTimeUp" });
      }
    }, 1000);
  }

  function updateFinalAnswerCount() {
    const eligible = getPlayersArray().length;
    $("final-answer-count").textContent = `${state.final.answers.size}/${eligible} answered`;
  }

  function startJudging() {
    clearInterval(state.final.timer);
    players.forEach((p, id) => {
      if (!state.final.answers.has(id)) state.final.answers.set(id, "(no answer)");
    });
    state.final.order = getPlayersArray()
      .map(p => p.id)
      .sort((a, b) => state.final.wagers.get(a) - state.final.wagers.get(b));
    state.final.judgeIndex = 0;
    showJudgeCard();
  }

  function showJudgeCard() {
    if (state.final.judgeIndex >= state.final.order.length) {
      $("fj-name").textContent = "All players judged!";
      $("fj-wager").textContent = "";
      $("fj-answer").textContent = "";
      $("btn-fj-correct").style.display = "none";
      $("btn-fj-wrong").style.display = "none";
      $("btn-fj-standings").style.display = "inline-block";
      showScreen("screen-finaljudge");
      return;
    }
    $("btn-fj-correct").style.display = "";
    $("btn-fj-wrong").style.display = "";
    $("btn-fj-standings").style.display = "none";
    const id = state.final.order[state.final.judgeIndex];
    const p = players.get(id);
    $("fj-name").textContent = p.name;
    $("fj-wager").textContent = "$" + state.final.wagers.get(id);
    $("fj-answer").textContent = state.final.answers.get(id);
    showScreen("screen-finaljudge");
  }

  function judgeFinal(correct) {
    const id = state.final.order[state.final.judgeIndex];
    const p = players.get(id);
    const wager = state.final.wagers.get(id);
    if (p) {
      p.score += correct ? wager : -wager;
      sendTo(id, { type: "finalJudged", correct, wager, score: p.score });
    }
    broadcastPlayers();
    state.final.judgeIndex++;
    showJudgeCard();
  }

  function finishGame() {
    const arr = getPlayersArray().sort((a, b) => b.score - a.score);
    $("final-standings").innerHTML = arr
      .map((p, i) => `<div class="jp-card" style="margin:8px auto; max-width:340px;">
        <div style="font-size:1.4rem; color:${i === 0 ? "var(--jp-gold)" : "var(--jp-white)"};">
          ${i === 0 ? "🏆 " : ""}${escapeHtml(p.name)}
        </div>
        <div style="font-size:1.8rem; color:var(--jp-gold);">${fmtMoney(p.score)}</div>
      </div>`)
      .join("");
    broadcast({ type: "gameOver", players: arr });
    showScreen("screen-gameover");
  }

  // ---------- wire up UI ----------

  $("btn-create-room").addEventListener("click", createRoom);
  $("btn-start-game").addEventListener("click", () => startRound("round1"));
  $("btn-goto-round2").addEventListener("click", () => startRound("round2"));
  $("btn-goto-final").addEventListener("click", startFinal);
  $("btn-dd-confirm").addEventListener("click", confirmDailyDouble);
  $("btn-final-reveal-clue").addEventListener("click", revealFinalClue);
  $("btn-final-judge").addEventListener("click", startJudging);
  $("btn-fj-correct").addEventListener("click", () => judgeFinal(true));
  $("btn-fj-wrong").addEventListener("click", () => judgeFinal(false));
  $("btn-fj-standings").addEventListener("click", finishGame);
  $("btn-new-game").addEventListener("click", () => location.reload());
})();
