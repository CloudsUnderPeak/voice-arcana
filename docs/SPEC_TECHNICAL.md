# 技術規格

```text
Version: 0.1.0
Status: Draft
Runtime: Browser only
```

## 1. 技術選擇

- UI：HTML、CSS、瀏覽器原生 ES Modules。
- 開發/打包：Vite；只產生靜態檔。
- 錄音：`navigator.mediaDevices.getUserMedia` + `MediaRecorder`。
- 即時音量：`AudioContext` + `AnalyserNode`，以感知曲線映射到分段強度計；不保存、不直接沿用為分析分數。
- 解碼：`OfflineAudioContext.decodeAudioData` 固定 16 kHz，讓分析不隨裝置輸出取樣率漂移；個別容器解碼失敗時退回 `AudioContext`。
- 分析：專案內 radix-2 FFT 與純 JavaScript 統計函式，於 module Web Worker 執行（Worker 不可用時退回主執行緒）。
- 儲存：僅記憶體；不使用 localStorage、IndexedDB、cookie 或 Cache API。
- i18n：`src/i18n/` 自製輕量模組（無依賴）。語系字典為純 ES module；語言以 URL `?lang=` 參數與 `navigator.language` 決定，只存在記憶體。domain 層不含任何 UI 文案：軸標籤、牌卡文案由 UI 邊界以 `t()` / `localizeCard()` 解析，分析進度以 stage 識別字回報。

不使用遠端 API、CDN runtime、語音辨識服務或第三方分析 SDK。

## 2. 分層與依賴方向

```text
main
  → app/create-app
      → pages
      → infrastructure/audio
      → domain/voice-portrait
      → domain/cards

pages → ui
pages/ui/app → i18n
domain → utils
```

依賴方向不得反轉：

- domain 不依賴 app、pages、ui、DOM 或 MediaRecorder。
- infrastructure 不依賴產品牌意。
- pages 只負責 DOM 組合與事件綁定。
- app 是唯一協調錄音、分析與換頁的層。

## 3. Session 狀態

```js
{
  view: "experience" | "processing" | "result",
  recordingStatus: "idle" | "requesting" | "recording" | "validating" | "ready",
  recording: null | {
    blob: Blob,
    url: string,
    duration: number,
    type: string,
    audioBuffer: AudioBuffer,
    qualityWarning: string
  },
  analysis: null | {
    portrait: VoicePortrait,
    card: VoiceCard,
    duration: number
  },
  error: string
}
```

- state 只存在模組記憶體。
- 換頁時 page controller 必須 `destroy()`。
- reset 時必須停止 MediaStream tracks、關閉 AudioContext、取消 RAF、撤銷 Object URL。

## 4. 資料管線

```text
使用者點擊
  → getUserMedia (mono preference, processing off)
  → MediaRecorder chunks
  → Blob + object URL
  → ArrayBuffer
  → decodeAudioData (fixed 16 kHz)
  → transfer channel copies to module worker
  → mix channels to mono
  → temporal features + sampled spectral/pitch frames
  → normalized six-axis vector [0,1]
  → nearest voice-card vector
  → render result
```

原始 sample、Blob 與 AudioBuffer 不可送入 `fetch`、XHR、WebSocket、Beacon 或持久化儲存。

結果分享使用固定 1080 × 1350 的 Canvas 在本機重繪牌面、六軸與提問，再以 `canvas.toBlob("image/png")` 建立圖片並掛上 object URL。「分享結果」按鈕開啟全螢幕覆蓋層顯示這張圖，使用者以長按（行動端）或右鍵（桌面）儲存——不使用 `navigator.share` 或自動下載，讓行為在所有裝置與 in-app 瀏覽器一致。覆蓋層不佔文流，維持單屏排版（viewport.css）的約束；頁面銷毀時撤銷 object URL。六軸在頁面與分享圖上都只呈現滑標位置，不顯示數字分數。匯出流程不讀取原始 sample、Blob 或 AudioBuffer。

結果同時具有可分享的網址（`src/app/share-link.js`）：參數只含牌 id 與六軸分數（`?card=<id>&axes=<0–100 六段>`，順序由 `PORTRAIT_AXES` 固定），不含任何音訊或可還原聲音的資料。完成分析後以 `history.replaceState` 寫回網址列，重新整理可還原結果；`reset` 時清除。對外分享連結指向 build 時為每張牌產生的靜態分享頁（`share/<id>/index.html`，見 `tools/share-pages.js`），供社群爬蟲讀取牌面專屬 OG 標籤，真人開啟時由該頁帶著 `axes` 導回應用程式；沒帶 `axes` 的連結以該牌原型向量呈現六軸。透過分享連結開啟的結果頁標示為朋友分享，主要行動改為「換我測測看」。分享圖 footer 印上導流短網址與「你也來測」CTA，並保留創意詮釋限制與本機處理聲明。

## 5. 錄音生命週期

- 優先 MIME：WebM Opus、Ogg Opus、MP4、WebM；格式必須同時通過 `MediaRecorder.isTypeSupported` 與 `<audio>.canPlayType`。舊版未提供 `isTypeSupported` 時僅在可播放的前提下使用 MP4；沒有共同格式時交由瀏覽器選擇預設格式。
- constraint 請求 mono 並關閉 echo cancellation、noise suppression、auto gain，讓聲學代理值較少被瀏覽器處理改變；瀏覽器可忽略 constraint。
- 每 250ms 產生 chunk，避免單一巨大 buffer。
- 60 秒由高解析時間計時，達上限呼叫 `stop()`。
- MediaStream 不連接到 `AudioDestinationNode`，避免回授。
- 停止後先拒絕空 Blob，再以 `decodeAudioData` 驗證格式並快取 AudioBuffer，避免分析時重複解碼。
- 以 20ms frame 的峰值 RMS 標記近乎靜音錄音；只顯示品質提示，不以裝置音量差異直接阻擋。
- `<audio>` 必須監聽載入錯誤；無法試聽時停用分析並提供重錄或更新瀏覽器的指引。

## 6. 效能預算

MVP：

- 只分析最多 96 個 1024-sample 頻譜幀。
- 只分析最多 32 個 2048-sample 音高幀，自相關搜尋限制在 70–400 Hz。
- FFT 為 O(N log N)。
- 時域特徵可單次 O(samples) 掃描。
- 分析階段間 yield，讓進度畫面能繪製。

已達成的 M1 項目：

- FFT 與統計已移到 module Web Worker（`src/app/voice-analysis-worker.js`）；channel 取樣以複本 Transferable 傳遞，原 AudioBuffer 保持可用以支援重試。Worker 建立或載入失敗時退回主執行緒分析。
- 固定 16 kHz 解碼將 60 秒錄音的分析樣本數與記憶體降到原本 48 kHz 的 1/3。

M1 其餘目標：

- 60 秒錄音在中階手機 3 秒內完成（需實機量測記錄）。

## 7. 安全與隱私

- 正式環境強制 HTTPS。
- CSP 已於 build 時以 `<meta http-equiv="Content-Security-Policy">` 注入（GitHub Pages 無法設定 response header；開發模式因 Vite HMR 需要 websocket 而不注入）：
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'`
- 不載入外部字型，以系統字型維持零第三方請求。
- 不把牌卡分數宣稱為生物特徵辨識結果。
- 分享圖必須保留創意詮釋限制與本機處理聲明，且不得含原始音訊或可還原聲音的資料。
- 部署前以 Network 與 CSP `connect-src 'none'` 驗證無外傳。

## 8. 測試策略

- 單元：數學正規化、FFT 峰值、向量距離、牌卡選擇、session store、HTML 逃逸、分享網址編解碼（`share-link`）。
- 合成音訊：不同頻率正弦、音高調變、不同增益、含底噪停頓、靜音。
- 整合：`createApp` 支援依賴注入，狀態機（錄音過短、解碼失敗、品質不足、分析失敗重試、結果頁資源釋放）以注入的 recorder/page 假件在 Node 驅動。
- E2E：需真實瀏覽器權限；CI 使用 fake media stream fixture。
- 視覺：桌面/平板/手機三個 breakpoint 截圖。

## 9. 靜態部署

`npm run build` 產生 `dist/`。部署是靜態檔案發布，不是產品後端。網站必須：

- 以 HTTPS 提供。
- 正確回傳 JS module MIME type。
- SPA 目前不依賴 path route，因此不需要 fallback rewrite。
- 不注入第三方 analytics 或錄音代理。

## 10. 里程碑

### M0 — 基本框架（目前）

- 完成三段流程與模組分層。
- 完成可運作的 MediaRecorder / Web Audio 管線。
- 完成六軸啟發式分數與八牌最近距離映射。
- 完成裝飾藝術視覺骨架與文件。

驗收：最新版桌面 Chrome 可錄製 2–60 秒、分析、顯示結果；Network 面板沒有錄音外傳。

### M1 — 分析可信度與可測性

- 建立合成訊號 fixtures：低/高頻、白噪音、振幅包絡、靜音。（已完成：`test/voice-analysis.test.js` 與 `tools/voice-calibration/`）
- 對不同 sample rate、瀏覽器編碼格式與麥克風輸入校準。
- 加入低訊號、削波、背景噪音品質提示。
- 把 CPU 密集分析移入 Web Worker，避免低階手機卡頓。（已完成，見 §6）

驗收：60 秒錄音在目標中階手機上 3 秒內完成，主執行緒無超過 100ms 的長任務。

### M2 — 跨瀏覽器與無障礙

- Chrome、Edge、Firefox、Safari 與 iOS Safari 測試矩陣。
- 權限復原引導、AudioContext suspended 狀態處理。
- 完整鍵盤操作、螢幕閱讀器狀態與色彩對比稽核。
- 加入錄音前環境音量檢測。

驗收：WCAG 2.2 AA 的核心流程；四大瀏覽器可完成體驗。

### M3 — 八張牌的完整宇宙

- 每張牌獨立構圖、圖騰、色彩與進場動畫。
- 建立插畫資產規格與 reduced-motion 對應。
- 增加 3–5 篇相近長度朗讀文本，避免內容熟悉效應。
- 結果卡 PNG 匯出；只在 Canvas 本機生成。

驗收：八張牌視覺可辨識且不依賴牌名；匯出不包含原始音訊。（結果卡 PNG 匯出已提前完成。）

### M4 — 公開測試

- 僅收集無法還原聲音、且使用者明確同意的匿名體驗回饋。
- 執行隱私威脅模型、CSP、第三方資源與靜態部署檢查。
- 撰寫對外方法說明，避免使用者誤解分數的科學意義。

## 11. 成功指標

隱私優先專案不預設植入追蹤。公開測試若需衡量，優先採使用者自願問卷或現場觀察：

- 從開始錄音到看見結果的完成率。
- 麥克風權限拒絕後是否能理解復原方式。
- 使用者能否正確回答「聲音有沒有上傳」。
- 使用者是否把結果理解為創意詮釋，而非科學診斷。
- 分析耗時、錯誤率與裝置相容性。

## 12. 主要風險

| 風險 | 影響 | 緩解 |
|---|---|---|
| 不同麥克風導致分數漂移 | 同一人結果差異過大 | 品質檢查、相對特徵、公開限制 |
| 「親密/沙啞」被誤認為診斷 | 信任與倫理風險 | 使用「創意轉譯」文案、避免人格推論 |
| 長錄音阻塞手機主執行緒 | 體驗卡頓 | M1 Web Worker、抽樣幀數上限 |
| Safari 編碼/解碼差異 | 無法完成流程 | MIME 能力選擇、跨瀏覽器測試 |
| 裝飾過多影響閱讀 | 可用性下降 | 內容優先、手機簡化、對比稽核 |
