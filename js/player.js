(function () {
  "use strict";

  let peer = null;
  let conn = null;
  let myId = null;
  let myName = "";
  let myScore = 0;
  let hasSubmittedWager = false;
  let hasSubmittedAnswer = false;
  let finalTimerInterval = null;

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll("body > section").forEach(s => { s.style.display = "none"; });
    $(id).style.display = "flex";
  }

  function prefillFromUrl() {
    const params = new URLSearchParams(location.search);
    const host = params.get("host");
    if (host) {
      const match = host.match(/jpy-([A-Za-z0-9]{4})/i);
      $("join-code").value = match ? match[1].toUpperCase() : host;
    }
  }

  function joinGame() {
    const codeRaw = $("join-code").value.trim().toUpperCase();
    const name = $("join-name").value.trim().slice(0, 20);
    $("join-error").textContent = "";

    if (!codeRaw) { $("join-error").textContent = "Enter the room code from the TV."; return; }
    if (!name) { $("join-error").textContent = "Enter your name."; return; }

    myName = name;
    $("btn-join").disabled = true;
    $("join-status").textContent = "Connecting…";

    const hostId = "jpy-" + codeRaw.replace(/^JPY-?/, "");

    if (peer) { try { peer.destroy(); } catch (e) {} }
    peer = new Peer(undefined, { debug: 1 });

    peer.on("open", () => {
      conn = peer.connect(hostId, { reliable: true });

      conn.on("open", () => {
        conn.send({ type: "join", name: myName });
      });

      conn.on("data", handleData);

      conn.on("close", () => {
        $("join-error").textContent = "Disconnected from host. Please rejoin.";
        showScreen("screen-join");
        $("btn-join").disabled = false;
      });

      conn.on("error", (err) => {
        console.error(err);
        $("join-error").textContent = "Could not reach that room. Check the code and try again.";
        $("btn-join").disabled = false;
        $("join-status").textContent = "";
      });
    });

    peer.on("error", (err) => {
      console.error(err);
      $("join-error").textContent = "Connection error. Check the code and try again.";
      $("btn-join").disabled = false;
      $("join-status").textContent = "";
    });
  }

  function handleData(data) {
    if (!data || !data.type) return;
    switch (data.type) {
      case "joined":
        myId = data.id;
        $("buzzer-player-name").textContent = myName;
        setStatus("Connected! Waiting for the game to start…");
        showScreen("screen-buzzer");
        break;

      case "players": {
        const me = data.players.find(p => p.id === myId);
        if (me) { myScore = me.score; $("my-score").textContent = fmtMoney(myScore); }
        break;
      }

      case "roundStart":
        resetBuzzer();
        setStatus(data.name + " — get ready!");
        showScreen("screen-buzzer");
        break;

      case "clueShown":
        resetBuzzer();
        setStatus(data.category + " for $" + data.value);
        showScreen("screen-buzzer");
        break;

      case "buzzOpen": {
        const excluded = (data.excluding || []).includes(myId);
        if (excluded) {
          setStatus("Buzzers reopened — you already tried this clue.");
          setBuzzState("disabled");
        } else {
          setStatus("BUZZ NOW!");
          setBuzzState("ready");
        }
        break;
      }

      case "buzzWinner":
        if (data.winnerId === myId) {
          setStatus("You're up! Answer out loud.");
          setBuzzState("won");
        } else {
          setStatus(data.winnerName + " buzzed in first!");
          setBuzzState("disabled");
        }
        break;

      case "judged":
        if (data.correct) {
          setStatus("Correct! +$" + data.delta);
        } else {
          setStatus("Incorrect. $" + data.delta);
        }
        setBuzzState("disabled");
        break;

      case "clueClosed":
        resetBuzzer();
        setStatus("Waiting for the host to pick a clue…");
        showScreen("screen-buzzer");
        break;

      case "dailyDoubleSplash":
        resetBuzzer();
        setStatus("DAILY DOUBLE in " + data.category + "! Stand by…");
        showScreen("screen-buzzer");
        break;

      case "dailyDouble":
        resetBuzzer();
        if (data.controllerId === myId) {
          setStatus("You have control! Wager: $" + data.wager + " — answer out loud.");
        } else {
          setStatus(data.controllerName + " found a Daily Double! Wager: $" + data.wager);
        }
        showScreen("screen-buzzer");
        break;

      case "finalCategory":
        hasSubmittedWager = false;
        $("fw-category").textContent = data.category;
        $("fw-score").textContent = "Your score: " + fmtMoney(myScore);
        $("fw-input").value = 0;
        $("fw-input").max = Math.max(0, myScore);
        $("fw-input").disabled = false;
        $("btn-fw-submit").disabled = false;
        $("fw-status").textContent = "";
        showScreen("screen-final-wager");
        break;

      case "finalClue":
        hasSubmittedAnswer = false;
        $("fa-category").textContent = "";
        $("fa-clue").textContent = data.clue;
        $("fa-input").value = "";
        $("fa-input").disabled = false;
        $("btn-fa-submit").disabled = false;
        $("fa-status").textContent = "";
        startFinalTimer(data.seconds || 30);
        showScreen("screen-final-answer");
        break;

      case "finalTimeUp":
        clearInterval(finalTimerInterval);
        if (!hasSubmittedAnswer) submitFinalAnswer(true);
        break;

      case "finalJudged":
        myScore = data.score;
        $("fr-title").textContent = data.correct ? "CORRECT!" : "INCORRECT";
        $("fr-title").style.color = data.correct ? "var(--jp-green)" : "var(--jp-red)";
        $("fr-score").textContent = (data.correct ? "+$" : "-$") + data.wager + " → " + fmtMoney(myScore);
        showScreen("screen-final-result");
        break;

      case "gameOver": {
        const sorted = data.players.slice().sort((a, b) => b.score - a.score);
        const won = sorted.length && sorted[0].id === myId;
        $("go-title").textContent = won ? "YOU WIN! 🏆" : "GAME OVER";
        $("go-standings").innerHTML = sorted
          .map((p, i) => `<div class="jp-card" style="margin:8px auto; max-width:320px;">
            <div style="font-size:1.2rem; ${p.id === myId ? "color:var(--jp-gold);" : ""}">
              ${i === 0 ? "🏆 " : ""}${escapeHtml(p.name)}${p.id === myId ? " (you)" : ""}
            </div>
            <div style="font-size:1.5rem; color:var(--jp-gold);">${fmtMoney(p.score)}</div>
          </div>`)
          .join("");
        showScreen("screen-gameover");
        break;
      }
    }
  }

  function fmtMoney(n) {
    return n < 0 ? "-$" + Math.abs(n) : "$" + n;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setStatus(text) { $("status-text").textContent = text; }

  function setBuzzState(mode) {
    const btn = $("buzz-btn");
    btn.className = "buzzer-btn";
    if (mode === "ready") {
      btn.disabled = false;
      btn.classList.add("ready");
      btn.textContent = "BUZZ";
    } else if (mode === "won") {
      btn.disabled = true;
      btn.classList.add("won");
      btn.textContent = "GO!";
    } else {
      btn.disabled = true;
      btn.textContent = "BUZZ";
    }
  }

  function resetBuzzer() { setBuzzState("disabled"); }

  function pressBuzz() {
    if ($("buzz-btn").disabled) return;
    setBuzzState("disabled");
    $("buzz-btn").classList.add("won");
    setStatus("Buzzing in…");
    if (navigator.vibrate) navigator.vibrate(40);
    conn.send({ type: "buzz" });
  }

  function submitWager() {
    let wager = Math.floor(Number($("fw-input").value) || 0);
    const max = Math.max(0, myScore);
    if (wager < 0) wager = 0;
    if (wager > max) wager = max;
    hasSubmittedWager = true;
    $("fw-input").disabled = true;
    $("btn-fw-submit").disabled = true;
    $("fw-status").textContent = "Wager locked in: $" + wager + ". Waiting for the clue…";
    conn.send({ type: "finalWager", wager });
  }

  function startFinalTimer(seconds) {
    let left = seconds;
    $("fa-timer").textContent = left;
    clearInterval(finalTimerInterval);
    finalTimerInterval = setInterval(() => {
      left--;
      $("fa-timer").textContent = Math.max(0, left);
      if (left <= 0) clearInterval(finalTimerInterval);
    }, 1000);
  }

  function submitFinalAnswer(auto) {
    if (hasSubmittedAnswer) return;
    hasSubmittedAnswer = true;
    const answer = $("fa-input").value.trim();
    $("fa-input").disabled = true;
    $("btn-fa-submit").disabled = true;
    $("fa-status").textContent = auto ? "Time's up! Answer submitted." : "Answer submitted. Waiting for other players…";
    conn.send({ type: "finalAnswer", answer });
  }

  $("btn-join").addEventListener("click", joinGame);
  $("join-name").addEventListener("keydown", e => { if (e.key === "Enter") joinGame(); });
  $("join-code").addEventListener("keydown", e => { if (e.key === "Enter") joinGame(); });
  $("buzz-btn").addEventListener("click", pressBuzz);
  $("btn-fw-submit").addEventListener("click", submitWager);
  $("btn-fa-submit").addEventListener("click", () => submitFinalAnswer(false));

  prefillFromUrl();
})();
