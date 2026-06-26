import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "インパクト思考 先人の知を現場の力に",
  description: "優先順位をつけ、大きな課題を砕いて、最初の一手を見つける",
};

export default function ImpactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
