import React, { useState } from "react";
import Button from "../common/Button";
import "../../styles/Room/SettingsModal.css";

export default function SettingsModal({ settings, onClose, onSave }) {
  const [tempSettings, setTempSettings] = useState({
    maxPlayers: settings.maxPlayers,
    endCondition: settings.endCondition || "rounds",
    roundsPerGame: settings.roundsPerGame,
    targetScore: settings.targetScore || 500,
    drawTimeLimit: settings.drawTimeLimit, // null = infinite
    strokeLimit: settings.strokeLimit, // null = infinite
    imposterCount: settings.imposterCount || 1,
    anonymousVoting: settings.anonymousVoting || false,
    wordCategories: settings.wordCategories || ["standard"],
    customWords: settings.customWords || "",
  });

  const updateSetting = (key, value) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(tempSettings);
  };

  const toggleCategory = (cat) => {
    if (tempSettings.wordCategories.includes(cat)) {
      updateSetting(
        "wordCategories",
        tempSettings.wordCategories.filter((c) => c !== cat),
      );
    } else {
      updateSetting("wordCategories", [...tempSettings.wordCategories, cat]);
    }
  };

  const isCustomWordsActive = tempSettings.customWords.trim().length > 0;

  return (
    <div className="modal-scrim open" style={{ zIndex: 100 }}>
      <div className="shape-citadel play theme-word settings-modal-container">
        <span className="popup-header-label" style={{ color: "var(--brass)" }}>
          Studio Settings
        </span>

        <div className="settings-scroll-area">
          <div className="setting-group">
            <label>Max Artists: {tempSettings.maxPlayers}</label>
            <input
              type="range"
              min="3"
              max="20"
              value={tempSettings.maxPlayers}
              onChange={(e) =>
                updateSetting("maxPlayers", Number(e.target.value))
              }
            />
          </div>

          <div className="setting-group">
            <label>Win Condition</label>
            <div 
              className={`segment-control ${tempSettings.endCondition}`}
              onClick={() => updateSetting('endCondition', tempSettings.endCondition === 'rounds' ? 'score' : 'rounds')}
            >
              <div className="segment-indicator"></div>
              <span className={`segment-label ${tempSettings.endCondition === 'rounds' ? 'active' : ''}`}>Play by Rounds</span>
              <span className={`segment-label ${tempSettings.endCondition === 'score' ? 'active' : ''}`}>Target Score</span>
            </div>
          </div>

          {tempSettings.endCondition === "rounds" ? (
            <div className="setting-group indent">
              <label>Rounds: {tempSettings.roundsPerGame}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={tempSettings.roundsPerGame}
                onChange={(e) =>
                  updateSetting("roundsPerGame", Number(e.target.value))
                }
              />
            </div>
          ) : (
            <div className="setting-group indent">
              <label>Target Score: {tempSettings.targetScore}</label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={tempSettings.targetScore}
                onChange={(e) =>
                  updateSetting("targetScore", Number(e.target.value))
                }
              />
            </div>
          )}

          <div className="setting-group">
            <label>
              Draw Time Limit:{" "}
              {tempSettings.drawTimeLimit === null
                ? "Infinite"
                : `${tempSettings.drawTimeLimit}s`}
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="15"
              value={
                tempSettings.drawTimeLimit === null
                  ? 0
                  : tempSettings.drawTimeLimit
              }
              onChange={(e) => {
                const val = Number(e.target.value);
                updateSetting("drawTimeLimit", val === 0 ? null : val);
              }}
            />
          </div>

          <div className="setting-group">
            <label>
              Stroke Limit:{" "}
              {tempSettings.strokeLimit === null
                ? "Infinite"
                : tempSettings.strokeLimit}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={
                tempSettings.strokeLimit === null ? 0 : tempSettings.strokeLimit
              }
              onChange={(e) => {
                const val = Number(e.target.value);
                updateSetting("strokeLimit", val === 0 ? null : val);
              }}
            />
          </div>

          <div className="setting-group">
            <label>Imposters: {tempSettings.imposterCount}</label>
            <input
              type="range"
              min="1"
              max="3"
              value={tempSettings.imposterCount}
              onChange={(e) =>
                updateSetting("imposterCount", Number(e.target.value))
              }
            />
          </div>

          <div className="setting-group toggle-group">
            <span>Anonymous Voting</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tempSettings.anonymousVoting}
                onChange={(e) =>
                  updateSetting("anonymousVoting", e.target.checked)
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-group">
            <label>Word Banks</label>
            <div className="checkbox-list">
              {["standard", "animals", "objects", "actions", "places", "food"].map((cat) => (
                <label
                  key={cat}
                  className={isCustomWordsActive ? "disabled" : ""}
                >
                  <input
                    type="checkbox"
                    checked={tempSettings.wordCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    disabled={isCustomWordsActive}
                  />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>Custom Words (Comma separated, overrides above)</label>
            <div className="textarea-container">
              <textarea
                placeholder="e.g. apple, banana, car, mountain"
                value={tempSettings.customWords}
                onChange={(e) => updateSetting("customWords", e.target.value)}
              />
            </div>
            <div className="nsfw-warning">No NSFW words allowed.</div>
          </div>
        </div>

        <div className="settings-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
