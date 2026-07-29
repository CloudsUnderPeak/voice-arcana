# Voice Arcana 規格索引

```text
Version: 0.1.0
Status: Draft / MVP Framework
Last updated: 2026-07-30
```

## 文件導覽

| 文件 | 目的 | 何時更新 |
|---|---|---|
| [PRODUCT_PLAN.md](PRODUCT_PLAN.md) | 產品定位、範圍、里程碑、風險 | 調整優先順序或發布範圍 |
| [SPEC_BEHAVIOR.md](SPEC_BEHAVIOR.md) | 使用者流程、狀態、文案與驗收條件 | 改變任何可見行為 |
| [SPEC_TECHNICAL.md](SPEC_TECHNICAL.md) | 架構、狀態、資料生命週期與效能 | 改變模組或處理管線 |
| [AUDIO_ANALYSIS.md](AUDIO_ANALYSIS.md) | 聲學特徵、六軸正規化、牌卡映射 | 改變分析演算法 |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | 視覺宇宙、token、元件與動態 | 改變品牌與共用視覺 |
| [ART_ASSET_BRIEF.md](ART_ASSET_BRIEF.md) | 正式美術交付清單、尺寸、格式與檔名 | 新增或替換美術素材 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Make 指令、CI 與 GitHub Pages 部署 | 調整建置或發布流程 |

## 名詞

- **Voice Arcana**：產品名稱；以八種原創聲音原型構成聲音牌系統，不採用傳統塔羅的牌組、牌義或占卜規則。
- **聲音肖像**：本次錄音經聲學代理值轉譯後的六個連續維度。
- **聲音牌**：八個原創聲音原型之一，由六維向量距離選出。
- **本機分析**：錄音原始資料、取樣與特徵不離開使用者裝置。
- **session**：從開啟頁面到重整或關閉頁面的暫存體驗。

## 規格優先順序

若文件與程式不一致，先以隱私約束及 `SPEC_BEHAVIOR.md` 的使用者承諾為準，確認產品決策後再同步技術文件與實作。
