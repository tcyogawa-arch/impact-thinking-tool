"use client";

import { useState } from "react";

// ----------------------------------------------------------------
// Sample input
// ----------------------------------------------------------------
const SAMPLE = `技術テーマ／システム名：
表面処理技術（めっき）

相談したいこと：
めっき技術について調査／対話したいです。`;

// ----------------------------------------------------------------
// Styles — same design language as Menu2 / Menu3
// ----------------------------------------------------------------
const S = {
  btnPrimary: {
    background: "var(--green-bright)",
    color: "white",
    border: "none",
    borderRadius: 4,
    padding: "8px 22px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnPrimaryDisabled: {
    background: "#9abfad",
    color: "white",
    border: "none",
    borderRadius: 4,
    padding: "8px 22px",
    cursor: "not-allowed",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnOrange: {
    background: "white",
    color: "var(--orange)",
    border: "1px solid var(--orange)",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnGreen: {
    background: "white",
    color: "var(--green)",
    border: "1px solid var(--green)",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnGray: {
    background: "white",
    color: "#666",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function Menu1() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState("");

  const flash = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError("技術テーマや相談内容を入力してください。");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "エラーが発生しました。再試行してください。");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("通信エラーが発生しました。ネットワーク接続を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    flash("回答をコピーしました");
  };

  return (
    <div>
      {/* Description */}
      <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
        技術テーマやシステム名を入力すると、品質工学の観点でpダイアグラム要素の候補と現場への問いを生成します。
      </p>

      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); setError(null); }}
        placeholder={
          "＜入力例＞\n技術テーマ／システム名：\n表面処理技術（めっき）\n\n相談したいこと：\nめっき技術について調査／対話したいです。"
        }
        disabled={loading}
        style={{
          width: "100%",
          minHeight: "180px",
          padding: "12px",
          border: error ? "1px solid var(--orange)" : "1px solid var(--border)",
          borderRadius: 4,
          fontSize: "15px",
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
          lineHeight: 1.85,
          background: loading ? "#f5f5f3" : "white",
          color: "var(--text)",
        }}
      />

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          style={loading ? S.btnPrimaryDisabled : S.btnPrimary}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "対話中..." : "対話を始める"}
        </button>
        <button style={S.btnGray} onClick={handleClear} disabled={loading}>
          クリア
        </button>
        <button
          style={S.btnOrange}
          onClick={() => { setInputText(SAMPLE); setResult(null); setError(null); }}
          disabled={loading}
        >
          サンプル入力
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "var(--orange)", marginTop: "12px", fontSize: "15px", lineHeight: 1.6 }}>
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "16px", color: "var(--green)", fontWeight: "bold", margin: 0 }}>
              Geminiの回答
            </h2>
            <button style={S.btnGreen} onClick={handleCopy}>
              コピー
            </button>
            {copyMsg && (
              <span style={{ fontSize: "14px", color: "var(--green)" }}>{copyMsg}</span>
            )}
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "16px 20px",
              background: "white",
              lineHeight: 1.9,
              fontSize: "15px",
              color: "var(--text)",
              whiteSpace: "pre-wrap",
            }}
          >
            {result}
          </div>

          <p style={{ marginTop: "10px", fontSize: "14px", color: "#888" }}>
            ※ AIの出力は正解ではなく，品質工学支援スタッフが現場向けに調整／仕上げて使うものです。
          </p>
        </div>
      )}
    </div>
  );
}
