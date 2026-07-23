import React, { useState } from "react";
import Button from "../common/Button";
import "../../styles/Room/SettingsModal.css";

// Base64 encoded to hide explicit terms from source code
// Base64 encoded to hide explicit terms from source code
const ENCODED_NSFW_WORDS = "ZnVjayxzaGl0LGJpdGNoLGFzcyxkaWNrLHB1c3N5LGN1bnQsY29jayx3aG9yZSxzbHV0LHBvcm4sc2V4LG5pZ2dlcixuaWdnYSxmYWdnb3QsYm9vYix0aXRzLHZhZ2luYSxwZW5pcyxiYXN0YXJkLHdhbmtlcix0d2F0LGplcmsscHJpY2ssY3VtLGNsaXQsZGlsZG8sc2x1dHR5LGhvcm55LHJhcGUsaW5jZXN0LGJsb3dqb2IsaGFuZGpvYix0aXRqb2IsbnVkZSxuYWtlZCxvcmd5LHRob3Qsc3BpYyxjaGluayxnb29rLGtpa2Usd2V0YmFjayxjb29uLHBlZG9waGlsZSxwZWRvLG1vbGVzdGVyLGFuYWwsc3Blcm0sc2VtZW4sdmlicmF0b3Isb3JnYXNtLG1hc3R1cmJhdGUsYm9uZXIsYXNzaG9sZSxtb3RoZXJmdWNrZXIscmV0YXJkLHRyYW5ueSxkeWtlLHNrYW5rLHNrYW5reSxob29rZXIsYmltYm8sbWlsZixidWtrYWtlLGdhbmdiYW5nLGdsb3J5aG9sZSxzY2hsb25nLHBlY2tlcixjYW1lbHRvZSxmYXAsaml6eixzbWVnbWEscmltam9iLHNjcm90ZSxzY3JvdHVtLHRlc3RpY2xlLG51dGJhZyx0aXR0eSx0aXR0aWVzLGJ1dHRwbHVnLGJ1dHRob2xlLGRlZXB0aHJvYXQsZG9nZ3lzdHlsZSxtaXNzaW9uYXJ5LGNvd2dpcmwsc2Npc3NvcmluZyxmaXN0aW5nLHBlZ2dpbmcsdGVhYmFnZ2luZyxjcmVhbXBpZSxzcXVpcnQsZmFjaWFsLDY5LGJkc20sa2luayxmZXRpc2gsYm9uZGFnZSxzYWRpc20sbWFzb2NoaXNt";
const NSFW_WORDS = atob(ENCODED_NSFW_WORDS).split(',');
const nsfwRegex = new RegExp(`\\b(${NSFW_WORDS.join('|')})\\b`, 'gi');

export default function SettingsModal({ settings, onClose, onSave }) {
  const [tempSettings, setTempSettings] = useState({
    maxPlayers: settings.maxPlayers,
    endCondition: settings.endCondition || "rounds",
    roundsPerGame: settings.roundsPerGame,
    targetScore: settings.targetScore || 500,
    drawTimeLimit: settings.drawTimeLimit,
    strokeLimit: settings.strokeLimit,
    imposterCount: settings.imposterCount || 1,
    anonymousVoting: settings.anonymousVoting !== undefined ? settings.anonymousVoting : true,
    wordCategories: settings.wordCategories || ["standard"],
    customWords: settings.customWords || "",
  });

  const customWordsStr = tempSettings.customWords || "";
  const nsfwMatches = [...customWordsStr.matchAll(nsfwRegex)].map(m => m[0]);
  const hasNsfw = nsfwMatches.length > 0;

  const renderHighlightedText = () => {
    if (!customWordsStr) return null;
    const parts = customWordsStr.split(nsfwRegex);
    return parts.map((part, i) => {
      if (new RegExp(`^(${NSFW_WORDS.join('|')})$`, 'i').test(part)) {
        return <mark key={i}>{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const updateSetting = (key, value) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (hasNsfw) return;
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
              max="12"
              value={tempSettings.maxPlayers}
              style={{ '--progress': `${((tempSettings.maxPlayers - 3) / 9) * 100}%` }}
              onChange={(e) =>
                updateSetting("maxPlayers", Number(e.target.value))
              }
            />
          </div>



          <div className="setting-group">
            <label>Rounds: {tempSettings.roundsPerGame}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={tempSettings.roundsPerGame}
              style={{ '--progress': `${((tempSettings.roundsPerGame - 1) / 9) * 100}%` }}
              onChange={(e) =>
                updateSetting("roundsPerGame", Number(e.target.value))
              }
            />
          </div>

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
              style={{ '--progress': `${((tempSettings.drawTimeLimit === null ? 0 : tempSettings.drawTimeLimit) / 90) * 100}%` }}
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
              style={{ '--progress': `${((tempSettings.strokeLimit === null ? 0 : tempSettings.strokeLimit) / 10) * 100}%` }}
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
              style={{ '--progress': `${((tempSettings.imposterCount - 1) / 2) * 100}%` }}
              onChange={(e) =>
                updateSetting("imposterCount", Number(e.target.value))
              }
            />
          </div>          <div className="setting-group toggle-group">
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
              <div className="textarea-backdrop">
                {renderHighlightedText()}
              </div>
              <textarea
                className={hasNsfw ? "has-error" : ""}
                placeholder="e.g. apple, banana, car, mountain"
                value={tempSettings.customWords}
                onChange={(e) => updateSetting("customWords", e.target.value)}
                onScroll={(e) => {
                  if (e.target.previousSibling) {
                    e.target.previousSibling.scrollTop = e.target.scrollTop;
                  }
                }}
              />
            </div>
            {hasNsfw && (
              <div className="nsfw-warning">
                Remove NSFW words to save
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={hasNsfw} style={{ opacity: hasNsfw ? 0.5 : 1 }}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
