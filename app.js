
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const STORAGE_KEY = 'rd-tracker-data-user';
const HISTORY_KEY = 'rd-tracker-history-user';
const EXEC_KEY = 'rd-tracker-executors-user';

let executors = (localStorage.getItem(EXEC_KEY) ? JSON.parse(localStorage.getItem(EXEC_KEY)) : (EXECUTORS||[]));
let rows = (localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : (INITIAL_ROWS||[]));
let historyLog = (localStorage.getItem(HISTORY_KEY) ? JSON.parse(localStorage.getItem(HISTORY_KEY)) : []);

function saveAll(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLog));
  localStorage.setItem(EXEC_KEY, JSON.stringify(executors));
}

function addHistory(action, rowIdx, field, oldVal, newVal){
  const stamp = new Date().toLocaleString();
  historyLog.unshift({stamp, rowIdx: rowIdx+1, action, field, oldVal, newVal});
  renderHistory();
  saveAll();
}

function renderHistory(){
  const log = $('#historyLog');
  if(!historyLog.length){ log.textContent = '— изменений пока нет —'; return; }
  log.textContent = historyLog.map(e => `[${e.stamp}] #${e.rowIdx} ${e.action}: ${e.field}
  было: ${e.oldVal || ''}
  стало: ${e.newVal || ''}
`).join('\n');
}

function statusToPct(status){
  if(status === '✅ Готово') return 1;
  if(status === '⚙️ В работе') return 0.5;
  return 0;
}

function applyDeadlineHighlight(tdDate, status){
  tdDate.classList.remove('deadline-red','deadline-orange','deadline-green');
  const v = tdDate.querySelector('input')?.value;
  if(!v){ return; }
  const d = new Date(v);
  if(Number.isNaN(d.getTime())) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.floor((d - today)/86400000);
  if(status === '✅ Готово'){ tdDate.classList.add('deadline-green'); return; }
  if(daysLeft < 0){ tdDate.classList.add('deadline-red'); return; }
  if(daysLeft <= 3){ tdDate.classList.add('deadline-orange'); return; }
}

function renderFilters(){
  const sel = $('#filterExecutor');
  sel.innerHTML = '<option value="">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
}

function renderKPIs(){
  const total = rows.length;
  const done = rows.filter(r => r[4] === '✅ Готово').length;
  const inprog = rows.filter(r => r[4] === '⚙️ В работе').length;
  const todo = rows.filter(r => r[4] === '⏳ Не начато').length;
  const nnew = rows.filter(r => !!r[3]).length;
  $('#kAll').textContent = total;
  $('#kDone').textContent = done;
  $('#kInProgress').textContent = inprog;
  $('#kTodo').textContent = todo;
  $('#kNew').textContent = nnew;
  const pct = total ? Math.round(done/total*100) : 0;
  $('#progressBar').value = pct;
  $('#progressPct').textContent = pct + '%';
  updatePie(done, inprog, todo);
}

function updatePie(done, inprog, todo){
  const total = done + inprog + todo;
  const cDone = $('#pieDone');
  const cProg = $('#pieInProgress');
  const cTodo = $('#pieTodo');
  const center = $('#pieCenter');
  if(!total){
    cDone.setAttribute('stroke-dasharray','0 100');
    cProg.setAttribute('stroke-dasharray','0 100');
    cTodo.setAttribute('stroke-dasharray','0 100');
    center.textContent = '0%';
    return;
  }
  const pd = done/total*100;
  const pp = inprog/total*100;
  const pt = todo/total*100;
  cDone.setAttribute('stroke-dasharray', `${pd} ${100-pd}`);
  cDone.setAttribute('stroke-dashoffset', '25');
  cProg.setAttribute('stroke-dasharray', `${pp} ${100-pp}`);
  cProg.setAttribute('stroke-dashoffset', String(25 - pd));
  cTodo.setAttribute('stroke-dasharray', `${pt} ${100-pt}`);
  cTodo.setAttribute('stroke-dashoffset', String(25 - pd - pp));
  const pct = Math.round((done/total)*100);
  center.textContent = pct + '%';
}

function renderTable(){
  const tbody = $('#rdTable tbody');
  tbody.innerHTML = '';

  const fStatus = $('#filterStatus').value;
  const fExec = $('#filterExecutor').value;
  const onlyNew = $('#filterNew').checked;

  const filtered = rows.filter(r => {
    if(fStatus && r[4] !== fStatus) return false;
    if(fExec && r[5] !== fExec) return false;
    if(onlyNew && !r[3]) return false;
    return true;
  });

  filtered.forEach((r) => {
    const idx = rows.indexOf(r);
    const tr = document.createElement('tr');

    // №
    const td0 = document.createElement('td');
    td0.contentEditable = 'true';
    td0.textContent = r[0] ?? '';
    td0.addEventListener('blur', e => { const old = rows[idx][0]; rows[idx][0] = e.target.textContent.trim(); addHistory('edit', idx, '№', old, rows[idx][0]); saveAll(); });
    tr.appendChild(td0);

    // Наименование
    const td1 = document.createElement('td');
    td1.contentEditable = 'true';
    td1.textContent = r[1] ?? '';
    td1.addEventListener('blur', e => { const old = rows[idx][1]; rows[idx][1] = e.target.textContent.trim(); addHistory('edit', idx, 'Наименование', old, rows[idx][1]); saveAll(); });
    tr.appendChild(td1);

    // Изменения
    const td2 = document.createElement('td');
    td2.contentEditable = 'true';
    td2.textContent = r[2] ?? '';
    td2.addEventListener('blur', e => { const old = rows[idx][2]; rows[idx][2] = e.target.textContent.trim(); addHistory('edit', idx, 'Изменения/Примечания', old, rows[idx][2]); saveAll(); });
    tr.appendChild(td2);

    // Новый лист
    const td3 = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = !!r[3];
    cb.addEventListener('change', e => { const old = rows[idx][3]; rows[idx][3] = e.target.checked; addHistory('edit', idx, 'Новый лист', old, rows[idx][3]); saveAll(); renderKPIs(); });
    td3.appendChild(cb);
    tr.appendChild(td3);

    // Статус
    const td4 = document.createElement('td');
    td4.classList.add('status-cell');
    const sel = document.createElement('select');
    ['⏳ Не начато','⚙️ В работе','✅ Готово'].forEach(s => {
      const opt = document.createElement('option'); opt.textContent = s; sel.appendChild(opt);
    });
    sel.value = r[4] || '⏳ Не начато';
    sel.addEventListener('change', e => {
      const old = rows[idx][4]; rows[idx][4] = e.target.value; addHistory('edit', idx, 'Статус', old, rows[idx][4]); saveAll(); renderKPIs(); applyRowStatusStyle(tr, rows[idx][4]); applyDeadlineHighlight(td6, rows[idx][4]);
    });
    td4.appendChild(sel);
    tr.appendChild(td4);

    // Исполнитель
    const td5 = document.createElement('td');
    const sel2 = document.createElement('select');
    executors.forEach(n => { const opt = document.createElement('option'); opt.textContent = n; sel2.appendChild(opt); });
    const emptyOpt = document.createElement('option'); emptyOpt.textContent = ''; sel2.insertBefore(emptyOpt, sel2.firstChild);
    sel2.value = r[5] || '';
    sel2.addEventListener('change', e => { const old = rows[idx][5]; rows[idx][5] = e.target.value; addHistory('edit', idx, 'Исполнитель', old, rows[idx][5]); saveAll(); });
    td5.appendChild(sel2);
    tr.appendChild(td5);

    // Дата
    const td6 = document.createElement('td');
    const inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.value = r[6] || '';
    inputDate.addEventListener('change', e => { const old = rows[idx][6]; rows[idx][6] = e.target.value; addHistory('edit', idx, 'Дата сдачи', old, rows[idx][6]); saveAll(); applyDeadlineHighlight(td6, rows[idx][4]); });
    td6.appendChild(inputDate);
    tr.appendChild(td6);

    // Комментарии
    const td7 = document.createElement('td');
    const ta = document.createElement('textarea');
    ta.value = r[7] || '';
    ta.rows = 2;
    ta.addEventListener('blur', e => { const old = rows[idx][7]; rows[idx][7] = e.target.value; addHistory('edit', idx, 'Комментарии', old, rows[idx][7]); saveAll(); });
    td7.appendChild(ta);
    tr.appendChild(td7);

    // Ссылка
    const td8 = document.createElement('td');
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.placeholder = '\\server\path\to\file.dwg';
    inputLink.value = r[8] || '';
    inputLink.addEventListener('blur', e => { const old = rows[idx][8]; rows[idx][8] = e.target.value; addHistory('edit', idx, 'Ссылка на файл', old, rows[idx][8]); saveAll(); renderOpenBtn(); });
    td8.appendChild(inputLink);
    tr.appendChild(td8);

    // Открыть
    const td9 = document.createElement('td');
    const openWrap = document.createElement('div');
    openWrap.className = 'link-wrap';
    const btnOpen = document.createElement('a');
    btnOpen.textContent = 'Открыть'; btnOpen.className = 'badge';
    function renderOpenBtn(){
      const link = rows[idx][8];
      if(link){ btnOpen.href = link; btnOpen.target = '_blank'; btnOpen.style.pointerEvents = 'auto'; btnOpen.style.opacity = '1'; }
      else { btnOpen.removeAttribute('href'); btnOpen.style.pointerEvents = 'none'; btnOpen.style.opacity = '.5'; }
    }
    renderOpenBtn();
    openWrap.appendChild(btnOpen);
    td9.appendChild(openWrap);
    tr.appendChild(td9);

    function applyRowStatusStyle(tr, status){
      tr.classList.remove('status-done','status-progress','status-todo');
      if(status === '✅ Готово') tr.classList.add('status-done');
      else if(status === '⚙️ В работе') tr.classList.add('status-progress');
      else tr.classList.add('status-todo');
    }
    applyRowStatusStyle(tr, r[4] || '⏳ Не начато');
    applyDeadlineHighlight(td6, r[4] || '⏳ Не начато');

    tbody.appendChild(tr);
  });

  renderKPIs();
}

function exportJSON(){
  const blob = new Blob([JSON.stringify({executors, rows}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rd_tracker.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(){
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const obj = JSON.parse(reader.result);
        if(obj.executors) executors = obj.executors;
        if(obj.rows) rows = obj.rows;
        saveAll(); renderFilters(); renderTable();
      }catch(err){ alert('Ошибка JSON'); }
    };
    reader.readAsText(f);
  };
  inp.click();
}

function exportCSV(){
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push([r[0],r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\n/g,' '),r[8]].map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rd_tracker.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function addRow(){
  rows.push(["","","",false,"⏳ Не начато","","","","",""]);
  saveAll();
  renderTable();
}

function init(){
  // Fill executor filter and table dropdowns
  $('#filterExecutor').innerHTML = '<option value="">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
  renderTable();
  renderHistory();

  // Buttons
  $('#btnAddRow').addEventListener('click', addRow);
  $('#btnExportJSON').addEventListener('click', exportJSON);
  $('#btnImportJSON').addEventListener('click', importJSON);
  $('#btnExportCSV').addEventListener('click', exportCSV);
  $('#btnClearHistory').addEventListener('click', () => { historyLog = []; renderHistory(); saveAll(); });
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#filterStatus').addEventListener('change', renderTable);
  $('#filterExecutor').addEventListener('change', renderTable);
  $('#filterNew').addEventListener('change', renderTable);
}

document.addEventListener('DOMContentLoaded', init);
