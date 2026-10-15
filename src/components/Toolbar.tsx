import type { Filters, SortMode } from "../domain/filtering";
import type { Priority, Status } from "../domain/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../domain/types";

interface Props {
  view: "board" | "list";
  onViewChange: (v: "board" | "list") => void;
  filters: Filters;
  sort: SortMode;
  allTags: string[];
  filtersActive: boolean;
  onFiltersChange: (f: Filters) => void;
  onSortChange: (s: SortMode) => void;
  onClearFilters: () => void;
  onCreate: () => void;
}

export default function Toolbar(props: Props) {
  const { filters, sort, allTags, onFiltersChange } = props;

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  return (
    <section className="toolbar" aria-label="视图与筛选">
      <div className="toolbar-row">
        <div className="segmented" role="group" aria-label="视图切换">
          <button
            type="button"
            className={props.view === "board" ? "seg active" : "seg"}
            aria-pressed={props.view === "board"}
            onClick={() => props.onViewChange("board")}
          >
            看板
          </button>
          <button
            type="button"
            className={props.view === "list" ? "seg active" : "seg"}
            aria-pressed={props.view === "list"}
            onClick={() => props.onViewChange("list")}
          >
            列表
          </button>
        </div>
        <label className="field search-field">
          <span className="field-label">搜索</span>
          <input
            type="search"
            value={filters.search}
            placeholder="搜索标题或描述…"
            aria-label="搜索标题或描述"
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </label>
        <button type="button" className="btn primary" data-modal-focus-fallback onClick={props.onCreate}>
          新建任务
        </button>
      </div>
      <div className="toolbar-row filters-row">
        <div className="filter-group" role="group" aria-label="状态筛选">
          <span className="filter-title">状态</span>
          {STATUSES.map((s: Status) => (
            <label key={s} className="chip">
              <input
                type="checkbox"
                checked={filters.statuses.includes(s)}
                onChange={() =>
                  onFiltersChange({ ...filters, statuses: toggleIn(filters.statuses, s) })
                }
              />
              {STATUS_LABELS[s]}
            </label>
          ))}
        </div>
        <div className="filter-group" role="group" aria-label="优先级筛选">
          <span className="filter-title">优先级</span>
          {PRIORITIES.map((p: Priority) => (
            <label key={p} className="chip">
              <input
                type="checkbox"
                checked={filters.priorities.includes(p)}
                onChange={() =>
                  onFiltersChange({ ...filters, priorities: toggleIn(filters.priorities, p) })
                }
              />
              {PRIORITY_LABELS[p]}
            </label>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="filter-group" role="group" aria-label="标签筛选">
            <span className="filter-title">标签</span>
            {allTags.map((tag) => (
              <label key={tag} className="chip">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={() => onFiltersChange({ ...filters, tags: toggleIn(filters.tags, tag) })}
                />
                {tag}
              </label>
            ))}
          </div>
        )}
        <label className="field sort-field">
          <span className="field-label">排序</span>
          <select value={sort} onChange={(e) => props.onSortChange(e.target.value as SortMode)}>
            <option value="manual">默认</option>
            <option value="dueAsc">截止日期 ↑</option>
            <option value="dueDesc">截止日期 ↓</option>
          </select>
        </label>
        {props.filtersActive && (
          <button
            type="button"
            className="btn ghost"
            aria-label="清除全部筛选"
            onClick={props.onClearFilters}
          >
            清除筛选
          </button>
        )}
      </div>
    </section>
  );
}
