"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0B0714", color: "#FFF5F8", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 40 }}>Something broke</h1>
          <button onClick={reset} style={{ marginTop: 20, height: 52, padding: "0 28px", borderRadius: 999, border: 0, background: "linear-gradient(120deg,#FF4D7E,#FF8A65,#FFC870)", color: "#fff", fontWeight: 600 }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
