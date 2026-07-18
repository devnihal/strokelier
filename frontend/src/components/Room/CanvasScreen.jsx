import React, { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import StrokeDivider from "../common/StrokeDivider";
import ScoreboardSidebar from "./ScoreboardSidebar";
import "../../styles/Room/CanvasScreen.css";

// Duplicate colors locally for frontend if backend import is brittle
const COLORS = [
  "#B23A2E",
  "#5C7A4A",
  "#4C6B8A",
  "#7A4A6B",
  "#CBA045",
  "#6B7580",
  "#A85C32",
  "#3D7A72",
  "#C9836B",
  "#8A8148",
  "#7385B8",
  "#9E5A6B",
];

export default function CanvasScreen({ roomState, myPlayer, socket }) {
  const canvasRef = useRef(null);

  const [roleInfo, setRoleInfo] = useState({ role: "artist", word: null });
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasPendingStroke, setHasPendingStroke] = useState(false);

  // Drawing settings
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeColor, setStrokeColor] = useState(myPlayer?.color || COLORS[0]);

  // Derive turn state
  const currentTurnUid = roomState.drawOrder[roomState.currentTurnIndex];
  const isMyTurn =
    currentTurnUid === myPlayer?.uid && roomState.state === "DRAWING";
  const currentPlayer = roomState.players[currentTurnUid];

  // Local stroke state for rendering
  const [localPendingPoints, setLocalPendingPoints] = useState([]);
  const [remotePendingStroke, setRemotePendingStroke] = useState(null);

  // Re-draw canvas whenever strokes change or pending strokes update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual pixel dimensions to match CSS dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPoints = (points, color, width) => {
      if (!points || points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(points[0].x * canvas.width, points[0].y * canvas.height);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * canvas.width, points[i].y * canvas.height);
      }
      ctx.stroke();
    };

    // 1. Draw committed history
    roomState.strokes.forEach((stroke) => {
      drawPoints(stroke.points, stroke.color, stroke.width);
    });

    // 2. Draw live pending stroke (mine or someone else's)
    if (isMyTurn && localPendingPoints.length > 0) {
      drawPoints(localPendingPoints, strokeColor, strokeWidth);
    } else if (
      !isMyTurn &&
      remotePendingStroke &&
      remotePendingStroke.points.length > 0
    ) {
      drawPoints(
        remotePendingStroke.points,
        remotePendingStroke.color,
        remotePendingStroke.width,
      );
    }
  }, [
    roomState.strokes,
    localPendingPoints,
    remotePendingStroke,
    isMyTurn,
    strokeColor,
    strokeWidth,
  ]);

  // Listen for role assignment once game starts
  useEffect(() => {
    socket.on("GAME_ROLE_ASSIGNED", (info) => {
      setRoleInfo(info);
    });
    return () => socket.off("GAME_ROLE_ASSIGNED");
  }, [socket]);

  // Listen for remote draw events
  useEffect(() => {
    const onRemoteStart = (stroke) => setRemotePendingStroke(stroke);
    const onRemotePoint = (pt) => {
      setRemotePendingStroke((prev) => {
        if (!prev) return prev;
        return { ...prev, points: [...prev.points, pt] };
      });
    };
    const onRemoteEnd = () => {};
    const onCleared = () => {
      setRemotePendingStroke(null);
      setLocalPendingPoints([]);
      setHasPendingStroke(false);
    };

    socket.on("DRAW_STROKE_START_BROADCAST", onRemoteStart);
    socket.on("DRAW_STROKE_POINT_BROADCAST", onRemotePoint);
    socket.on("DRAW_STROKE_END_BROADCAST", onRemoteEnd);
    socket.on("DRAW_STROKE_CLEARED", onCleared);

    return () => {
      socket.off("DRAW_STROKE_START_BROADCAST", onRemoteStart);
      socket.off("DRAW_STROKE_POINT_BROADCAST", onRemotePoint);
      socket.off("DRAW_STROKE_END_BROADCAST", onRemoteEnd);
      socket.off("DRAW_STROKE_CLEARED", onCleared);
    };
  }, [socket]);

  // Pointer Handlers
  const getNormPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (e) => {
    if (!isMyTurn || hasPendingStroke) return;
    setIsDrawing(true);
    const pt = getNormPos(e);
    setLocalPendingPoints([pt]);
    socket.emit("DRAW_STROKE_START", {
      width: strokeWidth,
      color: strokeColor,
    });
    socket.emit("DRAW_STROKE_POINT", pt);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !isMyTurn || hasPendingStroke) return;
    const pt = getNormPos(e);
    setLocalPendingPoints((prev) => [...prev, pt]);
    socket.emit("DRAW_STROKE_POINT", pt);
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasPendingStroke(true);
    socket.emit("DRAW_STROKE_END");
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleRetry = () => {
    socket.emit("DRAW_RETRY");
    setLocalPendingPoints([]);
    setHasPendingStroke(false);
  };

  const handleNextPlayer = () => {
    socket.emit("DRAW_NEXT_PLAYER");
    setLocalPendingPoints([]);
    setHasPendingStroke(false);
  };

  return (
    <div className="canvas-screen">
      <div className="game-header">
        {isMyTurn ? (
          <div className="turn-indicator is-me">
            <p>Your turn to draw</p>
            {roleInfo.role === "imposter" ? (
              <h2 className="secret-word imposter">
                You are the Imposter! Blend in.
              </h2>
            ) : (
              <h2 className="secret-word">Word: {roleInfo.word}</h2>
            )}
          </div>
        ) : (
          <div className="turn-indicator">
            <p>Waiting for artist</p>
            <h2>{currentPlayer?.name} is drawing...</h2>
          </div>
        )}
      </div>

      <div className="canvas-layout">
        <div
          className="canvas-main"
          style={{ flex: 1, width: "100%", maxWidth: "500px" }}
        >
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className={`drawing-board ${isMyTurn && !hasPendingStroke ? "can-draw" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>

          {isMyTurn && !hasPendingStroke && (
            <div className="drawing-tools">
              <div className="tool-group">
                <label>Thickness</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  style={{ '--thickness': `${strokeWidth}px` }}
                />
              </div>
              <div className="tool-group colors">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${strokeColor === c ? "active" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setStrokeColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {isMyTurn && (
            <div className="canvas-actions">
              <Button
                onClick={handleRetry}
                disabled={!hasPendingStroke}
                className="btn-retry"
              >
                Retry Stroke
              </Button>
              <Button onClick={handleNextPlayer} disabled={!hasPendingStroke}>
                End Turn
              </Button>
            </div>
          )}
        </div>

        <ScoreboardSidebar
          players={roomState.players}
          currentTurnUid={currentTurnUid}
          ownerUid={roomState.ownerUid}
          myUid={myPlayer?.uid}
        />
      </div>
    </div>
  );
}
