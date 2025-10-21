
const $ = sel => document.querySelector(sel);

let rows = [];
let executors = [];

window._readyFirebase = () => { initRealtime(); };

async function initRealtime(){
  const { collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;

  const execCol = collection(db, 'executors');
  onSnapshot(execCol, snap => {
    executors = snap.docs.map(d => d.id);
    if (!executors.length) executors = ['Иванов А.А.','Петров П.П.','Сидоров С.С.'];
    renderFilters(); renderTable();
  });

  const rowsCol = collection(db, 'rows');
  const q = query(rowsCol, orderBy('order'));
  onSnapshot(q, snap => {
    rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFilters(); renderTable();
  });
}

async function saveRow(idx){
  const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const r = rows[idx];
  if(!r.id){ r.id = String(Date.now()); r.order = rows.length; }
  const payload = {
    id: r.id,
    order: r.order ?? idx,
    0: r[0] || "",
    1: r[1] || "",
    2: r[2] || "",
    3: !!r[3],
    4: r[4] || "⏳ Не начато",
    5: r[5] || "",
    6: r[6] || "",
    7: r[7] || "",
    8: r[8] || ""
  };
  await setDoc(doc(window._db, 'rows', r.id), payload, { merge: true });
}

function renderFilters(){
  const sel = document.getElementById('filterExecutor');
  sel.innerHTML = '<option value=\"\">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
}

function renderKPIs(){
  const total = rows.length;
  const done = rows.filter(r => r[4] === '✅ Готово').length;
  const inprog = rows.filter(r => r[4] === '⚙️ В работе').length;
  const todo = rows.filter(r => r[4] === '⏳ Не начато').length;
  const nnew = rows.filter(r => !!r[3]).length;
  document.getElementById('kAll').textContent = total;
  document.getElementById('kDone').textContent = done;
  document.getElementById('kInProgress').textContent = inprog;
  document.getElementById('kTodo').textContent = todo;
  document.getElementById('kNew').textContent = nnew;
  const pct = total ? Math.round(done/total*100) : 0;
  document.getElementById('progressBar').value = pct;
  document.getElementById('progressPct').textContent = pct + '%';
  updatePie(done, inprog, todo);
}

function updatePie(done, inprog, todo){
  const total = done + inprog + todo;
  const cDone = document.getElementById('pieDone');
  const cProg = document.getElementById('pieInProgress');
  const cTodo = document.getElementById('pieTodo');
  const center = document.getElementById('pieCenter');
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

function renderTable(){
  const tbody = document.querySelector('#rdTable tbody');
  tbody.innerHTML = '';

  const fStatus = document.getElementById('filterStatus').value;
  const fExec = document.getElementById('filterExecutor').value;
  const onlyNew = document.getElementById('filterNew').checked;

  const filtered = rows.filter(r => {
    if(fStatus && r[4] !== fStatus) return false;
    if(fExec && r[5] !== fExec) return false;
    if(onlyNew && !r[3]) return false;
    return true;
  });

  filtered.forEach((r) => {
    const idx = rows.indexOf(r);
    const tr = document.createElement('tr');

    const td0 = document.createElement('td');
    td0.contentEditable = 'true';
    td0.textContent = r[0] ?? '';
    td0.addEventListener('blur', async e => { rows[idx][0] = e.target.textContent.trim(); await saveRow(idx); });
    tr.appendChild(td0);

    const td1 = document.createElement('td');
    td1.contentEditable = 'true';
    td1.textContent = r[1] ?? '';
    td1.addEventListener('blur', async e => { rows[idx][1] = e.target.textContent.trim(); await saveRow(idx); });
    tr.appendChild(td1);

    const td2 = document.createElement('td');
    td2.contentEditable = 'true';
    td2.textContent = r[2] ?? '';
    td2.addEventListener('blur', async e => { rows[idx][2] = e.target.textContent.trim(); await saveRow(idx); });
    tr.appendChild(td2);

    const td3 = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = !!r[3];
    cb.addEventListener('change', async e => { rows[idx][3] = e.target.checked; await saveRow(idx); renderKPIs(); });
    td3.appendChild(cb);
    tr.appendChild(td3);

    const td4 = document.createElement('td');
    const sel = document.createElement('select');
    ['⏳ Не начато','⚙️ В работе','✅ Готово'].forEach(s => {
      const opt = document.createElement('option'); opt.textContent = s; sel.appendChild(opt);
    });
    sel.value = r[4] || '⏳ Не начато';
    sel.addEventListener('change', async e => { rows[idx][4] = e.target.value; await saveRow(idx); renderKPIs(); applyDeadlineHighlight(td6, rows[idx][4]); });
    td4.appendChild(sel);
    tr.appendChild(td4);

    const td5 = document.createElement('td');
    const sel2 = document.createElement('select');
    executors.forEach(n => { const opt = document.createElement('option'); opt.textContent = n; sel2.appendChild(opt); });
    const emptyOpt = document.createElement('option'); emptyOpt.textContent = ''; sel2.insertBefore(emptyOpt, sel2.firstChild);
    sel2.value = r[5] || '';
    sel2.addEventListener('change', async e => { rows[idx][5] = e.target.value; await saveRow(idx); });
    td5.appendChild(sel2);
    tr.appendChild(td5);

    const td6 = document.createElement('td');
    const inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.value = r[6] || '';
    inputDate.addEventListener('change', async e => { rows[idx][6] = e.target.value; await saveRow(idx); applyDeadlineHighlight(td6, rows[idx][4]); });
    td6.appendChild(inputDate);
    tr.appendChild(td6);

    const td7 = document.createElement('td');
    const ta = document.createElement('textarea');
    ta.value = r[7] || '';
    ta.rows = 2;
    ta.addEventListener('blur', async e => { rows[idx][7] = e.target.value; await saveRow(idx); });
    td7.appendChild(ta);
    tr.appendChild(td7);

    const td8 = document.createElement('td');
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.placeholder = '\\\\server\\path\\to\\file.dwg';
    inputLink.value = r[8] || '';
    inputLink.addEventListener('blur', async e => { rows[idx][8] = e.target.value; await saveRow(idx); renderOpenBtn(); });
    td8.appendChild(inputLink);
    tr.appendChild(td8);

    const td9 = document.createElement('td');
    const btnOpen = document.createElement('a');
    btnOpen.textContent = 'Открыть'; btnOpen.className = 'badge';
    function renderOpenBtn(){
      const link = rows[idx][8];
      if(link){ btnOpen.href = link; btnOpen.target = '_blank'; btnOpen.style.pointerEvents = 'auto'; btnOpen.style.opacity = '1'; }
      else { btnOpen.removeAttribute('href'); btnOpen.style.pointerEvents = 'none'; btnOpen.style.opacity = '.5'; }
    }
    renderOpenBtn();
    td9.appendChild(btnOpen);
    tr.appendChild(td9);

    tbody.appendChild(tr);
  });

  renderKPIs();
}

async function addRow(){
  const r = { id: String(Date.now()), order: rows.length, 0:"",1:"",2:"",3:false,4:"⏳ Не начато",5:"",6:"",7:"",8:"" };
  rows.push(r);
  await saveRow(rows.length-1);
  renderTable();
}

function exportCSV(){
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push([r[0],r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\\n/g,' '),r[8]].map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob = new Blob([lines.join('\\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rd_tracker.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function initUI(){
  document.getElementById('btnAddRow').addEventListener('click', addRow);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
  document.getElementById('filterStatus').addEventListener('change', renderTable);
  document.getElementById('filterExecutor').addEventListener('change', renderTable);
  document.getElementById('filterNew').addEventListener('change', renderTable);
}
document.addEventListener('DOMContentLoaded', initUI);
