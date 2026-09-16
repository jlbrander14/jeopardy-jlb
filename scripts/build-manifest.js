#!/usr/bin/env node
// Scans games/*.csv (excluding TEMPLATE.csv) and writes games/manifest.json,
// the list host.html's game-picker dropdown loads at runtime.
//
// Run this after adding or removing a game file, then commit the result:
//   node scripts/build-manifest.js
"use strict";

const fs = require("fs");
const path = require("path");
const Papa = require("../vendor/papaparse.min.js");

const GAMES_DIR = path.join(__dirname, "..", "games");
const MANIFEST_PATH = path.join(GAMES_DIR, "manifest.json");

function readMeta(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "");
  const rows = Papa.parse(text, { skipEmptyLines: true }).data;

  let title = null;
  let author = null;
  let hasHeader = false;

  for (const row of rows) {
    const key = (row[0] || "").toString().trim().toLowerCase();
    if (key === "title" && title === null) title = (row[1] || "").toString().trim();
    else if (key === "author" && author === null) author = (row[1] || "").toString().trim();
    else if (key === "round") { hasHeader = true; break; }
  }

  return { title, author, hasHeader };
}

function main() {
  const files = fs
    .readdirSync(GAMES_DIR)
    .filter(f => f.toLowerCase().endsWith(".csv") && f.toLowerCase() !== "template.csv")
    .sort();

  if (files.length === 0) {
    console.warn("No game .csv files found in games/ (besides TEMPLATE.csv).");
  }

  const manifest = [];
  for (const file of files) {
    const fullPath = path.join(GAMES_DIR, file);
    const { title, author, hasHeader } = readMeta(fullPath);

    if (!hasHeader) {
      console.warn(`Skipping ${file}: no header row found (a row starting with "Round"). Is this a valid game file?`);
      continue;
    }

    manifest.push({
      id: file.replace(/\.csv$/i, ""),
      title: title || file.replace(/\.csv$/i, ""),
      author: author || "",
      file: "games/" + file
    });

    console.log(`+ ${file} — "${title || "(untitled)"}" by ${author || "(unknown)"}`);
  }

  manifest.sort((a, b) => a.title.localeCompare(b.title));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nWrote ${MANIFEST_PATH} with ${manifest.length} game(s).`);
}

main();
