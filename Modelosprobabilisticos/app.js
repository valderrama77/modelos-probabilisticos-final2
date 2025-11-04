let currentMatrix = null;
let stateNames = [];
let currentSize = 3;

let ultimoVectorEstacionario = null;
let ultimaMatrizPotenciada = null;
let ultimoNumPasos = null;
let ultimoEstadoInicial = null;

let stationaryChartRef = null;
let stepsChartRef = null;

function toggleTheme(){
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  const switchEl = document.getElementById('themeSwitch');
  if (switchEl) switchEl.classList.toggle('active', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
(function(){
  const stored = localStorage.getItem('theme');
  if(stored === 'dark'){
    document.documentElement.classList.add('dark');
    const switchEl = document.getElementById('themeSwitch');
    if (switchEl) switchEl.classList.add('active');
  }
})();

document.addEventListener('DOMContentLoaded', function(){ setupSizeSelector(); });

function setupSizeSelector(){
  const options = document.querySelectorAll('.size-option');
  options.forEach(option => {
    option.addEventListener('click', function(){
      options.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      const size = parseInt(this.dataset.size);
      currentSize = size;
      const select = document.getElementById('numStates');
      if (select) select.value = size;
      updateStateNames();
      updateMatrixInput();
      goToStep(2);
    });
  });
  const select = document.getElementById('numStates');
  if (select) select.value = '3';
  updateStateNames();
  updateMatrixInput();
}

function updateStateNames(){
  const container = document.getElementById('stateNamesContainer');
  const numStates = currentSize;
  if (!container) return;
  container.innerHTML = '';
  stateNames = [];
  for(let i=0;i<numStates;i++){
    const wrapper = document.createElement('div');
    wrapper.className = 'state-name-input';

    const label = document.createElement('label');
    label.textContent = `Nombre para Estado ${i+1} (opcional)`;

    const field = document.createElement('div');
    field.className = 'text-field';

    const prefix = document.createElement('span');
    prefix.className = 'prefix';
    prefix.textContent = `${i+1}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `stateName${i}`;
    input.placeholder = `Ej: Estado ${i+1}`;
    input.addEventListener('input', function(){ stateNames[i] = this.value || `Estado ${i+1}`; actualizarEstadoBotonPaso2(); });

    field.appendChild(prefix);
    field.appendChild(input);

    wrapper.appendChild(label);
    wrapper.appendChild(field);
    container.appendChild(wrapper);

    stateNames.push(`Estado ${i+1}`);
  }
  actualizarEstadoBotonPaso2();
}

function updateStateSelector(){
  const selector = document.getElementById('initialState');
  const numStates = currentSize;
  if (!selector) return;
  selector.innerHTML = '<option value="">No calcular por pasos</option>';
  for(let i=0;i<numStates;i++){
    const option = document.createElement('option'); option.value = i; option.textContent = stateNames[i] || `Estado ${i+1}`; selector.appendChild(option);
  }
}

function updateMatrixInput(){
  const numStates = currentSize; const container = document.getElementById('matrixInput');
  if (!container) return;
  container.innerHTML = ''; container.style.setProperty('--cols', numStates);
  const headerRow = document.createElement('div'); headerRow.className = 'matrix-row';
  headerRow.appendChild(document.createElement('div'));
  for(let j=0;j<numStates;j++){ const header = document.createElement('div'); header.className='matrix-label'; header.textContent = `→ ${stateNames[j] || `Estado ${j+1}`}`; headerRow.appendChild(header); }
  const sumHeader = document.createElement('div'); sumHeader.className='matrix-label'; sumHeader.textContent='Suma'; headerRow.appendChild(sumHeader); container.appendChild(headerRow);
  for(let i=0;i<numStates;i++){
    const row = document.createElement('div'); row.className='matrix-row';
    const label = document.createElement('div'); label.className='matrix-label'; label.textContent = `${stateNames[i] || `Estado ${i+1}`} →`; row.appendChild(label);
    for(let j=0;j<numStates;j++){
      const input = document.createElement('input'); input.type='number'; input.step='0.01'; input.min='0'; input.max='1'; input.placeholder='0.00'; input.id=`m${i}_${j}`;
      input.addEventListener('input', function(){ validateRow(i); actualizarEstadoBotonPaso3(); });
      row.appendChild(input);
    }
    const sumDiv = document.createElement('div'); sumDiv.className='row-sum'; sumDiv.id=`sum${i}`; sumDiv.textContent='0.00'; row.appendChild(sumDiv);
    container.appendChild(row);
  }
  updateStateSelector();
  actualizarEstadoBotonPaso3();
}

function actualizarEstadoBotonPaso2(){
  const btn = document.getElementById('btnNextStep2');
  if(!btn) return;
  const allFilled = Array.from({length: currentSize}, (_,i)=> (document.getElementById(`stateName${i}`)||{}).value || '').every(v => v.trim().length>0);
  btn.disabled = !allFilled;
}

function actualizarEstadoBotonPaso3(){
  const btn = document.getElementById('btnNextStep3');
  if(!btn) return;
  btn.disabled = !checkAllRowsValid();
}

function validateRow(rowIndex){
  const numStates = currentSize; let sum = 0; let allValid = true;
  for(let j=0;j<numStates;j++){
    const input = document.getElementById(`m${rowIndex}_${j}`); const value = parseFloat(input.value) || 0;
    if(value < 0 || value > 1){ input.classList.add('invalid'); allValid = false; } else { input.classList.remove('invalid'); }
    sum += value;
  }
  const sumDiv = document.getElementById(`sum${rowIndex}`); sumDiv.textContent = sum.toFixed(2);
  if(Math.abs(sum - 1.0) < 0.01 && allValid){ sumDiv.classList.add('valid'); sumDiv.classList.remove('invalid'); sumDiv.textContent = '✓ ' + sum.toFixed(2); return true; }
  sumDiv.classList.remove('valid'); sumDiv.classList.add('invalid'); return false;
}

function checkAllRowsValid(){ for(let i=0;i<currentSize;i++){ if(!validateRow(i)) return false; } return true; }

function goToStep(step){
  if(step===3){
    const gate = document.getElementById('btnNextStep2');
    const sec2 = document.getElementById('section2');
    if(sec2 && sec2.style.display!=='none' && gate && gate.disabled) return;
  }
  if(step===4){
    const gate = document.getElementById('btnNextStep3');
    const sec3 = document.getElementById('section3');
    if(sec3 && sec3.style.display!=='none' && gate && gate.disabled) return;
  }
  for(let i=1;i<=4;i++){
    const stepEl=document.getElementById(`step${i}`); const sectionEl=document.getElementById(`section${i}`);
    if(stepEl && sectionEl){
      if(i<step){ stepEl.classList.remove('active'); stepEl.classList.add('completed'); sectionEl.style.display='none'; }
      else if(i===step){ stepEl.classList.add('active'); stepEl.classList.remove('completed'); sectionEl.style.display='block'; }
      else { stepEl.classList.remove('active','completed'); sectionEl.style.display='none'; }
    }
  }
}

function getMatrix(){ const matrix=[]; for(let i=0;i<currentSize;i++){ const row=[]; for(let j=0;j<currentSize;j++){ const value=parseFloat(document.getElementById(`m${i}_${j}`).value); if(isNaN(value)||value<0||value>1){ return null; } row.push(value);} const sum=row.reduce((a,b)=>a+b,0); if(Math.abs(sum-1.0)>0.01){ return null; } matrix.push(row);} return matrix; }

function showError(message){ const errorDiv=document.getElementById('error'); if(!errorDiv) return; errorDiv.textContent=message; errorDiv.classList.add('show'); setTimeout(()=>errorDiv.classList.remove('show'),6000); }

function calculateStationaryVector(matrix){ const n=matrix.length; let vector=new Array(n).fill(1/n); for(let iter=0;iter<100;iter++){ const newVector=new Array(n).fill(0); for(let i=0;i<n;i++){ for(let j=0;j<n;j++){ newVector[i]+=vector[j]*matrix[j][i]; } } const sum=newVector.reduce((a,b)=>a+b,0); for(let i=0;i<n;i++){ newVector[i]/=sum; } let converged=true; for(let i=0;i<n;i++){ if(Math.abs(newVector[i]-vector[i])>1e-6){ converged=false; break; } } vector=newVector; if(converged) break; } return vector; }

function matrixPower(matrix, power){ if(power===1) return matrix; const n=matrix.length; let result=matrix; for(let p=1;p<power;p++){ const newResult=[]; for(let i=0;i<n;i++){ const row=[]; for(let j=0;j<n;j++){ let sum=0; for(let k=0;k<n;k++){ sum+=result[i][k]*matrix[k][j]; } row.push(sum);} newResult.push(row);} result=newResult;} return result; }

function colorPalette(n){
  const base = ['#4f46e5','#22c55e','#f59e0b','#ef4444','#14b8a6','#a78bfa'];
  return Array.from({length:n},(_,i)=> base[i%base.length]);
}

function pct(x){ return (x*100).toFixed(1)+'%'; }

function renderStationaryChart(labels, data){
  const ctx = document.getElementById('stationaryChart');
  if(!ctx) return;
  if(stationaryChartRef) { stationaryChartRef.destroy(); }
  const centerText = {
    id: 'centerText',
    afterDraw(chart, args, opts){
      const {ctx, chartArea:{width,height}} = chart;
      ctx.save();
      ctx.font = '700 16px Segoe UI';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('π', chart.getDatasetMeta(0).data[0].x, chart.getDatasetMeta(0).data[0].y);
      ctx.restore();
    }
  };
  stationaryChartRef = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colorPalette(labels.length), borderWidth: 1, borderColor: '#fff' }] },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true } },
        title: { display: true, text: 'Distribución a largo plazo (π)' },
        tooltip: { callbacks: { label: (ctx)=> `${ctx.label}: ${ctx.parsed.toFixed(4)} (${pct(ctx.parsed)})` } },
        datalabels: { color: '#0f172a', formatter: (v)=> pct(v), font: { weight: '700' } }
      },
      animation: { animateScale: true, animateRotate: true }
    },
    plugins: [ChartDataLabels, centerText]
  });
}

function renderStepsChart(labels, data, n){
  const ctx = document.getElementById('stepsChart');
  if(!ctx) return;
  if(stepsChartRef) { stepsChartRef.destroy(); }
  stepsChartRef = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: `Después de ${n} paso(s)`, data, backgroundColor: colorPalette(labels.length), borderRadius: 8 }] },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: `Distribución tras ${n} paso(s)` },
        tooltip: { callbacks: { label: (ctx)=> `${ctx.label}: ${ctx.parsed.y.toFixed(4)} (${pct(ctx.parsed.y)})` } },
        datalabels: { anchor: 'end', align: 'end', color: '#0f172a', formatter: (v)=> pct(v), font: { weight: '700' } }
      },
      scales:{ y:{ beginAtZero:true, max:1, ticks:{ callback:(v)=> (v*100)+'%' } } }
    },
    plugins: [ChartDataLabels]
  });
}

function calculate(){
  const matrix=getMatrix(); if(!matrix){ showError('Error: valida que cada fila sume 1.0 y los valores estén entre 0 y 1.'); return; }
  currentMatrix=matrix;

  const stationary=calculateStationaryVector(matrix);
  ultimoVectorEstacionario = stationary;

  const stationaryDiv=document.getElementById('stationaryVector'); if (stationaryDiv) { stationaryDiv.innerHTML=''; stationary.forEach((prob,i)=>{ const card=document.createElement('div'); card.className='probability-card'; card.innerHTML=`<div class="state-name">${stateNames[i]||`Estado ${i+1}`}</div><div class="value">${prob.toFixed(4)}</div><div class="percentage">${(prob*100).toFixed(2)}% del tiempo</div>`; stationaryDiv.appendChild(card); }); }
  renderStationaryChart(stateNames.map((n,i)=> n||`Estado ${i+1}`), stationary);

  const initialState=document.getElementById('initialState').value; const numSteps=parseInt(document.getElementById('numSteps').value);
  ultimoEstadoInicial = (initialState!=='' ? parseInt(initialState) : null);
  ultimoNumPasos = (numSteps && numSteps>0) ? numSteps : null;
  ultimaMatrizPotenciada = null;

  if(initialState !== '' && numSteps && numSteps>0){
    const stepResultsSection=document.getElementById('stepResultsSection'); if (stepResultsSection) stepResultsSection.style.display='block';
    const poweredMatrix=matrixPower(matrix, numSteps); ultimaMatrizPotenciada = poweredMatrix;
    const initialStateIdx=parseInt(initialState); const stepProbabilities=poweredMatrix[initialStateIdx];
    const stepDiv=document.getElementById('stepResults'); if (stepDiv) { stepDiv.innerHTML=''; stepProbabilities.forEach((prob,i)=>{ const card=document.createElement('div'); card.className='probability-card'; card.innerHTML=`<div class="state-name">${stateNames[i]||`Estado ${i+1}`}</div><div class="value">${prob.toFixed(4)}</div><div class="percentage">${(prob*100).toFixed(2)}% de probabilidad</div>`; stepDiv.appendChild(card); }); }
    const stepExplanation=document.getElementById('stepExplanation'); if (stepExplanation) stepExplanation.innerHTML=`Si empiezas en <strong>${stateNames[initialStateIdx]||`Estado ${initialStateIdx+1}`}</strong>, tras <strong>${numSteps} paso${numSteps>1?'s':''}</strong> estas son las probabilidades de estar en cada estado.`;
    renderStepsChart(stateNames.map((n,i)=> n||`Estado ${i+1}`), stepProbabilities, numSteps);
  } else {
    const section=document.getElementById('stepResultsSection'); if (section) section.style.display='none';
  }

  displayMatrix(matrix);
  const results=document.getElementById('results'); if (results) { results.classList.add('show'); results.scrollIntoView({behavior:'smooth',block:'start'}); }
}

function displayMatrix(matrix){ const n=matrix.length; let html='<table><thead><tr><th></th>'; for(let j=0;j<n;j++){ html+=`<th>${stateNames[j]||`Estado ${j+1}`}</th>`; } html+='</tr></thead><tbody>'; for(let i=0;i<n;i++){ html+=`<tr><th>${stateNames[i]||`Estado ${i+1}`}</th>`; for(let j=0;j<n;j++){ html+=`<td>${matrix[i][j].toFixed(3)}</td>`; } html+='</tr>'; } html+='</tbody></table>'; const display=document.getElementById('matrixDisplay'); if (display) display.innerHTML=html; }

function loadExampleWeather(){ currentSize=3; document.querySelector(`.size-option[data-size="3"]`).click(); document.getElementById('stateName0').value='Soleado'; document.getElementById('stateName1').value='Nublado'; document.getElementById('stateName2').value='Lluvioso'; stateNames=['Soleado','Nublado','Lluvioso']; setTimeout(()=>{ document.getElementById('m0_0').value='0.7'; document.getElementById('m0_1').value='0.2'; document.getElementById('m0_2').value='0.1'; document.getElementById('m1_0').value='0.3'; document.getElementById('m1_1').value='0.4'; document.getElementById('m1_2').value='0.3'; document.getElementById('m2_0').value='0.2'; document.getElementById('m2_1').value='0.3'; document.getElementById('m2_2').value='0.5'; for(let i=0;i<3;i++) validateRow(i); document.getElementById('initialState').value='0'; document.getElementById('numSteps').value='5'; goToStep(4); },100); }
function loadExampleCustomer(){ currentSize=3; document.querySelector(`.size-option[data-size="3"]`).click(); document.getElementById('stateName0').value='Satisfecho'; document.getElementById('stateName1').value='Neutral'; document.getElementById('stateName2').value='Insatisfecho'; stateNames=['Satisfecho','Neutral','Insatisfecho']; setTimeout(()=>{ document.getElementById('m0_0').value='0.8'; document.getElementById('m0_1').value='0.15'; document.getElementById('m0_2').value='0.05'; document.getElementById('m1_0').value='0.4'; document.getElementById('m1_1').value='0.4'; document.getElementById('m1_2').value='0.2'; document.getElementById('m2_0').value='0.1'; document.getElementById('m2_1').value='0.3'; document.getElementById('m2_2').value='0.6'; for(let i=0;i<3;i++) validateRow(i); document.getElementById('initialState').value='1'; document.getElementById('numSteps').value='3'; goToStep(4); },100); }
function loadExampleHealth(){ currentSize=3; document.querySelector(`.size-option[data-size="3"]`).click(); document.getElementById('stateName0').value='Sano'; document.getElementById('stateName1').value='Enfermo'; document.getElementById('stateName2').value='Recuperándose'; stateNames=['Sano','Enfermo','Recuperándose']; setTimeout(()=>{ document.getElementById('m0_0').value='0.95'; document.getElementById('m0_1').value='0.05'; document.getElementById('m0_2').value='0.0'; document.getElementById('m1_0').value='0.0'; document.getElementById('m1_1').value='0.6'; document.getElementById('m1_2').value='0.4'; document.getElementById('m2_0').value='0.7'; document.getElementById('m2_1').value='0.1'; document.getElementById('m2_2').value='0.2'; for(let i=0;i<3;i++) validateRow(i); document.getElementById('initialState').value='1'; document.getElementById('numSteps').value='7'; goToStep(4); },100); }

function resetToBeginning(){ goToStep(1); const results=document.getElementById('results'); if (results) results.classList.remove('show'); }
function clearAll(){ const select=document.getElementById('numStates'); if (select) select.value='3'; currentSize=3; document.querySelector(`.size-option[data-size="3"]`).click(); updateStateNames(); updateMatrixInput(); const isel=document.getElementById('initialState'); if (isel) isel.value=''; const nsteps=document.getElementById('numSteps'); if (nsteps) nsteps.value='5'; const results=document.getElementById('results'); if (results) results.classList.remove('show'); goToStep(1); }

// sin autoavance desde nombres de estado

function mostrarProceso(){
  if(!currentMatrix){ showError('Primero ingresa una matriz válida y calcula.'); return; }

  const filasSuman = currentMatrix.map(r => r.reduce((a,b)=>a+b,0));
  const filasOk = filasSuman.every(s => Math.abs(s-1) < 1e-6);

  let errorEst = null;
  if(ultimoVectorEstacionario){
    const n = currentMatrix.length;
    const piP = new Array(n).fill(0);
    for(let i=0;i<n;i++){
      for(let j=0;j<n;j++) piP[j] += ultimoVectorEstacionario[i]*currentMatrix[i][j];
    }
    errorEst = Math.max(...piP.map((v,j)=> Math.abs(v - ultimoVectorEstacionario[j])));
  }

  let filasSumanPn = null;
  if(ultimaMatrizPotenciada){ filasSumanPn = ultimaMatrizPotenciada.map(r => r.reduce((a,b)=>a+b,0)); }

  const exp = document.getElementById('processExplanation');
  if(exp){
    exp.innerHTML = `
      <strong>Resumen del procedimiento</strong><br>
      Validamos la matriz de transición, calculamos (si corresponde) la distribución después de n pasos con P^n y obtenemos el vector estacionario π por iteración de potencias.
    `;
  }

  const details = document.getElementById('processDetails');
  if(details){
    const lines = [];

    // Narrativa paso a paso
    const nEstados = currentMatrix.length;
    const etiquetaEstadoIni = (ultimoEstadoInicial!==null) ? (stateNames[ultimoEstadoInicial]||('Estado '+(ultimoEstadoInicial+1))) : '—';

    // Traza corta del método de potencias
    function trazaPotencias(P, maxIter=50, tol=1e-6){
      const n = P.length; let v = new Array(n).fill(1/n); const pasos = []; let err = null;
      for(let it=1; it<=maxIter; it++){
        const nv = new Array(n).fill(0);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++) nv[i] += v[j]*P[j][i];
        const s = nv.reduce((a,b)=>a+b,0); for(let i=0;i<n;i++) nv[i]/=s;
        err = Math.max(...nv.map((x,i)=> Math.abs(x - v[i])));
        if(it<=3) pasos.push(nv.slice());
        v = nv; if(err<tol) break;
      }
      return {v, err, pasos};
    }
    const traza = trazaPotencias(currentMatrix, 50, 1e-6);

    lines.push('<ol>');
    lines.push(`<li><strong>Validación de entrada</strong>: ${nEstados} estados. Cada fila de P debe sumar 1. Sumas obtenidas: <em>${filasSuman.map(s=>s.toFixed(6)).join(', ')}</em>. Resultado: ${filasOk? 'válido' : 'revisar'}.</li>`);
    if(ultimaMatrizPotenciada && ultimoEstadoInicial!==null){
      lines.push(`<li><strong>Distribución a ${ultimoNumPasos} paso(s)</strong>: se multiplicó P ${ultimoNumPasos} veces (P^${ultimoNumPasos}). La distribución desde <em>${etiquetaEstadoIni}</em> corresponde a la fila ${ultimoEstadoInicial+1} de P^${ultimoNumPasos}.</li>`);
    } else {
      lines.push('<li><strong>Distribución a n pasos</strong>: no se solicitó (estado inicial o n sin especificar).</li>');
    }
    lines.push('<li><strong>Vector estacionario</strong>: método de potencias. Vector inicial uniforme y normalización en cada iteración hasta tolerancia 1e-6.</li>');
    lines.push('</ol>');

    // Tarjetas rápidas
    lines.push('<div class="process-grid">');
    lines.push(`<div class="kv"><h4>Filas de P</h4><div class="v">${filasSuman.map(s=>s.toFixed(6)).join(', ')}</div><div>${filasOk? '✔ válido' : '✖ revisar'}</div></div>`);
    if(ultimoVectorEstacionario){ lines.push(`<div class="kv"><h4>||πP-π||∞</h4><div class="v">${(errorEst??0).toExponential(3)}</div></div>`); }
    if(ultimaMatrizPotenciada){ lines.push(`<div class="kv"><h4>Filas de P^${ultimoNumPasos}</h4><div class="v">${filasSumanPn.map(s=>s.toFixed(6)).join(', ')}</div></div>`); }
    if(ultimoEstadoInicial!==null){ lines.push(`<div class="kv"><h4>Estado inicial</h4><div class="v">${etiquetaEstadoIni}</div></div>`); }
    lines.push('</div>');

    // Traza de iteraciones
    lines.push('<h4>Iteraciones del método de potencias (primeras 3)</h4>');
    lines.push('<div class="mono">');
    traza.pasos.forEach((vec, idx)=>{
      lines.push(`Iter ${idx+1}: ${vec.map((x,i)=> `${stateNames[i]||('E'+(i+1))}: ${x.toFixed(6)}`).join('  ')}\n`);
    });
    lines.push('</div>');

    // Resultados finales
    lines.push('<h4>Vector estacionario π (final)</h4>');
    lines.push(`<div class="mono">${(ultimoVectorEstacionario||traza.v).map((v,i)=> `${stateNames[i]||('E'+(i+1))}: ${v.toFixed(6)}`).join('\n')}</div>`);
    if(ultimaMatrizPotenciada && ultimoEstadoInicial!==null){
      lines.push(`<h4>Distribución usada de P^${ultimoNumPasos} (desde ${etiquetaEstadoIni})</h4>`);
      lines.push(`<div class="mono">${ultimaMatrizPotenciada[ultimoEstadoInicial].map((v,i)=> `${stateNames[i]||('E'+(i+1))}: ${v.toFixed(6)}`).join('\n')}</div>`);
    }

    details.innerHTML = lines.join('');
  }

  const section = document.getElementById('processSection');
  if(section){ section.style.display='block'; section.scrollIntoView({behavior:'smooth', block:'start'}); }
}

// Alias en español
function alternarTema(){ return toggleTheme(); }
function configurarSelectorTamanio(){ return setupSizeSelector(); }
function actualizarNombresEstados(){ return updateStateNames(); }
function actualizarSelectorEstadoInicial(){ return updateStateSelector(); }
function actualizarEntradaMatriz(){ return updateMatrixInput(); }
function validarFila(){ return validateRow.apply(null, arguments); }
function todasFilasValidas(){ return checkAllRowsValid(); }
function irAlPaso(){ return goToStep.apply(null, arguments); }
function obtenerMatriz(){ return getMatrix(); }
function mostrarError(){ return showError.apply(null, arguments); }
function calcularVectorEstacionario(){ return calculateStationaryVector.apply(null, arguments); }
function potenciaMatriz(){ return matrixPower.apply(null, arguments); }
function calcularResultados(){ return calculate(); }
function mostrarMatriz(){ return displayMatrix.apply(null, arguments); }
function cargarEjemploClima(){ return loadExampleWeather(); }
function cargarEjemploClientes(){ return loadExampleCustomer(); }
function cargarEjemploSalud(){ return loadExampleHealth(); }
function reiniciarAlInicio(){ return resetToBeginning(); }
function limpiarTodo(){ return clearAll(); }
