// Saudação amigável
function saudacao(){
  const nome = (document.getElementById('nomeUsuario').value || '').trim();
  const $msg = document.getElementById('mensagemSaudacao');
  if(!nome){
    $msg.textContent = 'Digite seu nome para eu te cumprimentar!';
    $msg.style.color = 'var(--danger)';
    return;
  }
  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'bom dia' : (hora < 18 ? 'boa tarde' : 'boa noite');
  $msg.textContent = `Olá, ${nome}! Tenha um ${periodo} e boas explorações pelo meu portfólio 🚀`;
  $msg.style.color = 'var(--text)';
}

// Banner flutuante (persistência de fechamento)
(function(){
  const banner = document.getElementById('axion-banner');
  const closeBtn = document.getElementById('axion-close');
  if(banner && closeBtn){
    if(localStorage.getItem('axion_banner_closed') === 'true') banner.style.display = 'none';
    closeBtn.addEventListener('click', ()=>{
      banner.style.opacity = '0';
      setTimeout(()=>{ banner.style.display = 'none'; }, 250);
      localStorage.setItem('axion_banner_closed', 'true');
    });
  }
})();

// Rotação simples de anúncios (simulação de criativos)
const criativosLeader = [
  {bg:'#0c1322', html:'<strong>728×90</strong><br/><small>Seu anúncio aqui — topo</small>'},
  {bg:'linear-gradient(90deg, rgba(76,201,240,.2), rgba(34,197,94,.15))', html:'<strong>AxionTechI9</strong><br/><small>Automação & Segurança Eletrônica</small>'},
  {bg:'linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.00))', html:'<strong>Contrate um dev!</strong><br/><small>Projetos em Java, Python, Next.js</small>'}
];
const criativosRect = [
  {bg:'#0c1322', html:'<strong>300×250</strong><br/><small>Banner lateral: promo AxionTechI9</small>'},
  {bg:'linear-gradient(180deg, rgba(76,201,240,.20), rgba(34,197,94,.15))', html:'<strong>Consultoria</strong><br/><small>Diagnóstico grátis</small>'},
  {bg:'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.00))', html:'<strong>Mentoria</strong><br/><small>Carreira Dev & Portfólio</small>'}
];
let idx = 0;
function trocarAnuncio(){
  idx = (idx + 1) % criativosLeader.length;
  const leader = document.getElementById('ad-leader');
  const rect = document.getElementById('ad-rect');
  if(leader && rect){
    leader.style.background = criativosLeader[idx].bg;
    leader.innerHTML = `<div>${criativosLeader[idx].html}</div>`;
    rect.style.background = criativosRect[idx].bg;
    rect.innerHTML = `<div>${criativosRect[idx].html}</div>`;
  }
}
window.trocarAnuncio = trocarAnuncio;