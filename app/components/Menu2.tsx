"use client";

import { useState } from "react";

// ----------------------------------------------------------------
// Sample input
// ----------------------------------------------------------------
const INITIAL = `技術テーマ／システム名：〇〇技術

お願い：品質工学の視点でpダイアグラム要素を抽出したいです。`;

const SAMPLE = `技術テーマ／システム名：表面処理技術（めっき技術）

お願い：品質工学の視点でpダイアグラム要素を抽出したいです。`;

// ----------------------------------------------------------------
// Prompt generator
// ----------------------------------------------------------------
function generatePrompt(text: string): string {
  // Extract 技術テーマ line
  const themeMatch = text.match(/技術テーマ[／/]?システム名[：:]\s*(.+)/);
  const theme = themeMatch ? themeMatch[1].trim() : "（記載なし）";

  // Extract 要約／翻訳したいこと or お願い section
  const requestMatch = text.match(/(?:要約[／/]翻訳したいこと|お願い)[：:]\s*([\s\S]*)$/);
  const requestContent = requestMatch
    ? requestMatch[1].trim()
    : themeMatch
    ? text.replace(/技術テーマ[／/]?システム名[：:].+\n?/, "").trim()
    : text.trim();

  return `【依頼】
以下の論文・文献を，品質工学の観点から整理してください。

【技術テーマ／システム名】
${theme}

【依頼内容】
${requestContent}

【整理の指示】
・対象の論文・文献を，現場技術者にも理解しやすい表現で要約・翻訳すること
・単なる論文要約ではなく，品質工学の観点から整理すること
・入力内容や文献中に該当するものがない・不明なものは，勝手に推測しすぎず「該当なし」「不明」とすること

【出力形式】
以下の4項目で出力してください。

a) 機能／システム名称

b) 機能の概要／翻訳
最大5行程度を目安に，現場技術者にも伝わる表現で説明すること。

c) pダイアグラム要素
1) 機能／システム名：
2）入力信号因子 M：
3) 出力特性値 y：
4) 制御因子：
5) 誤差因子：
6) 標示因子：
7) 品質特性／不具合モード：

d) 現場への問いかけ
現場技術者との対話で確認すべき問いを3〜5つ作成すること。

【追加指示】
・複数回の実験（初回実験，2回目実験，予備実験，本実験など）がある場合は，実験ごとに上記a)〜d)を整理すること
・専門用語は，できるだけ現場技術者に伝わる言葉に翻訳すること
・出力は原則としてA4で2ページ前後に収まる程度を目指すこと
・AIの出力は正解ではなく，品質工学支援スタッフが現場向けに調整／仕上げて使う前提で作成すること

---
【論文・文献の情報を追加してください】
（このプロンプトをコピーし，論文・文献の情報を追記／添付して，ChatGPT・Gemini・Copilot等に送信してください）
`;
}

// ----------------------------------------------------------------
// Styles — same design language as Menu3
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
export default function Menu2() {
  const [inputText, setInputText] = useState(INITIAL);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  const flash = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handleGenerate = () => {
    if (!inputText.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setGeneratedPrompt(generatePrompt(inputText));
  };

  const handleClear = () => {
    setInputText(INITIAL);
    setGeneratedPrompt(null);
    setInputError(false);
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    flash("プロンプトをコピーしました");
  };

  return (
    <div>
      {/* Description */}
      <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
        PDFや論文・文献を ChatGPT・Gemini・Copilot 等に読ませるための指示文を生成します。
        生成されたプロンプトをコピーし，論文・文献の情報を追記／添付して利用の生成AIにて送信してください。
      </p>

      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); setInputError(false); }}
        placeholder={
          "＜入力例＞\n技術テーマ／システム名：表面処理技術（めっき技術）\n\nお願い：品質工学の視点でpダイアグラム要素を抽出したいです。"
        }
        style={{
          width: "100%",
          minHeight: "180px",
          padding: "12px",
          border: inputError ? "1px solid var(--orange)" : "1px solid var(--border)",
          borderRadius: 4,
          fontSize: "15px",
          fontFamily: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
          lineHeight: 1.85,
          background: "white",
          color: "var(--text)",
        }}
      />

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button style={S.btnPrimary} onClick={handleGenerate}>
          プロンプト生成
        </button>
        <button style={S.btnGray} onClick={handleClear}>
          クリア
        </button>
        <button style={S.btnOrange} onClick={() => { setInputText(SAMPLE); setGeneratedPrompt(null); setInputError(false); }}>
          サンプル入力
        </button>
      </div>

      {/* Input error */}
      {inputError && (
        <p style={{ color: "var(--orange)", marginTop: "10px", fontSize: "15px" }}>
          技術テーマや依頼内容を入力してください。
        </p>
      )}

      {/* Generated prompt */}
      {generatedPrompt && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "16px", color: "var(--green)", fontWeight: "bold", margin: 0 }}>
              生成されたプロンプト
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
            {generatedPrompt}
          </div>

          <p style={{ marginTop: "10px", fontSize: "14px", color: "#888" }}>
            ※ 上のプロンプトをコピーし，論文・文献の情報を追記／添付して利用の生成AIにて送信してください。
          </p>
        </div>
      )}
    </div>
  );
}
