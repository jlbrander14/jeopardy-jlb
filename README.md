# Jeopardy Night

A free, no-install Jeopardy game: the board and clues display on a TV, and
players buzz in from their own phones. No app to install, no account to
create, no server to run — it's static HTML/JS/CSS hosted on GitHub Pages,
with player devices connected directly to the host peer-to-peer (via
[PeerJS](https://peerjs.com/), which just brokers the initial connection —
no data ever touches a server you have to run).

## Playing

1. **Host**: open `host.html` on the laptop/computer connected to your TV,
   click **Create Room**. A QR code and 4-letter room code appear.
2. **Players**: scan the QR code with their phones (or open `player.html`
   and type in the room code), then enter their name and tap **Join Game**.
3. Once everyone's in, the host clicks **Start Game**.
4. The host reads clues off the board, clicks **Open Buzzers** once they've
   finished reading, and the first phone to buzz in gets a shot at
   answering (out loud, like real Jeopardy). The host marks each answer
   **Correct** or **Wrong** and the score updates everywhere automatically.
5. After the board is cleared, a button appears to move to Double Jeopardy,
   then Final Jeopardy (with wagers and typed answers submitted from
   players' phones).

Everyone needs an internet connection, but it can be the same Wi-Fi/hotspot
— no port forwarding or account sign-ups required.

## Customizing your own questions

Edit `js/data.js`. It's one big object:

```js
window.JEOPARDY_DATA = {
  round1: { name: "Jeopardy Round", categories: [ /* 6 categories x 5 clues */ ] },
  round2: { name: "Double Jeopardy Round", categories: [ /* 6 x 5, doubled values */ ] },
  final: { category: "...", clue: "...", answer: "..." }
};
```

Each clue looks like:

```js
{ value: 200, clue: "This is shown on the board.", answer: "What is the response?" }
```

Add `dailyDouble: true` to any clue to make it a Daily Double — when the
host clicks it, they'll be prompted to pick which player is "in control"
and set a wager before the clue is revealed.

The number of categories/rows is flexible — the board renders however many
you give it, but 6 categories x 5 clues is the classic layout.

## How it works (for the curious)

- `host.html` / `js/host.js` — the TV screen. Runs the whole game state
  machine (board, scoring, buzzer arbitration, Final Jeopardy judging) and
  acts as the PeerJS "server," accepting a connection from each player's
  phone.
- `player.html` / `js/player.js` — the phone buzzer. Connects directly to
  the host as a PeerJS peer and exchanges small JSON-like messages (buzz,
  wager, answer, score updates).
- `vendor/peerjs.min.js` — the [PeerJS](https://peerjs.com/) library
  (WebRTC data channels), vendored locally.
- `vendor/qrcode.js` — [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
  by Kazuhiko Arase, used to render the join QR code, vendored locally.

Both libraries are vendored (checked into the repo) rather than loaded from
a CDN at runtime, so the game keeps working even if a CDN is unreachable —
this project has no build step and no external dependencies at deploy time.

There's no backend server and no database: the host's browser is the
source of truth for the game state, and it's lost if the host's tab is
closed or refreshed. PeerJS's free public broker is only used to help two
browsers find each other and open a direct WebRTC connection — after that,
buzzes and scores travel directly between the host and each phone.

## Local preview

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Open `host.html` in one tab/window and `player.html` in another (or on
your phone, using your computer's LAN IP instead of `localhost`) to try it
out solo.

## Deploying (GitHub Pages)

1. **Repo settings → Pages → Build and deployment → Source**: `Deploy from a branch`.
2. **Branch**: `main`, folder `/ (root)`.
3. Save. GitHub serves `index.html` at `https://jlbrander14.github.io/jeopardy-jlb/`
   within a few minutes — that's the link to hand out as `host.html`/`player.html`
   for game night (or bookmark `host.html`/`player.html` directly).
