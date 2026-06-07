"use client";

import { useState } from "react";
import Menu1 from "./components/Menu1";
import Menu2 from "./components/Menu2";
import Menu3 from "./components/Menu3";

const TABS = [
  { id: 1, label: "メニュー1：機能の調査" },
  { id: 2, label: "メニュー2：論文／文献の調査 プロンプト生成" },
  { id: 3, label: "メニュー3：pダイアグラム作成" },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(3);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Header */}
        <h1 style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          color: "var(--green)",
          marginBottom: "0.4rem",
          paddingLeft: "12px",
          borderLeft: "4px solid var(--orange)",
        }}>
          品質工学 先人の知を現場の力に
        </h1>
        <p style={{ fontSize: "15px", color: "#555", marginBottom: "2rem" }}>
          先人にアクセスし，先人の力／知恵を現場につなぎます。
        </p>

        {/* Tab navigation */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "7px 14px",
                  marginRight: "4px",
                  border: "1px solid var(--border)",
                  borderTop: isActive ? "3px solid var(--orange)" : "1px solid var(--border)",
                  borderBottom: isActive ? "1px solid var(--bg)" : "none",
                  background: isActive ? "var(--bg)" : "var(--green-bg)",
                  color: isActive ? "var(--green)" : "#666",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  top: "1px",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 3 && <Menu3 />}
        {activeTab === 1 && <Menu1 />}
        {activeTab === 2 && <Menu2 />}

        {/* Footer note */}
        <p style={{
          marginTop: "3.5rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
          fontSize: "14px",
          color: "#888",
        }}>
          ※ AIの出力は正解ではなく，スタッフが現場向けに調整／仕上げて使うものです。
        </p>
      </div>
    </div>
  );
}
