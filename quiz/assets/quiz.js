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
  timeBonusCarry: 0, // acumula bônus de tempo para a PRÓXIMA questão
  config: window.QUIZ_CONFIG || {timePerQuestion:20, basePoints:100, speedBonusMax:50, allowKeyboard:true}
};

async function loadQuestions(){
  const res = await fetch('./data/questions.json',{cache:'no-store'});
  state.allQuestions = await res.json();
}

const screenHome   = $('#screen-home');
const screenGame   = $('#screen-game');
const screenResult = $('#screen-result');

const elQNum   = $('#q-number');
const elQTot   = $('#q-total');
const elQTitle = $('#q-title');
const elQOpts  = $('#q-options');
const elQTimer = $('#q-timer');
const elQScore = $('#q-score');
const elQFeed  = $('#q-feedback');
const elQTimeBonus = $('#q-timebonus'); // <-- REFERÊNCIA CORRETA DO BADGE

const elRHits  = $('#r-hits');
const elRTot   = $('#r-total');
const elRScore = $('#r-score');
const elRBest  = $('#r-best');
const elShare  = $('#btn-share');

const btnStart   = $('#btn-start');
const btnConfirm = $('#btn-confirm');
const btnNext    = $('#btn-next');
const btnRestart = $('#btn-restart');

const selCategory = $('#select-category');
const selLevel    = $('#select-level');
const selAmount   = $('#select-amount');

function show(el){ el.classList.remove('hidden') }
function hide(el){ el.classList.add('hidden') }

function buildRound(){
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
  // mantém o carry entre perguntas; no início da rodada, zere se quiser:
  state.timeBonusCarry = 0;

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
    li.setAttribute('role','radio'); li.setAttribute('tabindex','0');
    li.dataset.idx = op.idx; li.textContent = `${i+1}) ${op.text}`;
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

function renderTimeBonusBadge(){
  const b = state.timeBonusCarry || 0;
  if(!elQTimeBonus) return;
  elQTimeBonus.textContent = b > 0 ? `+${b}s` : '';
}

function startTimer(){
  stopTimer();
  // aplica o bônus ACUMULADO nesta questão
  state.timeLeft = state.config.timePerQuestion + (state.timeBonusCarry || 0);
  elQTimer.textContent = String(state.timeLeft);
  renderTimeBonusBadge();

  state.timer = setInterval(()=>{
    state.timeLeft--;
    elQTimer.textContent = String(state.timeLeft);
    if(state.timeLeft<=0){ stopTimer(); showAnswer(false); }
  },1000);
}

function stopTimer(){ if(state.timer){ clearInterval(state.timer); state.timer=null } }

function showAnswer(fromConfirm){
  stopTimer();
  const q = state.roundQuestions[state.currentIndex];
  const items = $$('#q-options li');
  items.forEach(li=>{
    const idx = parseInt(li.dataset.idx,10);
    if(idx===q.correta) li.classList.add('correct');
    if(state.selectedIndex!==null && idx===state.selectedIndex && state.selectedIndex!==q.correta){
      li.classList.add('wrong');
    }
  });

  let correct = (state.selectedIndex===q.correta);
  if(fromConfirm===false && state.selectedIndex===null) correct=false;

  if(correct){
    state.hits++;
    const speedBonus = Math.round((state.timeLeft/state.config.timePerQuestion)*state.config.speedBonusMax);
    const gained = state.config.basePoints + speedBonus;
    state.score += gained;
    elQFeed.textContent = `✅ Correto! +${state.config.basePoints} (básico) +${speedBonus} (velocidade). ${q.explicacao||''}`;

    // atualiza bônus de tempo PARA A PRÓXIMA questão
    state.timeBonusCarry = Math.min(
      (state.timeBonusCarry || 0) + (state.config.timeBonusPerHit || 0),
      state.config.timeBonusMax || 0
    );
  } else {
    elQFeed.textContent = `❌ Resposta incorreta. ${q.explicacao||''}`;

    // errou? decai o carry
    state.timeBonusCarry = Math.max(
      0,
      (state.timeBonusCarry || 0) - (state.config.timeBonusDecayOnWrong || 0)
    );
  }
  renderTimeBonusBadge();

  elQScore.textContent = String(state.score);
  btnConfirm.disabled = true;
  btnNext.classList.remove('hidden');
}

function nextQuestion(){
  state.currentIndex++;
  if(state.currentIndex>=state.roundQuestions.length) return finishRound();
  renderQuestion();
}

function finishRound(){
  hide(screenGame); show(screenResult);
  const total = state.roundQuestions.length;
  elRHits.textContent = String(state.hits);
  elRTot.textContent  = String(total);
  elRScore.textContent= String(state.score);

  const best = Number(localStorage.getItem('quiz_best')||'0');
  if(state.score>best){ localStorage.setItem('quiz_best', String(state.score)); elRBest.textContent = String(state.score)+' (novo recorde!)'; }
  else { elRBest.textContent = String(best); }

  const msg = encodeURIComponent(`Terminei o Quiz de Tecnologia da AxionTechI9! Pontos: ${state.score} | Acertos: ${state.hits}/${total} — Tente também: ${location.href}`);
  elShare.href = `https://wa.me/?text=${msg}`;
}

btnStart.addEventListener('click', async ()=>{
  hide(screenHome); show(screenGame);
  if(state.allQuestions.length===0){ await loadQuestions(); }
  buildRound(); renderQuestion();
});
btnConfirm.addEventListener('click', ()=>showAnswer(true));
btnNext.addEventListener('click', nextQuestion);
btnRestart.addEventListener('click', ()=>{ hide(screenResult); show(screenHome); });

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
