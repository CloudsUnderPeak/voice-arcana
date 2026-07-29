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
- 解碼：`AudioContext.decodeAudioData`。
- 分析：專案內 radix-2 FFT 與純 JavaScript 統計函式。
- 儲存：僅記憶體；不使用 localStorage、IndexedDB、cookie 或 Cache API。

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
  recordingStatus: "idle" | "requesting" | "recording" | "ready",
  recording: null | {
    blob: Blob,
    url: string,
    duration: number,
    type: string
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
  → decodeAudioData
  → mix channels to mono
  → temporal features + sampled spectral/pitch frames
  → normalized six-axis vector [0,1]
  → nearest voice-card vector
  → render result
```

原始 sample、Blob 與 AudioBuffer 不可送入 `fetch`、XHR、WebSocket、Beacon 或持久化儲存。

結果分享使用固定 1080 × 1350 的 Canvas 在本機重繪牌面、六軸與提問，再以 `canvas.toBlob("image/png")` 建立 `File`。若 `navigator.canShare({ files })` 通過，使用 `navigator.share()` 將 PNG 交給使用者選擇的系統分享目標；否則以暫時的 Object URL 觸發下載並在完成後撤銷 URL。分享 API 必須直接由使用者點擊觸發，因此結果頁會預先準備圖片。匯出流程不讀取原始 sample、Blob 或 AudioBuffer。

## 5. 錄音生命週期

- 優先 MIME：WebM Opus、Ogg Opus、MP4、WebM；以 `MediaRecorder.isTypeSupported` 選擇。
- constraint 請求 mono 並關閉 echo cancellation、noise suppression、auto gain，讓聲學代理值較少被瀏覽器處理改變；瀏覽器可忽略 constraint。
- 每 250ms 產生 chunk，避免單一巨大 buffer。
- 60 秒由高解析時間計時，達上限呼叫 `stop()`。
- MediaStream 不連接到 `AudioDestinationNode`，避免回授。

## 6. 效能預算

MVP：

- 只分析最多 96 個 1024-sample 頻譜幀。
- 只分析最多 32 個 2048-sample 音高幀，自相關搜尋限制在 70–400 Hz。
- FFT 為 O(N log N)。
- 時域特徵可單次 O(samples) 掃描。
- 分析階段間 yield，讓進度畫面能繪製。

M1 目標：

- 60 秒 / 48kHz 音訊在中階手機 3 秒內完成。
- 主執行緒沒有 >100ms long task。
- FFT 與統計移到 module Web Worker；傳遞 channel buffer 時使用 Transferable。

## 7. 安全與隱私

- 正式環境強制 HTTPS。
- 建議 CSP：
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'`
- 不載入外部字型，以系統字型維持零第三方請求。
- 不把牌卡分數宣稱為生物特徵辨識結果。
- 分享圖必須保留創意詮釋限制與本機處理聲明，且不得含原始音訊或可還原聲音的資料。
- 部署前以 Network 與 CSP `connect-src 'none'` 驗證無外傳。

## 8. 測試策略

- 單元：數學正規化、FFT 峰值、向量距離、牌卡選擇。
- 合成音訊：不同頻率正弦、音高調變、不同增益、白噪音、振幅調變、靜音。
- 整合：mock MediaRecorder 狀態與 60 秒停止。
- E2E：需真實瀏覽器權限；CI 使用 fake media stream fixture。
- 視覺：桌面/平板/手機三個 breakpoint 截圖。

## 9. 靜態部署

`npm run build` 產生 `dist/`。部署是靜態檔案發布，不是產品後端。網站必須：

- 以 HTTPS 提供。
- 正確回傳 JS module MIME type。
- SPA 目前不依賴 path route，因此不需要 fallback rewrite。
- 不注入第三方 analytics 或錄音代理。
