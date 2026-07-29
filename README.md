# Voice Arcana

一個 local-first 的聲音肖像網頁實驗。使用者朗讀約一分鐘的短文，瀏覽器會直接分析錄音的時間與頻譜特徵，生成六軸「聲音肖像」，並從八種原創聲音原型中選出當下最接近的一張「聲音牌」。Voice Arcana 不採用傳統塔羅的牌組或占卜系統。

## Demo

[https://cloudsunderpeak.github.io/voice-arcana/](https://cloudsunderpeak.github.io/voice-arcana/)

目前已完成可操作的 MVP 骨架：

- 裝飾藝術導讀文章與錄音引導
- 麥克風錄音、60 秒自動停止、錄音試聽
- 純瀏覽器音訊解碼與 FFT 特徵分析
- 三段式流程：錄音 → 本機分析進度 → 聲音牌結果
- 六個聲音維度與八張聲音牌
- 自製 SVG 牌面、牌意、提問與分析摘要
- 響應式版面與基本無障礙狀態

## 快速開始

需求：Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

```bash
npm test       # 領域函式測試
npm run build  # 產生 dist/ 靜態檔
npm run preview
```

`dist/` 可以部署到任何靜態主機，不需要應用程式後端。

也可以透過 Make 使用相同流程：

```bash
make install
make dev
make test
make build
make preview
```

## GitHub Pages

專案已包含 Pull Request CI 與 GitHub Pages 自動部署。將 repository 的 **Settings → Pages → Source** 設為 **GitHub Actions** 後，每次 push 到 `master` 都會測試、建置並部署 `dist/`。

完整設定與首次部署步驟請見 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 隱私與產品邊界

- 錄音透過 `MediaRecorder` 留在目前分頁的記憶體。
- 解碼、FFT、特徵正規化與牌卡匹配皆在瀏覽器完成。
- 沒有 API、資料庫、登入、cookie 或分析追蹤。
- 重整或關閉分頁後，錄音與分析結果不會被保存。
- 聲音肖像是創意詮釋，不是人格、情緒、性別、健康或身分診斷。

## 專案結構

```text
.
├─ docs/                         產品計劃、行為與技術規格
├─ src/
│  ├─ app/                       session 狀態與體驗流程協調
│  ├─ domain/
│  │  ├─ cards/                  八張牌資料與向量匹配
│  │  └─ voice-portrait/         FFT 與六軸分析
│  ├─ infrastructure/audio/      錄音與 AudioBuffer 解碼
│  ├─ pages/                     錄音、處理、結果三個頁面
│  ├─ styles/                    token、基礎、頁面、響應式
│  ├─ ui/                        共用頁首與 SVG 牌面
│  └─ utils/                     純數學工具
├─ test/                         Node 端領域測試
├─ AGENTS.md                     專案協作守則
├─ index.html
└─ package.json
```

架構採用瀏覽器原生 ES Modules；Vite 只負責本機開發與靜態打包，不參與正式執行時的聲音處理。

## 文件入口

從 [docs/SPEC_INDEX.md](docs/SPEC_INDEX.md) 開始閱讀。產品階段、驗收條件與風險請見 [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)；聲學計算與限制請見 [docs/AUDIO_ANALYSIS.md](docs/AUDIO_ANALYSIS.md)。正式美術交付格式與檔名請見 [docs/ART_ASSET_BRIEF.md](docs/ART_ASSET_BRIEF.md)。

## 已知限制

- MVP 的「親密 ↔ 開闊」與「乾淨 ↔ 沙啞」是多項聲學代理值的創意轉譯，不能視為專業音色診斷。
- 麥克風、房間反射、背景噪音與朗讀距離都會改變結果。
- 目前只做單次 session，不保存歷史紀錄，也不匯出或分享結果。
- 目前牌面為程式生成的共用視覺系統；每張牌的獨立插畫與動態是後續 M3 工作。
- 現階段背景、裝飾與牌面都是 CSS／內嵌 SVG 佔位素材，不是正式美術檔。
