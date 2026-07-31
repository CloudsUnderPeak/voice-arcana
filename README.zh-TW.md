# Voice Arcana

[English](README.md)

**[開啟線上 Demo](https://cloudsunderpeak.github.io/voice-arcana/)**

一個 local-first 的聲音肖像實驗，把一分鐘的聲音變成一張原創聲音牌。

Voice Arcana 邀請你朗讀一段短文。瀏覽器會直接分析錄音的時間與頻譜特徵，描繪出六軸「聲音肖像」——明暗、銳利、跳躍、空間、質地與能量——並從八種原創聲音原型中選出當下最接近的一張牌。它借用抽牌的儀式感，而不是牌組本身：不採用傳統塔羅的牌義或占卜系統。

## 為什麼做這個專案

聲音分析工具通常意味著把錄音上傳到某個伺服器。Voice Arcana 探索相反的路：錄音、解碼、FFT、特徵正規化與牌卡匹配全部在瀏覽器內完成——不上傳、沒有帳號，關閉分頁即釋放一切。這個專案同時是一份 browser-only audio pipeline 的可運作參考：MediaRecorder 錄音、固定取樣率解碼、Web Worker 分析，與依文獻校準的聲學特徵。

## 使用體驗

1. 閱讀隱私承諾與一篇約一分鐘的裝飾藝術短文。
2. 按下錄音；即時強度計跟著你的聲音起伏，60 秒自動停止。
3. 試聽錄音，送出後由本機分析走完一段儀式感的進度。
4. 翻開你的聲音牌：六軸肖像、牌意，以及一個給你的提問。
5. 分享本機生成的結果圖，或只攜帶牌 id 與六軸分數的結果網址。

## 特色

- **完全本機**：錄音、分析與分享圖都不離開裝置；部署站台附帶 `connect-src 'none'` 的 CSP 作為技術護欄。
- **有依據的聲學**：六軸建立在頻譜重心、HNR 代理週期性、過零率與動態之上，依語音聲學文獻、合成語音測試台與真人樣本三重校準。
- **八種原創原型**：每張牌有自己的牌面、牌意與提問，以六維距離匹配。
- **雙語介面**：繁體中文與英文，自動偵測、一鍵切換；分享連結與 OG 頁隨語系。
- **不需後端的分享**：Canvas 繪製的結果圖、無狀態的結果網址，與預先產生的每牌 OG 分享頁。
- **零框架**：瀏覽器原生 ES Modules，自製輕量 store 與 i18n；Vite 只負責開發與靜態打包。

## 適合誰

- 對聲音、敘事、互動藝術與自我觀察有興趣的人。
- 需要零資料負擔的展覽或工作坊互動作品的策展與設計團隊。
- 想看 browser-only audio pipeline 完整實例的前端開發者。

明確**不是**語音治療、醫療診斷、說話者辨識或聲紋驗證工具。

## 快速開始

需求：Node.js 22.12+。

```bash
npm install
npm run dev      # 開發伺服器
npm test         # 領域函式與流程狀態機測試
npm run check    # 全 src/test/tools 語法檢查 + 測試
npm run build    # 產生 dist/ 靜態檔（含 CSP meta）
npm run preview  # 預覽 production build
```

`dist/` 可部署到任何靜態主機，不需要應用程式後端。有 GNU Make 的環境可用同名捷徑（`make dev`、`make build`⋯，見 [Makefile](Makefile)）。

## 文件

從 [docs/SPEC_INDEX.md](docs/SPEC_INDEX.md) 開始閱讀。產品定位、行為與驗收請見 [docs/SPEC_BEHAVIOR.md](docs/SPEC_BEHAVIOR.md)；架構、里程碑與風險請見 [docs/SPEC_TECHNICAL.md](docs/SPEC_TECHNICAL.md)；聲學計算與限制請見 [docs/AUDIO_ANALYSIS.md](docs/AUDIO_ANALYSIS.md)；美術交付規格請見 [docs/ART_ASSET_BRIEF.md](docs/ART_ASSET_BRIEF.md)。

```text
src/
├─ app/                  session 狀態與體驗流程協調
├─ domain/               牌卡向量、FFT 與六軸分析（不含 UI 文案）
├─ i18n/                 語系字典（zh-Hant / en）與運行時
├─ infrastructure/audio/ 錄音與 AudioBuffer 解碼
├─ pages/                錄音、處理、結果三個頁面
├─ ui/                   共用頁首、牌面與分享圖
└─ styles/               token、基礎、頁面與響應式
```

## 隱私與產品邊界

- 錄音透過 `MediaRecorder` 留在分頁記憶體；解碼、FFT、正規化與牌卡匹配皆在瀏覽器完成。
- 沒有 API、資料庫、登入、cookie 或分析追蹤；重整或關閉分頁後錄音即釋放。
- 分享網址只攜帶牌 id 與六軸分數，不含任何音訊或可還原聲音的資料。
- 聲音肖像是創意詮釋，不是人格、情緒、性別、健康或身分診斷。

## 已知限制

- 「親密 ↔ 開闊」與「乾淨 ↔ 沙啞」是聲學代理值的創意轉譯，不能視為專業音色診斷。
- 麥克風、房間反射、背景噪音與朗讀距離都會改變結果。
- 目前只做單次 session、不保存歷史；分享圖在本機生成，由「分享結果」覆蓋層長按（或右鍵）儲存。
- 現階段牌面為程式生成的共用視覺系統；每張牌的獨立插畫與動態是後續里程碑工作。
