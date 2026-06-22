export default function DCTLogo({
  size = "default",
  showSubtext = true,
  className = "",
  onClick,
}) {
  const markSize = size === "small" ? 40 : 48;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`dct-brand-logo ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        border: 0,
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
      }}
    >
      <span
        style={{
          width: markSize,
          height: markSize,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: 24,
          fontWeight: 900,
          background: "linear-gradient(135deg,#007BBF,#024981)",
          boxShadow: "0 10px 22px rgba(3,126,196,.22)",
          lineHeight: 1,
        }}
      >
        D
      </span>

      <span style={{ display: "grid", gap: 4, textAlign: "left" }}>
        <strong
          style={{
            color: "#1F1A17",
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: "0.16em",
            lineHeight: 1,
          }}
        >
          DIGITAL
        </strong>

        {showSubtext && (
          <span
            style={{
              color: "#6A6B6D",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.32em",
              lineHeight: 1,
            }}
          >
            CAD TRAINING
          </span>
        )}
      </span>
    </button>
  );
}