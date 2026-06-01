const FOLDER_ID = '?????????????';
const NOTE_FILE_NAME = '記事本.txt';

function doGet() {
  return HtmlService.createHtmlOutput(buildPage_())
    .setTitle('記事本')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function buildPage_() {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe7;
        --panel: #fffdf8;
        --ink: #1f2937;
        --muted: #667085;
        --accent: #0f766e;
        --accent-strong: #115e59;
        --border: #d7d3ca;
        --shadow: 0 18px 48px rgba(17, 24, 39, 0.10);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.10), transparent 28%),
          radial-gradient(circle at top right, rgba(180, 83, 9, 0.09), transparent 22%),
          linear-gradient(180deg, #faf7f2 0%, var(--bg) 100%);
        color: var(--ink);
        min-height: 100vh;
        padding: 24px;
      }

      .app {
        max-width: 980px;
        margin: 0 auto;
        background: rgba(255, 253, 248, 0.85);
        border: 1px solid rgba(215, 211, 202, 0.85);
        border-radius: 22px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(8px);
        overflow: hidden;
      }

      .hero {
        padding: 24px 24px 16px;
        border-bottom: 1px solid var(--border);
        background: linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(180, 83, 9, 0.05));
      }

      .title {
        margin: 0 0 8px;
        font-size: 28px;
        letter-spacing: 0.02em;
      }

      .subtitle {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .content {
        display: grid;
        gap: 16px;
        padding: 24px;
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .status {
        flex: 1 1 320px;
        min-height: 44px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        line-height: 1.5;
      }

      .status strong {
        color: var(--ink);
      }

      .save-btn {
        appearance: none;
        border: 0;
        border-radius: 14px;
        padding: 13px 20px;
        font-size: 16px;
        font-weight: 700;
        color: white;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        box-shadow: 0 10px 24px rgba(15, 118, 110, 0.22);
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
        min-width: 120px;
      }

      .save-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 28px rgba(15, 118, 110, 0.28);
      }

      .save-btn:disabled {
        opacity: 0.65;
        cursor: wait;
        transform: none;
      }

      .editor {
        width: 100%;
        min-height: min(68vh, 720px);
        resize: vertical;
        padding: 18px 18px 20px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--ink);
        font-size: 16px;
        line-height: 1.7;
        outline: none;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }

      .editor:focus {
        border-color: rgba(15, 118, 110, 0.55);
        box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.10);
      }

      .meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        color: var(--muted);
        font-size: 13px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
      }

      @media (max-width: 720px) {
        body {
          padding: 12px;
        }

        .hero, .content {
          padding-left: 14px;
          padding-right: 14px;
        }

        .title {
          font-size: 24px;
        }

        .save-btn {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <section class="hero">
        <h1 class="title">記事本</h1>
        <p class="subtitle">所有內容直接存放在指定的 Google 雲端資料夾中，啟動時會自動讀取【記事本.txt】；如果檔案不存在，系統會自動建立。</p>
      </section>

      <section class="content">
        <div class="toolbar">
          <div id="status" class="status"><strong>狀態：</strong>載入中...</div>
          <button id="saveBtn" class="save-btn" type="button">Save</button>
        </div>

        <textarea id="editor" class="editor" placeholder="開始輸入你的記事內容..."></textarea>

        <div class="meta">
          <div class="pill">檔案：<span id="fileName">記事本.txt</span></div>
          <div class="pill">資料夾 ID：<span>${escapeHtml_(FOLDER_ID)}</span></div>
        </div>
      </section>
    </main>

    <script>
      const state = {
        loadedContent: '',
        dirty: false,
        saving: false,
      };

      const editor = document.getElementById('editor');
      const saveBtn = document.getElementById('saveBtn');
      const statusEl = document.getElementById('status');

      function setStatus(message, mode) {
        const label = mode ? '<strong>狀態：</strong>' : '';
        statusEl.innerHTML = label + escapeHtml(message);
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function syncDirty() {
        state.dirty = editor.value !== state.loadedContent;
        saveBtn.textContent = state.saving ? 'Saving...' : 'Save';
        saveBtn.disabled = state.saving;
        if (!state.saving) {
          setStatus(state.dirty ? '內容已修改，尚未儲存。' : '內容已載入完成。', true);
        }
      }

      function loadNote() {
        setStatus('正在讀取雲端記事本...', true);
        google.script.run
          .withSuccessHandler(function(result) {
            state.loadedContent = result.content || '';
            editor.value = state.loadedContent;
            state.dirty = false;
            setStatus(result.message || '已載入記事本。', true);
            saveBtn.disabled = false;
          })
          .withFailureHandler(function(error) {
            setStatus('載入失敗：' + (error && error.message ? error.message : error), true);
            saveBtn.disabled = false;
          })
          .loadNote();
      }

      function saveNote() {
        if (state.saving) {
          return;
        }
        state.saving = true;
        saveBtn.disabled = true;
        setStatus('正在儲存...', true);

        const content = editor.value;
        google.script.run
          .withSuccessHandler(function(result) {
            state.loadedContent = content;
            state.dirty = false;
            state.saving = false;
            saveBtn.disabled = false;
            setStatus(result.message || '已儲存。', true);
            saveBtn.textContent = 'Save';
          })
          .withFailureHandler(function(error) {
            state.saving = false;
            saveBtn.disabled = false;
            setStatus('儲存失敗：' + (error && error.message ? error.message : error), true);
            saveBtn.textContent = 'Save';
          })
          .saveNote(content);
      }

      editor.addEventListener('input', syncDirty);
      saveBtn.addEventListener('click', saveNote);

      loadNote();

      window.addEventListener('beforeunload', function(event) {
        if (state.dirty) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
    </script>
  </body>
</html>`;
}

function loadNote() {
  const noteFile = getOrCreateNoteFile_();
  const content = noteFile.getBlob().getDataAsString('UTF-8');
  return {
    content: content,
    message: noteFile.isTrashed() ? '記事本已建立。' : '已開啟記事本.txt。',
  };
}

function saveNote(content) {
  const noteFile = getOrCreateNoteFile_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    noteFile.setContent(content || '');
    return {
      ok: true,
      message: '已儲存到雲端資料夾中的記事本.txt。',
    };
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateNoteFile_() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(NOTE_FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return folder.createFile(NOTE_FILE_NAME, '', MimeType.PLAIN_TEXT);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
