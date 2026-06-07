"use client";

import { useState } from "react";

// ----------------------------------------------------------------
// Sample text
// ----------------------------------------------------------------
const SAMPLE = `a) 機能／システム名称：めっき技術

b) 機能の概要／翻訳
入力：電気量 M（電流×時間）に応じて，出力 y：めっきが析出されるシステム

c) pダイアグラム要素（候補）
1) 機能／システム名：めっき技術
2）入力信号因子 M：電気量（電流×時間）
3) 出力特性値ｙ：めっき析出量（膜厚）
4) 制御因子：A：液の濃度，B：添加剤Bの濃度，C：添加剤Cの濃度，D：前処理法，E：液の温度，F：撹拌方法
5) 誤差因子：P：吊り下げ位置，Q：ワーク内測定位置，L：液の劣化
6) 標示因子：V：銀吊りめっき
7) 品質特性／不具合モード：未めっき，めっき剥がれ，膨れ，外観やけ

d) 現場への問いかけ
・現在，めっきのばらつきに最も影響を与えている要因は何だと考えられますか？
・過去に，めっき品質に関するどのような不具合事例がありましたか？
・めっき性能に関して，お客様や最終製品から最も要求されていることは何ですか？
・めっき工程において管理が難しい，変化しやすいパラメータは何でしょうか？
・めっき技術者の方々が，経験的に重要だと感じている「勘所」は？`;

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface PDiagramData {
  systemName: string;
  overview: string;
  signalFactor: string;
  outputFactor: string;
  controlFactors: string;
  noiseFactors: string;
  indicatorFactor: string;
  qualityChar: string;
  questions: string;
}

// ----------------------------------------------------------------
// Parse: extract 7 elements from structured text
// ----------------------------------------------------------------
function parseText(text: string): PDiagramData | null {
  // Split into sections by a) b) c) d) at line start
  const lines = text.split("\n");
  const sections: Record<string, string[]> = {};
  let current = "";

  for (const line of lines) {
    const m = line.match(/^([a-d])\)/);
    if (m) {
      current = m[1];
      sections[current] = [line];
    } else if (current) {
      sections[current].push(line);
    }
  }

  const sectionBody = (key: string) =>
    (sections[key] ?? []).slice(1).join("\n").trim();

  // a) システム名称
  const aFirstLine = (sections["a"] ?? [])[0] ?? "";
  const nameFromA = aFirstLine.match(/名称[：:]\s*(.+)/)?.[1]?.trim() ?? "";

  // b) 機能の概要
  const overview = sectionBody("b");

  // c) numbered items
  const cText = (sections["c"] ?? []).join("\n");

  const extractItem = (num: number, labelPattern: string): string => {
    // match both half-width (1) and full-width（１）bracket styles
    const fw = String.fromCharCode(65296 + num); // ０=65296
    const re = new RegExp(
      `[${num}${fw}][)）]\\s*${labelPattern}[：:]\\s*(.+)`
    );
    return cText.match(re)?.[1]?.trim() ?? "";
  };

  const systemName =
    extractItem(1, "機能[/／]システム名") || nameFromA;
  const signalFactor = extractItem(2, "入力信号因子\\s*[Mｍ]?");
  const outputFactor = extractItem(3, "出力特性値\\s*[yｙ]?");
  const controlFactors = extractItem(4, "制御因子");
  const noiseFactors = extractItem(5, "誤差因子");
  const indicatorFactor = extractItem(6, "標示因子");
  const qualityChar = extractItem(7, "品質特性[^：:]*");

  // d) 現場への問いかけ
  const questions = sectionBody("d");

  if (!systemName && !signalFactor && !controlFactors) return null;

  return {
    systemName,
    overview,
    signalFactor,
    outputFactor,
    controlFactors,
    noiseFactors,
    indicatorFactor,
    qualityChar,
    questions,
  };
}

// ----------------------------------------------------------------
// Format: text for clipboard (plain text)
// ----------------------------------------------------------------
function formatDiagramText(d: PDiagramData): string {
  return [
    "pダイアグラム",
    "",
    "　　　↓ 制御因子 ↓",
    `　　　${d.controlFactors}`,
    "",
    `入力信号因子 M：${d.signalFactor}　→　【 ${d.systemName} 】　→　出力特性値 y：${d.outputFactor}`,
    "",
    `標示因子：${d.indicatorFactor}`,
    `誤差因子：${d.noiseFactors}`,
    `品質特性値／不具合：${d.qualityChar}`,
  ].join("\n");
}

function formatDiagramHtml(d: PDiagramData): string {
  const td = `border:1px solid #c0bfba;padding:10px 14px;vertical-align:top;font-family:"游ゴシック",YuGothic,"Hiragino Sans",sans-serif;font-size:13px;color:#1a1a1a;`;
  const lbl = `font-size:11px;color:#52796f;font-weight:bold;display:block;margin-bottom:4px;`;
  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
<tr>
  <td style="${td}background:#f8f8f6;"></td>
  <td style="${td}text-align:center;">
    <span style="${lbl}">↓ 制御因子 ↓</span>${d.controlFactors || "—"}
  </td>
  <td style="${td}background:#f8f8f6;"></td>
</tr>
<tr>
  <td style="${td}">
    <span style="${lbl}">入力信号因子 M →</span>${d.signalFactor || "—"}
  </td>
  <td style="${td}text-align:center;background:#eef2ef;">
    <span style="${lbl}">機能／システム名</span>
    <strong>${d.systemName || "—"}</strong>
  </td>
  <td style="${td}">
    <span style="${lbl}">→ 出力特性値 y</span>${d.outputFactor || "—"}
  </td>
</tr>
<tr>
  <td style="${td}">
    <span style="${lbl}">標示因子</span>${d.indicatorFactor || "—"}
  </td>
  <td style="${td}">
    <span style="${lbl}">↑誤差因子↑</span>${d.noiseFactors || "—"}
  </td>
  <td style="${td}">
    <span style="${lbl}">品質特性値／不具合</span>${d.qualityChar || "—"}
  </td>
</tr>
</table>`;
}

function formatTextSection(d: PDiagramData): string {
  return [
    `a) 機能／システム名称：${d.systemName}`,
    "",
    "b) 機能の概要／翻訳",
    d.overview,
    "",
    "c) pダイアグラム要素",
    `1) 機能／システム名：${d.systemName}`,
    `2) 入力信号因子 M：${d.signalFactor}`,
    `3) 出力特性値 y：${d.outputFactor}`,
    `4) 制御因子：${d.controlFactors}`,
    `5) 誤差因子：${d.noiseFactors}`,
    `6) 標示因子：${d.indicatorFactor}`,
    `7) 品質特性／不具合モード：${d.qualityChar}`,
    "",
    "d) 現場への問いかけ",
    d.questions,
  ].join("\n");
}

// ----------------------------------------------------------------
// Clipboard helper (HTML + plain text fallback)
// ----------------------------------------------------------------
async function copyToClipboard(plainText: string, html?: string): Promise<void> {
  if (html) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // fall through to plain text
    }
  }
  await navigator.clipboard.writeText(plainText);
}

// ----------------------------------------------------------------
// Styles
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

  cell: {
    border: "1px solid var(--border)",
    padding: "10px 14px",
    verticalAlign: "top" as const,
    width: "33.33%",
  } satisfies React.CSSProperties,

  label: {
    fontSize: "14px",
    color: "var(--green)",
    fontWeight: "bold" as const,
    display: "block" as const,
    marginBottom: "6px",
  } satisfies React.CSSProperties,
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function Menu3() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<PDiagramData | null>(null);
  const [parseError, setParseError] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  const flash = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handleCreate = () => {
    const parsed = parseText(inputText);
    setResult(parsed);
    setParseError(parsed === null);
  };

  const handleCopyDiagram = async () => {
    if (!result) return;
    await copyToClipboard(formatDiagramText(result), formatDiagramHtml(result));
    flash("pダイアグラムをコピーしました");
  };

  const handleCopyText = async () => {
    if (!result) return;
    await copyToClipboard(formatTextSection(result));
    flash("文章部分をコピーしました");
  };

  return (
    <div>
      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={
          "＜入力例＞\na) 機能／システム名称\n\nb) 機能の概要／翻訳\n\nc) pダイアグラム要素\n　1) 機能／システム名：\n　2）入力信号因子M：\n　3) 出力特性値ｙ：\n　4) 制御因子：\n　5) 誤差因子：\n　6) 標示因子：\n　7) 品質特性／不具合モード：\n\nd) 現場への問いかけ（3～5つ）"
        }
        style={{
          width: "100%",
          minHeight: "220px",
          padding: "12px",
          border: "1px solid var(--border)",
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

      {/* Buttons row 1 */}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button style={S.btnPrimary} onClick={handleCreate}>
          pダイアグラム作成
        </button>
        <button style={S.btnGray} onClick={() => { setInputText(""); setResult(null); setParseError(false); }}>
          クリア
        </button>
        <button style={S.btnOrange} onClick={() => { setInputText(SAMPLE); setResult(null); setParseError(false); }}>
          サンプル入力
        </button>
      </div>

      {/* Copy buttons — only shown when result exists */}
      {result && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button style={S.btnGreen} onClick={handleCopyDiagram}>
            pダイアグラム コピー
          </button>
          <button style={S.btnGreen} onClick={handleCopyText}>
            文章部分 コピー
          </button>
          {copyMsg && (
            <span style={{ fontSize: "14px", color: "var(--green)" }}>{copyMsg}</span>
          )}
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <p style={{ color: "var(--orange)", marginTop: "12px", fontSize: "15px" }}>
          要素を抽出できませんでした。サンプルの形式を参考にご入力ください。
        </p>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: "2.5rem" }}>

          {/* P-diagram fixed layout table */}
          <h2 style={{ fontSize: "16px", color: "var(--green)", fontWeight: "bold", marginBottom: "10px" }}>
            pダイアグラム
          </h2>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <tbody>
              {/* Row 1: 制御因子 (top center) */}
              <tr>
                <td style={{ ...S.cell, background: "#f8f8f6" }} />
                <td style={{ ...S.cell, textAlign: "center" }}>
                  <span style={S.label}>↓ 制御因子 ↓</span>
                  <span style={{ color: "var(--text)" }}>{result.controlFactors || "—"}</span>
                </td>
                <td style={{ ...S.cell, background: "#f8f8f6" }} />
              </tr>

              {/* Row 2: M → system → y */}
              <tr>
                <td style={S.cell}>
                  <span style={S.label}>入力信号因子 M →</span>
                  <span style={{ color: "var(--text)" }}>{result.signalFactor || "—"}</span>
                </td>
                <td style={{ ...S.cell, textAlign: "center", background: "var(--green-bg)" }}>
                  <span style={{ ...S.label, textAlign: "center" }}>機能／システム名</span>
                  <span style={{ color: "var(--text)", fontWeight: "bold", fontSize: "1rem" }}>
                    {result.systemName || "—"}
                  </span>
                </td>
                <td style={S.cell}>
                  <span style={S.label}>→ 出力特性値 y</span>
                  <span style={{ color: "var(--text)" }}>{result.outputFactor || "—"}</span>
                </td>
              </tr>

              {/* Row 3: 標示因子 / 誤差因子 / 品質特性 */}
              <tr>
                <td style={S.cell}>
                  <span style={S.label}>標示因子</span>
                  <span style={{ color: "var(--text)" }}>{result.indicatorFactor || "—"}</span>
                </td>
                <td style={{ ...S.cell, textAlign: "center" }}>
                  <span style={S.label}>↑誤差因子↑</span>
                  <span style={{ color: "var(--text)" }}>{result.noiseFactors || "—"}</span>
                </td>
                <td style={S.cell}>
                  <span style={S.label}>品質特性値／不具合</span>
                  <span style={{ color: "var(--text)" }}>{result.qualityChar || "—"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Text section */}
          <h2 style={{ fontSize: "16px", color: "var(--green)", fontWeight: "bold", marginTop: "2rem", marginBottom: "10px" }}>
            文章部分
          </h2>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "16px",
              background: "white",
              lineHeight: 1.9,
              fontSize: "15px",
              color: "var(--text)",
              whiteSpace: "pre-wrap",
            }}
          >
            {formatTextSection(result)}
          </div>
        </div>
      )}
    </div>
  );
}
