import type { Overview } from "../domain/filtering";

interface Props {
  overview: Overview;
}

export default function OverviewBar({ overview }: Props) {
  const rate =
    overview.completionRate === null ? "—" : `${overview.completionRate}%`;
  return (
    <section className="overview" aria-label="任务概览">
      <div className="stat">
        <span className="stat-value">{overview.total}</span>
        <span className="stat-label">任务总数</span>
      </div>
      <div className="stat">
        <span className="stat-value">{rate}</span>
        <span className="stat-label">完成率({overview.completed}/{overview.total})</span>
      </div>
      <div className={`stat${overview.overdue > 0 ? " stat-overdue" : ""}`}>
        <span className="stat-value">{overview.overdue}</span>
        <span className="stat-label">逾期任务</span>
      </div>
    </section>
  );
}
