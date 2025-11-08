/* ===============================
   ✅ SAUDAÇÃO PERSONALIZADA
================================= */
window.saudacao = function saudacao(){
  const input = document.getElementById('nomeUsuario');
  const msg   = document.getElementById('mensagemSaudacao');

  if(!input || !msg) return;

  const nome = input.value.trim();
  if(nome === ''){
    msg.textContent = 'Digite seu nome para eu te cumprimentar! 😊';
    msg.style.color = 'var(--danger)';
    return;
  }

  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'bom dia' :
                  hora < 18 ? 'boa tarde' : 'boa noite';

  msg.textContent = `Olá, ${nome}! Tenha um ${periodo} e boas explorações pelo meu portfólio 🚀`;
  msg.style.color = 'var(--text)';

  localStorage.setItem('portfolio_nome', nome);
};

// ✅ Executa saudação automática se nome salvo
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('nomeUsuario');
  const salvo = localStorage.getItem('portfolio_nome');
  if(salvo && input){
    input.value = salvo;
    window.saudacao();
  }
});

/* ===============================
   ✅ BANNER FLUTUANTE (AxionTech)
================================= */
(function(){
  const banner = document.getElementById('axion-banner');
  const close  = document.getElementById('axion-close');
  if(!banner || !close) return;

  if(localStorage.getItem('axion_banner_closed') === 'true'){
    banner.style.display = 'none';
  }

  close.addEventListener('click', () => {
    banner.style.opacity = '0';
    setTimeout(() => banner.style.display = 'none', 200);
    localStorage.setItem('axion_banner_closed', 'true');
  });
})();

/* ===============================
   ✅ ANÚNCIOS (simples)
================================= */
const criativosLeader = [
  {bg:'#0c1322', html:'<strong>728×90</strong><br/><small>Seu anúncio aqui — topo</small>'},
  {bg:'linear-gradient(90deg, rgba(76,201,240,.2), rgba(34,197,94,.15))', html:'<strong>AxionTechI9</strong><br/><small>Automação & Segurança</small>'}
];
const criativosRect = [
  {bg:'#0c1322', html:'<strong>300×250</strong><br/><small>Promo AxionTechI9</small>'},
  {bg:'linear-gradient(180deg, rgba(76,201,240,.20), rgba(34,197,94,.15))', html:'<strong>Consultoria</strong><br/><small>Diagnóstico grátis</small>'}
];
let idx = 0;
window.trocarAnuncio = function(){
  idx = (idx + 1) % criativosLeader.length;
  const leader = document.getElementById('ad-leader');
  const rect   = document.getElementById('ad-rect');
  if(!leader || !rect) return;
  leader.style.background = criativosLeader[idx].bg;
  leader.innerHTML = `<div>${criativosLeader[idx].html}</div>`;
  rect.style.background = criativosRect[idx].bg;
  rect.innerHTML = `<div>${criativosRect[idx].html}</div>`;
};
