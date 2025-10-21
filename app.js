// Простая инициализация таблицы
let rows=[];
window._readyFirebase=()=>{console.log("Firebase готов");loadRows();};

async function loadRows(){
  const db=window._db;
  const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const snap=await getDocs(collection(db,'rows'));
  rows=snap.docs.map(d=>d.data());
  renderTable();
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
