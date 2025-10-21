// Реальное время + автозагрузка стартовых данных, если коллекция пустая
let rows=[];
const DEFAULT_ROWS=[
  ["1","ОД (описывается второй ряд анкерных креплений, все остальное проверяется).","",false,"⏳ Не начато","","","",""],
  ["2","Схема выноса котлована (Подготовительный этап). (Координаты на топосъемке + спека на выемку и трубы)","без изменений",false,"⏳ Не начато","","","",""],
  ["3","Схема устройства форшахты. (Форшахта + координаты + спека на форшахту + сечение с армированием)","без изменений",false,"⏳ Не начато","","","",""],
  ["4","Схема выноса котлована (этап 2.1 ) (Котлован + координаты + топо)","Меняется откосная часть (контур и отметка дна 377.83)",false,"⏳ Не начато","","","",""],
  ["5","Схема котлована (этап 2.1)","Меняется откосная часть (контур и отметка дна 377.83)",false,"⏳ Не начато","","","",""],
  ["6","Схема расположения сечений 1-1..7.7 (этап 2.1)","Меняется дно этапа и откосная часть",false,"⏳ Не начато","","","",""],
  ["7","Схема расположения грунтовых анкеров этапа 2.1","Меняется дно этапа и откосная часть – контур",false,"⏳ Не начато","","","",""],
  ["8","Схема выноса котлована (этап 2.2)","Новый лист. Меняется откосная часть (контур и отметка дна 373.83)",true,"⏳ Не начато","","","",""],
  ["9","Схема котлована (этап 2.2)","Новый лист. Меняется откосная часть (контур и отметка дна 373.83)",true,"⏳ Не начато","","","",""],
  ["10","Схема расположения сечений 1-1..7.7 (этап 2.2)","Новый лист. Меняется дно этапа и откосная часть",true,"⏳ Не начато","","","",""],
  ["11","Схема расположения грунтовых анкеров этапа 2.2","Новый лист. Меняется дно этапа и откосная часть, количество и марка анкеров",true,"⏳ Не начато","","","",""],
  ["12","План котлована (этап 3)","Новый лист. Показать башенные краны (на других пунктиром)",true,"⏳ Не начато","","","",""],
  ["13","Грунтовый анкер Г-1","без изменений",false,"⏳ Не начато","","","",""],
  ["14","Грунтовый анкер Г-2","новый лист",true,"⏳ Не начато","","","",""],
  ["15","Посадка ограждения котлована на ИГИ разрезы","добавляется еще один ряд анкеров",false,"⏳ Не начато","","","",""],
  ["16","Узлы","добавить узлы по анкеру Г-2, новый узел для тупых углов, обновить ведомость деталей",false,"⏳ Не начато","","","",""],
  ["17","Схема армирования БСС","без изменений",false,"⏳ Не начато","","","",""],
  ["18","Схема армирования БНС","без изменений",false,"⏳ Не начато","","","",""],
  ["19","Закладная деталь Мн-1","без изменений",false,"⏳ Не начато","","","",""],
  ["20","Забирка","без изменений",false,"⏳ Не начато","","","",""],
  ["21","Спецификация","меняется в сторону увеличения объемов",false,"⏳ Не начато","","","",""]
];

window._readyFirebase=()=>{init();};

async function init(){
  const {collection, getDocs, setDoc, doc, onSnapshot, query, orderBy} = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const db=window._db;

  // если пусто — загружаем стартовые строки один раз
  const rowsCol = collection(db,'rows');
  const snap = await getDocs(rowsCol);
  if (snap.empty){
    for (let i=0;i<DEFAULT_ROWS.length;i++){
      const id = String(Date.now()+i);
      const r = DEFAULT_ROWS[i];
      await setDoc(doc(db,'rows',id), { id, order:i, 0:r[0],1:r[1],2:r[2],3:!!r[3],4:r[4],5:r[5],6:r[6],7:r[7],8:r[8] });
    }
  }

  // подписка в реальном времени
  const q = query(rowsCol, orderBy('order'));
  onSnapshot(q, s => {
    rows = s.docs.map(d=>({id:d.id, ...d.data()}));
    renderTable();
    renderKPIs();
  });
}

function renderKPIs(){
  const total = rows.length;
  const done = rows.filter(r => r[4]==='✅ Не начато' && false).length; // пока 0
  const inprog = rows.filter(r => r[4]==='⚙️ В работе').length;
  const todo = rows.filter(r => r[4]==='⏳ Не начато').length;
  const nnew = rows.filter(r => !!r[3]).length;
  document.getElementById('kAll').textContent=total;
  document.getElementById('kDone').textContent=done;
  document.getElementById('kInProgress').textContent=inprog;
  document.getElementById('kTodo').textContent=todo;
  document.getElementById('kNew').textContent=nnew;
  const pct = total? Math.round(done/total*100):0;
  document.getElementById('progressBar').value=pct;
  document.getElementById('progressPct').textContent=pct+'%';
}

function renderTable(){
  const tb=document.querySelector('#rdTable tbody');tb.innerHTML='';
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r[0]||''}</td><td>${r[1]||''}</td><td>${r[2]||''}</td>
      <td>${r[3]?'Да':'Нет'}</td><td>${r[4]||''}</td><td>${r[5]||''}</td>
      <td>${r[6]||''}</td><td>${r[7]||''}</td><td>${r[8]||''}</td>
      <td><a href="${r[8]||'#'}" target="_blank">Открыть</a></td>`;
    tb.appendChild(tr);
  });
}

// Экспорт CSV
document.getElementById('btnExportCSV').addEventListener('click',()=>{
  const headers = ["№","Наименование листа","Изменения / Примечания","Новый лист","Статус","Исполнитель","Дата сдачи","Комментарии","Ссылка на файл"];
  const lines=[headers.join(';')];
  rows.forEach(r=>{
    lines.push([r[0],r[1],r[2],r[3]?'Да':'',r[4],r[5],r[6],(r[7]||'').replace(/\n/g,' '),r[8]].map(v=>`"${(v??'').toString().replace(/"/g,'""')}"`).join(';'));
  });
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rd_tracker.csv';a.click();URL.revokeObjectURL(a.href);
});
document.getElementById('btnAddRow').addEventListener('click',()=>alert('Добавление строк из UI появится позже — сейчас важнее отобразить данные.'));
document.getElementById('btnPrint').addEventListener('click',()=>window.print());
