# Strokelier

Strokelier is a multiplayer drawing and deception game inspired by the classic party game *A Fake Artist Goes to New York*.

## The Game
- **The Catch**: Everyone in the lobby is given a secret word to draw together on a shared canvas... except for the **Impostor**, who gets absolutely nothing.
- **The Goal (Artists)**: Work together to draw the word by taking turns adding a single, continuous stroke to the canvas. But be careful: don't make your drawing too obvious! If the Impostor figures out the word, they win.
- **The Goal (Impostor)**: Blend in, pretend you know what everyone is drawing, and try to guess the secret word before the lobby catches on.

## Features
- Real-time multiplayer drawing powered by `socket.io`.
- Fully customized, premium UI with a beautiful dark aesthetic and responsive design.
- Game Show style results screen with personalized victory/loss sequences (including full-screen confetti!).
- Flexible host settings: anonymous voting, custom word lists, varied categories, and configurable drawing timers.
- Tight server-authoritative turn management that handles network latency and disconnects gracefully.

## Tech Stack
- **Frontend**: React, Vite, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Styling**: Vanilla CSS leveraging a robust modern token system

## Running Locally

1. **Install Dependencies**
   Open two terminals. In the first terminal, set up the backend:
   ```bash
   cd backend
   npm install
   ```
   In the second terminal, set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Servers**
   Start the Node server:
   ```bash
   cd backend
   npm run dev
   ```
   Start the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` (or the port Vite provides) and start playing!

---

## Architecture

Strokelier is built around a **Server-Authoritative** real-time architecture:

- **Backend (`/backend`)**:
  - The game logic is entirely managed by the server using `socket.io`.
  - The `Room.js` class is the heart of the system. It encapsulates the complete state of a single game lobby (players, settings, turn order, strokes, scores).
  - The server manages timers, turn advancement, and validation. It broadcasts sanitized state snapshots (`roomState`) to clients every time an event mutates the game state.
- **Frontend (`/frontend`)**:
  - A React Single Page Application (SPA) that acts primarily as a reactive view layer.
  - The main `App.jsx` connects to the WebSocket server and listens for `ROOM_STATE_UPDATE` events.
  - Depending on the `roomState.state` (e.g., `LOBBY`, `DRAWING`, `VOTING`, `RESULTS`), the frontend dynamically renders the appropriate Screen component.
  - The frontend never trusts itself. It sends "intent" events (like `DRAW_COMMIT_STROKE` or `SUBMIT_VOTE`) to the server, and only updates the visual UI when the server confirms the state change.

## Contribution Guidelines

If you want to contribute to Strokelier, please adhere to the following rules:

1. **Vanilla CSS Only**:
   - Do NOT introduce TailwindCSS, styled-components, or other CSS-in-JS libraries.
   - All styles must be written in standard CSS.
   - Always rely on the global CSS tokens defined in `frontend/src/styles/tokens.css` (e.g., `var(--bone)`, `var(--wax-red)`, `var(--font-heading)`) to maintain the premium aesthetic and dark mode harmony.

2. **Server-Authoritative Logic**:
   - Never implement game rules or timer logic purely on the frontend.
   - The frontend should only be responsible for rendering data and catching user input.
   - Ensure the backend properly sanitizes broadcasted data (e.g., do not leak the Impostor's identity or the secret word in the public room state until the `RESULTS` phase).

3. **Component Modularity**:
   - Keep React components small and focused.
   - Screen-level components should reside in `frontend/src/components/Room/` and smaller reusable UI parts (buttons, avatars) should reside in `frontend/src/components/common/`.
   - Maintain the one-to-one mapping of components to CSS files in the `styles/` directory.

4. **Socket Management**:
   - Always properly clean up socket event listeners in `useEffect` return statements to prevent memory leaks and duplicate firing upon re-renders.

5. **Documentation Integrity**:
   - Preserve all existing comments and docstrings that are unrelated to your code changes. 
   - Ensure complex backend game logic and socket handlers remain well-documented for future maintainers.
