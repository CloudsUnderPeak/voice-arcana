# 聲音分析方法

## 1. 定位

這套方法的目標是產生穩定、可解釋的互動藝術輸入，不是建立聲紋辨識、情緒辨識或臨床評估。六軸名稱是文學化的介面語言；底層量測只能提供代理線索。

## 2. 目前量測

### 時域

- **Active RMS**：高於最低活動門檻的 frame 均方根音量。
- **RMS variation**：活動 frame 音量的變異係數。
- **Dynamic range proxy**：RMS 第 85 百分位與第 15 百分位差，相對於高百分位正規化。
- **Zero-crossing rate**：波形穿越零點的比例。
- **Active ratio**：高於最低 RMS 門檻的 frame 比例。

### 頻域

- 取最多 96 個均勻分散的活動 frame，每幀 1024 samples。
- Hann window 後執行專案內 radix-2 FFT。
- **Spectral centroid**：頻率以 magnitude 加權的重心。
- **Spectral rolloff**：累積 magnitude 達 85% 時的頻率，用來補充音色輪廓。
- **High-frequency ratio**：3kHz 以上 magnitude 佔比。
- **Spectral flatness**：magnitude 幾何平均 / 算術平均。
- **Centroid variation**：各活動幀頻譜重心的變異係數。

### 音高

- 取最多 32 個均勻分散的活動 frame，每幀 2048 samples。
- 以 70–400 Hz 範圍的正規化自相關估計基頻，不使用遠端模型。
- **Median pitch**：有效基頻估計的中位數；只描述本次錄音的音高輪廓。
- **Pitch variation**：有效基頻估計的變異係數。
- **Pitch confidence**：自相關強度與可估計 frame 比例的組合，只控制音高特徵的權重。

## 3. 六軸轉譯

所有輸入先以經驗門檻線性正規化到 `[0,1]`，再依權重組合：

| 軸 | 主要代理值 | 解讀限制 |
|---|---|---|
| 低沉 ↔ 明亮 | spectral centroid、高頻比例、基頻 | 基頻只描述聲線表現，不推論性別、年齡或身分 |
| 柔和 ↔ 銳利 | 明亮度、rolloff、flatness、ZCR | 子音比例與發音內容會影響 |
| 沉穩 ↔ 跳躍 | RMS variation、centroid variation、pitch variation | 是本段朗讀起伏，不是人格 |
| 親密 ↔ 開闊 | centroid variation、dynamic range、pitch variation、明亮度 | 只是假設性空間感代理，無法真正估計距離/殘響 |
| 乾淨 ↔ 沙啞 | flatness、ZCR | 背景噪音會被誤認為粗糙質地 |
| 平靜 ↔ 充滿能量 | active RMS、dynamic range、跳躍度、active ratio | 絕對音量只占 10%；仍可能間接受活動門檻與裝置增益影響 |

門檻與確切權重定義在 `src/domain/voice-portrait/analyze-voice.js`。任何調整都要以合成訊號與多裝置測試記錄支持。

即時錄音頁的強度計使用另一條感知顯示曲線，只提供操作回饋，不會把畫面上的強度值寫入六軸分析。

## 4. 牌卡選擇

每張牌定義一個六維原型向量：

```text
[brightness, sharpness, bounce, openness, raspiness, energy]
```

計算使用者向量與八個原型的 Euclidean distance，取距離最小者。匹配度只表示距離相近程度，不代表統計機率或科學信心。

八張牌的向量與文案位於 `src/domain/cards/card-catalog.js`。

目前八個原型刻意保留至少 `0.30` 的兩兩距離，降低相近向量集中落在同一張牌的情況。這不是保證八張牌平均出現；實際分布仍需用不同裝置與朗讀者錄音校準。

## 5. 品質與信心

錄音停止後會先用 20ms frame 的峰值 RMS 檢查近乎靜音的輸入；只顯示品質提示，不阻擋分析，以免裝置增益差異誤傷輕聲使用者。MVP 若活動 frame 低於全部 frame 的 18%，結果標記 `confidence: low`，但 UI 尚未阻擋。M1 應繼續加入：

- 過小音量：以多裝置資料校準目前的提示門檻。
- 削波：樣本接近 ±1 的比例超過門檻時重錄。
- 背景噪音：朗讀前 1 秒估計 noise floor。
- 有效語音：使用簡易 VAD 排除長停頓。
- 裝置校準：以相對分位數降低絕對音量的硬體差異。

## 6. 不應加入的推論

- 說話者身分或跨 session 追蹤。
- 性別、年齡、族群、口音、疾病、心理狀態。
- 真偽、可信度、能力或人格判斷。
- 使用者沒有明確理解與同意的任何模型訓練資料收集。

基頻可讓不同音高表現產生不同聲音肖像，但不得把基頻區間命名為「男聲／女聲」，也不得用牌卡結果推論性別。
