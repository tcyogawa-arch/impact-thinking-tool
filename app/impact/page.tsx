"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────
type ImpactLevel = "high" | "mid" | "low" | "";
type SpeedLevel  = "slow" | "mid" | "fast" | "";

interface Theme {
  id: string;
  text: string;
  impact: ImpactLevel;
  speed: SpeedLevel;
  placed: boolean;
}

interface Subtheme {
  id: string;
  title: string;
  reason: string;
  impact: ImpactLevel;
  speed: SpeedLevel;
  placed: boolean;
}

interface Memo {
  subtheme: string;
  today: string;
  thisWeek: string;
  nextCheck: string;
}

// ─── Matrix definitions ───────────────────────────────────────────────
const MATRIX_CELLS: Record<string, { num: number; label: string }> = {
  high_slow: { num: 7, label: "大きな課題・砕く候補" },
  high_mid:  { num: 3, label: "計画して進める" },
  high_fast: { num: 1, label: "最優先" },
  mid_slow:  { num: 8, label: "見直し候補" },
  mid_mid:   { num: 4, label: "検討" },
  mid_fast:  { num: 2, label: "早めに着手" },
  low_slow:  { num: 9, label: "やらない候補" },
  low_mid:   { num: 6, label: "後回し" },
  low_fast:  { num: 5, label: "やりすぎ注意" },
};

const IMPACT_OPTIONS: { value: ImpactLevel; label: string }[] = [
  { value: "",     label: "選択してください" },
  { value: "high", label: "高" },
  { value: "mid",  label: "中" },
  { value: "low",  label: "低" },
];

const SPEED_OPTIONS: { value: SpeedLevel; label: string }[] = [
  { value: "",     label: "選択してください" },
  { value: "slow", label: "遅い" },
  { value: "mid",  label: "中間" },
  { value: "fast", label: "早い" },
];

const IMPACT_LABELS: Record<string, string> = { high: "高", mid: "中", low: "低" };
const SPEED_LABELS:  Record<string, string> = { slow: "遅い", mid: "中間", fast: "早い" };

// ─── Helpers ─────────────────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

function cellBg(num: number): string {
  if (num === 1) return "#e6f4ea";
  if (num === 2) return "#eef5f0";
  if (num === 7) return "#fff4e6";
  if (num === 9) return "#f5f5f5";
  return "#ffffff";
}

function mapImpact(v?: string): ImpactLevel {
  if (v === "高") return "high";
  if (v === "中") return "mid";
  if (v === "低") return "low";
  return "";
}

function mapSpeed(v?: string): SpeedLevel {
  if (v === "早い") return "fast";
  if (v === "中間") return "mid";
  if (v === "遅い") return "slow";
  return "";
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function newTheme(): Theme {
  return { id: uid(), text: "", impact: "", speed: "", placed: false };
}

function newSubtheme(title = "", reason = "", impact: ImpactLevel = "", speed: SpeedLevel = ""): Subtheme {
  return { id: uid(), title, reason, impact, speed, placed: false };
}

// ─── Sample data ──────────────────────────────────────────────────────
const SAMPLE_THEMES: Omit<Theme, "id">[] = [
  { text: "歩留まりを抜本的に改善する",       impact: "high", speed: "slow", placed: true },
  { text: "段取り替え時間を短縮する",           impact: "mid",  speed: "fast", placed: true },
  { text: "検査記録の手戻りを減らす",           impact: "mid",  speed: "mid",  placed: true },
  { text: "部品欠品によるライン停止を減らす",   impact: "high", speed: "slow", placed: true },
  { text: "作業ミスによる手直しを減らす",       impact: "mid",  speed: "mid",  placed: true },
];

const SAMPLE_SUBTHEMES: Omit<Subtheme, "id">[] = [
  { title: "直近3か月の不良を種類別に分類する",       reason: "まず影響の大きい不良を絞るため",     impact: "high", speed: "fast", placed: true },
  { title: "最多不良が発生している工程を特定する",     reason: "手をつける場所を明確にするため",     impact: "high", speed: "fast", placed: true },
  { title: "設備条件の設定値と実績値の差を確認する",   reason: "設備ばらつきの有無を見るため",       impact: "high", speed: "mid",  placed: true },
  { title: "作業者による手順差を観察する",             reason: "作業ばらつきの可能性を見るため",     impact: "mid",  speed: "fast", placed: true },
  { title: "材料ロット別の不良傾向を確認する",         reason: "材料要因の影響を見るため",           impact: "mid",  speed: "mid",  placed: true },
];

const SAMPLE_MEMO: Memo = {
  subtheme:  "直近3か月の不良を種類別に分類する",
  today:     "直近の不良データを10件集める",
  thisWeek:  "不良種類、発生工程、品番、設備、材料ロットで並べる",
  nextCheck: "最多不良1件について、発生工程と発生条件を確認する",
};

// ─── Copy formatters ──────────────────────────────────────────────────
const COPY_FF = `'Yu Gothic', '游ゴシック', 'YuGothic', sans-serif`;

// Shared style snippets for copy HTML (single-quoted font names safe inside double-quoted HTML attrs)
const C = {
  table: `border-collapse:collapse;width:100%;table-layout:fixed;font-family:${COPY_FF};font-size:11pt;line-height:1.5;`,
  th: `border:1px solid #999;padding:8px;background-color:#DDEBF7;font-weight:bold;text-align:center;vertical-align:middle;font-family:${COPY_FF};font-size:11pt;line-height:1.5;`,
  td: `border:1px solid #999;padding:8px;background-color:#FFFFFF;text-align:left;vertical-align:top;font-family:${COPY_FF};font-size:11pt;line-height:1.5;`,
  axisCol: `width:48px;`,
  dataCol: `width:30%;`,
};

type CopyItem = { placed: boolean; impact: ImpactLevel; speed: SpeedLevel; text: string };

function buildMatrixHtml(items: CopyItem[], title: string): string {
  // Row 1: title (col 1-2) + "← 実施スピード →" (col 3-5)
  const row1 =
    `<tr>` +
    `<th colspan="2" style="${C.th}">${escHtml(title)}</th>` +
    `<th colspan="3" style="${C.th}">← 実施スピード →</th>` +
    `</tr>`;

  // Row 2: empty axis cells + speed labels
  const row2 =
    `<tr>` +
    `<th style="${C.th}${C.axisCol}"></th>` +
    `<th style="${C.th}${C.axisCol}"></th>` +
    `<th style="${C.th}${C.dataCol}">遅い</th>` +
    `<th style="${C.th}${C.dataCol}">中間</th>` +
    `<th style="${C.th}${C.dataCol}">早い</th>` +
    `</tr>`;

  // Vertical "↑インパクト↓" text — one character per line
  const impactVertical = `↑<br>${"インパクト".split("").join("<br>")}<br>↓`;

  // Rows 3-5: impact × speed data cells
  const dataRows = (["high", "mid", "low"] as const).map((impact, idx) => {
    const cells = (["slow", "mid", "fast"] as const).map((speed) => {
      const cell = MATRIX_CELLS[`${impact}_${speed}`];
      const its = items.filter((t) => t.placed && t.impact === impact && t.speed === speed);
      const label = escHtml(`${cell.num}：${cell.label}`);
      const content = its.length === 0
        ? label
        : label + "<br>" + its.map((t) => escHtml(t.text)).join("<br>");
      return `<td style="${C.td}${C.dataCol}">${content}</td>`;
    }).join("");

    const axisCell = idx === 0
      ? `<th rowspan="3" style="${C.th}${C.axisCol}">${impactVertical}</th>`
      : "";

    return `<tr>${axisCell}<th style="${C.th}${C.axisCol}">${IMPACT_LABELS[impact]}</th>${cells}</tr>`;
  }).join("");

  return `<table style="${C.table}">${row1}${row2}${dataRows}</table>`;
}

function buildMatrixTsv(items: CopyItem[], title: string): string {
  const row1 = `${title}\t\t← 実施スピード →`;
  const row2 = `\t\t遅い\t中間\t早い`;
  const dataRows = (["high", "mid", "low"] as const).map((impact, idx) => {
    const axisLabel = idx === 0 ? "↑ インパクト ↓" : "";
    const cells = (["slow", "mid", "fast"] as const).map((speed) => {
      const cell = MATRIX_CELLS[`${impact}_${speed}`];
      const its = items.filter((t) => t.placed && t.impact === impact && t.speed === speed);
      const label = `${cell.num}：${cell.label}`;
      return its.length === 0 ? label : label + " / " + its.map((t) => t.text).join(" / ");
    });
    return `${axisLabel}\t${IMPACT_LABELS[impact]}\t${cells.join("\t")}`;
  });
  return [row1, row2, ...dataRows].join("\n");
}

function buildThemeMatrixHtml(themes: Theme[]): string {
  const items: CopyItem[] = themes.map((t) => ({ placed: t.placed, impact: t.impact, speed: t.speed, text: t.text }));
  return buildMatrixHtml(items, "優先順位マトリクス");
}

function buildSubthemeMatrixHtml(subthemes: Subtheme[]): string {
  const items: CopyItem[] = subthemes.map((s) => ({ placed: s.placed, impact: s.impact, speed: s.speed, text: s.title }));
  return buildMatrixHtml(items, "解体後マトリクス");
}

function formatThemeMatrixTsv(themes: Theme[]): string {
  const items: CopyItem[] = themes.map((t) => ({ placed: t.placed, impact: t.impact, speed: t.speed, text: t.text }));
  return buildMatrixTsv(items, "優先順位マトリクス");
}

function formatThemeList(themes: Theme[]): string {
  const lines = ["【候補テーマ一覧】", ""];
  themes.forEach((t, i) => {
    const key = t.impact && t.speed ? `${t.impact}_${t.speed}` : "";
    const cell = key ? MATRIX_CELLS[key] : null;
    lines.push(`${i + 1}. ${t.text || "（未入力）"}`);
    lines.push(`   インパクト：${t.impact ? IMPACT_LABELS[t.impact] : "未選択"}　実施スピード：${t.speed ? SPEED_LABELS[t.speed] : "未選択"}${cell ? `　→ ${cell.num}：${cell.label}` : ""}`);
    lines.push("");
  });
  return lines.join("\n");
}

function formatSubthemeMatrixTsv(subthemes: Subtheme[]): string {
  const items: CopyItem[] = subthemes.map((s) => ({ placed: s.placed, impact: s.impact, speed: s.speed, text: s.title }));
  return buildMatrixTsv(items, "解体後マトリクス");
}

function formatSubthemeList(subthemes: Subtheme[]): string {
  const lines = ["【サブテーマ一覧】", ""];
  subthemes.forEach((s, i) => {
    const key = s.impact && s.speed ? `${s.impact}_${s.speed}` : "";
    const cell = key ? MATRIX_CELLS[key] : null;
    lines.push(`${i + 1}. ${s.title || "（未入力）"}`);
    lines.push(`   ${s.reason || "（理由なし）"}`);
    lines.push(`   インパクト：${s.impact ? IMPACT_LABELS[s.impact] : "未選択"}　実施スピード：${s.speed ? SPEED_LABELS[s.speed] : "未選択"}${cell ? `　→ ${cell.num}：${cell.label}` : ""}`);
    lines.push("");
  });
  return lines.join("\n");
}

function formatMemo(memo: Memo): string {
  return [
    "【最初の一手メモ】",
    "",
    "今回取り組むテーマ：",
    memo.subtheme  || "（未入力）",
    "",
    "今日やること：",
    memo.today     || "（未入力）",
    "",
    "今週やること：",
    memo.thisWeek  || "（未入力）",
    "",
    "次回確認すること：",
    memo.nextCheck || "（未入力）",
  ].join("\n");
}

// ─── Styles ───────────────────────────────────────────────────────────
const S = {
  section: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  } satisfies React.CSSProperties,

  h2: {
    fontSize: "1.05rem",
    fontWeight: "bold",
    color: "#2a5280",
    marginBottom: "1rem",
    paddingLeft: "12px",
    borderLeft: "4px solid #3a6ea5",
  } satisfies React.CSSProperties,

  h2Large: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#2a5280",
    marginBottom: "1rem",
    paddingLeft: "12px",
    borderLeft: "4px solid #3a6ea5",
  } satisfies React.CSSProperties,

  h3: {
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#2a5280",
    marginBottom: "10px",
    paddingLeft: "10px",
    borderLeft: "3px solid #7aabcc",
  } satisfies React.CSSProperties,

  h3Large: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#2a5280",
    marginBottom: "12px",
    paddingLeft: "12px",
    borderLeft: "4px solid #3a6ea5",
  } satisfies React.CSSProperties,

  card: {
    background: "#f7fafd",
    border: "1px solid #b8ccd8",
    borderRadius: "6px",
    padding: "16px",
    marginBottom: "12px",
  } satisfies React.CSSProperties,

  subCard: {
    background: "#f0f6fb",
    border: "1px solid #b8ccd8",
    borderRadius: "6px",
    padding: "16px",
    marginBottom: "12px",
  } satisfies React.CSSProperties,

  label: {
    fontSize: "13px",
    color: "#3a6ea5",
    fontWeight: "bold" as const,
    display: "block" as const,
    marginBottom: "4px",
  } satisfies React.CSSProperties,

  axisLabel: {
    fontSize: "12px",
    color: "#2a5280",
    fontWeight: "bold" as const,
    display: "block" as const,
    marginBottom: "3px",
  } satisfies React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #b8ccd8",
    borderRadius: "4px",
    fontSize: "15px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    lineHeight: 1.6,
    background: "white",
    color: "#1a1a1a",
  } satisfies React.CSSProperties,

  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #b8ccd8",
    borderRadius: "4px",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    lineHeight: 1.75,
    background: "white",
    color: "#1a1a1a",
  } satisfies React.CSSProperties,

  select: {
    padding: "9px 10px",
    border: "1px solid #b8ccd8",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "white",
    color: "#1a1a1a",
    cursor: "pointer",
  } satisfies React.CSSProperties,

  btnPrimary: {
    background: "#3a6ea5",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnPrimaryDisabled: {
    background: "#7aabcc",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "9px 20px",
    cursor: "not-allowed",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnBlueSolid: {
    background: "#1a6ec0",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 22px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnBlue: {
    background: "white",
    color: "#3a6ea5",
    border: "1px solid #3a6ea5",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnGray: {
    background: "white",
    color: "#5a6a7a",
    border: "1px solid #b8ccd8",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnGreen: {
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "11px 26px",
    cursor: "pointer",
    fontSize: "16px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnGreenDisabled: {
    background: "#6ee7b7",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "11px 26px",
    cursor: "not-allowed",
    fontSize: "16px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnOrange: {
    background: "white",
    color: "#d4783a",
    border: "1px solid #d4783a",
    borderRadius: "4px",
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: "inherit",
    fontWeight: "bold",
  } satisfies React.CSSProperties,

  btnDanger: {
    background: "white",
    color: "#b03020",
    border: "1px solid #c8a090",
    borderRadius: "4px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
  } satisfies React.CSSProperties,

  h2Orange: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#E36D4A",
    marginBottom: "1rem",
    paddingLeft: "12px",
    borderLeft: "4px solid #E36D4A",
  } satisfies React.CSSProperties,

  h3OrangeLarge: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#E36D4A",
    marginBottom: "12px",
    paddingLeft: "12px",
    borderLeft: "4px solid #E36D4A",
  } satisfies React.CSSProperties,

  h3Orange: {
    fontSize: "1.05rem",
    fontWeight: "bold",
    color: "#E36D4A",
    marginBottom: "10px",
    paddingLeft: "12px",
    borderLeft: "4px solid #E36D4A",
  } satisfies React.CSSProperties,
};

// ─── Matrix table component ───────────────────────────────────────────
interface MatrixItem {
  impact: ImpactLevel;
  speed: SpeedLevel;
  text: string;
}

function MatrixTable({ items }: { items: MatrixItem[] }) {
  const thStyle: React.CSSProperties = {
    border: "1px solid #b8ccd8",
    padding: "9px 12px",
    background: "#dce8f2",
    color: "#2a5280",
    fontWeight: "bold",
    fontSize: "15px",
    textAlign: "center",
  };
  const cornerStyle: React.CSSProperties = {
    border: "1px solid #b8ccd8",
    padding: "6px 8px",
    background: "#c8d8e8",
    minWidth: "36px",
  };
  const axisStyle: React.CSSProperties = {
    border: "1px solid #b8ccd8",
    padding: "9px 12px",
    background: "#dce8f2",
    color: "#2a5280",
    fontWeight: "bold",
    fontSize: "16px",
    textAlign: "center",
    verticalAlign: "middle",
  };
  const tdBase: React.CSSProperties = {
    border: "1px solid #b8ccd8",
    padding: "10px 12px",
    verticalAlign: "top",
    minWidth: "120px",
  };

  return (
    <div>
      {/* 横軸ラベル */}
      <div style={{
        textAlign: "center",
        fontWeight: "bold",
        color: "#2a5280",
        fontSize: "14px",
        marginBottom: "4px",
        letterSpacing: "0.04em",
      }}>
        ← 実施スピード →
      </div>

      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* 縦軸ラベル：文字を1つずつ縦に並べて天地正しく表示 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          color: "#2a5280",
          fontSize: "13px",
          marginRight: "6px",
          lineHeight: 1.35,
          userSelect: "none",
          minWidth: "18px",
        }}>
          <span style={{ fontSize: "11px" }}>↑</span>
          {"インパクト".split("").map((char, i) => (
            <span key={i}>{char}</span>
          ))}
          <span style={{ fontSize: "11px" }}>↓</span>
        </div>

        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "480px" }}>
            <thead>
              <tr>
                <th style={cornerStyle}>&nbsp;</th>
                <th style={thStyle}>遅い</th>
                <th style={thStyle}>中間</th>
                <th style={thStyle}>早い</th>
              </tr>
            </thead>
            <tbody>
              {(["high", "mid", "low"] as const).map((impact) => (
                <tr key={impact}>
                  <td style={axisStyle}>{IMPACT_LABELS[impact]}</td>
                  {(["slow", "mid", "fast"] as const).map((speed) => {
                    const key = `${impact}_${speed}`;
                    const cell = MATRIX_CELLS[key];
                    const cellItems = items.filter(
                      (i) => i.impact === impact && i.speed === speed
                    );
                    return (
                      <td key={speed} style={{ ...tdBase, background: cellBg(cell.num) }}>
                        <div style={{ fontSize: "12px", color: "#5a6a7a", marginBottom: "6px" }}>
                          <strong style={{ color: "#2a5280", fontSize: "13px" }}>{cell.num}</strong>
                          <span style={{ marginLeft: "4px" }}>：{cell.label}</span>
                        </div>
                        {cellItems.length === 0 ? (
                          <div style={{ fontSize: "13px", color: "#b0bec5" }}>—</div>
                        ) : (
                          cellItems.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: "13px",
                                color: "#1a1a1a",
                                background: "rgba(255,255,255,0.85)",
                                border: "1px solid #b8ccd8",
                                borderRadius: "3px",
                                padding: "4px 8px",
                                marginBottom: "4px",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.text}
                            </div>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────
function PriorityBadge({ impact, speed }: { impact: ImpactLevel; speed: SpeedLevel }) {
  if (!impact || !speed) return null;
  const cell = MATRIX_CELLS[`${impact}_${speed}`];
  if (!cell) return null;
  return (
    <span style={{
      fontSize: "13px",
      color: "#2a5280",
      background: "#dce8f2",
      border: "1px solid #b8ccd8",
      borderRadius: "4px",
      padding: "7px 10px",
      whiteSpace: "nowrap",
    }}>
      {cell.num}：{cell.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────
export default function ImpactPage() {
  const [themes, setThemes]           = useState<Theme[]>(() => [newTheme(), newTheme(), newTheme()]);
  const [bigIssue, setBigIssue]       = useState("");
  const [bigIssueCtx, setBigIssueCtx] = useState("");
  const [subthemes, setSubthemes]     = useState<Subtheme[]>([]);
  const [memo, setMemo]               = useState<Memo>({ subtheme: "", today: "", thisWeek: "", nextCheck: "" });
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);
  const [copyMsg, setCopyMsg]         = useState("");

  const flash = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash("コピーしました");
    } catch {
      flash("コピーに失敗しました");
    }
  };

  const copyRich = async (html: string, plain: string) => {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html":  new Blob([html],  { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
        flash("コピーしました");
      } else {
        await navigator.clipboard.writeText(plain);
        flash("コピーしました");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(plain);
        flash("コピーしました");
      } catch {
        flash("コピーに失敗しました");
      }
    }
  };

  // ── Theme handlers ────────────────────────────────────────────────
  const updateTheme = (id: string, patch: Partial<Theme>) =>
    setThemes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const placeTheme = (id: string) => {
    const t = themes.find((t) => t.id === id);
    if (!t) return;
    if (!t.text.trim()) { alert("テーマを入力してください。"); return; }
    if (!t.impact || !t.speed) { alert("インパクトと実施スピードを選択してください。"); return; }
    updateTheme(id, { placed: true });
  };

  const sendToDecompose = (text: string) => {
    if (!text.trim()) return;
    if (bigIssue.trim() && !window.confirm("大きな課題欄にすでに入力があります。上書きしますか？")) return;
    setBigIssueCtx("");
    setSubthemes([]);
    setMemo({ subtheme: "", today: "", thisWeek: "", nextCheck: "" });
    setApiError(null);
    setBigIssue(text);
  };

  const clearThemeMatrix = () => {
    if (!window.confirm("入力内容をクリアして、次の作業を始めますか？")) return;
    setThemes([newTheme(), newTheme(), newTheme()]);
  };

  // ── Subtheme handlers ─────────────────────────────────────────────
  const updateSubtheme = (id: string, patch: Partial<Subtheme>) =>
    setSubthemes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const placeSubtheme = (id: string) => {
    const s = subthemes.find((s) => s.id === id);
    if (!s) return;
    if (!s.title.trim()) { alert("サブテーマを入力してください。"); return; }
    if (!s.impact || !s.speed) { alert("インパクトと実施スピードを選択してください。"); return; }
    updateSubtheme(id, { placed: true });
  };

  const clearSubthemeMatrix = () => {
    if (!window.confirm("入力内容をクリアして、次の作業を始めますか？")) return;
    setBigIssue("");
    setBigIssueCtx("");
    setSubthemes([]);
    setMemo({ subtheme: "", today: "", thisWeek: "", nextCheck: "" });
    setApiError(null);
  };

  // ── Decompose API call ────────────────────────────────────────────
  const handleDecompose = async () => {
    if (!bigIssue.trim()) { setApiError("大きな課題を入力してください。"); return; }
    setApiError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bigIssue: bigIssue.trim(), context: bigIssueCtx.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setApiError(data.error ?? "エラーが発生しました。再試行してください。");
      } else {
        setSubthemes(
          (data.subthemes ?? []).map(
            (s: { title: string; reason: string; impact?: string; speed?: string }) => {
              const impact = mapImpact(s.impact);
              const speed = mapSpeed(s.speed);
              const placed = !!(impact && speed);
              return { ...newSubtheme(s.title, s.reason, impact, speed), placed };
            }
          )
        );
      }
    } catch {
      setApiError("通信エラーが発生しました。ネットワーク接続を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  // ── Sample loader ─────────────────────────────────────────────────
  const loadSample = () => {
    setThemes(SAMPLE_THEMES.map((t) => ({ ...t, id: uid() })));
    setBigIssue("歩留まりを抜本的に改善する");
    setBigIssueCtx(
      "特定工程で不良が継続的に発生している。\n原因が設備条件、作業手順、材料ロット、測定方法にまたがっている可能性がある。\n一度に全部を解こうとすると範囲が広く、どこから手をつければよいか決めにくい。"
    );
    setSubthemes(SAMPLE_SUBTHEMES.map((s) => ({ ...s, id: uid() })));
    setMemo(SAMPLE_MEMO);
    setApiError(null);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const placedThemeItems: MatrixItem[] = themes
    .filter((t) => t.placed && t.impact && t.speed)
    .map((t) => ({ impact: t.impact, speed: t.speed, text: t.text }));

  const placedSubthemeItems: MatrixItem[] = subthemes
    .filter((s) => s.placed && s.impact && s.speed)
    .map((s) => ({ impact: s.impact, speed: s.speed, text: s.title }));

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f2f5f9" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
          <h1 style={{
            fontSize: "1.45rem",
            fontWeight: "bold",
            color: "#2a5280",
            marginBottom: "0",
            paddingLeft: "12px",
            borderLeft: "4px solid #3a6ea5",
          }}>
            インパクト思考 先人の知を現場の力に
          </h1>
          <div style={{ marginLeft: "16px", flexShrink: 0 }}>
            <button style={S.btnOrange} onClick={loadSample}>
              デモ用サンプル
            </button>
          </div>
        </div>
        <p style={{ fontSize: "15px", color: "#5a6a7a", marginBottom: "0.25rem", paddingLeft: "14px" }}>
          優先順位をつける
        </p>
        <p style={{ fontSize: "14px", color: "#7a8a9a", marginBottom: "2rem", paddingLeft: "14px" }}>
          大きな課題（塊）は砕いて、最初の一手を見つける
        </p>

        {/* ══════════════════════════════════════════════════
            Section 1: 候補テーマ
        ══════════════════════════════════════════════════ */}
        <div style={S.section}>

          {/* 優先順位マトリクス（上部） */}
          <h3 style={S.h3Large}>優先順位をつける</h3>
          <MatrixTable items={placedThemeItems} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              style={S.btnBlueSolid}
              onClick={() => copyRich(buildThemeMatrixHtml(themes), formatThemeMatrixTsv(themes))}
            >
              優先順位マトリクス コピー
            </button>
            <button style={S.btnGray} onClick={() => copy(formatThemeList(themes))}>
              テーマをコピー
            </button>
            <button style={S.btnGray} onClick={clearThemeMatrix}>
              クリア
            </button>
            {copyMsg && <span style={{ fontSize: "14px", color: "#3a6ea5" }}>{copyMsg}</span>}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #dce8f2", marginBottom: "20px" }} />

          {/* 候補テーマ入力（マトリクスの下） */}
          <h2 style={S.h2}>候補テーマを入力しよう！</h2>
          <p style={{ fontSize: "14px", color: "#5a6a7a", marginBottom: "16px", lineHeight: 1.7 }}>
            取り組みたい候補テーマを入力し、インパクトと実施スピードを選択して「表示」でマトリクスに配置してください。
          </p>

          {themes.map((theme, idx) => (
            <div key={theme.id} style={S.card}>
              <div style={{ marginBottom: "8px" }}>
                <span style={S.label}>候補テーマ {idx + 1}</span>
                <input
                  type="text"
                  value={theme.text}
                  onChange={(e) => updateTheme(theme.id, { text: e.target.value, placed: false })}
                  placeholder="取り組みたいテーマを入力"
                  style={S.input}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <span style={S.axisLabel}>インパクト</span>
                  <select
                    value={theme.impact}
                    onChange={(e) => updateTheme(theme.id, { impact: e.target.value as ImpactLevel, placed: false })}
                    style={S.select}
                  >
                    {IMPACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <span style={S.axisLabel}>実施スピード</span>
                  <select
                    value={theme.speed}
                    onChange={(e) => updateTheme(theme.id, { speed: e.target.value as SpeedLevel, placed: false })}
                    style={S.select}
                  >
                    {SPEED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <PriorityBadge impact={theme.impact} speed={theme.speed} />
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <button style={S.btnPrimary} onClick={() => placeTheme(theme.id)}>表示</button>
                <button style={S.btnGray}    onClick={() => updateTheme(theme.id, { placed: false })}>表示取消</button>
                <button style={S.btnBlue}    onClick={() => sendToDecompose(theme.text)}>解体へ送る</button>
                <button style={S.btnDanger}  onClick={() => setThemes((prev) => prev.filter((t) => t.id !== theme.id))}>テーマ削除</button>
                {theme.placed && (
                  <span style={{ fontSize: "13px", color: "#3a6ea5" }}>✓ マトリクスに表示中</span>
                )}
              </div>
            </div>
          ))}

          <div>
            <button style={S.btnBlue} onClick={() => setThemes((prev) => [...prev, newTheme()])}>
              ＋ テーマ追加
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            Section 2: 大きな課題の解体
        ══════════════════════════════════════════════════ */}
        <div style={S.section}>
          <h2 style={S.h2Orange}>大きな課題の解体（塊を砕く）</h2>
          <p style={{ fontSize: "14px", color: "#5a6a7a", marginBottom: "16px", lineHeight: 1.85 }}>
            大きな課題（塊）は、手付かずにせず、ここで砕きましょう！<br />
            <br />
            <strong style={{ color: "#E36D4A" }}>AIの力を借りる場合｜</strong><br />
            課題と補足を入力して、「大きな課題／塊を砕く（Gemini連携）」ボタンを押してください<br />
            <br />
            <span style={{ color: "#7a8a9a" }}>※AIの出力はたたき台です。現場での対話に活用し、編集ください。</span>
          </p>

          {/* 1. 大きな課題入力 */}
          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>大きな課題</span>
            <input
              type="text"
              value={bigIssue}
              onChange={(e) => { setBigIssue(e.target.value); setApiError(null); }}
              placeholder="例：歩留まりを抜本的に改善する"
              style={{ ...S.input, border: apiError ? "1px solid #d4783a" : "1px solid #b8ccd8" }}
            />
          </div>

          {/* 2. 補足入力 */}
          <div style={{ marginBottom: "14px" }}>
            <span style={S.label}>補足（任意）</span>
            <textarea
              value={bigIssueCtx}
              onChange={(e) => setBigIssueCtx(e.target.value)}
              rows={3}
              placeholder="例：特定工程で不良が続いている。原因が設備・作業・材料にまたがっている可能性がある。"
              style={S.textarea}
            />
          </div>

          {/* 3. 大きな課題／塊を砕くボタン */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <button
              style={loading ? S.btnGreenDisabled : S.btnGreen}
              onClick={handleDecompose}
              disabled={loading}
            >
              {loading ? "提案を生成中..." : "大きな課題／塊を砕く（Gemini連携）"}
            </button>
          </div>

          {apiError && (
            <p style={{ color: "#d4783a", fontSize: "15px", marginBottom: "12px", lineHeight: 1.6 }}>
              {apiError}
            </p>
          )}

          {/* 4. 大きな課題の解体マトリクス */}
          <div style={{ marginTop: "20px", marginBottom: "8px" }}>
            <h3 style={S.h3OrangeLarge}>大きな課題の解体マトリクス</h3>
            <p style={{ fontSize: "14px", color: "#5a6a7a", marginBottom: "12px" }}>
              サブテーマをマトリクスに配置して、「最初の一手」を見つけてください。
            </p>
            <MatrixTable items={placedSubthemeItems} />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                style={S.btnBlueSolid}
                onClick={() => copyRich(buildSubthemeMatrixHtml(subthemes), formatSubthemeMatrixTsv(subthemes))}
              >
                解体後マトリクス コピー
              </button>
              {subthemes.length > 0 && (
                <button style={S.btnGray} onClick={() => copy(formatSubthemeList(subthemes))}>
                  サブテーマをコピー
                </button>
              )}
              <button style={S.btnGray} onClick={clearSubthemeMatrix}>
                クリア
              </button>
              {copyMsg && <span style={{ fontSize: "14px", color: "#3a6ea5" }}>{copyMsg}</span>}
            </div>
          </div>

          {/* 5. サブテーマ入力 */}
          {subthemes.length > 0 && (
            <div>
              <h3 style={S.h3Orange}>サブテーマに分解しよう！</h3>
              <p style={{ fontSize: "13px", color: "#7a8a9a", marginBottom: "12px" }}>
                ※AIの出力はたたき台です。現場での対話に活用し、編集ください。
              </p>
              {subthemes.map((sub, idx) => (
                <div key={sub.id} style={S.subCard}>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={S.label}>サブテーマ {idx + 1}</span>
                    <input
                      type="text"
                      value={sub.title}
                      onChange={(e) => updateSubtheme(sub.id, { title: e.target.value, placed: false })}
                      placeholder="サブテーマを入力"
                      style={S.input}
                    />
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <span style={S.label}>ひとこと理由</span>
                    <input
                      type="text"
                      value={sub.reason}
                      onChange={(e) => updateSubtheme(sub.id, { reason: e.target.value })}
                      placeholder="なぜこのサブテーマに分けたか"
                      style={S.input}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div>
                      <span style={S.axisLabel}>インパクト</span>
                      <select
                        value={sub.impact}
                        onChange={(e) => updateSubtheme(sub.id, { impact: e.target.value as ImpactLevel, placed: false })}
                        style={S.select}
                      >
                        {IMPACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={S.axisLabel}>実施スピード</span>
                      <select
                        value={sub.speed}
                        onChange={(e) => updateSubtheme(sub.id, { speed: e.target.value as SpeedLevel, placed: false })}
                        style={S.select}
                      >
                        {SPEED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <PriorityBadge impact={sub.impact} speed={sub.speed} />
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <button style={S.btnPrimary} onClick={() => placeSubtheme(sub.id)}>表示</button>
                    <button style={S.btnGray}    onClick={() => updateSubtheme(sub.id, { placed: false })}>表示取消</button>
                    <button style={S.btnDanger}  onClick={() => setSubthemes((prev) => prev.filter((s) => s.id !== sub.id))}>サブテーマ削除</button>
                    {sub.placed && (
                      <span style={{ fontSize: "13px", color: "#3a6ea5" }}>✓ 解体マトリクスに表示中</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button style={S.btnBlue} onClick={() => setSubthemes((prev) => [...prev, newSubtheme()])}>
              ＋ サブテーマ追加
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            Section 3: 最初の一手メモ
        ══════════════════════════════════════════════════ */}
        <div style={S.section}>
          <h2 style={S.h2}>最初の一手メモ</h2>
          <p style={{ fontSize: "14px", color: "#5a6a7a", marginBottom: "16px", lineHeight: 1.7 }}>
            最初の一手として取り組むことをメモっておきましょう！
          </p>

          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>今回取り組むテーマ</span>
            <input
              type="text"
              value={memo.subtheme}
              onChange={(e) => setMemo((prev) => ({ ...prev, subtheme: e.target.value }))}
              placeholder="例：直近3か月の不良を種類別に分類する"
              style={S.input}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>今日やること</span>
            <textarea
              rows={2}
              value={memo.today}
              onChange={(e) => setMemo((prev) => ({ ...prev, today: e.target.value }))}
              placeholder="例：直近の不良データを10件集める"
              style={S.textarea}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={S.label}>今週やること</span>
            <textarea
              rows={2}
              value={memo.thisWeek}
              onChange={(e) => setMemo((prev) => ({ ...prev, thisWeek: e.target.value }))}
              placeholder="例：不良種類、発生工程、品番、設備、材料ロットで並べる"
              style={S.textarea}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <span style={S.label}>次回確認すること</span>
            <textarea
              rows={2}
              value={memo.nextCheck}
              onChange={(e) => setMemo((prev) => ({ ...prev, nextCheck: e.target.value }))}
              placeholder="例：最多不良1件について、発生工程と発生条件を確認する"
              style={S.textarea}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button style={S.btnBlue} onClick={() => copy(formatMemo(memo))}>
              最初の一手をコピー
            </button>
            {copyMsg && <span style={{ fontSize: "14px", color: "#3a6ea5" }}>{copyMsg}</span>}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: "1.5rem",
          paddingTop: "1rem",
          borderTop: "1px solid #b8ccd8",
          fontSize: "14px",
          color: "#7a8a9a",
        }}>
          ※ AIの出力は正解ではなく、現場メンバーが対話の結果として確認・編集して使うものです。
        </p>
      </div>
    </div>
  );
}
