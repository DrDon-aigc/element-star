# 元素星空

单页化学小游戏。前端静态文件在 `public/`，排行榜后端使用 Cloudflare Pages Functions，数据库使用 Cloudflare D1。

## 项目结构

```text
public/index.html             前端页面
public/asset/                 视频等静态资源
functions/api/saveScore.js    Cloudflare 保存成绩接口：/api/saveScore
functions/api/getLeaderboard.js Cloudflare 排行榜接口：/api/getLeaderboard
server/leaderboard.js         排行榜后端核心逻辑
d1/leaderboard.sql            D1 建表 SQL
package.json                  项目脚本
```

不要上传或提交：

```text
node_modules/
.wrangler/
.env
.env.*
.dev.vars
.dev.vars.*
.DS_Store
```

## Cloudflare Pages 部署

这个项目的前端本身不需要打包，Cloudflare Pages 发布 `public/`，后端接口由 `functions/` 目录里的 Pages Functions 提供。

Pages 构建设置：

```text
Framework preset: None
Build command: npm ci
Build output directory: public
Root directory: 留空
```

部署后进入 Cloudflare Pages 项目，把 D1 数据库绑定到 Functions：

1. 打开 `Settings`。
2. 打开 `Bindings`。
3. 新增 `D1 database` binding。
4. Binding name 填：

```text
DB
```

5. 数据库选择 `element-star-db`。

保存后重新部署一次。

## D1 初始化

在 Cloudflare D1 的 Console 中执行：

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  time_used INTEGER NOT NULL CHECK (time_used > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_time
  ON leaderboard (time_used ASC, created_at ASC);
```

查看已有记录：

```sql
SELECT id, username, time_used, created_at
FROM leaderboard
ORDER BY time_used ASC, created_at ASC, id ASC;
```

删除某条记录：

```sql
DELETE FROM leaderboard
WHERE id = <要删除的记录ID>;
```

## 本地调试

安装依赖：

```bash
npm install
```

启动 Cloudflare Pages 本地环境：

```bash
npx wrangler pages dev public
```

也可以使用：

```bash
npm run dev
```

然后访问 Wrangler 给出的本地地址。不要直接双击打开 `public/index.html`，否则 `/api/*` 后端接口不会运行。

## 测试

```bash
npm test
```

## 当前排行榜规则

- 只显示前 20 名。
- 按 `time_used ASC, created_at ASC, id ASC` 排序。
- 只有跃迁模式通关才会提交成绩。
