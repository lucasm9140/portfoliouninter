// Função para emitir saudação personalizada na página inicial
function saudacao() {
    const nome = document.getElementById('nomeUsuario').value;
    const mensagem = document.getElementById('mensagemSaudacao');
    if (nome.trim() !== "") {
        mensagem.textContent = `Bem-vindo, ${nome}! 🚀`;
    } else {
        mensagem.textContent = "Por favor, digite seu nome para saudação.";
    }
}
