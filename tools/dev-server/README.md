# Python 本機預覽伺服器

不需安裝 Node.js，使用 Python 3 啟動：

```bash
python tools/dev-server/server.py
```

預設網址為 `http://localhost:4173/`。也可自訂連接埠：

```bash
python tools/dev-server/server.py --port 8080
```

停止伺服器請在執行視窗按 `Ctrl+C`。

伺服器會直接發布專案根目錄；圖片位於 `src/assets/`，不需要額外複製或掛載 `public/`。
