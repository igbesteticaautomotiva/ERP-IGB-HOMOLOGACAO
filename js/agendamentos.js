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
    dataAtualFiltro = new Date(); // Inicia sempre no dia de hoje
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

// Nova função chamada pelo calendário invisível
function mudarDataPeloCalendario(dataStr) {
    if (!dataStr) return;
    // Separa a string YYYY-MM-DD para evitar bugs de fuso horário
    const [ano, mes, dia] = dataStr.split('-');
    dataAtualFiltro = new Date(ano, parseInt(mes) - 1, dia);
    
    atualizarLabelDataFiltro();
    loadAgendamentos();
}

function atualizarLabelDataFiltro() {
    // Atualiza o texto na tela
    document.getElementById('label-data-filtro').innerText = formatarDataExibicao(dataAtualFiltro);
    
    // Mantém o input invisível sincronizado com a data que estamos exibindo
    const inputFiltro = document.getElementById('input-data-filtro');
    if (inputFiltro) {
        inputFiltro.value = formatarDataParaBanco(dataAtualFiltro);
    }
}

function openModalAgendamento() {
    document.getElementById('modal-agendamento').classList.remove('hidden');
    if (!agendamentoEmEdicaoId) {
        document.getElementById('agen-data').value = formatarDataParaBanco(dataAtualFiltro);
        document.getElementById('agen-horario').value = "08:00";
        document.getElementById('agen-status').value = "Agendado";
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

    // Calculo dos Resumos (Cards)
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

    // Empty state
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
    const agendamento = {
        data_agendamento: document.getElementById('agen-data').value,
        horario: document.getElementById('agen-horario').value,
        cliente_nome: document.getElementById('agen-cliente').value,
        veiculo: document.getElementById('agen-veiculo').value,
        descricao: document.getElementById('agen-descricao').value,
        servicos: document.getElementById('agen-servicos').value,
        valor_total: desformatarMoeda(document.getElementById('agen-valor').value),
        status: document.getElementById('agen-status').value,
        apagado: 'N'
    };

    if (agendamentoEmEdicaoId) {
        await supabaseClient.from('agendamentos').update(agendamento).eq('id', agendamentoEmEdicaoId);
    } else {
        await supabaseClient.from('agendamentos').insert([agendamento]);
    }
    closeModalAgendamento();
    loadAgendamentos();
}

async function editarAgendamento(id) {
    const { data } = await supabaseClient.from('agendamentos').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('agen-data').value = data.data_agendamento;
        document.getElementById('agen-horario').value = data.horario.substring(0,5);
        document.getElementById('agen-cliente').value = data.cliente_nome;
        document.getElementById('agen-veiculo').value = data.veiculo || '';
        document.getElementById('agen-descricao').value = data.descricao || '';
        document.getElementById('agen-servicos').value = data.servicos || '';
        document.getElementById('agen-valor').value = formatarNumeroParaMoeda(data.valor_total);
        document.getElementById('agen-status').value = data.status;
        
        agendamentoEmEdicaoId = id;
        openModalAgendamento();
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
