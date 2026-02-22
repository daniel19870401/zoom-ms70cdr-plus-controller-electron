# Zoom MS-70CDR+ 控制程式

這支程式是用於 Zoom MS-70CDR+ 效果器的 Electron 控制工具，透過 Web MIDI / SysEx 與裝置通訊，可進行 Patch 切換、效果器開關、參數調整，並支援 OSC 遠端控制。

## 功能特色
- Web MIDI / SysEx 連線（Electron 內建權限處理）
- 自動初始化（連線後會送出初始化與 Param Edit Enable）
- 自動同步 Patch 資訊（目前 Patch、Bank、Program、總 Patch 數量）
- 顯示目前 Patch 名稱與位置（第 X / 總數）
- 效果槽位（1-6）切換、效果器啟用/停用
- 參數清單（依 `data/zoom-effect-mappings-ms70cdrp.json` 載入）
- 參數值滑桿與對應數值/文字顯示（含部分快速符號字元）
- OSC 控制 Patch / 效果器 / 參數
- 即時收發紀錄（MIDI / SysEx log）

## 系統需求
- macOS / Windows（Electron 可執行環境）
- Zoom MS-70CDR+（USB 連線）
- Node.js 18+（建議 Node.js 20）

## 安裝與啟動
1. 安裝依賴
   ```bash
   npm install
   ```
2. 啟動程式（Electron）
   ```bash
   npm start
   ```

## 裝置端連線設定（Zoom MS-70CDR+）
建議先在效果器上確認 MIDI 設定，以避免只能部分同步或無法收到回傳。

建議設定：
- `MIDI TX`：開啟（讓裝置在切換 Patch / 參數時回傳資料）
- `PC OUT`：開啟（讓 Patch 切換事件可回傳）
- 確認 USB 已正確連接、裝置可被系統辨識

如果你不確定目前設定，可先手動在效果器上打開 `MIDI TX / PC OUT` 再測試。

## 連線方法（程式操作）
1. 用 USB 連接 Zoom MS-70CDR+
2. 啟動程式後，先確認 `MIDI 輸出` / `MIDI 輸入` 下拉選單已列出裝置
3. 按下 `連線`
4. 程式會自動執行以下流程：
   - 啟用 Web MIDI / SysEx
   - 開啟 MIDI 輸入 / 輸出 port
   - 送出 `Get Patch Count`
   - 送出初始化（Get Current Patch）
   - 送出 `Param Edit Enable`
5. 連線成功後，操作紀錄區會顯示收發 log

## 畫面控制說明
### 1) 連線狀態區
- `Device ID (Hex)`：預設為 `6E`，若你的裝置 Device ID 不同可手動修改
- `MIDI 輸出 / MIDI 輸入`：選擇對應的 Zoom 裝置 port
- `連線`：建立 Web MIDI/SysEx 連線並啟動同步
- `重新整理裝置`：重新掃描 MIDI 裝置
- `初始化`：重新送出目前 Patch 初始化要求

### 2) 快速指令區
提供常用 SysEx 指令按鈕（例如 Param Edit Enable、Get Current Patch 等），可用於測試通訊或除錯。

### 3) 參數與效果開關區
此區為主要控制介面：
- `目前 Patch`：顯示名稱、位置（第 X / 總數）
- `Bank / Program / 總 Patch 數量 / Bank 數量 / 每 Bank 數量 / Patch 長度`
- `效果槽位 (1-6)`：選擇要操作的效果槽位
- `效果器`：顯示該槽位目前效果器名稱
- `參數編號`：依照效果器對應的參數清單（英文名稱）
- `參數數值`：滑桿調整值，會依 JSON mapping 套用合理範圍
- `送出參數`：送出該參數變更
- `切換效果啟用/停用`：送出效果開關命令
- `效果狀態`：顯示目前槽位效果啟用狀態
- `同步 Patch 資訊`：手動要求重新同步目前 Patch 資料

## 自動同步行為（重要）
- 連線後會先取得總 Patch 數量與目前 Patch
- 當效果器切換 Bank / Patch（且裝置有回傳）時，程式會自動同步：
  - Patch 名稱
  - 效果槽位內容
  - 效果器名稱
  - 效果開關狀態
  - 參數值
- 程式以裝置回傳（ACK / Patch Dump）為主，不會持續高頻輪詢

## OSC 控制
預設監聽 UDP `9000`，可用環境變數 `OSC_PORT` 指定其他 port：

```bash
OSC_PORT=9001 npm start
```

### OSC 指令格式
- `/zoom/patch` 或 `/zoom/patch/set`：`bank program [channel]`
  - `bank`：直接使用輸入數字（例如 `7` 就是 bank 7）
  - `program`：會自動減 1（例如輸入 `3` 會送出 program `2`）
  - `channel`：選填，使用原始 MIDI channel 值 `0-15`（`0` = MIDI Ch.1）
- `/zoom/patch/next`
- `/zoom/patch/prev`
- `/zoom/effect/toggle`：`slot [enabled]`
  - `slot` 可用 `1-6` 或 `0-5`
  - `enabled` 可省略；省略時會切換目前狀態
- `/zoom/effect/param`：`slot param value`
  - 直接送出參數值（整數）
- `/zoom/effect/param_norm`：`slot param value`
  - `value` 使用 `0.0 - 1.0`，程式會依該參數最大值換算

### OSC 範例
- 切到 Bank 7、Program 3（實際送出 program 2）
  - `/zoom/patch 7 3`
- 下一個 Patch
  - `/zoom/patch/next`
- 切換第 1 槽效果開關
  - `/zoom/effect/toggle 1`
- 啟用第 2 槽效果
  - `/zoom/effect/toggle 2 1`
- 設定第 1 槽第 3 參數為 120
  - `/zoom/effect/param 1 3 120`
- 用 normalized 值調變第 1 槽第 3 參數到 50%
  - `/zoom/effect/param_norm 1 3 0.5`

## 專案結構（重點）
- `index.html`：UI 結構
- `styles.css`：介面樣式
- `app.js`：前端邏輯（Web MIDI / SysEx / Patch 同步 / OSC bridge）
- `main.js`：Electron 主程序（啟動視窗、權限、OSC UDP server）
- `preload.js`：Electron preload（OSC IPC bridge）
- `server.js`：本機靜態伺服器
- `data/zoom-effect-mappings-ms70cdrp.json`：效果器參數對應表
- `.github/workflows/build.yml`：GitHub Actions 多平台打包流程

## 打包（Electron）
### 本機打包指令
- Windows Intel (`x64`)
  ```bash
  npm run build:win:x64
  ```
- Windows ARM (`arm64`)
  ```bash
  npm run build:win:arm64
  ```
- macOS ARM (`arm64`)
  ```bash
  npm run build:mac:arm64
  ```

其他現有指令：
- `npm run build`：輸出 unpacked 版本（資料夾）
- `npm run build:all`：依序執行三個平台指令（通常建議改用 GitHub Actions）

### GitHub Actions 打包
已提供 workflow：`.github/workflows/build.yml`

觸發方式：
- 手動觸發（GitHub Actions 頁面 / `workflow_dispatch`）
- 推送 tag（例如 `v0.1.0`）

產出：
- `windows-x64` artifact
- `windows-arm64` artifact
- `macos-arm64` artifact

## 常見問題（Troubleshooting）
### 1. 按「連線」後沒有反應 / 無法控制
- 確認 `MIDI 輸出` 與 `MIDI 輸入` 都選到 Zoom 裝置
- 確認 Device ID 是否正確（預設 `6E`）
- 確認效果器的 `MIDI TX / PC OUT` 已開啟
- 確認 USB 線材可正常傳輸資料（不只是充電線）

### 2. Patch 名稱或參數沒有自動更新
- 裝置端需有回傳（建議開啟 `MIDI TX / PC OUT`）
- 先按 `同步 Patch 資訊` 測試手動同步是否正常
- 查看操作紀錄是否有收到 SysEx / ACK

### 3. OSC 指令有送出但 Patch 不正確
- `/zoom/patch` 的 `program` 會自動減 1
- 例如 `/zoom/patch 7 3` 代表送出 `bank 7 / program 2`
- 若有指定 `channel`，請確認是原始值 `0-15`

### 4. Windows ARM64 / macOS ARM64 打包失敗
- 某些平台打包需要對應 runner/工具鏈，建議使用 GitHub Actions
- 若 workflow 失敗，先查看該 job 的 `npm run build:*` log 再調整設定

## 安全與風險提醒
- SysEx / MIDI 寫入可能即時改變效果器狀態
- 建議先備份你的 Patch，再進行大量測試或自動化控制

---

# English Version

## Overview
This application is an Electron-based controller for the Zoom MS-70CDR+. It communicates with the pedal via Web MIDI / SysEx and supports patch switching, effect on/off control, parameter editing, and OSC remote control.

## Features
- Web MIDI / SysEx connection (with Electron permission handling)
- Auto initialization after connect (including Param Edit Enable)
- Automatic patch info sync (current patch, bank, program, total patch count)
- Current patch name and position display
- Effect slot (1-6) selection and effect on/off switching
- Parameter list loaded from `data/zoom-effect-mappings-ms70cdrp.json`
- Parameter slider with mapped value range and text/value display
- OSC control for patch/effect/parameters
- Real-time MIDI / SysEx log view

## Requirements
- macOS / Windows (Electron runtime)
- Zoom MS-70CDR+ connected via USB
- Node.js 18+ (Node.js 20 recommended)

## Install and Run
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the Electron app
   ```bash
   npm start
   ```

## Device-Side Setup (Zoom MS-70CDR+)
Before connecting, check the pedal's MIDI settings to ensure status/patch changes are sent back to the app.

Recommended settings:
- `MIDI TX`: ON (sends patch/parameter updates back to the app)
- `PC OUT`: ON (sends patch change related messages)
- Confirm USB is connected properly and recognized by the OS

If synchronization is incomplete, manually enable `MIDI TX / PC OUT` on the pedal first and test again.

## Connection Steps (In the App)
1. Connect Zoom MS-70CDR+ via USB
2. Launch the app and confirm the Zoom device appears in `MIDI Input` / `MIDI Output`
3. Click `Connect`
4. The app will automatically:
   - Enable Web MIDI / SysEx
   - Open MIDI input/output ports
   - Send `Get Patch Count`
   - Send initialization (`Get Current Patch`)
   - Send `Param Edit Enable`
5. Check the log panel for incoming/outgoing MIDI/SysEx messages

## UI Controls
### 1) Connection Status Panel
- `Device ID (Hex)`: default is `6E`; change it if your pedal uses a different device ID
- `MIDI Output / MIDI Input`: select the Zoom MIDI ports
- `Connect`: starts Web MIDI/SysEx connection and synchronization
- `Refresh Devices`: rescans available MIDI devices
- `Initialize`: manually requests current patch initialization again

### 2) Quick Commands Panel
Provides common SysEx buttons (for example, Param Edit Enable and Get Current Patch) for testing and diagnostics.

### 3) Parameters and Effect Toggle Panel
This is the main control area:
- Current patch name and position (`#X / total`)
- Patch summary fields (Bank / Program / Total Patches / Bank Count / Patches per Bank / Patch Length)
- `Effect Slot (1-6)` selector
- Current effect name for the selected slot
- Parameter selector (mapped names from JSON)
- Parameter value slider (range adjusted from mapping data)
- `Send Parameter` button
- `Toggle Effect On/Off` button
- Effect status display
- `Sync Patch Info` button for manual refresh

## Automatic Sync Behavior
- After connection, the app requests total patch count and current patch information
- When the pedal changes bank/patch (and sends data back), the app updates:
  - Patch name
  - Effect slot contents
  - Effect names
  - Effect on/off states
  - Parameter values
- The app is primarily event-driven from pedal responses (ACK / patch dump), not constant high-frequency polling

## OSC Control
Default OSC UDP port is `9000`. You can change it with `OSC_PORT`:

```bash
OSC_PORT=9001 npm start
```

### OSC Commands
- `/zoom/patch` or `/zoom/patch/set`: `bank program [channel]`
  - `bank`: used as-is (e.g. `7` means bank 7)
  - `program`: automatically converted by subtracting 1 (e.g. input `3` sends program `2`)
  - `channel`: optional, raw MIDI channel value `0-15` (`0` = MIDI Ch.1)
- `/zoom/patch/next`
- `/zoom/patch/prev`
- `/zoom/effect/toggle`: `slot [enabled]`
  - `slot` supports `1-6` or `0-5`
  - omit `enabled` to toggle current state
- `/zoom/effect/param`: `slot param value`
  - sends an integer parameter value directly
- `/zoom/effect/param_norm`: `slot param value`
  - `value` uses `0.0 - 1.0` and is scaled to the parameter max value

### OSC Examples
- Switch to Bank 7, Program 3 (actually sends program 2)
  - `/zoom/patch 7 3`
- Next patch
  - `/zoom/patch/next`
- Toggle effect in slot 1
  - `/zoom/effect/toggle 1`
- Enable effect in slot 2
  - `/zoom/effect/toggle 2 1`
- Set slot 1 parameter 3 to 120
  - `/zoom/effect/param 1 3 120`
- Set slot 1 parameter 3 to 50% (normalized)
  - `/zoom/effect/param_norm 1 3 0.5`

## Project Structure (Key Files)
- `index.html`: UI structure
- `styles.css`: UI styles
- `app.js`: frontend logic (Web MIDI / SysEx / patch sync / OSC bridge handling)
- `main.js`: Electron main process (window setup, permissions, OSC UDP server)
- `preload.js`: Electron preload bridge (OSC IPC bridge)
- `server.js`: local static server
- `data/zoom-effect-mappings-ms70cdrp.json`: effect/parameter mapping data
- `.github/workflows/build.yml`: GitHub Actions workflow for multi-platform builds

## Packaging (Electron)
### Local Build Commands
- Windows Intel (`x64`)
  ```bash
  npm run build:win:x64
  ```
- Windows ARM (`arm64`)
  ```bash
  npm run build:win:arm64
  ```
- macOS ARM (`arm64`)
  ```bash
  npm run build:mac:arm64
  ```

Other available commands:
- `npm run build`: outputs unpacked build (directory)
- `npm run build:all`: runs the three platform commands in sequence (GitHub Actions is recommended instead)

### GitHub Actions Build
Workflow file: `.github/workflows/build.yml`

Trigger methods:
- Manual run (`workflow_dispatch`)
- Push a tag (for example `v0.1.0`)

Artifacts:
- `windows-x64`
- `windows-arm64`
- `macos-arm64`

## Troubleshooting
### 1. Connect button works but the pedal does not respond
- Confirm both `MIDI Output` and `MIDI Input` are set to the Zoom device
- Confirm the device ID is correct (default `6E`)
- Confirm `MIDI TX / PC OUT` are enabled on the pedal
- Confirm the USB cable supports data transfer (not charge-only)

### 2. Patch name or parameters do not update automatically
- The pedal must send response data back (`MIDI TX / PC OUT` should be ON)
- Try `Sync Patch Info` manually
- Check the log panel for incoming SysEx / ACK messages

### 3. OSC patch command selects the wrong patch
- `/zoom/patch` automatically subtracts 1 from `program`
- Example: `/zoom/patch 7 3` sends `bank 7 / program 2`
- If `channel` is provided, it must be a raw value `0-15`

### 4. Windows ARM64 / macOS ARM64 build fails
- Some platform targets depend on runner/toolchain support; GitHub Actions is recommended
- If a workflow job fails, inspect that job's `npm run build:*` logs first

## Safety Notes
- SysEx / MIDI writes can change pedal state immediately
- Back up your patches before heavy testing or automation
