# Consolidated Feature & Bug Report

Date: February 4, 2026

## Scope
Codebase review for Sign Language Meet Chrome Extension.

## Bugs

### 1) Stop Detection button does nothing
**Severity:** High

**Symptoms:** Clicking "Stop Detection" in the popup does not stop detection, speech, or camera usage.

**Evidence:** The popup sends `STOP_DETECTION`, but no listener handles it.
- `popup.js` sends the message.
- `background.js` has no handler for `STOP_DETECTION`.
- `offscreen.js` does not implement any stop logic or disable flag reset.

**Impact:** Users cannot stop camera usage or speech without closing the extension or browser tab.

**Suggested Fix:**
- Add a `STOP_DETECTION` handler in `background.js` that forwards a stop message to the offscreen document.
- Implement a stop handler in `offscreen.js` to set `detectionEnabled = false`, clear timers/state, stop speech, and stop video tracks.

### 2) Camera continues streaming even when detection is disabled
**Severity:** Medium

**Symptoms:** The camera stream starts immediately when the offscreen document loads and never stops, even if detection is disabled or the user wants to stop.

**Evidence:** `offscreen.js` calls `getUserMedia()` and starts the stream at module load time; no teardown exists.

**Impact:** Privacy and resource usage concerns. Camera remains active.

**Suggested Fix:**
- Delay camera start until detection is enabled.
- Add teardown logic to stop tracks when detection stops or when the offscreen document is closed.

### 3) Meet tab ID is not cleared on tab close or navigation
**Severity:** Medium

**Symptoms:** If the user closes a Meet tab or navigates away, `meetTabId` remains set. Messages can be sent to a stale tab ID.

**Evidence:** `background.js` only sets `meetTabId` in `onUpdated` and never clears it.

**Impact:** Messages to a non-existent or incorrect tab can fail silently, leading to missing subtitles.

**Suggested Fix:**
- Listen to `chrome.tabs.onRemoved` and clear `meetTabId` when the stored tab is closed.
- Optionally verify `tab.url` on every `SIGN_DETECTED` to ensure it is still a Meet tab.

## Feature Improvements

### 1) Add visual status indicator in popup
**Priority:** Medium

**Goal:** Show whether detection is running, stopped, or waiting for camera permission.

**Suggested Implementation:**
- Track state in background or offscreen and send updates to the popup.
- Display status text and color (e.g., Running/Stopped/Error).

### 2) Add explicit permissions error handling
**Priority:** Medium

**Goal:** Show a friendly error if camera permission is denied or unavailable.

**Suggested Implementation:**
- Wrap `getUserMedia()` in `try/catch` and message the popup with failure reason.

### 3) Add detection pause when Meet tab not active
**Priority:** Low

**Goal:** Reduce resource usage by pausing detection when Meet is not the active tab.

**Suggested Implementation:**
- Use `chrome.tabs.onActivated` to detect active tab changes and toggle detection accordingly.

## Notes
- Logging via `console.table()` inside the detection loop in `offscreen.js` may produce heavy console output; consider reducing or gating behind a debug flag.
