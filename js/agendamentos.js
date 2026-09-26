// ==========================================
// MÓDULO AGENDAMENTOS
// ==========================================
let dataAtualFiltro = new Date();

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
    loadAgendamentos();
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
    document.getElementById('label-data-filtro').innerText = formatarDataExibicao(dataAtualFiltro);
    const inputFiltro = document.getElementById('input-data-filtro');
    if (inputFiltro) {
        inputFiltro.value = formatarDataParaBanco(dataAtualFiltro);
    }
}

async function carregarVeiculosDoCliente(clienteNome, veiculoPreSelecionado = null) {
    const selVeiculo = document.getElementById('agen-veiculo');
    selVeiculo.innerHTML = '<option value="" selected>Carregando...</option>';

    if (!clienteNome) {
        selVeiculo.innerHTML = '<option value="" selected>Selecione o cliente primeiro...</option>';
        return;
    }

    const { data: veiculos } = await supabaseClient
        .from('veiculos')
        .select('nome, cor')
        .eq('cliente_nome', clienteNome)
        .eq('apagado', 'N');

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
    if(clientes) {
        clientes.forEach(cli => {
            selCliente.innerHTML += `<option value="${cli.nome}">${cli.nome}</option>`;
        });
    }

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
    document.getElementById('agen-valor').value = formatarNumeroParaMoeda(total);
}

async function openModalAgendamento() {
    await carregarDadosFormularioAgendamento(); 
    
    document.getElementById('modal-agendamento').classList.remove('hidden');
    
    if (!agendamentoEmEdicaoId) {
        document.getElementById('agen-data').value = formatarDataParaBanco(dataAtualFiltro);
        document.getElementById('agen-horario').value = "08:00";
        document.getElementById('agen-status').value = "Agendado";
        document.getElementById('agen-valor').value = "";
        
        document.getElementById('agen-veiculo').innerHTML = '<option value="" selected>Selecione o cliente primeiro...</option>';
    }
}

function closeModalAgendamento() {
    document.getElementById('modal-agendamento').classList.add('hidden');
    document.getElementById('form-agendamento').reset();
    agendamentoEmEdicaoId = null;
}

async function loadAgendamentos() {
    if (!supabaseClient) return;
    
    const dataBanco = formatarDataParaBanco(dataAtualFiltro);
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('apagado', 'N')
        .eq('data_agendamento', dataBanco)
        .order('horario', { ascending: true });

    if (error) return console.error('Erro', error);

    const tbody = document.getElementById('tabela-agendamentos-body');
    tbody.innerHTML = '';
    document.getElementById('pesquisa-agendamentos').value = ''; 

    let countTotal = data.length;
    let countAndamento = 0;
    let countFinalizado = 0;
    let countCancelado = 0;

    data.forEach(item => {
        if(item.status === 'Em Andamento') countAndamento++;
        if(item.status === 'Finalizado') countFinalizado++;
        if(item.status === 'Cancelado') countCancelado++;
    });

    document.getElementById('card-agen-total').innerText = countTotal;
    document.getElementById('card-agen-andamento').innerText = countAndamento;
    document.getElementById('card-agen-finalizado').innerText = countFinalizado;
    document.getElementById('card-agen-cancelado').innerText = countCancelado;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-gray-400">
                    <div class="flex flex-col items-center justify-center">
                        <i class="ph ph-calendar-blank text-4xl mb-3 text-gray-300"></i>
                        <p>Nenhum agendamento para esta data.</p>
                    </div>
                </td>
            </tr>
        `;
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
            listaServicos.forEach(srv => {
                servicosHtml += `<span class="truncate" title="${srv}">• ${srv}</span>`;
            });
            servicosHtml += '</div>';
        }

        let horarioFormatado = item.horario.substring(0, 5); 

        tbody.innerHTML += `
            <tr class="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4 w-24 font-bold text-lg text-gray-900">${horarioFormatado}</td>
                <td class="py-4 px-4">
                    <span class="font-bold text-gray-900 block">${item.cliente_nome}</span>
                    <span class="text-xs text-gray-500 block">${item.veiculo || '-'}</span>
                </td>
                <td class="py-4 px-4 font-bold text-gray-800">${item.descricao}</td>
                <td class="py-4 px-4 w-64">${servicosHtml}</td>
                <td class="py-4 px-4 font-bold text-gray-900 w-32">R$ ${parseFloat(item.valor_total).toFixed(2).replace('.', ',')}</td>
                <td class="py-4 px-4 w-32 text-center">
                    <span class="px-3 py-1.5 rounded uppercase text-[10px] font-bold tracking-wider ${badgeClass}">
                        ${item.status.toUpperCase()}
                    </span>
                </td>
                <td class="py-4 px-4 w-24 text-center whitespace-nowrap">
                    <button onclick="editarAgendamento('${item.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors" title="Editar"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarAgendamento('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Apagar"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

async function salvarAgendamento(event) {
    event.preventDefault();
    
    const servicosSelecionados = Array.from(document.querySelectorAll('.chk-servico:checked'))
                                      .map(chk => chk.value)
                                      .join(', ');

    const agendamento = {
        data_agendamento: document.getElementById('agen-data').value,
        horario: document.getElementById('agen-horario').value,
        cliente_nome: document.getElementById('agen-cliente').value,
        veiculo: document.getElementById('agen-veiculo').value,
        descricao: document.getElementById('agen-descricao').value,
        servicos: servicosSelecionados, 
        valor_total: desformatarMoeda(document.getElementById('agen-valor').value),
        status: document.getElementById('agen-status').value,
        apagado: 'N'
    };

    if (agendamentoEmEdicaoId) {
        await supabaseClient.from('agendamentos').update(agendamento).eq('id', agendamentoEmEdicaoId);
    } else {
        await supabaseClient.from('agendamentos').insert([agendamento]);
        
        // Agora salva a categoria como "Agendamento" ao invés de jogar no título!
        const novoFinanceiro = {
            tipo: 'receber',
            categoria: 'Agendamento',
            descricao: agendamento.descricao,
            cliente: agendamento.cliente_nome,
            vencimento: agendamento.data_agendamento,
            valor_total: agendamento.valor_total,
            valor_pago: 0,
            status: 'Pendente',
            forma_pagamento: 'A Combinar',
            apagado: 'N',
            baixado: 'N',
            parcela: '1/1',
            grupo_id: gerarIdGrupo() 
        };
        
        await supabaseClient.from('financeiro').insert([novoFinanceiro]);
        
        if (typeof loadFinanceiro === 'function') {
            loadFinanceiro();
        }
    }
    
    closeModalAgendamento();
    loadAgendamentos();
}

async function editarAgendamento(id) {
    const { data } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
    if (data) {
        agendamentoEmEdicaoId = id; 
        await carregarDadosFormularioAgendamento();

        document.getElementById('agen-data').value = data.data_agendamento;
        document.getElementById('agen-horario').value = data.horario.substring(0,5);
        
        const selCliente = document.getElementById('agen-cliente');
        if(Array.from(selCliente.options).some(opt => opt.value === data.cliente_nome)) {
            selCliente.value = data.cliente_nome;
        } else {
            selCliente.innerHTML += `<option value="${data.cliente_nome}">${data.cliente_nome} (Inativo)</option>`;
            selCliente.value = data.cliente_nome;
        }

        await carregarVeiculosDoCliente(data.cliente_nome, data.veiculo);

        document.getElementById('agen-descricao').value = data.descricao || '';
        
        const servicosArray = (data.servicos || '').split(',').map(s => s.trim());
        document.querySelectorAll('.chk-servico').forEach(chk => {
            if(servicosArray.includes(chk.value)) {
                chk.checked = true;
            }
        });

        document.getElementById('agen-valor').value = formatarNumeroParaMoeda(data.valor_total);
        document.getElementById('agen-status').value = data.status;
        
        document.getElementById('modal-agendamento').classList.remove('hidden');
    }
}

async function deletarAgendamento(id) {
    if(confirm('Tem certeza que deseja apagar este agendamento?')) {
        await supabaseClient.from('agendamentos').update({ apagado: 'S' }).eq('id', id);
        loadAgendamentos();
    }
}

function pesquisarAgendamentos() {
    let input = document.getElementById("pesquisa-agendamentos").value.toLowerCase();
    let tr = document.getElementById("tabela-agendamentos").getElementsByTagName("tr");
    for (let i = 1; i < tr.length; i++) {
        if ((tr[i].textContent || tr[i].innerText).toLowerCase().indexOf(input) > -1) {
            tr[i].style.display = "";
        } else { tr[i].style.display = "none"; }
    }
}
