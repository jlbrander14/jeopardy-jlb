(function () {
  "use strict";

  function truthy(v) {
    const s = (v || "").toString().trim().toLowerCase();
    return s === "true" || s === "1" || s === "y" || s === "yes";
  }

  // Parses a game CSV (see games/TEMPLATE.csv) into
  // { game: { title, author, round1, round2|null, final|null }, warnings: string[] }
  function parseGameCsv(text) {
    const parsed = Papa.parse(text.replace(/^﻿/, ""), { skipEmptyLines: true });
    const rows = parsed.data;
    const warnings = [];

    let title = null;
    let author = null;
    let headerIdx = -1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = (row[0] || "").toString().trim().toLowerCase();
      if (key === "title" && title === null) {
        title = (row[1] || "").toString().trim();
      } else if (key === "author" && author === null) {
        author = (row[1] || "").toString().trim();
      } else if (key === "round") {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      throw new Error('Could not find the header row (a row starting with "Round"). Compare this file against games/TEMPLATE.csv.');
    }

    const header = rows[headerIdx].map(h => (h || "").toString().trim().toLowerCase());
    const colIdx = name => header.indexOf(name);
    const idx = {
      round: colIdx("round"),
      category: colIdx("category"),
      value: colIdx("value"),
      clue: colIdx("clue"),
      answer: colIdx("answer"),
      dailyDouble: colIdx("dailydouble")
    };

    if (idx.round === -1 || idx.category === -1 || idx.clue === -1 || idx.answer === -1) {
      throw new Error("Header row must include Round, Category, Clue, and Answer columns.");
    }

    const round1Cats = new Map();
    const round2Cats = new Map();
    const finalRows = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => !c || !c.toString().trim())) continue;

      const roundRaw = (row[idx.round] || "").toString().trim().toLowerCase();
      const category = (row[idx.category] || "").toString().trim();
      const clue = (row[idx.clue] || "").toString().trim();
      const answer = (row[idx.answer] || "").toString().trim();
      const valueRaw = idx.value !== -1 ? (row[idx.value] || "").toString().trim() : "";
      const dailyDouble = idx.dailyDouble !== -1 ? truthy(row[idx.dailyDouble]) : false;

      if (!roundRaw) continue;
      if (!clue && !answer) continue;

      if (roundRaw.startsWith("final")) {
        finalRows.push({ category, clue, answer });
        continue;
      }

      const roundNum = parseInt(roundRaw.replace(/[^0-9]/g, ""), 10);
      const target = roundNum === 1 ? round1Cats : roundNum === 2 ? round2Cats : null;

      if (!target) {
        warnings.push(`Row ${i + 1}: unrecognized Round "${row[idx.round]}" — skipped.`);
        continue;
      }
      if (!category || !clue || !answer) {
        warnings.push(`Row ${i + 1}: missing Category, Clue, or Answer — skipped.`);
        continue;
      }

      let value = parseInt(valueRaw.replace(/[^0-9]/g, ""), 10);
      if (isNaN(value)) {
        warnings.push(`Row ${i + 1}: missing or invalid Value — defaulted to 0.`);
        value = 0;
      }

      if (!target.has(category)) target.set(category, []);
      target.get(category).push({ value, clue, answer, dailyDouble });
    }

    function buildRound(catMap, name) {
      if (catMap.size === 0) return null;
      const categories = Array.from(catMap.entries()).map(([catName, clues]) => ({
        name: catName,
        clues: clues.slice().sort((a, b) => a.value - b.value)
      }));
      return { name, categories };
    }

    const round1 = buildRound(round1Cats, "Jeopardy Round");
    const round2 = buildRound(round2Cats, "Double Jeopardy Round");

    let final = null;
    if (finalRows.length) {
      if (finalRows.length > 1) warnings.push(`Found ${finalRows.length} Final Jeopardy rows — using the first one.`);
      const f = finalRows[0];
      if (f.category && f.clue && f.answer) {
        final = { category: f.category, clue: f.clue, answer: f.answer };
      } else {
        warnings.push("Final Jeopardy row is missing Category, Clue, or Answer — Final Jeopardy skipped.");
      }
    }

    if (!round1) {
      throw new Error("This game has no Round 1 clues. Check that the Round column contains 1, 2, or Final.");
    }

    return {
      game: {
        title: title || "Untitled Game",
        author: author || "",
        round1,
        round2,
        final
      },
      warnings
    };
  }

  window.GameLoader = { parseGameCsv };
})();
