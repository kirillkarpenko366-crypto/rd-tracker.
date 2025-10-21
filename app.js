
const $ = s => document.querySelector(s);

let rows = [];
let executors = [];
let projects = [];
let currentProject = 'Манжерок';
let uid = null;

window._readyFirebase = () => {
  uid = window._auth?.currentUser?.uid || null;
  initProjects();
  bindUI();
};

// Projects
async function initProjects(){
  const { collection, onSnapshot, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;

  onSnapshot(collection(db,'projects'), snap => {
    projects = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (!projects.length){
      addDoc(collection(db,'projects'), { name:'Манжерок' });
      addDoc(collection(db,'projects'), { name:'Катунь' });
      addDoc(collection(db,'projects'), { name:'Рублёво' });
    }
    renderProjectSelect();
    subscribeData();
  });
}

function renderProjectSelect(){
  const sel = $('#projectSelect');
  const names = projects.map(p => p.name);
  if (!names.includes(currentProject)) currentProject = names[0] || 'Манжерок';
  sel.innerHTML = names.map(n => `<option${n===currentProject?' selected':''}>${n}</option>`).join('');
  sel.onchange = () => { currentProject = sel.value; subscribeData(); };
}

// Subscriptions
let unsubRows = null, unsubExec = null;
async function subscribeData(){
  const { collection, onSnapshot, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;
  if (unsubRows) unsubRows(); if (unsubExec) unsubExec();

  const qRows = query(collection(db,'rows'), where('proj','==', currentProject), orderBy('order'));
  unsubRows = onSnapshot(qRows, snap => {
    rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderKPIs(); renderTable();
  });

  const qExec = query(collection(db,'executors'), where('proj','==', currentProject), orderBy('name'));
  unsubExec = onSnapshot(qExec, snap => {
    executors = snap.docs.map(d => d.data().name);
    renderFilters(); renderTable();
  });
}

// UI Bindings
function bindUI(){
  $('#addProject').addEventListener('click', async ()=>{
    const name = prompt('Название проекта:');
    if (!name) return;
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    await addDoc(collection(window._db,'projects'), { name });
  });

  $('#btnAddExec').addEventListener('click', async ()=>{
    const name = prompt('ФИО исполнителя:');
    if (!name) return;
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    await addDoc(collection(window._db,'executors'), { proj: currentProject, name });
  });

  $('#btnAddRow').addEventListener('click', async ()=>{
    const r = { id:String(Date.now()), proj: currentProject, order: rows.length, 0:String(rows.length+1), 1:'', 2:'', 3:false, 4:'⏳ Не начато', 5:'', 6:'', 7:'', 8:'' };
    rows.push(r);
    await saveRow(rows.length-1, true);
    renderTable(); renderKPIs();
  });

  $('#btnSaveAll').addEventListener('click', saveAll);
  $('#btnExportCSV').addEventListener('click', exportCSV);
  $('#btnPrint').addEventListener('click', ()=>window.print());

  $('#btnHistory').addEventListener('click', openHistory);
  $('#historyClose').addEventListener('click', ()=>$('#historyModal').classList.remove('open'));

  $('#filterStatus').addEventListener('change', renderTable);
  $('#filterExecutor').addEventListener('change', renderTable);
  $('#filterNew').addEventListener('change', renderTable);
}

function renderFilters(){
  const sel = $('#filterExecutor');
  sel.innerHTML = '<option value=\"\">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
}

// KPIs
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

// Save/Delete
async function saveRow(idx, isNew=false, changedField=null){
  const { doc, setDoc, serverTimestamp, addDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const r = rows[idx];
  if(!r.id){ r.id = String(Date.now()); r.order = rows.length; }
  const payload = {
    id: r.id, proj: currentProject, order: r.order ?? idx,
    0: r[0]||"", 1: r[1]||"", 2: r[2]||"", 3: !!r[3],
    4: r[4]||"⏳ Не начато", 5: r[5]||"", 6: r[6]||"", 7: r[7]||"", 8: r[8]||"",
    modifiedAt: serverTimestamp(), modifiedBy: uid || ""
  };
  await setDoc(doc(window._db,'rows', r.id), payload, { merge:true });

  let message = null;
  if (isNew) message = `Создана новая строка №${payload[0]}: ${payload[1]||''}`;
  else if (changedField==='comment') message = `Комментарий обновлён: ${(payload[7]||'').slice(0,140)}`;
  else if (changedField) message = `Поле "${changedField}" обновлено`;
  if (message){
    await addDoc(collection(window._db,'history'), {
      proj: currentProject, rowId: r.id, message, by: uid||"", ts: serverTimestamp()
    });
  }
}

async function deleteRow(id){
  if (!confirm('Удалить строку?')) return;
  const { doc, deleteDoc, addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  await deleteDoc(doc(window._db,'rows', id));
  await addDoc(collection(window._db,'history'), { proj: currentProject, rowId: id, message:'Строка удалена', by: uid||'', ts: serverTimestamp() });
}

async function saveAll(){
  for(let i=0;i<rows.length;i++){ await saveRow(i); }
  alert('Сохранено ✅');
}

// Table
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
    i0.addEventListener('blur', async e => { rows[idx][0]=e.target.value; await saveRow(idx,false,'№'); });
    td0.appendChild(i0); tr.appendChild(td0);

    const td1 = document.createElement('td');
    const i1 = document.createElement('input'); i1.type='text'; i1.value=r[1]||'';
    i1.addEventListener('blur', async e => { rows[idx][1]=e.target.value; await saveRow(idx,false,'Наименование'); });
    td1.appendChild(i1); tr.appendChild(td1);

    const td2 = document.createElement('td');
    const i2 = document.createElement('textarea'); i2.value=r[2]||''; i2.rows=2;
    i2.addEventListener('blur', async e => { rows[idx][2]=e.target.value; await saveRow(idx,false,'Изменения'); });
    td2.appendChild(i2); tr.appendChild(td2);

    const td3 = document.createElement('td');
    const i3 = document.createElement('input'); i3.type='checkbox'; i3.checked=!!r[3];
    i3.addEventListener('change', async e => { rows[idx][3]=e.target.checked; await saveRow(idx,false,'Новый лист'); renderKPIs(); });
    td3.appendChild(i3); tr.appendChild(td3);

    const td4 = document.createElement('td');
    const s4 = document.createElement('select');
    ['⏳ Не начато','⚙️ В работе','✅ Готово'].forEach(s=>{ const o=document.createElement('option'); o.textContent=s; s4.appendChild(o); });
    s4.value = r[4] || '⏳ Не начато';
    s4.addEventListener('change', async e => { rows[idx][4]=e.target.value; await saveRow(idx,false,'Статус'); renderKPIs(); applyDeadlineHighlight(td6, rows[idx][4]); });
    td4.appendChild(s4); tr.appendChild(td4);

    const td5 = document.createElement('td');
    const s5 = document.createElement('select');
    const emptyOpt = document.createElement('option'); emptyOpt.textContent=''; s5.appendChild(emptyOpt);
    executors.forEach(n => { const o=document.createElement('option'); o.textContent=n; s5.appendChild(o); });
    s5.value = r[5] || '';
    s5.addEventListener('change', async e => { rows[idx][5]=e.target.value; await saveRow(idx,false,'Исполнитель'); });
    td5.appendChild(s5); tr.appendChild(td5);

    const td6 = document.createElement('td');
    const i6 = document.createElement('input'); i6.type='date'; i6.value=r[6]||'';
    i6.addEventListener('change', async e => { rows[idx][6]=e.target.value; await saveRow(idx,false,'Дата'); applyDeadlineHighlight(td6, rows[idx][4]); });
    td6.appendChild(i6); tr.appendChild(td6);

    const td7 = document.createElement('td');
    const i7 = document.createElement('textarea'); i7.rows=2; i7.value=r[7]||'';
    i7.addEventListener('blur', async e => { rows[idx][7]=e.target.value; await saveRow(idx,false,'comment'); });
    td7.appendChild(i7); tr.appendChild(td7);

    const td8 = document.createElement('td');
    const i8 = document.createElement('input'); i8.type='text'; i8.placeholder='\\\\\\server\\share\\file.dwg'; i8.value=r[8]||'';
    i8.addEventListener('blur', async e => { rows[idx][8]=e.target.value; await saveRow(idx,false,'Ссылка'); renderOpen(); });
    td8.appendChild(i8); tr.appendChild(td8);

    const td9 = document.createElement('td');
    const a9 = document.createElement('a'); a9.textContent='Открыть'; a9.className='badge';
    const delBtn = document.createElement('button'); delBtn.textContent='Удалить'; delBtn.className='ghost'; delBtn.style.marginLeft='8px';
    delBtn.addEventListener('click', ()=>deleteRow(r.id));
    function renderOpen(){
      const link = rows[idx][8];
      if (link){ a9.href = link; a9.target = '_blank'; a9.style.pointerEvents='auto'; a9.style.opacity='1'; }
      else { a9.removeAttribute('href'); a9.style.pointerEvents='none'; a9.style.opacity='.5'; }
    }
    renderOpen();
    td9.appendChild(a9); td9.appendChild(delBtn); tr.appendChild(td9);

    tr.classList.remove('status-done','status-progress','status-todo');
    if (s4.value==='✅ Готово') tr.classList.add('status-done');
    else if (s4.value==='⚙️ В работе') tr.classList.add('status-progress');
    else tr.classList.add('status-todo');
    applyDeadlineHighlight(td6, s4.value);

    tbody.appendChild(tr);
  });
}

// CSV
function exportCSV(){
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push([r[0],r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\\n/g,' '),r[8]]
      .map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob = new Blob([lines.join('\\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='rd_tracker.csv'; a.click(); URL.revokeObjectURL(a.href);
}

// History modal
async function openHistory(){
  $('#historyModal').classList.add('open');
  const list = $('#historyList');
  list.textContent = 'Загрузка…';
  const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const q = query(collection(window._db,'history'), where('proj','==', currentProject), orderBy('ts','desc'), limit(200));
  const snap = await getDocs(q);
  if (snap.empty){ list.textContent = 'Пока изменений нет.'; return; }
  list.innerHTML = '';
  snap.forEach(docu => {
    const h = docu.data();
    const div = document.createElement('div');
    div.className = 'history-item';
    const dt = h.ts?.toDate ? h.ts.toDate().toLocaleString() : '';
    div.textContent = `[${dt}] ${h.message} — ${h.by ? ('UID '+h.by.slice(0,6)) : ''}`;
    list.appendChild(div);
  });
}
