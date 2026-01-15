export default function TypingIndicator({ label = "Réponse en cours" }) {
  return (
    <span className="typing-indicator" role="status" aria-live="polite" aria-label={label}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  );
}
