import { useState } from "react";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const getScore = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/v1/getScore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet }),
      });

      const data = await res.json();
      setScore(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 
  const getScoreColor = (value) => {
    if (value > 70) return "#22c55e";
    if (value > 40) return "#facc15"; 
    return "#ef4444"; 
  };

  const getLabelColor = (value) => {
    if (value > 70) return "rgba(34,197,94,0.15)";
    if (value > 40) return "rgba(250,204,21,0.15)";
    return "rgba(239,68,68,0.15)";
  };

  return (
    <div
      style={{
        width: 320,
        height: 420,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        background:
          "linear-gradient(135deg, #0f172a, #1e293b, #020617)",
        color: "white",
      }}
    >
      <div style={{ width: "100%" }}>
        
        <h2
          style={{
            textAlign: "center",
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
           Wallet Score ◎
        </h2>

     
        {!score && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "center",
            }}
          >
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address"
              style={{
                width: "90%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                outline: "none",
                fontSize: "14px",
              }}
            />

            <button
              onClick={getScore}
              disabled={loading}
              style={{
                width: "90%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background:
                  "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
                transition: "0.3s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Analyzing..." : "Get Score"}
            </button>
          </div>
        )}

   
        {score && (
          <div
            style={{
              padding: 16,
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 12, opacity: 0.6 }}>
              Wallet Address
            </p>

            <p
              style={{
                fontSize: 12,
                wordBreak: "break-all",
                marginBottom: 12,
              }}
            >
              {score.address}
            </p>
            <h1
              style={{
                fontSize: 42,
                margin: "10px 0",
                color: getScoreColor(score.score),
              }}
            >
              {score.score}
            </h1>
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "999px",
                background: getLabelColor(score.score),
                color: getScoreColor(score.score),
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {score.scoreLable}
            </div>

            <button
              onClick={() => {
                setScore(null);
                setWallet("");
              }}
              style={{
                marginTop: 10,
                padding: "10px",
                width: "100%",
                borderRadius: "10px",
                border: "solid-rgba",
                 background:
                  "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
                
              }}
            >
              Check Another Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}