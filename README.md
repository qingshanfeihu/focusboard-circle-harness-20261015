# FocusBoard

本地任务看板 Web 应用:React + TypeScript + Vite,无后端、无账号、无外部 API、无远程字体或图片。数据仅保存在浏览器 localStorage。

## 环境要求

- Node.js 24:安装后确保 `node` 与 `npm` 位于 PATH(`node --version` 应为 v24.x)
- npm(随 Node 24 提供,当前 11.x)

## 启动

```bash
npm ci             # 按 package-lock.json 安装依赖(锁文件已提交)
npm run dev        # 开发服务器,默认 http://localhost:5173(端口被占用时换端口)
```

## 测试

```bash
npm run test       # Vitest 一次性运行(domain/storage/组件共 5 个测试文件)
npm run test:watch # 监听模式
```

## 类型检查与构建

```bash
npm run typecheck  # tsc -b,要求零错误
npm run build      # tsc -b + vite build,输出 dist/
npm run preview    # 本地预览生产构建
```

项目未配置 lint(ESLint),`npm run lint` 不提供;类型检查与测试承担静态质量门禁。

## CI

`.github/workflows/ci.yml` 在 push 到 `main` / `codex/focusboard` 及面向 `main` 的 Pull Request 时,于 ubuntu-latest + Node 24 执行与本地相同的现有检查:`npm ci`、`npm test`、`npm run typecheck`、`npm run build`(lint 仅在 package.json 提供该脚本时执行)。配置文件存在不等于远端 CI 已经运行通过,以 Actions 页面的实际结果为准。

## 功能

- **任务管理**:创建/编辑/删除任务;字段含标题(必填、自动 trim)、描述、状态(待办/进行中/完成)、优先级(低/中/高)、可选截止日期、逗号分隔标签;删除与清空均有确认弹窗。
- **双视图**:看板(三列)与列表(表格);看板卡片通过状态选择器移动(无需拖拽,键盘可达)。
- **搜索与筛选**:标题/描述大小写不敏感搜索;状态、优先级、标签多选筛选可任意组合并与搜索叠加;支持按截止日期升/降排序(无截止日排最后);一键清除全部筛选。
- **概览**:任务总数、完成率、逾期数。完成任务不计逾期;截止当天不计逾期。
- **持久化**:localStorage 自动保存,刷新不丢;损坏数据不会白屏,显示警告条并可确认关闭;首次访问提供少量演示数据,可清空(清空后不自动重新播种,可手动“恢复演示数据”)。
- **导入/导出**:导出 `focusboard-export.json` 保留全部字段;导入先整体校验——只要任一条记录不合法即整批拒绝,给出具体错误行,现有数据一项不变;校验通过需确认后才替换。
- **可用性与无障碍**:桌面与 375px 宽手机可用;弹窗焦点锁定在对话框内,关闭后焦点还原到触发入口(入口消失时回到“新建任务”锚点);表单有可见标签、必填校验与 `aria-invalid`/错误提示;空状态区分“无任务”与“无匹配”;基本 CRUD 全流程可纯键盘完成(弹窗支持 Esc 关闭、背景点击关闭)。

## 已知限制

- 单人单浏览器使用:无同步、无多标签页实时一致(localStorage 写穿,另一个标签页需刷新)。
- 浏览器隐私模式或存储配额耗尽时无法持久化,界面会提示“无法保存”横幅,但应用仍可用(数据仅存在于内存)。
- 标签无颜色/图标体系;排序仅支持截止日期,不支持优先级排序。
- 日期比较基于本地日历日字符串比较,不涉及时区转换或提醒推送。
- 导入策略为整批替换(不做增量合并)。
- 未配置 ESLint;质量门禁为 `tsc -b` 与 Vitest。
- 键盘操作未做全页面 aria-live 播报,读屏器体验未做专项审计。


## Developer collaboration note
Keep JSON exports safe. This demo stores tasks only in the current browser.

Git workflow probe: right edit retained.
Git workflow probe: left edit retained.
