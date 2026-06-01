// 單一檔案 GAS Web App：線上記事本（使用 DriveApp 存取指定資料夾）
var RAW_FOLDER_ID = '=1GVcetfmI2ISjxPQJ_SW1DHYMkOSGiuk7';

function _getFolder() {
  var id = RAW_FOLDER_ID || '';
  if (id.charAt(0) === '=') id = id.substring(1);
  id = id.trim();
  return DriveApp.getFolderById(id);
}

function _getNoteFile() {
  var folder = _getFolder();
  var files = folder.getFilesByName('記事本.txt');
  if (files.hasNext()) return files.next();
  return folder.createFile('記事本.txt', '');
}

function loadNote() {
  try {
    var file = _getNoteFile();
    var content = file.getBlob().getDataAsString();
    var updated = Utilities.formatDate(file.getLastUpdated(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    return {content: content, updated: updated};
  } catch (e) {
    return {error: e.toString()};
  }
}

function saveNote(text) {
  try {
    var file = _getNoteFile();
    file.setContent(text);
    var updated = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    return {success: true, updated: updated};
  } catch (e) {
    return {success: false, error: e.toString()};
  }
}

function doGet(e) {
  var html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>記事本</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:12px}
      #note{width:100%;height:60vh;padding:8px;font-size:14px;box-sizing:border-box}
      #toolbar{display:flex;gap:8px;align-items:center;margin-bottom:8px}
      button{padding:6px 12px;font-size:14px}
      #status{color:#666;font-size:13px}
    </style>
  </head>
  <body>
    <div id="toolbar">
      <button id="saveBtn">Save</button>
      <div id="status">載入中...</div>
    </div>
    <textarea id="note" placeholder="在這裡輸入記事..."></textarea>

    <script>
      const saveBtn = document.getElementById('saveBtn');
      const noteEl = document.getElementById('note');
      const statusEl = document.getElementById('status');

      function setStatus(text){ statusEl.textContent = text; }

      function load(){
        setStatus('載入中...');
        google.script.run.withSuccessHandler(function(r){
          if(r && r.error){ setStatus('載入失敗: '+r.error); return; }
          noteEl.value = r.content || '';
          setStatus('已載入 — 上次更新: ' + (r.updated||'—'));
        }).loadNote();
      }

      function save(){
        saveBtn.disabled = true;
        setStatus('儲存中...');
        const text = noteEl.value;
        google.script.run.withSuccessHandler(function(r){
          saveBtn.disabled = false;
          if(r && r.success){ setStatus('已儲存: ' + r.updated); }
          else if(r && r.error){ setStatus('儲存失敗: '+r.error); }
          else { setStatus('儲存失敗'); }
        }).saveNote(text);
      }

      // Ctrl/Cmd+S 快速儲存
      window.addEventListener('keydown', function(e){
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
          e.preventDefault(); save();
        }
      });

      saveBtn.addEventListener('click', save);
      // 初始載入
      load();
    </script>
  </body>
</html>`;

  return HtmlService.createHtmlOutput(html).setTitle('記事本');
}
