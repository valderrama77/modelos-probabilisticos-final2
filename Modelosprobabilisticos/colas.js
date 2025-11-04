// colas.js
// Muestra/oculta parámetros según el modelo y calcula medidas básicas.
// Requiere math.js (incluido en el HTML).

let selectedModel = 'mm1';

function selectModel(model){
  selectedModel = model;
  document.querySelectorAll('.size-option').forEach(el => el.classList.toggle('selected', el.dataset.model === model));
  // toggles
  document.getElementById('param-c').style.display = (model === 'mmc') ? 'block' : 'none';
  document.getElementById('param-k').style.display = (model === 'mm1k') ? 'block' : 'none';
  document.getElementById('param-sigma').style.display = (model === 'mg1') ? 'block' : 'none';
  // always show lambda & mu
  document.getElementById('param-lambda').style.display = 'block';
  document.getElementById('param-mu').style.display = 'block';
  clearResults();
}

function getNumber(id){
  const v = parseFloat(document.getElementById(id).value);
  return (isNaN(v) ? null : v);
}

function showError(msg){
  const el = document.getElementById('queueError');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 6000);
}

function clearResults(){
  document.getElementById('resultsQueue').style.display = 'none';
  document.getElementById('queueMeasures').innerHTML = '';
  document.getElementById('queueFormulas').innerHTML = '';
  document.getElementById('queueSummary').innerHTML = '';
}

function resetQueue(){
  document.getElementById('lambda').value = '';
  document.getElementById('mu').value = '';
  document.getElementById('c').value = '1';
  document.getElementById('k').value = '10';
  document.getElementById('sigma').value = '';
  clearResults();
}

function computeQueue(){
  clearResults();
  const lambda = getNumber('lambda');
  const mu = getNumber('mu');
  if(lambda === null || mu === null){
    showError('Ingresa λ y μ válidos.');
    return;
  }
  if(mu <= 0 || lambda < 0){
    showError('λ >= 0 y μ > 0.');
    return;
  }

  try {
    if(selectedModel === 'mm1'){
      computeMM1(lambda, mu);
    } else if(selectedModel === 'mmc'){
      const c = parseInt(document.getElementById('c').value) || 1;
      computeMMc(lambda, mu, c);
    } else if(selectedModel === 'mm1k'){
      const K = parseInt(document.getElementById('k').value) || 1;
      computeMM1K(lambda, mu, K);
    } else if(selectedModel === 'mg1'){
      const sigma = getNumber('sigma');
      if(sigma === null) { showError('Ingresa desviación estándar (σ) para M/G/1.'); return; }
      computeMG1(lambda, mu, sigma);
    }
  } catch (err){
    console.error(err);
    showError('Error al calcular: ' + (err.message || err));
  }
}

/* ====== STUBS / EJEMPLOS: Implementa las fórmulas con math.js aquí ====== */

/* M/M/1: ρ = λ/μ, L = ρ/(1-ρ), Lq = ρ^2/(1-ρ), W = L/λ, Wq = Lq/λ */
function computeMM1(lambda, mu){
  const rho = lambda / mu;
  if(rho >= 1){
    showError('Sistema inestable (ρ >= 1). Para M/M/1 se requiere λ/μ < 1.');
  }
  const L = rho / (1 - rho);
  const Lq = (rho * rho) / (1 - rho);
  const W = L / lambda;
  const Wq = Lq / lambda;

  displayQueueResults({
    summary: `Modelo M/M/1 — ρ = ${rho.toFixed(4)}`,
    measures: [
      ['Utilización ρ', rho],
      ['Clientes en sistema L', L],
      ['Clientes en cola Lq', Lq],
      ['Tiempo en sistema W', W],
      ['Tiempo en cola Wq', Wq]
    ],
    formulas: `
      ρ = λ / μ<br>
      L = ρ / (1 − ρ) ; Lq = ρ² / (1 − ρ) <br>
      W = L / λ ; Wq = Lq / λ
    `
  });
}

/* M/M/c: Ejemplo breve: P0 cálculos y Lq (Erlang C) — aquí solo un stub simplificado */
function computeMMc(lambda, mu, c){
  const rho = lambda / (c * mu);
  if(rho >= 1){
    showError('Sistema inestable (ρ >= 1) para M/M/c (λ/(c·μ) < 1).');
  }
  // Para M/M/c hay que calcular P0 y Lq con la fórmula de Erlang C.
  // Implementación correcta: usar math.js para sumas y factoriales.
  // Aquí dejo un cálculo simplificado de ejemplo (NO es la fórmula exacta)
  // Implementa la versión completa usando math.factorial y sumatorias:
  // P0 = [ sum_{n=0}^{c-1} ( (λ/μ)^n / n! ) + ( (λ/μ)^c / (c! * (1 - ρ)) ) ]^{-1}
  // Lq = ( P0 * (λ/μ)^c * ρ ) / ( c! * (1-ρ)^2 )
  const lamMu = lambda / mu;
  // ejemplo calculo P0 (simplificado)
  let sum = 0;
  for(let n=0;n<=c-1;n++){
    sum += Math.pow(lamMu, n) / factorial(n);
  }
  const part = Math.pow(lamMu, c) / (factorial(c) * (1 - rho));
  const P0 = 1 / (sum + part);
  const Lq = (P0 * Math.pow(lamMu, c) * rho) / ( factorial(c) * Math.pow(1 - rho, 2) );
  const L = Lq + lambda / mu;
  const W = L / lambda;
  const Wq = Lq / lambda;

  displayQueueResults({
    summary: `Modelo M/M/c — c = ${c}, ρ = ${rho.toFixed(4)}`,
    measures: [
      ['Utilización ρ', rho],
      ['Clientes en cola Lq', Lq],
      ['Clientes en sistema L', L],
      ['Tiempo en cola Wq', Wq],
      ['Tiempo en sistema W', W]
    ],
    formulas: `
      P0 = [ Σ_{n=0}^{c-1} ( (λ/μ)^n / n! ) + ( (λ/μ)^c / (c! (1−ρ)) ) ]^{-1}<br>
      Lq = ( P0 (λ/μ)^c ρ ) / ( c! (1−ρ)^2 )
    `
  });
}

/* M/M/1/K: sistema con capacidad finita K */
function computeMM1K(lambda, mu, K){
  // Fórmulas: ρ = λ/μ, Pn = (1-ρ)/(1-ρ^{K+1}) * ρ^n (si ρ != 1)
  // L = Σ n Pn
  const rho = lambda / mu;
  let P0, L;
  if(Math.abs(rho - 1) < 1e-12){
    P0 = 1 / (K + 1);
    // L = K/2 (si ρ = 1), ya que distribución uniforme
    L = K / 2;
  } else {
    P0 = (1 - rho) / (1 - Math.pow(rho, K + 1));
    // calcular L = Σ_{n=0}^K n * Pn
    L = 0;
    for(let n=0;n<=K;n++){
      const Pn = P0 * Math.pow(rho, n);
      L += n * Pn;
    }
  }
  const Lq = L - (1 - P0); // aproximación simple (ajustar según definiciones)
  const effectiveArrival = lambda * (1 - (Math.pow(rho, K) * P0)); // tasa efectiva (aprox)
  const W = L / effectiveArrival;
  const Wq = Lq / effectiveArrival;

  displayQueueResults({
    summary: `Modelo M/M/1/K — K = ${K}, ρ = ${rho.toFixed(4)}`,
    measures: [
      ['Utilización ρ', rho],
      ['Clientes en sistema L', L],
      ['Clientes en cola Lq', Lq],
      ['Tasa efectiva de llegada λ_e', effectiveArrival],
      ['Tiempo en sistema W', W],
      ['Tiempo en cola Wq', Wq]
    ],
    formulas: `
      Para ρ ≠ 1: P0 = (1−ρ)/(1−ρ^{K+1}), Pn = P0 ρ^n<br>
      L = Σ_{n=0}^{K} n Pn
    `
  });
}

/* M/G/1: usa la fórmula de Pollaczek–Khinchine para Lq:
   Lq = (λ^2 * σ^2 + ρ^2) / (2(1-ρ))  (variante; implementar con atención a la varianza)
   Aquí dejo un placeholder para que implementes con math.js precisión.
*/
function computeMG1(lambda, mu, sigma){
  const rho = lambda / mu;
  if(rho >= 1){ showError('Sistema inestable (ρ >= 1) para M/G/1'); return; }

  // σ es desviación estándar del tiempo de servicio; varianza = σ^2
  const varService = Math.pow(sigma, 2);
  // Pollaczek–Khinchine (forma): Lq = (λ^2 * E[S^2]) / (2(1-ρ))
  // E[S] = 1/μ ; E[S^2] = Var(S) + (E[S])^2
  const ES = 1 / mu;
  const ES2 = varService + ES * ES;
  const Lq = (Math.pow(lambda,2) * ES2) / (2 * (1 - rho));
  const L = Lq + rho;
  const Wq = Lq / lambda;
  const W = L / lambda;

  displayQueueResults({
    summary: `Modelo M/G/1 — ρ = ${rho.toFixed(4)}`,
    measures: [
      ['Utilización ρ', rho],
      ['Clientes en cola Lq', Lq],
      ['Clientes en sistema L', L],
      ['Tiempo en cola Wq', Wq],
      ['Tiempo en sistema W', W]
    ],
    formulas: `
      Pollaczek–Khinchine: Lq = (λ^2 E[S^2]) / (2(1−ρ)) ; donde E[S^2] = Var(S) + (E[S])^2
    `
  });
}

/* ====== auxiliares y UI ====== */
function displayQueueResults({ summary, measures, formulas }){
  document.getElementById('resultsQueue').style.display = 'block';
  document.getElementById('queueSummary').innerHTML = summary;
  const grid = document.getElementById('queueMeasures');
  grid.innerHTML = '';
  measures.forEach(m => {
    const card = document.createElement('div');
    card.className = 'probability-card';
    card.innerHTML = `<div class="state-name">${m[0]}</div><div class="value">${(typeof m[1] === 'number' ? m[1].toFixed(6) : m[1])}</div>`;
    grid.appendChild(card);
  });
  document.getElementById('queueFormulas').innerHTML = formulas;
}

/* factorial util (para M/M/c) */
function factorial(n){
  if(n < 0) return NaN;
  if(n === 0) return 1;
  let r = 1;
  for(let i=1;i<=n;i++) r*=i;
  return r;
}

// inicialización: seleccionar modelo por defecto
document.addEventListener('DOMContentLoaded', function(){
  selectModel(selectedModel);
});
