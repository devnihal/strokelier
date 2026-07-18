import React from 'react';
// We will expand CanvasScreen in a future step when building the drawing mechanics.

export default function CanvasScreen({ roomState, myPlayer, socket }) {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2>Game is in progress! (Drawing Canvas pending)</h2>
      <p>Room State: {roomState.state}</p>
    </div>
  );
}
