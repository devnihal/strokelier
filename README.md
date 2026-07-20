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
