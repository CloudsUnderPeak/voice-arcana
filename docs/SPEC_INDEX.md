# Voice Arcana 規格索引

```text
Version: 0.1.0
Status: Draft / MVP Framework
Last updated: 2026-07-31
```

## 文件導覽

| 文件 | 目的 | 何時更新 |
|---|---|---|
| [SPEC_BEHAVIOR.md](SPEC_BEHAVIOR.md) | 產品定位與範圍、使用者流程、視覺與互動系統、驗收條件 | 改變產品範圍或任何可見行為 |
| [SPEC_TECHNICAL.md](SPEC_TECHNICAL.md) | 架構、狀態、資料生命週期、效能、里程碑與風險 | 改變模組、處理管線或發布優先順序 |
| [AUDIO_ANALYSIS.md](AUDIO_ANALYSIS.md) | 聲學特徵、六軸正規化、牌卡映射 | 改變分析演算法 |
| [ART_ASSET_BRIEF.md](ART_ASSET_BRIEF.md) | 正式美術交付清單、尺寸、格式與檔名 | 新增或替換美術素材 |
| [README](../README.zh-TW.md)（部署到 GitHub Pages） | 建置指令、CI 與 GitHub Pages 部署 | 調整建置或發布流程 |

## 名詞

- **Voice Arcana**：產品名稱；以八種原創聲音原型構成聲音牌系統，不採用傳統塔羅的牌組、牌義或占卜規則。
- **聲音肖像**：本次錄音經聲學代理值轉譯後的六個連續維度。
- **聲音牌**：八個原創聲音原型之一，由六維向量距離選出。
- **本機分析**：錄音原始資料、取樣與特徵不離開使用者裝置。
- **session**：從開啟頁面到重整或關閉頁面的暫存體驗。

## 規格優先順序

若文件與程式不一致，先以隱私約束及 `SPEC_BEHAVIOR.md` 的使用者承諾為準，確認產品決策後再同步技術文件與實作。
