# 元素星空

单页化学小游戏。前端静态文件在 `public/`，排行榜后端已迁移为 Cloudflare Pages Functions，数据库继续使用 Neon Postgres。

## 项目结构

```text
public/index.html             前端页面
public/asset/                 视频等静态资源
functions/api/saveScore.js    Cloudflare 保存成绩接口：/api/saveScore
functions/api/getLeaderboard.js Cloudflare 排行榜接口：/api/getLeaderboard
server/leaderboard.js         排行榜后端核心逻辑
neon/leaderboard.sql          Neon 建表 SQL
package.json                  后端函数依赖
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

这个项目的前端本身不需要打包，但 Cloudflare 需要安装 `package.json` 里的 Neon 函数依赖，然后发布 `public/`。

Pages 构建设置：

```text
Framework preset: None
Build command: npm ci
Build output directory: public
Root directory: 留空
```

部署后进入 Cloudflare Pages 项目：

1. 打开 `Settings`。
2. 打开 `Environment variables`。
3. 在 Production 环境新增变量：

```text
DATABASE_URL = 你的 Neon 连接字符串
```

保存后重新部署一次。不要把真实 `DATABASE_URL` 写进 GitHub。

## Neon SQL Editor 初始化

在 Neon 的 SQL Editor 中执行：

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  time_used INTEGER NOT NULL CHECK (time_used > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

新建本地变量文件 `.dev.vars`：

```text
DATABASE_URL="postgresql://..."
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
