/* API de gerenciamento de eventos academicos para o trabalho
   final da disciplina desenvolvimento web 
   frontend em JavaScript
   faz as requisições para a API hospedada no Render */

/* URL pública da API no Render (sem a barra no final).
   antes usava http://localhost:3000, agora troquei pela URL de produção */
const API_URL = 'https://eventos-api-vna2.onrender.com';

// pega os elementos da página que serao manipulados
const form = document.getElementById('form-evento');
const btnSalvar = document.getElementById('btn-salvar');
const mensagem = document.getElementById('mensagem');
const lista = document.getElementById('lista-eventos');
const statusLista = document.getElementById('status-lista');
const btnAtualizar = document.getElementById('btn-atualizar');

/* o input date devolve a data como "2026-11-25",
   então é convertido para "25/11/2026", que é o formato salvo na tabela */
function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/* escapa os caracteres especiais para não quebrar o HTML (ex: <script>)
   protege contra ataques XSS (Cross-Site Scripting) */
function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// mostra uma mensagem embaixo do formulário (tipo = 'sucesso' ou 'erro')
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

// LISTAGEM (GET /eventos)
async function carregarEventos() {
  // avisa que está carregando (o Render gratuito demora na primeira requisição)
  statusLista.textContent = 'Carregando eventos... (a primeira chamada pode demorar se o servidor estiver "dormindo")';
  statusLista.style.display = 'block';
  lista.innerHTML = '';

  try {
    // faz a requisição GET para a API
    const resposta = await fetch(`${API_URL}/eventos`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    // converte a resposta para JSON (vem um array de eventos)
    const eventos = await resposta.json();

    // se não tem nenhum evento, mostra aviso na tela
    if (eventos.length === 0) {
      statusLista.textContent = 'Nenhum evento cadastrado.';
      return;
    }

    // esconde a mensagem de status e monsta uma <li> para cada evento
    statusLista.style.display = 'none';
    lista.innerHTML = eventos
      .map(
        (ev) => `
        <li>
          <h3>${escapeHtml(ev.titulo)}</h3>
          <p class="meta">📅 ${escapeHtml(ev.data_evento)} &nbsp;•&nbsp; 📍 ${escapeHtml(ev.local)}</p>
          ${ev.descricao ? `<p>${escapeHtml(ev.descricao)}</p>` : ''}
        </li>`
      )
      .join('');
  } catch (erro) {
    // se a API estiver fora do ar ou a URL estiver errada, cai aqui
    console.error(erro);
    statusLista.textContent = 'Erro ao carregar eventos. Verifique a URL da API.';
  }
}

// CADASTRO (POST /eventos)
form.addEventListener('submit', async (e) => {
  // Impede o formulário de recarregar a página
  e.preventDefault();

  // monta o objeto do evento com os valores digitados
  const evento = {
    titulo: document.getElementById('titulo').value.trim(),
    descricao: document.getElementById('descricao').value.trim(),
    data_evento: formatarData(document.getElementById('data_evento').value),
    local: document.getElementById('local').value.trim(),
  };

  // desativa o botão para o usuário não clicar duas vezes
  btnSalvar.disabled = true;
  mostrarMensagem('Salvando...', '');

  try {
    // envia o evento para a API em formato JSON
    const resposta = await fetch(`${API_URL}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento),
    });
    const dados = await resposta.json();

    // se a API retornou erro (400 ou 500), mostra a mensagem que ela mandou
    if (!resposta.ok) throw new Error(dados.erro || `HTTP ${resposta.status}`);

    // deu certo: avisa, limpa o formulário e recarrega a lista
    mostrarMensagem('Evento cadastrado com sucesso!', 'sucesso');
    form.reset();
    carregarEventos();
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(`Erro ao cadastrar: ${erro.message}`, 'erro');
  } finally {
    // reativa o botão, dando certo ou não
    btnSalvar.disabled = false;
  }
});

// botao "Atualizar" recarrega a lista
btnAtualizar.addEventListener('click', carregarEventos);

// quando a página abre, já carrega os eventos
carregarEventos();