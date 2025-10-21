
const $ = s => document.querySelector(s);

let rows = [];
let executors = [];
let uid = null;

window._readyFirebase = () => {
  uid = window._auth?.currentUser?.uid || null;
  initRealtime();
  initUI();
};

async function initRealtime(){
  const { collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;

  onSnapshot(collection(db,'executors'), snap => {
    executors = snap.docs.map(d => d.id);
    renderFilters(); renderTable();
  });

  const q = query(collection(db,'rows'), orderBy('order'));
  onSnapshot(q, snap => {
    rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderKPIs(); renderTable();
  });
}

function renderFilters(){
  const sel = $('#filterExecutor');
  sel.innerHTML = '<option value=\"\">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
}

function kpiCount(arr, status){ return arr.filter(r => r[4]===status).length; }
function renderKPIs(){
  $('#kAll').textContent = rows.length;
  $('#kDone').textContent = kpiCount(rows,'✅ Готово');
  $('#kInProgress').textContent = kpiCount(rows,'⚙️ В работе');
  $('#kTodo').textContent = kpiCount(rows,'⏳ Не начато');
  $('#kNew').textContent = rows.filter(r => !!r[3]).length;
  const pct = rows.length? Math.round(kpiCount(rows,'✅ Готово')/rows.length*100) : 0;
  $('#progressBar').value = pct; $('#progressPct').textContent = pct+'%';
}

async function saveRow(idx){
  const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const r = rows[idx];
  if(!r.id){ r.id = String(Date.now()); r.order = rows.length; }
  const payload = {
    id: r.id, order: r.order ?? idx,
    0: r[0]||"", 1: r[1]||"", 2: r[2]||"", 3: !!r[3],
    4: r[4]||"⏳ Не начато", 5: r[5]||"", 6: r[6]||"", 7: r[7]||"", 8: r[8]||"",
    modifiedAt: serverTimestamp(), modifiedBy: uid || ""
  };
  await setDoc(doc(window._db,'rows', r.id), payload, { merge:true });
}

async function saveAll(){
  for(let i=0;i<rows.length;i++){ await saveRow(i); }
  alert('Сохранено ✅');
}

function applyDeadlineHighlight(tdDate, status){
  tdDate.classList.remove('deadline-red','deadline-orange','deadline-green');
  const v = tdDate.querySelector('input')?.value;
  if(!v) return;
  const d = new Date(v);
  if(Number.isNaN(d.getTime())) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.floor((d - today)/86400000);
  if(status==='✅ Готово'){ tdDate.classList.add('deadline-green'); return; }
  if(daysLeft < 0){ tdDate.classList.add('deadline-red'); return; }
  if(daysLeft <= 3){ tdDate.classList.add('deadline-orange'); return; }
}

function renderTable(){
  const tbody = document.querySelector('#rdTable tbody');
  tbody.innerHTML = '';

  const fStatus = $('#filterStatus').value;
  const fExec = $('#filterExecutor').value;
  const onlyNew = $('#filterNew').checked;

  const filtered = rows.filter(r => (!fStatus || r[4]===fStatus) && (!fExec || r[5]===fExec) && (!onlyNew || r[3]));

  filtered.forEach(r => {
    const idx = rows.indexOf(r);
    const tr = document.createElement('tr');

    const td0 = document.createElement('td');
    const i0 = document.createElement('input'); i0.type='text'; i0.value=r[0]||'';
    i0.addEventListener('blur', async e => { rows[idx][0]=e.target.value; await saveRow(idx); });
    td0.appendChild(i0); tr.appendChild(td0);

    const td1 = document.createElement('td');
    const i1 = document.createElement('input'); i1.type='text'; i1.value=r[1]||'';
    i1.addEventListener('blur', async e => { rows[idx][1]=e.target.value; await saveRow(idx); });
    td1.appendChild(i1); tr.appendChild(td1);

    const td2 = document.createElement('td');
    const i2 = document.createElement('textarea'); i2.value=r[2]||''; i2.rows=2;
    i2.addEventListener('blur', async e => { rows[idx][2]=e.target.value; await saveRow(idx); });
    td2.appendChild(i2); tr.appendChild(td2);

    const td3 = document.createElement('td');
    const i3 = document.createElement('input'); i3.type='checkbox'; i3.checked=!!r[3];
    i3.addEventListener('change', async e => { rows[idx][3]=e.target.checked; await saveRow(idx); renderKPIs(); });
    td3.appendChild(i3); tr.appendChild(td3);

    const td4 = document.createElement('td');
    const s4 = document.createElement('select');
    ['⏳ Не начато','⚙️ В работе','✅ Готово'].forEach(s=>{ const o=document.createElement('option'); o.textContent=s; s4.appendChild(o); });
    s4.value = r[4] || '⏳ Не начато';
    s4.addEventListener('change', async e => { rows[idx][4]=e.target.value; await saveRow(idx); renderKPIs(); applyDeadlineHighlight(td6, rows[idx][4]); });
    td4.appendChild(s4); tr.appendChild(td4);

    const td5 = document.createElement('td');
    const s5 = document.createElement('select');
    const emptyOpt = document.createElement('option'); emptyOpt.textContent=''; s5.appendChild(emptyOpt);
    executors.forEach(n => { const o=document.createElement('option'); o.textContent=n; s5.appendChild(o); });
    s5.value = r[5] || '';
    s5.addEventListener('change', async e => { rows[idx][5]=e.target.value; await saveRow(idx); });
    td5.appendChild(s5); tr.appendChild(td5);

    const td6 = document.createElement('td');
    const i6 = document.createElement('input'); i6.type='date'; i6.value=r[6]||'';
    i6.addEventListener('change', async e => { rows[idx][6]=e.target.value; await saveRow(idx); applyDeadlineHighlight(td6, rows[idx][4]); });
    td6.appendChild(i6); tr.appendChild(td6);

    const td7 = document.createElement('td');
    const i7 = document.createElement('textarea'); i7.rows=2; i7.value=r[7]||'';
    i7.addEventListener('blur', async e => { rows[idx][7]=e.target.value; await saveRow(idx); });
    td7.appendChild(i7); tr.appendChild(td7);

    const td8 = document.createElement('td');
    const i8 = document.createElement('input'); i8.type='text'; i8.placeholder='\\\\\\server\\share\\file.dwg'; i8.value=r[8]||'';
    i8.addEventListener('blur', async e => { rows[idx][8]=e.target.value; await saveRow(idx); renderOpen(); });
    td8.appendChild(i8); tr.appendChild(td8);

    const td9 = document.createElement('td');
    const a9 = document.createElement('a'); a9.textContent='Открыть'; a9.className='badge';
    function renderOpen(){
      const link = rows[idx][8];
      if (link){ a9.href = link; a9.target = '_blank'; a9.style.pointerEvents='auto'; a9.style.opacity='1'; }
      else { a9.removeAttribute('href'); a9.style.pointerEvents='none'; a9.style.opacity='.5'; }
    }
    renderOpen();
    td9.appendChild(a9); tr.appendChild(td9);

    // color & deadlines
    tr.classList.remove('status-done','status-progress','status-todo');
    if (s4.value==='✅ Готово') tr.classList.add('status-done');
    else if (s4.value==='⚙️ В работе') tr.classList.add('status-progress');
    else tr.classList.add('status-todo');
    applyDeadlineHighlight(td6, s4.value);

    tbody.appendChild(tr);
  });
}

function initUI(){
  $('#btnAddRow').addEventListener('click', async ()=>{
    const r = { id:String(Date.now()), order: rows.length, 0:String(rows.length+1), 1:'', 2:'', 3:false, 4:'⏳ Не начато', 5:'', 6:'', 7:'', 8:'' };
    rows.push(r);
    await saveRow(rows.length-1);
    renderTable(); renderKPIs();
  });
  $('#btnSaveAll').addEventListener('click', saveAll);
  $('#btnExportCSV').addEventListener('click', exportCSV);
  $('#btnPrint').addEventListener('click', ()=>window.print());
  $('#filterStatus').addEventListener('change', renderTable);
  $('#filterExecutor').addEventListener('change', renderTable);
  $('#filterNew').addEventListener('change', renderTable);
}

function exportCSV(){
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push([r[0],r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\n/g,' '),r[8]]
      .map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='rd_tracker.csv'; a.click(); URL.revokeObjectURL(a.href);
}
