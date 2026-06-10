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
// Strip Markdown: remove heading/bold/bullet markers from AI output
// ----------------------------------------------------------------
function stripMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let l = line.replace(/^\s*#{1,4}\s*/, "");  // ## heading markers
      l = l.replace(/\*\*(.+?)\*\*/g, "$1");        // **bold** → plain
      l = l.replace(/^[-*]\s+/, "");                 // - and * bullets at line start
      return l;
    })
    .filter((line) => {
      const t = line.trim();
      return t === "" || !/^[*\-・]+$/.test(t);      // remove marker-only lines
    })
    .join("\n");
}

// ----------------------------------------------------------------
// Simplify LaTeX: convert $...$ inline math to plain text
// ----------------------------------------------------------------
function simplifyLatex(text: string): string {
  return text.replace(/\$([^$\n]+)\$/g, (_, inner) => {
    let s: string = inner;
    // Fractions first (must run before brace removal)
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
    // Greek letters
    s = s.replace(/\\alpha/g, "α");
    s = s.replace(/\\beta/g, "β");
    s = s.replace(/\\gamma/g, "γ");
    s = s.replace(/\\delta/g, "δ");
    s = s.replace(/\\Delta/g, "Δ");
    s = s.replace(/\\sigma/g, "σ");
    s = s.replace(/\\Sigma/g, "Σ");
    s = s.replace(/\\mu/g, "μ");
    s = s.replace(/\\eta/g, "η");
    s = s.replace(/\\epsilon/g, "ε");
    s = s.replace(/\\phi/g, "φ");
    // Math symbols
    s = s.replace(/\\times/g, "×");
    s = s.replace(/\\pm/g, "±");
    s = s.replace(/\\cdot/g, "·");
    // Subscripts: _{N} then _N
    s = s.replace(/_{([^}]+)}/g, "$1");
    s = s.replace(/_([A-Za-z0-9])/g, "$1");
    // Superscripts: ^{N} then ^N
    s = s.replace(/\^{([^}]+)}/g, "$1");
    s = s.replace(/\^([A-Za-z0-9])/g, "$1");
    // Remove remaining backslash commands and braces
    s = s.replace(/\\[a-zA-Z]+/g, "");
    s = s.replace(/[{}]/g, "");
    // Remove LaTeX artifact spaces between adjacent alphanumeric tokens
    s = s.replace(/([A-Za-zα-ωΑ-Ω0-9]) ([A-Za-zα-ωΑ-Ω0-9])/g, "$1$2");
    return s.trim();
  });
}

// ----------------------------------------------------------------
// Normalize: restore newlines lost when pasting AI-generated text
// ----------------------------------------------------------------
function normalizeInput(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = stripMarkdown(t);
  t = simplifyLatex(t);
  // Insert newline before section headers (a-d) that appear mid-line
  t = t.replace(/([^\n])([a-d][)）])/g, "$1\n$2");
  // Insert newline before item numbers (1-7, half or full-width) that appear mid-line
  t = t.replace(/([^\n])([1-7１-７][)）])/g, "$1\n$2");
  // Collapse 3+ consecutive newlines to 2
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
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
    const fw = String.fromCharCode(65296 + num); // ０=65296
    const lines = cText.split("\n");

    // Primary: find the header line with number prefix, then collect following lines
    const headerRe = new RegExp(
      `^[ \\t]*[${num}${fw}][)）][ \\t]*${labelPattern}[：:]?(.*)`
    );
    let startIdx = -1;
    let inlineContent = "";
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(headerRe);
      if (m) { startIdx = i; inlineContent = m[1]?.trim() ?? ""; break; }
    }

    if (startIdx >= 0) {
      // Collect following lines until the next numbered item header
      const nextItemRe = /^[ \t]*[1-7１-７][)）]/;
      const contentLines: string[] = [];
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].match(nextItemRe)) break;
        const l = lines[i].trim();
        if (l) contentLines.push(l);
      }
      const parts = inlineContent ? [inlineContent, ...contentLines] : contentLines;
      if (parts.length > 0) return parts.join("\n");
    }

    // Fallback: label-only single-line match (for AI output without number prefix)
    const labelRe = new RegExp(`^[ \\t]*${labelPattern}[：:][ \\t]*(.+)`);
    for (const line of lines) {
      const m = line.match(labelRe);
      if (m) return m[1]?.trim() ?? "";
    }
    return "";
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

  fieldTextarea: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    lineHeight: 1.75,
    background: "white",
    color: "var(--text)",
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
  const [editData, setEditData] = useState<PDiagramData | null>(null);

  const updateField = (key: keyof PDiagramData, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const flash = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handleDecompose = () => {
    const parsed = parseText(normalizeInput(inputText));
    setEditData(parsed);
    setResult(null);
    setParseError(parsed === null);
  };

  const handleCreate = () => {
    if (!editData) return;
    setResult({ ...editData });
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
        <button style={S.btnPrimary} onClick={handleDecompose}>
          テキスト分解
        </button>
        <button style={S.btnGray} onClick={() => { setInputText(""); setEditData(null); setResult(null); setParseError(false); }}>
          クリア
        </button>
        <button style={S.btnOrange} onClick={() => { setInputText(SAMPLE); setEditData(null); setResult(null); setParseError(false); }}>
          サンプル入力
        </button>
      </div>

      {/* Parse error */}
      {parseError && (
        <p style={{ color: "var(--orange)", marginTop: "12px", fontSize: "15px" }}>
          要素を抽出できませんでした。サンプルの形式を参考にご入力ください。
        </p>
      )}

      {/* Edit section — shown after テキスト分解 */}
      {editData && (
        <div style={{ marginTop: "2rem", borderTop: "2px solid var(--green-light)", paddingTop: "1.5rem" }}>
          <h2 style={{ fontSize: "16px", color: "var(--green)", fontWeight: "bold", marginBottom: "1rem" }}>
            要素の確認・編集
          </h2>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>a) 機能／システム名称</span>
            <textarea rows={1} value={editData.systemName} onChange={(e) => updateField("systemName", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>b) 機能の概要／翻訳</span>
            <textarea rows={3} value={editData.overview} onChange={(e) => updateField("overview", e.target.value)} style={S.fieldTextarea} />
          </div>

          <p style={{ fontSize: "14px", color: "var(--green)", fontWeight: "bold", margin: "8px 0 12px" }}>
            c) pダイアグラム要素（候補）
          </p>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>2) 入力信号因子 M</span>
            <textarea rows={1} value={editData.signalFactor} onChange={(e) => updateField("signalFactor", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>3) 出力特性値 y</span>
            <textarea rows={1} value={editData.outputFactor} onChange={(e) => updateField("outputFactor", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>4) 制御因子</span>
            <textarea rows={2} value={editData.controlFactors} onChange={(e) => updateField("controlFactors", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>5) 誤差因子</span>
            <textarea rows={2} value={editData.noiseFactors} onChange={(e) => updateField("noiseFactors", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>6) 標示因子</span>
            <textarea rows={1} value={editData.indicatorFactor} onChange={(e) => updateField("indicatorFactor", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>7) 品質特性／不具合モード</span>
            <textarea rows={2} value={editData.qualityChar} onChange={(e) => updateField("qualityChar", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span style={S.label}>d) 現場への問いかけ</span>
            <textarea rows={5} value={editData.questions} onChange={(e) => updateField("questions", e.target.value)} style={S.fieldTextarea} />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button style={S.btnPrimary} onClick={handleCreate}>
              pダイアグラム作成
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: "2.5rem" }}>
          {/* Copy buttons */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
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
