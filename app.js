const SEED_FROM_EXCEL = [{"0": "1", "1": "ОД", "2": "Описывается 2-й ряд анкерных креплений, новую этапность, новая отметка дна котлована, остальное без изменений", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "2", "1": "Схема выноса котлована (подготовительный этап)", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "3", "1": "Схема устройства форшахты", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "4", "1": "Схема выноса котлована (этап 2.1)", "2": "Меняется откосная часть (контур, отметка дна 377.83)", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "5", "1": "Схема котлована (этап 2.1)", "2": "Меняется откосная часть (контур, отметка дна 377.83)", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "6", "1": "Схема расположения сечений 1-1..7-7 (этап 2.1)", "2": "Меняется дно и откосная часть на сечениях", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "7", "1": "Схема расположения грунтовых анкеров (этап 2.1)", "2": "Меняется дно и откосная часть (контур)", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "8", "1": "Схема выноса котлована (этап 2.2)", "2": "Меняется откосная часть (контур, отметка дна 373.83)", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "9", "1": "Схема котлована (этап 2.2)", "2": "Меняется откосная часть (контур, отметка дна 373.83)", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "10", "1": "Схема расположения сечений 1-1..7-7 (этап 2.2)", "2": "Меняется дно и откосная часть", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "11", "1": "Схема расположения грунтовых анкеров (этап 2.2)", "2": "Меняется дно, откос, количество и марка анкеров", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "12", "1": "План котлована (этап 3)", "2": "Новый лист, добавлены башенные краны", "3": true, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "13", "1": "Грунтовый анкер Г-1", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "14", "1": "Грунтовый анкер Г-2", "2": "Новый лист", "3": true, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "15", "1": "Посадка ограждения котлована на ИГИ", "2": "Добавляется ряд анкеров", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "16", "1": "Узлы", "2": "Добавлены узлы по анкеру Г-2, новый узел 1, обновлена ведомость деталей", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "17", "1": "Схема армирования БСС", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "18", "1": "Схема армирования БНС", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "19", "1": "Закладная деталь Мн-1", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "20", "1": "Забирка", "2": "Без изменений", "3": false, "4": "✅ Готово", "5": "", "6": "2025-10-24", "7": "", "8": ""}, {"0": "21", "1": "Спецификация", "2": "Меняется — увеличение объемов", "3": false, "4": "⏳ Не начато", "5": "", "6": "2025-10-24", "7": "", "8": ""}];

const $ = s => document.querySelector(s);

let rows = [];
let executors = [];
let projects = [];
let currentProject = 'Манжерок';
let uid = null;

window._readyFirebase = () => { uid = window._auth?.currentUser?.uid || null; initProjects(); bindUI(); };

// --- Projects & initial seed ---
async function initProjects(){
  const { collection, onSnapshot, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;
  onSnapshot(collection(db,'projects'), async snap => {
    projects = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if (!projects.length){ await addDoc(collection(db,'projects'), { name:'Манжерок' }); }
    renderProjectSelect();
    await ensureSeed(); // one-time seed for Манжерок
    subscribeData();
  });
}

async function ensureSeed(){
  const { collection, query, where, getDocs, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;
  const q = query(collection(db,'rows'), where('proj','==','Манжерок'));
  const snap = await getDocs(q);
  if (snap.empty){
    const seed = SEED_FROM_EXCEL;
    const doneIdx = SEED_DONE;
    const newIdx  = SEED_NEW;
    let i=0;
    for (const s of seed){
      const idx = Number(s['0']||i+1);
      await addDoc(collection(db,'rows'), {
        proj:'Манжерок',
        order:i,
        0:String(idx),
        1:s['1']||'',
        2:s['2']||'',
        3:s['3']===true,
        4: s['4']||'⏳ Не начато',
        5:s['5']||'',
        6:(s['6']||'').slice(0,10),
        7:s['7']||'',
        8:s['8']||''
      });
      i++;
    }
  }
}

function renderProjectSelect(){
  const sel = $('#projectSelect');
  const names = projects.map(p => p.name);
  if (!names.includes(currentProject)) currentProject = names[0] || 'Манжерок';
  sel.innerHTML = names.map(n => `<option ${n===currentProject?'selected':''}>${n}</option>`).join('');
  sel.onchange = () => { currentProject = sel.value; subscribeData(); };
}

// --- Data subscriptions ---
let unsubRows = null, unsubExec = null;
async function subscribeData(){
  const { collection, onSnapshot, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db = window._db;
  if (unsubRows) unsubRows(); if (unsubExec) unsubExec();

  const qRows = query(collection(db,'rows'), where('proj','==', currentProject), orderBy('order'));
  unsubRows = onSnapshot(qRows, snap => { rows = snap.docs.map(d => ({ id:d.id, ...d.data() })); renderKPIs(); renderTable(); if(currentProject==='Манжерок'){ mergeSeedIfNeeded(); } });

  const qExec = query(collection(db,'executors'), where('proj','==', currentProject), orderBy('name'));
  unsubExec = onSnapshot(qExec, snap => { executors = snap.docs.map(d => d.data().name); renderFilters(); renderTable(); });
}

// --- UI ---
function bindUI(){
  $('#addProject').addEventListener('click', async ()=>{
    const name = prompt('Название проекта:'); if(!name) return;
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    await addDoc(collection(window._db,'projects'), { name });
  });
  $('#btnAddExec').addEventListener('click', async ()=>{
    const name = prompt('ФИО исполнителя:'); if (!name) return;
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    await addDoc(collection(window._db,'executors'), { proj: currentProject, name });
  });
  $('#btnAddRow').addEventListener('click', async ()=>{
    const r = { id:String(Date.now()), proj: currentProject, order: rows.length, 0:String(rows.length+1), 1:'', 2:s['2']||'', 3:false, 4:'⏳ Не начато', 5:s['5']||'', 6:'', 7:s['7']||'', 8:s['8']||'' };
    rows.push(r); await saveRow(rows.length-1, true); renderTable(); renderKPIs();
  });
  $('#btnSaveAll').addEventListener('click', saveAll);
  $('#btnExportCSV').addEventListener('click', exportCSV);
  $('#btnPrint').addEventListener('click', ()=>window.print());
  $('#btnWide').addEventListener('click', ()=>{ document.body.classList.toggle('wide'); });
  $('#btnHistory').addEventListener('click', openHistory);
  $('#historyClose').addEventListener('click', ()=>$('#historyModal').classList.remove('open'));
  $('#filterStatus').addEventListener('change', renderTable);
  $('#filterExecutor').addEventListener('change', renderTable);
  $('#filterNew').addEventListener('change', renderTable);
}

function renderFilters(){
  const sel = $('#filterExecutor');
  sel.innerHTML = '<option value="">Все</option>' + executors.map(n => `<option>${n}</option>`).join('');
}

// --- KPIs ---
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

// --- Save/Delete + History ---
async function saveRow(idx, isNew=false, changedField=null){
  const { doc, setDoc, serverTimestamp, addDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const r = rows[idx];
  if(!r.id){ r.id = String(Date.now()); r.order = rows.length; }
  // автообновляем №
  r[0] = String((r.order ?? idx) + 1);
  const payload = { id: r.id, proj: currentProject, order: r.order ?? idx, 0: r[0]||"", 1: r[1]||"", 2: r[2]||"", 3: !!r[3], 4: r[4]||"⏳ Не начато", 5: r[5]||"", 6: r[6]||"", 7: r[7]||"", 8: r[8]||"", modifiedAt: serverTimestamp(), modifiedBy: uid || "" };
  await setDoc(doc(window._db,'rows', r.id), payload, { merge:true });
  let message = null;
  if (isNew) message = `Создана строка №${payload[0]}: ${payload[1]||''}`;
  else if (changedField==='comment') message = `Комментарий обновлён: ${(payload[7]||'').slice(0,140)}`;
  else if (changedField) message = `Поле "${changedField}" обновлено`;
  if (message){
    await addDoc(collection(window._db,'history'), { proj: currentProject, rowId: r.id, message, by: uid||"", ts: serverTimestamp() });
  }
}

async function deleteRow(id){
  if (!confirm('Удалить строку?')) return;
  const { doc, deleteDoc, addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  await deleteDoc(doc(window._db,'rows', id));
  await addDoc(collection(window._db,'history'), { proj: currentProject, rowId: id, message:'Строка удалена', by: uid||'', ts: serverTimestamp() });
}

async function saveAll(){ for(let i=0;i<rows.length;i++){ await saveRow(i); } alert('Сохранено ✅'); }

// --- Table ---
function applyDeadlineHighlight(tdDate, status){
  tdDate.classList.remove('deadline-red','deadline-orange','deadline-green');
  const v = tdDate.querySelector('input')?.value; if(!v) return;
  const d = new Date(v); if(Number.isNaN(d.getTime())) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.floor((d - today)/86400000);
  if(status==='✅ Готово'){ tdDate.classList.add('deadline-green'); return; }
  if(daysLeft < 0){ tdDate.classList.add('deadline-red'); return; }
  if(daysLeft <= 3){ tdDate.classList.add('deadline-orange'); return; }
}

function renderTable(){
  const tbody = document.querySelector('#rdTable tbody'); tbody.innerHTML = '';
  const fStatus = $('#filterStatus').value; const fExec = $('#filterExecutor').value; const onlyNew = $('#filterNew').checked;
  const filtered = rows.filter(r => (!fStatus || r[4]===fStatus) && (!fExec || r[5]===fExec) && (!onlyNew || r[3]));
  filtered.forEach(r => {
    const idx = rows.indexOf(r); const tr = document.createElement('tr');

    const td0 = document.createElement('td');
    td0.textContent = String((r.order ?? idx) + 1);
    tr.appendChild(td0);

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

    const td4 = document.createElement('td'); td4.className='status-cell';
    const s4 = document.createElement('select');
    ['⏳ Не начато','⚙️ В работе','✅ Готово'].forEach(s=>{ const o=document.createElement('option'); o.textContent=s; s4.appendChild(o); });
    s4.value = r[4] || '⏳ Не начато';
    s4.addEventListener('change', async e => { rows[idx][4]=e.target.value; await saveRow(idx,false,'Статус'); renderKPIs(); applyDeadlineHighlight(td6, rows[idx][4]); });
    const chip = document.createElement('span'); chip.className='status-chip';
function paintChip(val){ chip.className='status-chip ' + (val==='✅ Готово'?'status-done':val==='⚙️ В работе'?'status-work':'status-todo'); tr.dataset.status = val; }
paintChip(s4.value);
s4.addEventListener('change', ()=>{paintChip(s4.value); tr.dataset.status=s4.value;});
td4.appendChild(chip); td4.appendChild(s4); tr.appendChild(td4);

    const td5 = document.createElement('td');
    const s5 = document.createElement('select'); const emptyOpt = document.createElement('option'); emptyOpt.textContent=''; s5.appendChild(emptyOpt);
    executors.forEach(n => { const o=document.createElement('option'); o.textContent=n; s5.appendChild(o); });
    s5.value = r[5] || '';
    s5.addEventListener('change', async e => { rows[idx][5]=e.target.value; await saveRow(idx,false,'Исполнитель'); });
    td5.appendChild(s5); tr.appendChild(td5);

    const td6 = document.createElement('td');
    const i6 = document.createElement('input'); i6.type='date'; i6.value=r[6]||'';
    i6.addEventListener('change', async e => { rows[idx][6]=e.target.value; await saveRow(idx,false,'Дата'); applyDeadlineHighlight(td6, rows[idx][4]); });
    td6.appendChild(i6); tr.appendChild(td6);

    const td7 = document.createElement('td');
    const wrap7 = document.createElement('div'); wrap7.style.display='flex'; wrap7.style.gap='6px'; wrap7.style.alignItems='flex-start';
    const i7 = document.createElement('textarea'); i7.rows=2; i7.style.flex='1'; i7.value=r[7]||'';
    const upBtn = document.createElement('button'); upBtn.textContent='📎'; upBtn.title='Прикрепить изображение'; upBtn.className='btn-light';
    const file = document.createElement('input'); file.type='file'; file.accept='image/*'; file.style.display='none';
    upBtn.addEventListener('click', ()=>file.click());
    file.addEventListener('change', async ()=>{
      if(!file.files || !file.files[0]) return;
      const f = file.files[0];
      try {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js');
        const st = getStorage();
        const path = `attachments/${currentProject}/${rows[idx].id || 'temp'}/${Date.now()}_${f.name}`;
        const rref = ref(st, path);
        await uploadBytes(rref, f);
        const url = await getDownloadURL(rref);
        // Добавляем ссылку в конец комментария и сохраняем
        const toAdd = (i7.value ? "\n" : "") + url;
        i7.value = (i7.value || "") + toAdd;
        rows[idx][7] = i7.value;
        await saveRow(idx, false, 'comment');
        alert('Изображение загружено 📎');
        file.value = '';
      } catch (e) {
        console.error(e); alert('Ошибка загрузки файла');
      }
    });
    i7.addEventListener('blur', async e => { rows[idx][7]=e.target.value; await saveRow(idx,false,'comment'); });
    wrap7.appendChild(i7); wrap7.appendChild(upBtn); wrap7.appendChild(file);
    td7.appendChild(wrap7); tr.appendChild(td7);

    const td8 = document.createElement('td');
    const i8 = document.createElement('input'); i8.type='text'; i8.placeholder='\\\\server\\share\\file.dwg'; i8.value=r[8]||'';
    i8.addEventListener('blur', async e => { rows[idx][8]=e.target.value; await saveRow(idx,false,'Ссылка'); renderOpen(); });
    td8.appendChild(i8); tr.appendChild(td8);

    const td9 = document.createElement('td');
    const a9 = document.createElement('a'); a9.textContent='Открыть'; a9.className='badge';
    const delBtn = document.createElement('button'); delBtn.textContent='Удалить'; delBtn.className='btn-danger'; delBtn.style.marginLeft='8px';
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

    tr.dataset.status = s4.value; tbody.appendChild(tr);
  });
}

// --- CSV ---
function exportCSV(){
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines = [headers.join(';')];
  rows.forEach(r => {
    lines.push([r[0]||'',r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\n/g,' '),r[8]]
      .map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='rd_tracker.csv'; a.click(); URL.revokeObjectURL(a.href);
}

// --- History modal ---
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
    div.textContent = `[${dt}] ${h.message} — ${h.by || ''}`;
    list.appendChild(div);
  });
}

// constants injected
const SEED_TITLES = ["\u041e\u0414 (\u043e\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0432\u0442\u043e\u0440\u043e\u0439 \u0440\u044f\u0434 \u0430\u043d\u043a\u0435\u0440\u043d\u044b\u0445 \u043a\u0440\u0435\u043f\u043b\u0435\u043d\u0438\u0439, \u0432\u0441\u0435 \u043e\u0441\u0442\u0430\u043b\u044c\u043d\u043e\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u0442\u0441\u044f).", "\u0421\u0445\u0435\u043c\u0430 \u0432\u044b\u043d\u043e\u0441\u0430 \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u044d\u0442\u0430\u043f). (\u041a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b \u043d\u0430 \u0442\u043e\u043f\u043e\u0441\u044a\u0435\u043c\u043a\u0435 + \u0441\u043f\u0435\u043a\u0430 \u043d\u0430 \u0432\u044b\u0435\u043c\u043a\u0443 \u0438 \u0442\u0440\u0443\u0431\u044b) \u2013 \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439", "\u0421\u0445\u0435\u043c\u0430 \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430 \u0444\u043e\u0440\u0448\u0430\u0445\u0442\u044b. (\u0424\u043e\u0440\u0448\u0430\u0445\u0442\u0430 + \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b + \u0441\u043f\u0435\u043a\u0430 \u043d\u0430 \u0444\u043e\u0440\u0448\u0430\u0445\u0442\u0443 + \u0441\u0435\u0447\u0435\u043d\u0438\u0435 \u0441 \u0430\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435\u043c) \u2013 \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439", "\u0421\u0445\u0435\u043c\u0430 \u0432\u044b\u043d\u043e\u0441\u0430 \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u044d\u0442\u0430\u043f 2.1 ). (\u041a\u043e\u0442\u043b\u043e\u0432\u0430\u043d + \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b + \u0442\u043e\u043f\u043e) \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c (\u043e\u0442\u043a\u043e\u0441\u043d\u044b\u0439 \u043a\u043e\u043d\u0442\u0443\u0440 \u0438 \u043e\u0442\u043c\u0435\u0442\u043a\u0430 \u0434\u043d\u0430 \u044d\u0442\u0430\u043f\u0430 377.83)", "\u0421\u0445\u0435\u043c\u0430 \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u044d\u0442\u0430\u043f 2.1) \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c (\u043e\u0442\u043a\u043e\u0441\u043d\u044b\u0439 \u043a\u043e\u043d\u0442\u0443\u0440 \u0438 \u043e\u0442\u043c\u0435\u0442\u043a\u0430 \u0434\u043d\u0430 \u044d\u0442\u0430\u043f\u0430 377.83)", "\u0421\u0445\u0435\u043c\u0430 \u0440\u0430\u0441\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0441\u0435\u0447\u0435\u043d\u0438\u0439 1-1..7.7. (\u044d\u0442\u0430\u043f 2.1) \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0434\u043d\u043e \u044d\u0442\u0430\u043f\u0430 \u0438 \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c \u043d\u0430 \u0441\u0435\u0447\u0435\u043d\u0438\u044f\u0445", "\u0421\u0445\u0435\u043c\u0430 \u0440\u0430\u0441\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0433\u0440\u0443\u043d\u0442\u043e\u0432\u044b\u0445 \u0430\u043d\u043a\u0435\u0440\u043e\u0432 \u044d\u0442\u0430\u043f\u0430 2.1 (\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0434\u043d\u043e \u044d\u0442\u0430\u043f\u0430 \u0438 \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c - \u043a\u043e\u043d\u0442\u0443\u0440)", "\u0421\u0445\u0435\u043c\u0430 \u0432\u044b\u043d\u043e\u0441\u0430 \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u044d\u0442\u0430\u043f 2.2 ). \u2013 \u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442 \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c (\u043e\u0442\u043a\u043e\u0441\u043d\u044b\u0439 \u043a\u043e\u043d\u0442\u0443\u0440 \u0438 \u043e\u0442\u043c\u0435\u0442\u043a\u0430 \u0434\u043d\u0430 \u044d\u0442\u0430\u043f\u0430 373.83)", "\u0421\u0445\u0435\u043c\u0430 \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u044d\u0442\u0430\u043f 2.2) \u2013 \u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442 \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c (\u043e\u0442\u043a\u043e\u0441\u043d\u044b\u0439 \u043a\u043e\u043d\u0442\u0443\u0440 \u0438 \u043e\u0442\u043c\u0435\u0442\u043a\u0430 \u0434\u043d\u0430 \u044d\u0442\u0430\u043f\u0430 373.83)", "\u0421\u0445\u0435\u043c\u0430 \u0440\u0430\u0441\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0441\u0435\u0447\u0435\u043d\u0438\u0439 1-1..7.7. (\u044d\u0442\u0430\u043f 2.2) - \u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442 \u041c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0434\u043d\u043e \u044d\u0442\u0430\u043f\u0430 \u0438 \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c \u043d\u0430 \u0441\u0435\u0447\u0435\u043d\u0438\u044f\u0445", "\u0421\u0445\u0435\u043c\u0430 \u0440\u0430\u0441\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0433\u0440\u0443\u043d\u0442\u043e\u0432\u044b\u0445 \u0430\u043d\u043a\u0435\u0440\u043e\u0432 \u044d\u0442\u0430\u043f\u0430 2.2 \u2013 \u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442 (\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0434\u043d\u043e \u044d\u0442\u0430\u043f\u0430 \u0438 \u043e\u0442\u043a\u043e\u0441\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u044c \u2013 \u043a\u043e\u043d\u0442\u0443\u0440, \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0438 \u043c\u0430\u0440\u043a\u0430 \u0430\u043d\u043a\u0435\u0440\u043e\u0432)", "\u041f\u043b\u0430\u043d \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 (\u044d\u0442\u0430\u043f 3) \u2013 \u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442 (\u043d\u0430 \u043d\u0435\u043c \u0436\u0435 \u043e\u0442\u0440\u0430\u0436\u0430\u0435\u043c \u0431\u0430\u0448\u0435\u043d\u043d\u044b\u0435 \u043a\u0440\u0430\u043d\u044b) \u2013 \u043d\u0430 \u0434\u0440\u0443\u0433\u0438\u0445 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c \u0438\u0445 \u043f\u0443\u043d\u043a\u0442\u0438\u0440\u043e\u043c (\u0431\u044b\u043b\u043e \u0437\u0430\u043c\u0435\u0447\u0430\u043d\u0438\u0435 \u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430 \u043f\u043e \u043f\u0440\u043e\u0448\u043b\u044b\u043c \u0432\u044b\u043f\u0443\u0441\u043a\u0430\u043c)", "\u0413\u0440\u0443\u043d\u0442\u043e\u0432\u044b\u0439 \u0430\u043d\u043a\u0435\u0440 \u0413-1 (\u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439)", "\u0413\u0440\u0443\u043d\u0442\u043e\u0432\u044b\u0439 \u0430\u043d\u043a\u0435\u0440 \u0413-2 (\u043d\u043e\u0432\u044b\u0439 \u043b\u0438\u0441\u0442)", "\u041f\u043e\u0441\u0430\u0434\u043a\u0430 \u043e\u0433\u0440\u0430\u0436\u0434\u0435\u043d\u0438\u044f \u043a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u0430 \u043d\u0430 \u0418\u0413\u0418 \u0440\u0430\u0437\u0440\u0435\u0437\u044b (\u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0435\u0449\u0435 \u043e\u0434\u0438\u043d \u0440\u044f\u0434 \u0430\u043d\u043a\u0435\u0440\u043e\u0432)", "\u0423\u0437\u043b\u044b. (\u0434\u043e\u0431\u0430\u0432\u043b\u044f\u044e\u0442\u0441\u044f \u0443\u0437\u043b\u044b \u043f\u043e \u0430\u043d\u043a\u0435\u0440\u0443 \u0413-2, \u0432\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043d\u043e\u0432\u044b\u0439 \u0443\u0437\u0435\u043b \u0434\u043b\u044f \u0442\u0443\u043f\u044b\u0445 \u0443\u0433\u043b\u043e\u0432 \u0441\u043e\u043f\u0440\u044f\u0436\u0435\u043d\u0438\u044f \u043e\u0431\u0432\u044f\u0437\u043e\u0447\u043d\u043e\u0433\u043e \u043f\u043e\u044f\u0441\u0430 (\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0443\u0437\u0435\u043b 1), \u043e\u0431\u043d\u043e\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0432\u0435\u0434\u043e\u043c\u043e\u0441\u0442\u044c \u0434\u0435\u0442\u0430\u043b\u0435\u0439.", "\u0421\u0445\u0435\u043c\u0430 \u0430\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u0411\u0421\u0421 (\u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439)", "\u0421\u0445\u0435\u043c\u0430 \u0430\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u0411\u041d\u0421 (\u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439)", "\u0417\u0430\u043a\u043b\u0430\u0434\u043d\u0430\u044f \u0434\u0435\u0442\u0430\u043b\u044c \u041c\u043d-1 (\u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439).", "\u0417\u0430\u0431\u0438\u0440\u043a\u0430 (\u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439)", "\u0421\u043f\u0435\u0446\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f (\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u0432 \u0441\u0442\u043e\u0440\u043e\u043d\u0443 \u0443\u0432\u0435\u043b\u0438\u0447\u0435\u043d\u0438\u044f \u043e\u0431\u044a\u0435\u043c\u043e\u0432)"];
const SEED_DONE = [12, 16, 17, 18, 19, 20];
const SEED_NEW  = [8, 9, 10, 11, 12, 14];


async function fullSyncFromExcel(){
  const excel = SEED_FROM_EXCEL || [];
  if (!excel.length) return;
  const mapByTitle = new Map(rows.map(r => [(r[1]||'').trim(), r]));
  const { doc, setDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  let changed = false;
  // upsert/update
  for (let i=0;i<excel.length;i++){
    const s = excel[i]; const title = (s['1']||'').trim(); if(!title) continue;
    const exists = mapByTitle.get(title);
    const order = s['0'] ? Number(s['0'])-1 : i;
    const payload = { proj: currentProject, order, 0:String(order+1), 1:s['1']||'', 2:s['2']||'', 3:!!s['3'], 4:s['4']||'⏳ Не начато', 5:s['5']||'', 6:(s['6']||'').slice(0,10), 7:s['7']||'', 8:s['8']||'' };
    if (exists){
      await setDoc(doc(window._db,'rows', exists.id), payload, { merge:true });
    } else {
      await addDoc(collection(window._db,'rows'), payload);
    }
    changed = true;
  }
  if (changed){ /* Firestore snapshot обновит UI */ }
}
