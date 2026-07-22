"use client";

export default function PrivacyPreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("legends:open-privacy"))}
      style={{
        padding: 0,
        color: "inherit",
        background: "transparent",
        border: 0,
        font: "inherit",
        cursor: "pointer",
        opacity: 0.72,
      }}
    >
      Privacidade
    </button>
  );
}
