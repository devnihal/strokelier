import React from "react";

/**
 * A timer that counts down from `maxTime` (in seconds) based on when the player disconnected.
 * Formats as MM:SS if maxTime is greater than 60.
 */
export default function DisconnectTimer({ disconnectTime, maxTime = 120 }) {
  const [timeLeft, setTimeLeft] = React.useState(maxTime);

  React.useEffect(() => {
    if (!disconnectTime) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - disconnectTime) / 1000);
      setTimeLeft(Math.max(0, maxTime - elapsed));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [disconnectTime, maxTime]);

  if (timeLeft === 0) return null;

  return (
    <span
      title="Time until permanently kicked"
      style={{
        color: "#d9534f",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "8px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {maxTime > 60
        ? `${Math.floor(timeLeft / 60)
            .toString()
            .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`
        : `00:${timeLeft.toString().padStart(2, "0")}`}
    </span>
  );
}
