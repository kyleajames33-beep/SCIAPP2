import { BattleErrorBoundary } from "../_components/BattleErrorBoundary";

export default function BossLayout({ children }: { children: React.ReactNode }) {
  return <BattleErrorBoundary>{children}</BattleErrorBoundary>;
}
