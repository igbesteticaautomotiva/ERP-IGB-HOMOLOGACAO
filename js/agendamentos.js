// ==========================================
// MÓDULO AGENDAMENTOS E ORÇAMENTOS
// ==========================================
var dataAtualFiltro = new Date();
var idEditAgendamento = null;
var idEditOrcamento = null;
var currentAgenTab = 'lista';

var cardsDataInicio = '';
var cardsDataFim = '';

function formatarDataParaBanco(data) {
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatarDataExibicao(data) {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const yyyy = data.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function initAgendamentos() {
    dataAtualFiltro = new Date(); 
    atualizarLabelDataFiltro();
    setarMesAtualCards(false); 
    loadAgendamentos();
}

function switchAgenTab(tab) {
    currentAgenTab = tab;
    const btnLista = document.getElementById('tab-agen-lista');
    const btnGrade = document.getElementById('tab-agen-grade');
    const btnOrca = document.getElementById('tab-agen-orcamentos');
    
    const contLista = document.getElementById('container-agen-lista');
    const contGrade = document.getElementById('container-agen-grade');
    const contOrca = document.getElementById('container-agen-orcamentos'); 
    
    const contCards = document.getElementById('agen-cards-wrapper');

    if (!btnLista || !btnGrade || !btnOrca) return;

    const classBtnAtivo = 'px-6 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold tracking-wider transition-colors shadow-sm';
    const classBtnInativo = 'px-6 py-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 text-[11px] font-bold tracking-wider transition-colors shadow-sm';

    btnLista.className = classBtnInativo;
    btnGrade.className = classBtnInativo;
    btnOrca.className = classBtnInativo;

    if(contLista) contLista.classList.add('hidden');
    if(contGrade) contGrade.classList.add('hidden');
    if(contOrca) contOrca.classList.add('hidden');

    if (tab === 'lista') {
        btnLista.className = classBtnAtivo;
        if(contLista) {
            contLista.classList.remove('hidden');
            contLista.classList.add('flex');
        }
        if (contCards) contCards.classList.remove('hidden');
        
    } else if (tab === 'grade') {
        btnGrade.className = classBtnAtivo;
        if(contGrade) contGrade.classList.remove('hidden');
        if (contCards) contCards.classList.add('hidden');
        
    } else if (tab === 'orcamentos') {
        btnOrca.className = classBtnAtivo;
        if(contOrca) {
            contOrca.classList.remove('hidden');
            contOrca.classList.add('flex');
        }
        if (contCards) contCards.classList.add('hidden');
    }
}

function mudarDataFiltro(dias) {
    dataAtualFiltro.setDate(dataAtualFiltro.getDate() + dias);
    atualizarLabelDataFiltro();
    loadAgendamentos();
}

function irParaHoje() {
    dataAtualFiltro = new Date();
    atualizarLabelDataFiltro();
    loadAgendamentos();
}

function mudarDataPeloCalendario(dataStr) {
    if (!dataStr) return;
    const [ano, mes, dia] = dataStr.split('-');
    dataAtualFiltro = new Date(ano, parseInt(mes) - 1, dia);
    atualizarLabelDataFiltro();
    loadAgendamentos();
}

function atualizarLabelDataFiltro() {
    const lbl = document.getElementById('label-data-filtro');
    if(lbl) lbl.innerText = formatarDataExibicao(dataAtualFiltro);
    const inputFiltro = document.getElementById('input-data-filtro');
    if (inputFiltro) inputFiltro.value = formatarDataParaBanco(dataAtualFiltro);
}

function abrirModalFiltroCards() {
    document.getElementById('filtro-card-inicio').value = cardsDataInicio;
    document.getElementById('filtro-card-fim').value = cardsDataFim;
    document.getElementById('modal-filtro-cards').classList.remove('hidden');
}

function fecharModalFiltroCards() {
    document.getElementById('modal-filtro-cards').classList.add('hidden');
}

function setarMesAtualCards(fecharModal = true) {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    cardsDataInicio = formatarDataParaBanco(primeiroDia);
    cardsDataFim = formatarDataParaBanco(ultimoDia);
    document.getElementById('filtro-card-inicio').value = cardsDataInicio;
    document.getElementById('filtro-card-fim').value = cardsDataFim;

    if (fecharModal) fecharModalFiltroCards();
    loadCardsAgendamentos();
}

function aplicarFiltroCards() {
    const i = document.getElementById('filtro-card-inicio').value;
    const f = document.getElementById('filtro-card-fim').value;
    
    if(!i || !f) { alert('Preencha as duas datas para aplicar o filtro!'); return; }
    
    cardsDataInicio = i;
    cardsDataFim = f;
    fecharModalFiltroCards();
    loadCardsAgendamentos();
}

async function loadCardsAgendamentos() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('status')
        .eq('apagado', 'N')
        .gte('data_agendamento', cardsDataInicio)
        .lte('data_agendamento', cardsDataFim);

    if (error) return console.error('Erro nos cards:', error);

    let countAndamento = 0, countFinalizado = 0, countCancelado = 0;
    if(data) {
        data.forEach(item => {
            if(item.status === 'Em Andamento') countAndamento++;
            if(item.status === 'Finalizado') countFinalizado++;
            if(item.status === 'Cancelado') countCancelado++;
        });
        document.getElementById('card-agen-total').innerText = data.length;
    } else {
        document.getElementById('card-agen-total').innerText = 0;
    }

    document.getElementById('card-agen-andamento').innerText = countAndamento;
    document.getElementById('card-agen-finalizado').innerText = countFinalizado;
    document.getElementById('card-agen-cancelado').innerText = countCancelado;

    const [aI, mI, dI] = cardsDataInicio.split('-');
    const [aF, mF, dF] = cardsDataFim.split('-');
    document.getElementById('label-periodo-cards').innerText = `${dI}/${mI} a ${dF}/${mF}`;
}


// ==========================================
// FUNÇÕES DE AGENDAMENTO (OFICIAL)
// ==========================================
async function carregarVeiculosDoCliente(clienteNome, veiculoPreSelecionado = null) {
    const selVeiculo = document.getElementById('agen-veiculo');
    selVeiculo.innerHTML = '<option value="" selected>Carregando...</option>';

    if (!clienteNome) {
        selVeiculo.innerHTML = '<option value="" selected>Selecione o cliente primeiro...</option>';
        return;
    }

    const { data: veiculos } = await supabaseClient.from('veiculos').select('nome, cor').eq('cliente_nome', clienteNome).eq('apagado', 'N');
    selVeiculo.innerHTML = '<option value="" selected>Nenhum veículo selecionado</option>'; 
    
    if (veiculos && veiculos.length > 0) {
        veiculos.forEach(v => {
            const desc = v.cor ? `${v.nome} (${v.cor})` : v.nome;
            const isSelected = (v.nome === veiculoPreSelecionado) ? 'selected' : '';
            selVeiculo.innerHTML += `<option value="${v.nome}" ${isSelected}>${desc}</option>`;
        });
    } else {
        selVeiculo.innerHTML = '<option value="" selected>Nenhum veículo cadastrado para este cliente</option>';
    }

    if (veiculoPreSelecionado && !veiculos?.some(v => v.nome === veiculoPreSelecionado)) {
         selVeiculo.innerHTML += `<option value="${veiculoPreSelecionado}" selected>${veiculoPreSelecionado} (Não cadastrado)</option>`;
    }
}

async function carregarDadosFormularioAgendamento() {
    if (!supabaseClient) return;
    const { data: clientes } = await supabaseClient.from('clientes').select('nome').eq('apagado', 'N').order('nome');
    const selCliente = document.getElementById('agen-cliente');
    selCliente.innerHTML = '<option value="" disabled selected>Selecione um cliente...</option>';
    if(clientes) clientes.forEach(cli => selCliente.innerHTML += `<option value="${cli.nome}">${cli.nome}</option>`);

    selCliente.onchange = () => carregarVeiculosDoCliente(selCliente.value);

    const { data: servicos } = await supabaseClient.from('servicos').select('nome, preco').eq('apagado', 'N').eq('status', 'Ativo').order('nome');
    const contServicos = document.getElementById('agen-servicos-container');
    contServicos.innerHTML = '';
    if(servicos && servicos.length > 0) {
        servicos.forEach(srv => {
            contServicos.innerHTML += `
                <label class="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm w-full md:w-auto">
                    <input type="checkbox" class="chk-servico rounded border-gray-300 text-blue-600 focus:ring-blue-500" value="${srv.nome}" data-preco="${srv.preco}" onchange="calcularTotalAgendamento()">
                    <span>${srv.nome} <span class="text-gray-400 text-xs">(R$ ${parseFloat(srv.preco).toFixed(2).replace('.', ',')})</span></span>
                </label>
            `;
        });
    } else {
        contServicos.innerHTML = '<span class="text-xs text-gray-400">Nenhum serviço ativo encontrado. Cadastre em "Serviços".</span>';
    }
}

function calcularTotalAgendamento() {
    let total = 0;
    document.querySelectorAll('.chk-servico:checked').forEach(chk => {
        total += parseFloat(chk.getAttribute('data-preco') || 0);
    });
    if (typeof formatarNumeroParaMoeda === 'function') {
        document.getElementById('agen-valor').value = formatarNumeroParaMoeda(total);
    } else {
        document.getElementById('agen-valor').value = total.toFixed(2).replace('.', ',');
    }
}

// CONTROLADOR DE MODAIS: Decide se abre Agendamento ou Orçamento
async function openModalAgendamentoMaster() {
    if (currentAgenTab === 'orcamentos') {
        await openModalOrcamento();
    } else {
        await openModalAgendamento();
    }
}

async function openModalAgendamento() {
    await carregarDadosFormularioAgendamento(); 
    document.getElementById('modal-agendamento').classList.remove('hidden');
    
    if (!idEditAgendamento) {
        document.getElementById('form-agendamento').reset();
        document.getElementById('agen-data').value = formatarDataParaBanco(dataAtualFiltro);
        document.getElementById('agen-horario').value = "08:00";
        document.getElementById('agen-horario-fim').value = "";
        document.getElementById('agen-status').value = "Agendado";
        document.getElementById('agen-valor').value = "";
        document.getElementById('agen-veiculo').innerHTML = '<option value="" selected>Selecione o cliente primeiro...</option>';
    }
}

function closeModalAgendamento() {
    document.getElementById('modal-agendamento').classList.add('hidden');
    document.getElementById('form-agendamento').reset();
    idEditAgendamento = null;
}

// ==========================================
// FUNÇÕES DE ORÇAMENTO (TELA SIMPLIFICADA)
// ==========================================
async function carregarServicosOrcamento() {
    if (!supabaseClient) return;
    const { data: servicos } = await supabaseClient.from('servicos').select('nome, preco').eq('apagado', 'N').eq('status', 'Ativo').order('nome');
    const contServicos = document.getElementById('orc-servicos-container');
    contServicos.innerHTML = '';
    if(servicos && servicos.length > 0) {
        servicos.forEach(srv => {
            contServicos.innerHTML += `
                <label class="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm w-full md:w-auto">
                    <input type="checkbox" class="chk-servico-orc rounded border-purple-300 text-purple-600 focus:ring-purple-500" value="${srv.nome}" data-preco="${srv.preco}" onchange="calcularTotalOrcamento()">
                    <span>${srv.nome} <span class="text-gray-400 text-xs">(R$ ${parseFloat(srv.preco).toFixed(2).replace('.', ',')})</span></span>
                </label>
            `;
        });
    }
}

function calcularTotalOrcamento() {
    let total = 0;
    document.querySelectorAll('.chk-servico-orc:checked').forEach(chk => {
        total += parseFloat(chk.getAttribute('data-preco') || 0);
    });
    if (typeof formatarNumeroParaMoeda === 'function') {
        document.getElementById('orc-valor').value = formatarNumeroParaMoeda(total);
    } else {
        document.getElementById('orc-valor').value = total.toFixed(2).replace('.', ',');
    }
}

async function openModalOrcamento() {
    await carregarServicosOrcamento();
    document.getElementById('modal-orcamento').classList.remove('hidden');
    
    if (!idEditOrcamento) {
        document.getElementById('form-orcamento').reset();
        document.getElementById('orc-data').value = formatarDataParaBanco(dataAtualFiltro);
        document.getElementById('orc-status').value = "Orçamento";
    }
}

function closeModalOrcamento() {
    document.getElementById('modal-orcamento').classList.add('hidden');
    document.getElementById('form-orcamento').reset();
    idEditOrcamento = null;
}

// Salva Orçamentos Simples (Sem horário)
async function salvarOrcamento(event) {
    event.preventDefault();
    
    const servicosSelecionados = Array.from(document.querySelectorAll('.chk-servico-orc:checked')).map(chk => chk.value).join(', ');
    let valorPuro = document.getElementById('orc-valor').value || '0';
    let valorCalculado = parseFloat(valorPuro.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

    const orcamento = {
        data_agendamento: document.getElementById('orc-data').value,
        horario: '08:00', // Padrão escondido para o DB aceitar
        horario_fim: null, // Sem horário fim
        cliente_nome: document.getElementById('orc-cliente').value,
        veiculo: document.getElementById('orc-veiculo').value,
        descricao: document.getElementById('orc-descricao').value,
        servicos: servicosSelecionados, 
        valor_total: valorCalculado,
        status: document.getElementById('orc-status').value, 
        apagado: 'N'
    };

    if (idEditOrcamento) {
        await supabaseClient.from('agendamentos').update(orcamento).eq('id', idEditOrcamento);
        // Se aprovou para Agendado, cria financeiro!
        if (orcamento.status === 'Agendado' || orcamento.status === 'Em Andamento' || orcamento.status === 'Finalizado') {
            const { data: finData } = await supabaseClient.from('financeiro').select('id').eq('agendamento_id', idEditOrcamento).single();
            if (!finData) {
                const geradorId = typeof gerarIdGrupo === 'function' ? gerarIdGrupo() : Date.now().toString();
                const novoFinanceiro = { tipo: 'receber', categoria: 'Agendamento', descricao: orcamento.descricao, servicos: orcamento.servicos, cliente: orcamento.cliente_nome, vencimento: orcamento.data_agendamento, valor_total: orcamento.valor_total, valor_pago: 0, status: 'Pendente', forma_pagamento: 'A Combinar', apagado: 'N', baixado: 'N', parcela: '1/1', grupo_id: geradorId, agendamento_id: idEditOrcamento };
                await supabaseClient.from('financeiro').insert([novoFinanceiro]);
            }
        }
    } else {
        const { data: insertedData } = await supabaseClient.from('agendamentos').insert([orcamento]).select();
        // Se já criou direto como Agendado, cria financeiro
        if (insertedData && insertedData.length > 0 && orcamento.status !== 'Orçamento' && orcamento.status !== 'Cancelado') {
            const novoId = insertedData[0].id;
            const geradorId = typeof gerarIdGrupo === 'function' ? gerarIdGrupo() : Date.now().toString();
            const novoFinanceiro = { tipo: 'receber', categoria: 'Agendamento', descricao: orcamento.descricao, servicos: orcamento.servicos, cliente: orcamento.cliente_nome, vencimento: orcamento.data_agendamento, valor_total: orcamento.valor_total, valor_pago: 0, status: 'Pendente', forma_pagamento: 'A Combinar', apagado: 'N', baixado: 'N', parcela: '1/1', grupo_id: geradorId, agendamento_id: novoId };
            await supabaseClient.from('financeiro').insert([novoFinanceiro]);
        }
    }
    
    closeModalOrcamento();
    loadAgendamentos();
    if (typeof loadFinanceiro === 'function') loadFinanceiro();
}


async function salvarAgendamento(event) {
    event.preventDefault();
    
    const servicosSelecionados = Array.from(document.querySelectorAll('.chk-servico:checked')).map(chk => chk.value).join(', ');
    let valorPuro = document.getElementById('agen-valor').value || '0';
    let valorCalculado = parseFloat(valorPuro.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    
    let hFim = document.getElementById('agen-horario-fim').value;

    const agendamento = {
        data_agendamento: document.getElementById('agen-data').value,
        horario: document.getElementById('agen-horario').value,
        horario_fim: hFim ? hFim : null,
        cliente_nome: document.getElementById('agen-cliente').value,
        veiculo: document.getElementById('agen-veiculo').value,
        descricao: document.getElementById('agen-descricao').value,
        servicos: servicosSelecionados, 
        valor_total: valorCalculado,
        status: document.getElementById('agen-status').value,
        apagado: 'N'
    };

    if (idEditAgendamento) {
        await supabaseClient.from('agendamentos').update(agendamento).eq('id', idEditAgendamento);
        const { data: finData } = await supabaseClient.from('financeiro').select('id, valor_pago').eq('agendamento_id', idEditAgendamento).single();
        if (finData) {
            let novoStatus = 'Pendente';
            if (parseFloat(finData.valor_pago) >= parseFloat(agendamento.valor_total) && parseFloat(agendamento.valor_total) > 0) novoStatus = 'Pago';
            const updateFin = { descricao: agendamento.descricao, servicos: agendamento.servicos, cliente: agendamento.cliente_nome, vencimento: agendamento.data_agendamento, valor_total: agendamento.valor_total, status: novoStatus };
            await supabaseClient.from('financeiro').update(updateFin).eq('id', finData.id);
        }
        if (typeof loadFinanceiro === 'function') loadFinanceiro();
    } else {
        const { data: insertedData } = await supabaseClient.from('agendamentos').insert([agendamento]).select();
        if (insertedData && insertedData.length > 0 && agendamento.status !== 'Orçamento' && agendamento.status !== 'Cancelado') {
            const novoId = insertedData[0].id;
            const geradorId = typeof gerarIdGrupo === 'function' ? gerarIdGrupo() : Date.now().toString();
            const novoFinanceiro = { tipo: 'receber', categoria: 'Agendamento', descricao: agendamento.descricao, servicos: agendamento.servicos, cliente: agendamento.cliente_nome, vencimento: agendamento.data_agendamento, valor_total: agendamento.valor_total, valor_pago: 0, status: 'Pendente', forma_pagamento: 'A Combinar', apagado: 'N', baixado: 'N', parcela: '1/1', grupo_id: geradorId, agendamento_id: novoId };
            await supabaseClient.from('financeiro').insert([novoFinanceiro]);
            if (typeof loadFinanceiro === 'function') loadFinanceiro();
        }
    }
    
    closeModalAgendamento();
    loadAgendamentos();
}

async function editarAgendamento(id) {
    const { data } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
    if (data) {
        
        // IDENTIFICA SE É ORÇAMENTO OU AGENDAMENTO
        if (data.status === 'Orçamento') {
            idEditOrcamento = id;
            await carregarServicosOrcamento();
            
            document.getElementById('orc-data').value = data.data_agendamento;
            document.getElementById('orc-cliente').value = data.cliente_nome || '';
            document.getElementById('orc-veiculo').value = data.veiculo || '';
            document.getElementById('orc-descricao').value = data.descricao || '';
            
            const servicosArray = (data.servicos || '').split(',').map(s => s.trim());
            document.querySelectorAll('.chk-servico-orc').forEach(chk => {
                if(servicosArray.includes(chk.value)) chk.checked = true;
            });

            document.getElementById('orc-valor').value = parseFloat(data.valor_total || 0).toFixed(2).replace('.', ',');
            document.getElementById('orc-status').value = data.status;
            
            document.getElementById('modal-orcamento').classList.remove('hidden');

        } else {
            // FLUXO NORMAL (AGENDAMENTO)
            idEditAgendamento = id; 
            await carregarDadosFormularioAgendamento();

            document.getElementById('agen-data').value = data.data_agendamento;
            document.getElementById('agen-horario').value = data.horario.substring(0,5);
            document.getElementById('agen-horario-fim').value = data.horario_fim ? data.horario_fim.substring(0,5) : "";
            
            const selCliente = document.getElementById('agen-cliente');
            if(Array.from(selCliente.options).some(opt => opt.value === data.cliente_nome)) {
                selCliente.value = data.cliente_nome;
            } else {
                selCliente.innerHTML += `<option value="${data.cliente_nome}">${data.cliente_nome} (Não Cadastrado)</option>`;
                selCliente.value = data.cliente_nome;
            }

            await carregarVeiculosDoCliente(data.cliente_nome, data.veiculo);

            document.getElementById('agen-descricao').value = data.descricao || '';
            
            const servicosArray = (data.servicos || '').split(',').map(s => s.trim());
            document.querySelectorAll('.chk-servico').forEach(chk => {
                if(servicosArray.includes(chk.value)) chk.checked = true;
            });

            document.getElementById('agen-valor').value = parseFloat(data.valor_total || 0).toFixed(2).replace('.', ',');
            document.getElementById('agen-status').value = data.status;
            document.getElementById('modal-agendamento').classList.remove('hidden');
        }
    }
}

async function deletarAgendamento(id) {
    if(confirm('Tem certeza que deseja apagar este registro?')) {
        await supabaseClient.from('agendamentos').update({ apagado: 'S' }).eq('id', id);
        await supabaseClient.from('financeiro').update({ apagado: 'S' }).eq('agendamento_id', id);
        loadAgendamentos();
        if (typeof loadFinanceiro === 'function') loadFinanceiro();
    }
}


// ==========================================
// RENDERIZAÇÃO NA TELA
// ==========================================
async function loadAgendamentos() {
    if (!supabaseClient) return;

    if (!cardsDataInicio) setarMesAtualCards(false); 
    else loadCardsAgendamentos();
    
    const dataBanco = formatarDataParaBanco(dataAtualFiltro);
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('apagado', 'N')
        .eq('data_agendamento', dataBanco)
        .order('horario', { ascending: true });

    if (error) return console.error('Erro ao carregar a lista de agendamentos:', error);

    const dataAgendamentosReais = data.filter(d => d.status !== 'Orçamento');
    const dataOrcamentos = data.filter(d => d.status === 'Orçamento');

    renderTabelaLista(dataAgendamentosReais);
    renderTabelaOrcamentos(dataOrcamentos);
    renderGradeVisual(dataAgendamentosReais);
}

function renderTabelaLista(data) {
    const tbody = document.getElementById('tabela-agendamentos-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-gray-400"><div class="flex flex-col items-center justify-center"><i class="ph ph-calendar-blank text-4xl mb-3 text-gray-300"></i><p>Nenhum agendamento para esta data na tabela.</p></div></td></tr>`;
        return;
    }

    data.forEach(item => {
        let badgeClass = "bg-gray-200 text-gray-700";
        if(item.status === 'Finalizado') badgeClass = "bg-[#4ade80] text-green-900"; 
        else if(item.status === 'Em Andamento') badgeClass = "bg-[#cceb34] text-[#6b7c10]"; 
        else if(item.status === 'Cancelado') badgeClass = "bg-[#f87171] text-red-900"; 
        else if(item.status === 'Agendado') badgeClass = "bg-[#eaeffc] text-[#6185eb]"; 

        let servicosHtml = '-';
        if (item.servicos) {
            let listaServicos = item.servicos.split(',').map(s => s.trim()).filter(s => s);
            servicosHtml = '<div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">';
            listaServicos.forEach(srv => { servicosHtml += `<span class="truncate" title="${srv}">• ${srv}</span>`; });
            servicosHtml += '</div>';
        }

        let horarioFormatado = item.horario.substring(0, 5); 
        if (item.horario_fim) horarioFormatado += `<br><span class="text-[10px] text-gray-400 font-normal">até ${item.horario_fim.substring(0,5)}</span>`;
        let valorFormatado = parseFloat(item.valor_total).toFixed(2).replace('.', ',');

        tbody.innerHTML += `
            <tr class="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4 w-32"><span class="font-bold text-gray-900 block text-sm">${horarioFormatado}</span></td>
                <td class="py-4 px-4"><span class="font-bold text-gray-900 block">${item.cliente_nome}</span><span class="text-xs text-gray-500 block">${item.veiculo || '-'}</span></td>
                <td class="py-4 px-4 font-bold text-gray-800">${item.descricao}</td>
                <td class="py-4 px-4 w-64">${servicosHtml}</td>
                <td class="py-4 px-4 font-bold text-gray-900 w-32">R$ ${valorFormatado}</td>
                <td class="py-4 px-4 w-32 text-center"><span class="px-3 py-1.5 rounded uppercase text-[10px] font-bold tracking-wider ${badgeClass}">${item.status.toUpperCase()}</span></td>
                <td class="py-4 px-4 w-24 text-center whitespace-nowrap">
                    <button onclick="editarAgendamento('${item.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors" title="Editar"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarAgendamento('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Apagar"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

// Renderiza a tabela exclusiva de Orçamentos com a Data ao invés do Horário
function renderTabelaOrcamentos(data) {
    const tbody = document.getElementById('tabela-orcamentos-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-gray-400"><div class="flex flex-col items-center justify-center"><i class="ph ph-clipboard-text text-4xl mb-3 text-gray-300"></i><p>Nenhum orçamento cadastrado para esta data.</p></div></td></tr>`;
        return;
    }

    data.forEach(item => {
        let badgeClass = "bg-[#f3e8ff] text-purple-900 border border-purple-200"; 
        let servicosHtml = '-';
        if (item.servicos) {
            let listaServicos = item.servicos.split(',').map(s => s.trim()).filter(s => s);
            servicosHtml = '<div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">';
            listaServicos.forEach(srv => { servicosHtml += `<span class="truncate" title="${srv}">• ${srv}</span>`; });
            servicosHtml += '</div>';
        }

        let dataFormatada = item.data_agendamento.split('-').reverse().join('/');
        let valorFormatado = parseFloat(item.valor_total).toFixed(2).replace('.', ',');

        tbody.innerHTML += `
            <tr class="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4 w-32"><span class="font-bold text-gray-900 block text-sm">${dataFormatada}</span></td>
                <td class="py-4 px-4"><span class="font-bold text-gray-900 block">${item.cliente_nome}</span><span class="text-xs text-gray-500 block">${item.veiculo || '-'}</span></td>
                <td class="py-4 px-4 font-bold text-gray-800">${item.descricao}</td>
                <td class="py-4 px-4 w-64">${servicosHtml}</td>
                <td class="py-4 px-4 font-bold text-gray-900 w-32">R$ ${valorFormatado}</td>
                <td class="py-4 px-4 w-32 text-center"><span class="px-3 py-1.5 rounded uppercase text-[10px] font-bold tracking-wider shadow-sm ${badgeClass}">${item.status.toUpperCase()}</span></td>
                <td class="py-4 px-4 w-24 text-center whitespace-nowrap">
                    <button onclick="editarAgendamento('${item.id}')" class="text-gray-400 hover:text-purple-600 mx-1 transition-colors" title="Editar/Aprovar"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarAgendamento('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Apagar"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderGradeVisual(data) {
    const contGrade = document.getElementById('container-agen-grade');
    if (!contGrade) return;

    let horariosBase = [];
    for (let h = 6; h <= 19; h++) {
        let hStr = String(h).padStart(2, '0');
        horariosBase.push(`${hStr}:00`);
        if (h < 19) horariosBase.push(`${hStr}:30`);
    }
    
    data.forEach(item => {
        let hInicio = item.horario.substring(0,5);
        if(!horariosBase.includes(hInicio)) horariosBase.push(hInicio);
        if (item.horario_fim) {
            let hFim = item.horario_fim.substring(0,5);
            if(!horariosBase.includes(hFim)) horariosBase.push(hFim);
        }
    });
    horariosBase = [...new Set(horariosBase)].sort(); 

    let gradeHtml = `
    <div class="bg-white rounded-[24px] p-5 md:p-6 shadow-sm border border-gray-100 w-full mb-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3 mb-6">
    `;

    horariosBase.forEach(hora => {
        let agendamentosNesteHorario = data.filter(a => {
            let inicio = a.horario.substring(0,5);
            let fim = a.horario_fim ? a.horario_fim.substring(0,5) : null;
            if (fim) return hora >= inicio && hora <= fim;
            else return hora === inicio;
        });

        if (agendamentosNesteHorario.length === 1) {
            let agen = agendamentosNesteHorario[0]; 
            let nomeStatus = agen.status === 'Finalizado' ? 'Concluído' : 'Agendado';
            
            gradeHtml += `
                <div onclick="editarAgendamento('${agen.id}')" class="bg-[#f5f5f5] border border-gray-200 rounded-[12px] flex flex-col items-center justify-center min-h-[75px] w-full px-2 py-1.5 cursor-pointer hover:bg-gray-200 hover:border-gray-300 transition-colors shadow-sm overflow-hidden" title="${agen.cliente_nome} - ${agen.descricao || ''}">
                    <span class="text-gray-400 font-bold text-[18px] leading-none mb-1">${hora}</span>
                    <span class="text-gray-800 text-[10px] font-bold uppercase tracking-wider mb-0.5">${nomeStatus}</span>
                    <span class="text-gray-600 text-[10px] font-medium truncate w-full text-center leading-tight">${agen.cliente_nome}</span>
                </div>
            `;
        } else if (agendamentosNesteHorario.length > 1) {
            agendamentosNesteHorario.sort((a,b) => a.horario.localeCompare(b.horario));
            gradeHtml += `<div class="bg-[#f5f5f5] border border-gray-200 rounded-[12px] flex flex-col items-center justify-start min-h-[75px] w-full p-1.5 shadow-sm gap-1"><span class="text-gray-400 font-bold text-[12px] leading-none mb-0.5">${hora}</span>`;
            agendamentosNesteHorario.forEach(agen => {
                let nomeStatus = agen.status === 'Finalizado' ? 'Concluído' : 'Agendado';
                gradeHtml += `
                    <div onclick="editarAgendamento('${agen.id}')" class="w-full bg-white border border-gray-200 rounded-md p-1 flex flex-col items-center cursor-pointer hover:border-gray-400 transition-colors shrink-0" title="${agen.cliente_nome} - Início: ${agen.horario.substring(0,5)}">
                        <span class="text-gray-800 text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5">${nomeStatus}</span>
                        <span class="text-gray-600 text-[9px] font-medium truncate w-full text-center leading-none">${agen.cliente_nome}</span>
                    </div>
                `;
            });
            gradeHtml += `</div>`;
        } else {
            gradeHtml += `
                <div onclick="abrirModalAgendamentoHorario('${hora}')" class="bg-white border-[1.5px] border-[#a1c4fd] rounded-[12px] flex flex-col items-center justify-center min-h-[75px] w-full p-2 cursor-pointer hover:bg-[#f2f6ff] hover:border-blue-400 transition-colors shadow-sm">
                    <span class="text-[#3366ff] font-bold text-[18px] leading-none">${hora}</span>
                </div>
            `;
        }
    });

    gradeHtml += `</div></div>`;
    contGrade.innerHTML = gradeHtml;
}

// Filtro Múltiplo para todas as 3 Views!
function pesquisarAgendamentos() {
    let input = document.getElementById("pesquisa-agendamentos").value.toLowerCase();
    
    let trLista = document.getElementById("tabela-agendamentos").getElementsByTagName("tr");
    for (let i = 1; i < trLista.length; i++) {
        if (trLista[i].getElementsByTagName("td").length > 1) { 
            if ((trLista[i].textContent || trLista[i].innerText).toLowerCase().indexOf(input) > -1) trLista[i].style.display = "";
            else trLista[i].style.display = "none";
        }
    }

    let trOrca = document.getElementById("tabela-orcamentos").getElementsByTagName("tr");
    for (let i = 1; i < trOrca.length; i++) {
        if (trOrca[i].getElementsByTagName("td").length > 1) { 
            if ((trOrca[i].textContent || trOrca[i].innerText).toLowerCase().indexOf(input) > -1) trOrca[i].style.display = "";
            else trOrca[i].style.display = "none";
        }
    }
    
    let gradeContainer = document.getElementById("grade-agendamentos-body");
    if(gradeContainer) {
        let cards = gradeContainer.children[0].children[0].children; // Acessa os cards dentro do grid
        for(let i = 0; i < cards.length; i++) {
            if((cards[i].textContent || cards[i].innerText).toLowerCase().indexOf(input) > -1) cards[i].style.display = "";
            else cards[i].style.display = "none";
        }
    }
}
