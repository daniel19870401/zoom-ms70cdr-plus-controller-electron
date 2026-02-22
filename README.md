# Zoom MS-70CDR+ 控制程式

這支程式是用於 Zoom MS-70CDR+ 效果器的控制工具（Electron App）。

功能包含：
- Web MIDI / SysEx 連線控制
- Patch 切換與資訊同步
- 效果器開關與參數調整
- OSC 控制（可切換 Patch、開關效果器、調變參數）
- 即時收發紀錄

## 使用方式
1. 安裝依賴
   ```bash
   npm install
   ```
2. 啟動程式
   ```bash
   npm start
   ```
3. 連接 Zoom MS-70CDR+，按下「連線」
4. 選擇 MIDI 輸入 / 輸出裝置

## OSC 控制
預設監聽 UDP `9000`（可用 `OSC_PORT` 環境變數修改）。

可用指令：
- `/zoom/patch` 或 `/zoom/patch/set`：`bank program [channel]`
  - `bank` 直接使用輸入數字
  - `program` 會自動減 1（例如輸入 `3` 會送出 program `2`）
- `/zoom/patch/next`
- `/zoom/patch/prev`
- `/zoom/effect/toggle`：`slot enabled`
- `/zoom/effect/param`：`slot param value`
- `/zoom/effect/param_norm`：`slot param 0.0-1.0`

## 打包（Electron）
本專案可打包為：
- Windows Intel (`x64`)
- Windows ARM (`arm64`)
- macOS ARM (`arm64`)

建議使用 GitHub Actions 進行多平台打包與產物上傳（已提供 workflow）。

## 注意事項
- Web MIDI / SysEx 需在 Electron 中執行
- 若無法控制，請確認 Device ID 與效果器 MIDI 設定
- 首次連線會自動送出初始化與 Param Edit Enable 指令
