import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `あなたは現場活動・改善活動・企画活動を支援するアシスタントです。
入力された大きな課題を、現場メンバーが取り組みやすいサブテーマに分解してください。

条件：
- サブテーマは最大5つ
- 現場で対話しやすい短い表現にする
- テーマにより、設備、作業、材料、測定、情報、人、管理などの観点を考慮する
- テーマにより、設計要因、製造要因、部品要因、その他要因などの観点を考慮する
- テーマにより、Quality（品質）、Cost（コスト）、Delivery（生産スピード）、Safety（安全）などの観点を考慮する
- テーマにより、Strategy（戦略）、Structure（組織構造）、System（仕組み）、Staff（陣容）、Skill（能力）、Style（行動様式）、Shared Value（価値観）などの観点を考慮する
- AIの提案は正解ではなく、現場で編集する前提にする
- 各サブテーマには、なぜそれに分けたかを示す「ひとこと理由」を添える
- 各サブテーマについて、想定されるインパクトを「低」「中」「高」から1つ選ぶ
- 各サブテーマについて、想定される実施スピードを「遅い」「中間」「早い」から1つ選ぶ
- この判断はAIの仮置きであり、現場メンバーが後で確認・修正する前提にする
- 出力は必ずJSON形式にする
- JSON以外の文章は出力しない

出力JSON形式：
{
  "subthemes": [
    {
      "title": "サブテーマ名",
      "reason": "ひとこと理由",
      "impact": "低|中|高",
      "speed": "遅い|中間|早い"
    }
  ]
}`;

function extractJson(text: string): string {
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (blockMatch) return blockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]+\}/);
  if (jsonMatch) return jsonMatch[0];
  return text.trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.startsWith("ここに")) {
    return Response.json(
      { error: "APIキーが設定されていません。.env.local の GEMINI_API_KEY を確認してください。" },
      { status: 500 }
    );
  }

  let bigIssue: string;
  let context: string;
  try {
    const body = await request.json();
    bigIssue = (body.bigIssue ?? "").trim();
    context = (body.context ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  if (!bigIssue) {
    return Response.json({ error: "大きな課題が入力されていません。" }, { status: 400 });
  }

  const userInput = context
    ? `【大きな課題】\n${bigIssue}\n\n【補足】\n${context}`
    : `【大きな課題】\n${bigIssue}`;

  const prompt = `${SYSTEM_PROMPT}\n\n---\n${userInput}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
  } catch {
    return Response.json(
      { error: "通信エラーが発生しました。ネットワーク接続を確認してください。" },
      { status: 503 }
    );
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;
    const errorBody = await geminiRes.text().catch(() => "(本文取得失敗)");
    if (status === 503) {
      console.error(`[impact] Gemini API 503 overloaded or temporarily unavailable`);
    } else {
      console.error(`[impact] API error: status=${status}, body=${errorBody}`);
    }
    const msg =
      status === 400 ? "リクエストが正しくありません。入力内容を確認してください。" :
      status === 403 ? "APIキーが無効です。.env.local の GEMINI_API_KEY を確認してください。" :
      status === 429 ? "APIの利用上限に達しました。しばらく待ってから再試行してください。" :
      status === 503 ? "Gemini APIが一時的に混み合っています。少し時間をおいて再度お試しください。手入力でサブテーマを追加することもできます。" :
      "Gemini APIの呼び出しに失敗しました。しばらく待ってから再試行してください。";
    return Response.json({ error: msg }, { status });
  }

  const data = await geminiRes.json();
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    return Response.json(
      { error: "Geminiから回答を取得できませんでした。再試行してください。" },
      { status: 500 }
    );
  }

  try {
    const jsonText = extractJson(rawText);
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.subthemes)) throw new Error("Invalid format");
    return Response.json({ subthemes: parsed.subthemes });
  } catch {
    return Response.json(
      { error: "回答の解析に失敗しました。再試行してください。" },
      { status: 500 }
    );
  }
}
