let metas = []; // Armazena todas as metas
let etapasForm = []; // Etapas temporárias do formulário
let chartInstances = {}; // Gráficos das metas financeiras

// Navegação
function abrirMetas() {
    const mainContainer = document.getElementById('mainContainer');
    const metasPage = document.getElementById('metasPage');
    mainContainer.style.display = 'none';
    metasPage.style.display = 'block';
    renderMetas();
}

function fecharMetas() {
    const mainContainer = document.getElementById('mainContainer');
    const metasPage = document.getElementById('metasPage');
    metasPage.style.display = 'none';
    mainContainer.style.display = 'block'; // Corrigido aqui!
    renderResumoMetasHome();
}

// Campos dinâmicos do formulário
function atualizaExibeCamposMeta() {
    const tipo = document.getElementById('tipoMeta').value;
    document.getElementById('valorAlvo').style.display = tipo === "financeira" ? "block" : "none";
    document.getElementById('etapasBoxForm').style.display = tipo === "normal" ? "block" : "none";
    document.getElementById('obsMetaForm').style.display = tipo === "normal" ? "block" : "none";
    document.getElementById('dataAlvoForm').style.display = tipo === "normal" ? "block" : "none";
}

// Frase motivacional
function editarFraseMotivacional() {
    let frase = prompt("Digite sua frase motivacional:");
    if (frase && frase.trim().length > 2) {
        document.getElementById('motivacionalFrase').innerText = frase.trim();
    }
}

// Etapas do formulário
function adicionarEtapaForm() {
    let val = document.getElementById('novaEtapa').value.trim();
    if (val.length > 0) {
        etapasForm.push({ texto: val, feita: false });
        document.getElementById('novaEtapa').value = "";
        renderEtapasForm();
    }
}
function removerEtapaForm(idx) {
    etapasForm.splice(idx, 1);
    renderEtapasForm();
}
function renderEtapasForm() {
    let html = "";
    etapasForm.forEach((etapa, idx) => {
        html += `<li>
            <input type="checkbox" disabled>
            <span>${etapa.texto}</span>
            <button type="button" onclick="removerEtapaForm(${idx})" style="background:#ff6464;margin-left:6px;font-size:.92em;">Remover</button>
        </li>`;
    });
    document.getElementById('listaEtapasForm').innerHTML = html;
}

// Adiciona novo valor a uma meta financeira
function adicionarValor(idx) {
    let valor = prompt("Quanto deseja guardar esse mês?");
    valor = parseFloat(valor);
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido!");

    let meta = metas[idx];
    let hoje = new Date();
    let mesAno = ("0" + (hoje.getMonth() + 1)).slice(-2) + "/" + hoje.getFullYear();

    if (!meta.depositos) meta.depositos = [];
    let dep = meta.depositos.find(d => d.mes === mesAno);
    if (dep) dep.valor += valor;
    else meta.depositos.push({ mes: mesAno, valor: valor });

    meta.valorAtual = (meta.valorAtual || 0) + valor;
    if (meta.valorAtual > meta.valorAlvo) meta.valorAtual = meta.valorAlvo;

    renderMetas();
    renderResumoMetasHome();
}

// Gráficos com Chart.js
function graficosMetasFinanceiras(meta, idCanvas) {
    const ctx = document.getElementById(idCanvas);
    if (!ctx) return;
    const context = ctx.getContext('2d');

    if (chartInstances[idCanvas]) chartInstances[idCanvas].destroy();

    const depositosOrdenados = (meta.depositos || []).sort((a, b) => {
        const [mA, aA] = a.mes.split('/').map(Number);
        const [mB, aB] = b.mes.split('/').map(Number);
        return (aA * 12 + mA) - (aB * 12 + mB);
    }).slice(-6);

    const labels = depositosOrdenados.map(d => d.mes);
    const data = depositosOrdenados.map(d => d.valor);

    chartInstances[idCanvas] = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor Guardado (R$)',
                data: data,
                backgroundColor: '#a75df2',
                borderColor: '#5e00c7',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#e7d5ff' },
                    grid: { color: '#38245d' }
                },
                x: {
                    ticks: { color: '#e7d5ff' },
                    grid: { color: '#38245d' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Toggle de etapas concluídas
function toggleEtapa(metaIdx, etapaIdx) {
    metas[metaIdx].etapas[etapaIdx].feita = !metas[metaIdx].etapas[etapaIdx].feita;
    renderMetas();
    renderResumoMetasHome();
}

// Remoção de metas
function removerMeta(idx) {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
        metas.splice(idx, 1);
        renderMetas();
        renderResumoMetasHome();
    }
}

// Envio do formulário de metas
document.getElementById('metaForm').onsubmit = function (e) {
    e.preventDefault();
    const titulo = document.getElementById('tituloMeta').value;
    const tipo = document.getElementById('tipoMeta').value;
    let novaMeta = {
        titulo: titulo,
        tipo: tipo,
        etapas: [],
        obs: '',
        dataAlvo: '',
        valorAlvo: 0,
        valorAtual: 0,
        depositos: []
    };

    if (tipo === "normal") {
        novaMeta.etapas = [...etapasForm];
        novaMeta.obs = document.getElementById('obsMetaForm').value;
        novaMeta.dataAlvo = document.getElementById('dataAlvoForm').value;
        if (novaMeta.etapas.length === 0) {
            return alert("Por favor, adicione pelo menos uma etapa.");
        }
    } else if (tipo === "financeira") {
        novaMeta.valorAlvo = parseFloat(document.getElementById('valorAlvo').value);
        if (isNaN(novaMeta.valorAlvo) || novaMeta.valorAlvo <= 0) {
            return alert("Valor alvo inválido.");
        }
    } else {
        return alert("Selecione o tipo da meta.");
    }

    metas.push(novaMeta);
    renderMetas();
    renderResumoMetasHome();
    this.reset();
    etapasForm = [];
    renderEtapasForm();
    atualizaExibeCamposMeta();
    document.getElementById('tipoMeta').value = "";
};

// Renderizar metas completas
function renderMetas() {
    let html = "";
    if (metas.length === 0) {
        html = "<div>Nenhuma meta cadastrada ainda.</div>";
    } else {
        metas.forEach((meta, i) => {
            let concluidaBadge = '';
            if (meta.tipo === 'normal' && meta.etapas.every(e => e.feita)) {
                concluidaBadge = '<span class="concluida-badge">Concluída!</span>';
            } else if (meta.tipo === 'financeira' && (meta.valorAtual || 0) >= (meta.valorAlvo || 0)) {
                concluidaBadge = '<span class="concluida-badge">Concluída!</span>';
            }

            html += `<div><b>${meta.titulo}</b> <span style="color:#a75df2;">[${meta.tipo}]</span> ${concluidaBadge}`;

            if (meta.dataAlvo) {
                html += `<div class="data-meta">Data alvo: ${new Date(meta.dataAlvo).toLocaleDateString('pt-BR')}</div>`;
            }
            if (meta.obs) {
                html += `<div class="obs-meta">Obs: ${meta.obs}</div>`;
            }

            if (meta.tipo === "normal") {
                html += `<div class="etapas-box"><ul class="etapas-list">`;
                meta.etapas.forEach((et, j) => {
                    html += `<li>
                        <input type="checkbox" onclick="toggleEtapa(${i},${j})" ${et.feita ? 'checked' : ''}>
                        <span>${et.texto}</span>
                    </li>`;
                });
                html += `</ul></div>`;
            }

            if (meta.tipo === "financeira") {
                let progresso = Math.min(100, ((meta.valorAtual || 0) / (meta.valorAlvo || 1) * 100)).toFixed(1);
                html += `
                <div style="font-size:.97em;color:#cdb6e2;">
                    Valor alvo: R$${meta.valorAlvo.toFixed(2).replace('.', ',')}
                    <br>Guardado: R$${meta.valorAtual.toFixed(2).replace('.', ',')}
                </div>
                <div style="height:13px;background:#38245d;border-radius:8px;margin:10px 0 7px 0;position:relative;overflow:hidden;">
                    <div style="position:absolute;left:0;top:0;bottom:0;width:${progresso}%;min-width:8px;
                    background:linear-gradient(90deg,#a75df2 70%,#5e00c7 100%);
                    border-radius:${progresso >= 99.9 ? '8px':'8px 0 0 8px'};transition:width .4s;height:100%;">
                    </div>
                    <span style="position:absolute;right:7px;top:-2px;font-size:.95em;color:#eee;z-index:1;">${progresso}%</span>
                </div>
                <button onclick="adicionarValor(${i})" style="background:#43a047;margin-bottom:10px;color:#fff;padding:3px 10px;border:none;border-radius:6px;cursor:pointer;">+ Guardar valor</button>
                <div style="margin-bottom:6px;">
                    <canvas id="graficoMeta${i}" height="130"></canvas>
                </div>`;
            }

            html += `<button onclick="removerMeta(${i})">Remover</button></div>`;
        });
    }

    document.getElementById('listaMetas').innerHTML = html;
    metas.forEach((meta, i) => {
        if (meta.tipo === "financeira") {
            graficosMetasFinanceiras(meta, `graficoMeta${i}`);
        }
    });
}

// Resumo na Home
function renderResumoMetasHome() {
    let html = `<div class="resumo-metas-titulo">Minhas Metas Atuais</div>`;
    const metasAtuais = metas.filter(meta =>
        (meta.tipo === 'financeira' && meta.valorAtual < meta.valorAlvo) ||
        (meta.tipo === 'normal' && meta.etapas.some(e => !e.feita))
    );
    if (metasAtuais.length === 0) {
        html += `<div style="color:#b7a9d6;font-size:.97em;margin-bottom:20px;">Nenhuma meta ativa no momento!</div>`;
    } else {
        metasAtuais.forEach(meta => {
            if (meta.tipo === 'financeira') {
                let progresso = Math.min(100, ((meta.valorAtual || 0) / (meta.valorAlvo || 1) * 100)).toFixed(1);
                html += `<div class="meta-card-home">
                    <div class="meta-titulo-home">${meta.titulo} <span style="color:#a75df2;">[Financeira]</span></div>
                    <div class="meta-info-home">Guardado: <b>R$${meta.valorAtual.toFixed(2).replace('.', ',')}</b> / R$${meta.valorAlvo.toFixed(2).replace('.', ',')}</div>
                    <div class="progress-bar-home">
                        <div class="progress-fill-home" style="width:${progresso}%;"></div>
                        <span class="progress-text-home">${progresso}%</span>
                    </div>
                </div>`;
            } else {
                let total = meta.etapas.length;
                let feitas = meta.etapas.filter(e => e.feita).length;
                let progresso = total ? Math.floor(feitas / total * 100) : 0;
                html += `<div class="meta-card-home">
                    <div class="meta-titulo-home">${meta.titulo} <span style="color:#a75df2;">[Normal]</span></div>
                    <div class="meta-info-home">${feitas} de ${total} etapas concluídas</div>
                    <div class="progress-bar-home">
                        <div class="progress-fill-home" style="width:${progresso}%;"></div>
                        <span class="progress-text-home">${progresso}%</span>
                    </div>
                    <ul class="etapas-home-list">${meta.etapas.map(e => `<li>${e.feita ? '✅' : '⬜'} ${e.texto}</li>`).join('')}</ul>
                </div>`;
            }
        });
    }
    html += `<button class="btn-ver-todas-metas" onclick="abrirMetas()">Ver todas as metas</button>`;
    document.getElementById('resumoMetasHome').innerHTML = html;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    metas = [
        { tipo: 'financeira', titulo: 'Moto dos sonhos', valorAtual: 3200, valorAlvo: 20000, depositos: [{ mes: '03/2025', valor: 1000 }, { mes: '04/2025', valor: 1200 }, { mes: '05/2025', valor: 1000 }] },
        { tipo: 'normal', titulo: 'Quitar dívidas', etapas: [{ texto: 'Pagar a primeira', feita: true }, { texto: 'Pagar a segunda', feita: false }, { texto: 'Pagar a terceira', feita: false }], obs: 'Negociar com o banco X', dataAlvo: '2025-12-31' },
        { tipo: 'financeira', titulo: 'Reserva de emergência', valorAtual: 1200, valorAlvo: 10000, depositos: [{ mes: '04/2025', valor: 500 }, { mes: '05/2025', valor: 700 }] },
        { tipo: 'normal', titulo: 'Estudar Inglês', etapas: [{ texto: 'Comprar livro', feita: true }, { texto: 'Fazer 10 aulas', feita: false }, { texto: 'Praticar 1 hora/dia', feita: false }], obs: 'Foco na conversação', dataAlvo: '2025-08-30' }
    ];
    renderResumoMetasHome();
});