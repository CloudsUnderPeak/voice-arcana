# Voice Arcana 專案協作守則

本檔案提供給後續參與專案的開發者與 AI agent。修改程式前，請先理解產品承諾：**所有錄音與聲音分析都在使用者瀏覽器內完成，不上傳、不依賴後端。**

## 規格優先

調整需求或行為前，先閱讀 `docs/SPEC_INDEX.md`，再依變更範圍同步：

- 使用者流程、文案、互動、驗收條件：`docs/SPEC_BEHAVIOR.md`
- 架構、模組邊界、狀態與效能限制：`docs/SPEC_TECHNICAL.md`
- 聲學特徵、分數正規化與牌卡映射：`docs/AUDIO_ANALYSIS.md`
- 產品定位、範圍與里程碑：`docs/SPEC_BEHAVIOR.md` §1 與 `docs/SPEC_TECHNICAL.md` §10–12
- 色彩、排版與元件語言：`docs/SPEC_BEHAVIOR.md` §9 與 `docs/ART_ASSET_BRIEF.md`
- 建置、CI 與 GitHub Pages：`README.zh-TW.md` 的「部署到 GitHub Pages」章節

行為與技術同時改變時，兩份規格必須保持一致。

## 不可破壞的產品約束

1. 不新增錄音上傳、遠端分析、帳號或追蹤 SDK。
2. 不將 `Blob`、`AudioBuffer`、原始取樣或可還原聲音的資料寫入 `localStorage`、IndexedDB、cookie 或 analytics。
3. 不把聲音肖像描述成性格、健康、性別、情緒或身分診斷。
4. 麥克風只可在使用者明確點擊「開始錄音」後請求。
5. 錄音最長 60 秒；頁面重整或關閉後資料應自然釋放。

若未來產品確實要改變以上任一點，必須先更新規格、隱私說明與使用者同意流程，不可只改程式。

## 架構邊界

```text
pages/            組合畫面、綁定 DOM 事件
app/              流程協調與 session 狀態
domain/           純分析、牌卡規則、產品模型
infrastructure/   MediaRecorder / Web Audio 等瀏覽器介接
i18n/             語系字典與 t()/localizeCard() 運行時
ui/               跨頁共用展示元件
styles/           tokens、基礎、頁面與響應式樣式
utils/            無領域語意的純函式
```

- `domain/` 不可直接操作 DOM，也不可含 UI 文案；新文案一律進 `src/i18n/locales/`，且兩個語系必須同步（測試會驗證 key 對齊）。
- `pages/` 不可直接實作 FFT、錄音生命週期或牌卡距離演算法。
- `infrastructure/` 回傳瀏覽器資源的封裝結果，不決定牌意或 UI 文案。
- 先以小而可測的純函式解決問題，避免建立只使用一次的抽象層。

## 開發與驗證

```bash
npm install
npm run dev
npm test
npm run build
```

也可使用 `make install`、`make check`、`make build` 與 `make preview`。GitHub Pages 部署規則以 `README.zh-TW.md` 的「部署到 GitHub Pages」章節為準。

涉及錄音時，除自動測試外至少手動驗證：

- 麥克風允許、拒絕、找不到裝置三種情況。
- 錄音不足 2 秒、正常停止、60 秒自動停止。
- Chrome / Edge；里程碑 M2 前補 Safari 與 Firefox。
- 桌面 1440px、平板 768px、手機 390px。
- 分析期間沒有任何錄音網路請求。

## 修改原則

- 優先做能直接追溯到需求的局部修改。
- 不順便重構無關程式或重寫既有文案。
- 新增聲音軸或修改正規化門檻時，必須加入固定合成訊號測試。
- 新增聲音牌時，同步更新牌卡目錄、向量定義、牌意、提問與設計規格。
- 任何效能優化都要記錄測試裝置、錄音長度、分析耗時與結果誤差。
