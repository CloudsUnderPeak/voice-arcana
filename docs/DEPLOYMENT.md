# GitHub Pages 部署

## 1. 部署方式

專案使用 Vite 建置成 `dist/` 靜態檔，GitHub Actions 再把該目錄上傳為 Pages artifact。部署不包含應用程式後端，正式執行時仍只在瀏覽器分析錄音。

```text
push master
  → install dependencies
  → npm test
  → vite build
  → upload dist/
  → deploy-pages
```

`vite.config.js` 使用 `base: "./"`，因此同一份 build 可部署到：

- `https://<username>.github.io/`
- `https://<username>.github.io/<repository>/`
- GitHub Pages 自訂網域

## 2. GitHub Repository 初次設定

1. 將專案推送至 GitHub，預設分支命名為 `master`。
2. 開啟 repository 的 **Settings → Pages**。
3. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
4. 推送至 `master`，或在 **Actions → Deploy GitHub Pages → Run workflow** 手動執行。
5. 部署完成後，正式網址會顯示在 workflow 的 `deploy` job 與 repository Environments。

Workflow 位於：

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`

## 3. Make 指令

```bash
make install
make dev
make test
make check
make build
make verify
make preview
make clean
```

可覆寫本機 port：

```bash
make dev DEV_PORT=8080
make preview PREVIEW_PORT=8081
```

Windows 若沒有 GNU Make，可直接使用對應的 npm 指令；尚未安裝 Node.js 時仍可使用 `python tools/dev-server/server.py` 預覽未打包的原始網站。

## 4. Workflow 行為

### Frontend CI

- Pull Request 指向 `master` 時執行。
- 也可手動觸發。
- 安裝依賴、執行測試、確認 production build。
- 不取得 Pages 寫入權限，也不部署。

### Deploy GitHub Pages

- push 到 `master` 或手動觸發。
- `build` job 只有 `contents: read`。
- `deploy` job 才取得 `pages: write` 與 `id-token: write`。
- 使用 `github-pages` environment。
- concurrency 保留正在進行的正式部署，不因後續 push 中途取消。

## 5. Lockfile 待辦

目前建立專案的本機環境沒有 Node.js/npm，無法由 npm 正式解析並產生 `package-lock.json`。因此 workflow 暫時使用：

```bash
npm install --no-audit --no-fund
```

在第一個具備 Node.js 24 的開發環境，應執行：

```bash
npm install
```

確認並提交產生的 `package-lock.json` 後，把兩份 workflow 的安裝指令改成：

```bash
npm ci --no-audit --no-fund
```

並在 `actions/setup-node` 啟用：

```yaml
with:
  node-version: 24
  cache: npm
```

Lockfile 必須由實際 package manager 產生，不應手工編寫。

## 6. 部署驗收

1. `make test` 與 `make build` 成功。
2. `dist/index.html` 存在，資源 URL 可在 repository 子路徑載入。
3. Pages workflow 的 build、artifact、deploy 三段成功。
4. 正式 HTTPS 網址可以請求麥克風權限。
5. 完成一段錄音與分析，Network 面板沒有音訊上傳。
6. 重新整理結果頁後，錄音與結果不會被保留。

## 7. 自訂網域

自訂網域應在 GitHub **Settings → Pages → Custom domain** 設定。若需要版本控制 `CNAME`，可把 `CNAME` 放在 `public/`，Vite build 時會複製到 `dist/`。設定前需要先確認正式網域，請勿提交假的 `CNAME`。
