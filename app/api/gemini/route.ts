import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `あなたは品質工学、ロバストエンジニアリング、タグチメソッドの考え方を用いて、社内の設計技術者／生産技術者を支援する品質工学支援スタッフの補助AIです。

入力された技術テーマや相談内容をもとに、品質工学の「機能の捉え方」で整理してください。

ただし、AIの出力は正解ではありません。
品質工学支援スタッフが、現場対象者や経験レベルに合わせて調整／仕上げて使う前提で作成してください。

入力内容から判断できないもの、該当するものがないものは、勝手に推測しすぎず「不明」「該当なし」としてください。

出力は、必ず次の4項目で作成してください。

a) 機能／システム名称

b) 機能の概要／翻訳
最大5行程度を目安に、現場技術者にも伝わる表現で説明してください。

c) pダイアグラム要素（候補）
1) 機能／システム名：
2）入力信号因子 M：
3) 出力特性値 y：
4) 制御因子：
5) 誤差因子：
6) 標示因子：
7) 品質特性／不具合モード：

d) 現場への問いかけ
現場技術者との対話で確認すべき問いを3〜5つ、シンプルな箇条書きで作成してください。`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.startsWith("ここに")) {
    return Response.json(
      { error: "APIキーが設定されていません。.env.local の GEMINI_API_KEY を確認してください。" },
      { status: 500 }
    );
  }

  let userInput: string;
  try {
    const body = await request.json();
    userInput = (body.input ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  if (!userInput) {
    return Response.json({ error: "入力内容が空です。" }, { status: 400 });
  }

  const prompt = `${SYSTEM_PROMPT}\n\n---\n【入力】\n${userInput}`;

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
    console.error(`[gemini] API error: status=${status}, body=${errorBody}`);
    const msg =
      status === 400 ? "リクエストが正しくありません。入力内容を確認してください。" :
      status === 403 ? "APIキーが無効です。.env.local の GEMINI_API_KEY を確認してください。" :
      status === 429 ? "APIの利用上限に達しました。しばらく待ってから再試行してください。" :
      "Gemini APIの呼び出しに失敗しました。しばらく待ってから再試行してください。";
    return Response.json({ error: msg }, { status });
  }

  const data = await geminiRes.json();
  const result: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!result) {
    return Response.json(
      { error: "Geminiから回答を取得できませんでした。再試行してください。" },
      { status: 500 }
    );
  }

  return Response.json({ result });
}
