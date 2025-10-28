const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function sample(a,n){ return shuffle(a).slice(0,n) }

const state = {
  allQuestions: [],
  roundQuestions: [],
  currentIndex: 0,
  selectedIndex: null,
  timer: null,
  timeLeft: 0,
  score: 0,
  hits: 0,
  // carry pode ser positivo (acertos) ou negativo (erros); aplica na PRÓXIMA questão
  timeBonusCarry: 0,
  gameOver: false,
  config: {
    timePerQuestion: 20,
    basePoints: 100,
    speedBonusMax: 50,
    allowKeyboard: true,
    ...window.QUIZ_CONFIG // mantém qualquer ajuste vindo do HTML
  }
};

// Screens
const screenHome   = $('#screen-home');
const screenGame   = $('#screen-game');
const screenResult = $('#screen-result');

// Game elements
const elQNum   = $('#q-number');
const elQTot   = $('#q-total');
const elQTitle = $('#q-title');
const elQOpts  = $('#q-options');
const elQTimer = $('#q-timer');
const elQScore = $('#q-score');
const elQFeed  = $('#q-feedback');
const elQTimeBonus = $('#q-timebonus');

// Result elements
const elRTitle = $('#r-title');
const elRHits  = $('#r-hits');
const elRTot   = $('#r-total');
const elRScore = $('#r-score');
const elRBest  = $('#r-best');
const elRBoard = $('#r-board');
const elShare  = $('#btn-share');

// Controls
const btnStart   = $('#btn-start');
const btnConfirm = $('#btn-confirm');
const btnNext    = $('#btn-next');
const btnRestart = $('#btn-restart');

// Selects
const selCategory = $('#select-category');
const selLevel    = $('#select-level');
const selAmount   = $('#select-amount');

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

async function loadQuestions(){
  const res = await fetch('./data/questions.json',{cache:'no-store'});
  state.allQuestions = await res.json();
}

// ================= ROUND =================
function buildRound(){
  state.gameOver = false;

  const cat = selCategory.value;   // 'todas' | categoria
  const lvl = selLevel.value;      // 'misto' | 'facil' | 'medio' | 'dificil'
  const amt = parseInt(selAmount.value,10);

  let pool = state.allQuestions.slice();
  if(cat!=='todas') pool = pool.filter(q=>q.categoria===cat);
  if(lvl!=='misto') pool = pool.filter(q=>q.nivel===lvl);
  if(pool.length<amt) pool = state.allQuestions.slice();

  state.roundQuestions = sample(pool, amt);
  state.currentIndex = 0;
  state.selectedIndex = null;
  state.score = 0;
  state.hits  = 0;
  // se quiser resetar o carry a cada rodada, descomente:
  // state.timeBonusCarry = 0;

  elQTot.textContent = String(amt);
  elQScore.textContent = '0';
  renderTimeBonusBadge();
}

function renderQuestion(){
  const q = state.roundQuestions[state.currentIndex];
  elQNum.textContent = String(state.currentIndex+1);
  elQTitle.textContent = q.pergunta;
  elQFeed.textContent = '';

  const options = q.alternativas.map((text, idx)=>({text, idx}));
  const ops = shuffle(options);
  elQOpts.innerHTML = '';
  ops.forEach((op, i)=>{
    const li = document.createElement('li');
    li.setAttribute('role','radio');
    li.setAttribute('tabindex','0');
    li.dataset.idx = op.idx;
    li.textContent = `${i+1}) ${op.text}`;
    li.addEventListener('click', ()=>selectOption(li));
    li.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault(); selectOption(li)} });
    elQOpts.appendChild(li);
  });

  state.selectedIndex = null;
  btnConfirm.disabled = false;
  btnNext.classList.add('hidden');
  startTimer();
}

function selectOption(li){
  $$('#q-options li').forEach(x=>x.classList.remove('selected'));
  li.classList.add('selected');
  state.selectedIndex = parseInt(li.dataset.idx,10);
}

// badge mostra +Xs ou -Xs acumulado para a PRÓXIMA questão
function renderTimeBonusBadge(){
  if(!elQTimeBonus) return;
  const b = state.timeBonusCarry || 0;
  elQTimeBonus.textContent = b === 0 ? '' : `${b > 0 ? '+' : ''}${b}s`;
}

// ================= TIMER =================
function startTimer(){
  stopTimer();

  const base  = state.config.timePerQuestion || 20;
  const carry = (state.timeBonusCarry || 0); // pode ser positivo ou negativo
  // Garante pelo menos 1 segundo de largada
  state.timeLeft = Math.max(1, base + carry);

  elQTimer.textContent = String(state.timeLeft);
  renderTimeBonusBadge();

  state.timer = setInterval(()=>{
    state.timeLeft--;
    elQTimer.textContent = String(state.timeLeft);
    elQTimer.toggleAttribute('data-low', state.timeLeft <= 5);

    if (state.timeLeft <= 0) {
      stopTimer();
      gameOver(); // acabou o tempo => GAME OVER
    }
  }, 1000);
}

function stopTimer(){
  if(state.timer){
    clearInterval(state.timer);
    state.timer=null;
  }
}

// ================= ANSWER =================
function showAnswer(fromConfirm){
  if (state.gameOver) return;

  stopTimer();

  const q = state.roundQuestions[state.currentIndex];
  const items = $$('#q-options li');

  // pinta correto/errado
  items.forEach(li=>{
    const idx = parseInt(li.dataset.idx,10);
    if(idx===q.correta) li.classList.add('correct');
    if(state.selectedIndex!==null && idx===state.selectedIndex && state.selectedIndex!==q.correta){
      li.classList.add('wrong');
    }
  });

  let correct = (state.selectedIndex===q.correta);
  if(fromConfirm===false && state.selectedIndex===null) correct=false;

  if (correct) {
    state.hits++;

    // Pontuação normal: base + velocidade (NÃO descontamos pontos ao errar)
    const speedBonus = Math.round(
      (state.timeLeft / (state.config.timePerQuestion || 20)) * (state.config.speedBonusMax || 50)
    );
    const gained = (state.config.basePoints || 100) + speedBonus;
    state.score += gained;

    elQFeed.textContent =
      `✅ Correto! +${state.config.basePoints || 100} (básico) +${speedBonus} (velocidade). ${q.explicacao || ''}`;

    // ✔ Próxima questão: +5s cumulativo, sem limite
    state.timeBonusCarry = (state.timeBonusCarry || 0) + 5;

  } else {
    elQFeed.textContent = `❌ Resposta incorreta. ${q.explicacao || ''}`;

    // ✔ Próxima questão: -5s cumulativo (pode ficar negativo)
    state.timeBonusCarry = (state.timeBonusCarry || 0) - 5;
  }

  renderTimeBonusBadge();

  elQScore.textContent = String(state.score);
  btnConfirm.disabled = true;
  btnNext.classList.remove('hidden');
}

function nextQuestion(){
  state.currentIndex++;
  if(state.currentIndex>=state.roundQuestions.length) return finishRound(false);
  renderQuestion();
}

// ================= RESULT / RANKING =================
function finishRound(wasGameOver){
  hide(screenGame); show(screenResult);

  const total = state.roundQuestions.length;
  elRHits.textContent = String(state.hits);
  elRTot.textContent  = String(total);
  elRScore.textContent= String(state.score);

  elRTitle.textContent = wasGameOver ? 'GAME OVER' : 'Resultado';

  // best local
  const best = Number(localStorage.getItem('quiz_best')||'0');
  if(state.score>best){
    localStorage.setItem('quiz_best', String(state.score));
    elRBest.textContent = String(state.score)+' (novo recorde!)';
  } else {
    elRBest.textContent = String(best);
  }

  // ranking
  saveToLeaderboard(state.score).then(renderLeaderboard);

  // share
  const msg = encodeURIComponent(
    `${wasGameOver ? 'GAME OVER no' : 'Terminei o'} Quiz de Tecnologia da AxionTechI9! Pontos: ${state.score} | Acertos: ${state.hits}/${total} — Tente também: ${location.href}`
  );
  elShare.href = `https://wa.me/?text=${msg}`;
}

function gameOver(){
  state.gameOver = true;
  // marca correto para dar um feedback mínimo visual
  if (state.selectedIndex === null) {
    const q = state.roundQuestions[state.currentIndex];
    $$('#q-options li').forEach(li=>{
      const idx = parseInt(li.dataset.idx,10);
      if(idx===q.correta) li.classList.add('correct');
    });
  }
  finishRound(true);
}

// ===== Leaderboard (localStorage) =====
async function saveToLeaderboard(score){
  let name = localStorage.getItem('quiz_player_name');
  if(!name){
    name = prompt('Digite seu nome para salvar seu recorde no ranking:') || 'Jogador';
    name = name.trim().slice(0, 30) || 'Jogador';
    localStorage.setItem('quiz_player_name', name);
  }
  const entry = { name, score, date: new Date().toISOString() };
  const key = 'quiz_leaderboard';
  const list = JSON.parse(localStorage.getItem(key) || '[]');

  list.push(entry);
  // ordena por score desc, desempate por mais recente
  list.sort((a,b)=> b.score - a.score || new Date(b.date) - new Date(a.date));
  const top = list.slice(0,10);
  localStorage.setItem(key, JSON.stringify(top));
}

function renderLeaderboard(){
  if(!elRBoard) return;
  const key = 'quiz_leaderboard';
  const list = JSON.parse(localStorage.getItem(key) || '[]');

  if(list.length === 0){
    elRBoard.innerHTML = '<p class="muted">Ainda não há entradas no ranking.</p>';
    return;
  }

  const rows = list.map((r, i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${r.name}</td>
      <td style="text-align:right">${r.score}</td>
    </tr>
  `).join('');

  elRBoard.innerHTML = `
    <h3>🏆 Ranking (Top 10)</h3>
    <div style="overflow:auto">
      <table style="width:100%;border-collapse:collapse;border:1px solid rgba(255,255,255,.06)">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid rgba(255,255,255,.06)">#</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid rgba(255,255,255,.06)">Jogador</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid rgba(255,255,255,.06)">Pontos</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// ================= EVENTS =================
btnStart.addEventListener('click', async ()=>{
  hide(screenHome); show(screenGame);
  if(state.allQuestions.length===0){ await loadQuestions(); }
  buildRound();
  renderQuestion();
});
btnConfirm.addEventListener('click', ()=>showAnswer(true));
btnNext.addEventListener('click', nextQuestion);
btnRestart.addEventListener('click', ()=>{ hide(screenResult); show(screenHome); });

// Teclado
if(state.config.allowKeyboard){
  document.addEventListener('keydown',(ev)=>{
    if(screenGame.classList.contains('hidden')) return;
    const k = ev.key;
    if(['1','2','3','4'].includes(k)){
      const li = $$('#q-options li')[Number(k)-1];
      if(li) selectOption(li);
    }
    if(k==='Enter'){
      if(!btnConfirm.disabled) showAnswer(true);
      else if(!btnNext.classList.contains('hidden')) nextQuestion();
    }
  });
}
