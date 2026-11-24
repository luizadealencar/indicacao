const catalogo = document.querySelector("#catalogo");
const destaque = document.querySelector("#destaque");
const tituloCatalogo = document.querySelector("#titulo-catalogo");
const buscaForm = document.querySelector("#busca-form");
const campoBusca = document.querySelector("#busca");
const campoChave = document.querySelector("#chave");
const botaoSalvarChave = document.querySelector("#salvar-chave");
const chaveArea = document.querySelector("#chave-area");
const botoesCategoria = document.querySelectorAll(".categoria");
const botoesTipo = document.querySelectorAll(".tipo");
const modal = document.querySelector("#modal");
const detalhes = document.querySelector("#detalhes");
const botaoFecharModal = document.querySelector("#fechar-modal");

const URL_API = "https://api.themoviedb.org/3";
let chave = localStorage.getItem("tmdb-api-key") || "";
let categoriaAtual = "popular";
let tipoAtual = "movie";

function montarUrl(caminho, parametros = {}) {
    const url = new URL(`${URL_API}/${caminho}`);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("include_adult", "false");
    Object.entries(parametros).forEach(([nome, valor]) => {
        url.searchParams.set(nome, valor);
    });

    if (chave.includes(".") || chave.length > 40) {
        return { url: url.toString(), headers: { Authorization: `Bearer ${chave}` } };
    }

    url.searchParams.set("api_key", chave);
    return { url: url.toString(), headers: {} };
}

async function requisitar(caminho, parametros = {}) {
    if (!chave) throw new Error("Informe a chave da TMDB.");

    const requisicao = montarUrl(caminho, parametros);
    const resposta = await fetch(requisicao.url, { headers: requisicao.headers });
    if (!resposta.ok) throw new Error(`Erro da TMDB: ${resposta.status}`);
    return resposta.json();
}

function criarImagem(item) {
    if (!item.poster_path) return "https://placehold.co/500x750/101a2d/9aa7bd?text=Sem+Pôster";
    return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
}

function mostrarDestaque(item) {
    if (!item) {
        destaque.innerHTML = "";
        return;
    }

    const titulo = item.title || item.name;
    destaque.innerHTML = `
        <article>
            <img src="${criarImagem(item)}" alt="${titulo}">
            <div>
                <span class="nota">★ ${item.vote_average.toFixed(1)}</span>
                <h2>${titulo}</h2>
                <p>${item.overview || "Descricao indisponivel."}</p>
            </div>
        </article>
    `;
}

function mostrarCatalogo(itens) {
    catalogo.innerHTML = "";

    if (!itens.length) {
        catalogo.innerHTML = '<p class="mensagem">Nenhum conteudo encontrado.</p>';
        return;
    }

    itens.forEach((item) => {
        const artigo = document.createElement("article");
        artigo.className = "filme";
        artigo.tabIndex = 0;
        artigo.setAttribute("role", "button");
        artigo.setAttribute("aria-label", `Abrir ${item.title || item.name}`);
        artigo.addEventListener("click", () => abrirDetalhes(item.id));
        artigo.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter" || evento.key === " ") abrirDetalhes(item.id);
        });

        const imagem = document.createElement("img");
        imagem.src = criarImagem(item);
        imagem.alt = item.title || item.name;
        imagem.loading = "lazy";

        const informacoes = document.createElement("div");
        informacoes.className = "filme-info";

        const nome = document.createElement("h2");
        nome.textContent = item.title || item.name;

        const nota = document.createElement("p");
        const data = item.release_date || item.first_air_date;
        nota.textContent = `★ ${item.vote_average.toFixed(1)} • ${data?.slice(0, 4) || "Sem data"}`;

        informacoes.append(nome, nota);
        artigo.append(imagem, informacoes);
        catalogo.appendChild(artigo);
    });
}

async function abrirDetalhes(id) {
    try {
        detalhes.innerHTML = "<p>Carregando detalhes...</p>";
        modal.hidden = false;

        const item = await requisitar(`${tipoAtual}/${id}`, {
            append_to_response: "videos,credits"
        });
        const titulo = item.title || item.name;
        const data = item.release_date || item.first_air_date || "Sem data";
        const generos = item.genres?.map((genero) => genero.name).join(", ") || "Sem genero";

        detalhes.innerHTML = `
            <img src="${criarImagem(item)}" alt="${titulo}">
            <div>
                <span class="nota">★ ${item.vote_average.toFixed(1)}</span>
                <h2>${titulo}</h2>
                <p><strong>Data:</strong> ${data}</p>
                <p><strong>Generos:</strong> ${generos}</p>
                <p>${item.overview || "Descricao indisponivel."}</p>
            </div>
        `;
    } catch (erro) {
        detalhes.innerHTML = `<p>${erro.message}</p>`;
    }
}

async function carregarCategoria(categoria = "popular", nome = "Filmes populares") {
    try {
        tituloCatalogo.textContent = nome;
        catalogo.innerHTML = '<p class="mensagem">Carregando catalogo...</p>';
        destaque.innerHTML = "";

        let categoriaApi = categoria;
        if (tipoAtual === "tv") {
            if (categoria === "now_playing") categoriaApi = "on_the_air";
            if (categoria === "upcoming") categoriaApi = "airing_today";
        }

        const dados = await requisitar(`${tipoAtual}/${categoriaApi}`, { page: "1" });
        mostrarDestaque(dados.results[0]);
        mostrarCatalogo(dados.results);
    } catch (erro) {
        catalogo.innerHTML = `<p class="mensagem">${erro.message}</p>`;
    }
}

async function buscarFilmes() {
    const termo = campoBusca.value.trim();
    if (!termo) return;

    try {
        tituloCatalogo.textContent = `Resultados para "${termo}"`;
        catalogo.innerHTML = '<p class="mensagem">Buscando filmes...</p>';
        destaque.innerHTML = "";

        const dados = await requisitar(`search/${tipoAtual}`, { query: termo, page: "1" });
        mostrarDestaque(dados.results[0]);
        mostrarCatalogo(dados.results);
    } catch (erro) {
        catalogo.innerHTML = `<p class="mensagem">${erro.message}</p>`;
    }
}

botaoSalvarChave.addEventListener("click", () => {
    chave = campoChave.value.trim();
    if (!chave) return;

    localStorage.setItem("tmdb-api-key", chave);
    chaveArea.hidden = true;
    carregarCategoria(categoriaAtual);
});

buscaForm.addEventListener("submit", (evento) => {
    evento.preventDefault();
    buscarFilmes();
});

botoesTipo.forEach((botao) => {
    botao.addEventListener("click", () => {
        botoesTipo.forEach((item) => item.classList.remove("ativa"));
        botao.classList.add("ativa");
        tipoAtual = botao.dataset.tipo;

        const nomes = tipoAtual === "movie"
            ? "Filmes populares"
            : "Series populares";
        tituloCatalogo.textContent = nomes;
        campoBusca.placeholder = tipoAtual === "movie"
            ? "Buscar filmes..."
            : "Buscar series...";
        carregarCategoria("popular", nomes);
    });
});

botoesCategoria.forEach((botao) => {
    botao.addEventListener("click", () => {
        botoesCategoria.forEach((item) => item.classList.remove("ativa"));
        botao.classList.add("ativa");
        categoriaAtual = botao.dataset.categoria;
        const nomes = tipoAtual === "movie"
            ? {
                popular: "Filmes populares",
                top_rated: "Mais avaliados",
                now_playing: "Em cartaz",
                upcoming: "Em breve"
            }
            : {
                popular: "Series populares",
                top_rated: "Mais avaliadas",
                now_playing: "No ar",
                upcoming: "Hoje na TV"
            };
        carregarCategoria(categoriaAtual, nomes[categoriaAtual]);
    });
});

botaoFecharModal.addEventListener("click", () => {
    modal.hidden = true;
});

modal.addEventListener("click", (evento) => {
    if (evento.target === modal) modal.hidden = true;
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") modal.hidden = true;
});

if (chave) {
    campoChave.value = chave;
    chaveArea.hidden = true;
    carregarCategoria();
}
