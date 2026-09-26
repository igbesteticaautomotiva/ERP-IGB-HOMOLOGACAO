// ==========================================
// MÓDULO VEÍCULOS
// ==========================================
function openModalVeiculo() {
    openModal('modal-veiculo');
    if (!veiculoEmEdicaoId) {
        document.getElementById('vei-status').value = "Ativo";
    }
}

function closeModalVeiculo() {
    closeModal('modal-veiculo');
}

async function loadVeiculos() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('veiculos')
        .select('*')
        .eq('apagado', 'N')
        .order('created_at', { ascending: false });

    if (error) return console.error('Erro', error);

    const tbody = document.getElementById('tabela-veiculos-body');
    tbody.innerHTML = '';
    document.getElementById('pesquisa-veiculos').value = ''; 

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-gray-400">
                    <div class="flex flex-col items-center justify-center">
                        <i class="ph ph-car text-4xl mb-3 text-gray-300"></i>
                        <p>Nenhum veículo cadastrado.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        // Formatar Badge de Status
        let badgeClass = "bg-gray-200 text-gray-700";
        if(item.status === 'Ativo') badgeClass = "bg-[#4ade80] text-green-900"; // Verde
        else if(item.status === 'Inativo') badgeClass = "bg-[#f87171] text-red-900"; // Vermelho

        // Tratar formatação dupla nas colunas
        const telefoneHtml = item.cliente_telefone ? `<span class="text-xs text-gray-500 block">${item.cliente_telefone}</span>` : '';
        const ultimoServData = item.ultimo_servico_data ? `<span class="text-xs text-gray-500 block">${item.ultimo_servico_data.split('-').reverse().join('/')}</span>` : '';

        tbody.innerHTML += `
            <tr class="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 font-bold text-gray-900 text-sm">${item.nome}</td>
                <td class="py-4 px-6">
                    <span class="font-bold text-gray-900 block text-sm">${item.cliente_nome}</span>
                    ${telefoneHtml}
                </td>
                <td class="py-4 px-6 font-bold text-gray-800 text-sm">${item.cor || '-'}</td>
                <td class="py-4 px-6 font-bold text-gray-800 text-sm">${item.ano || '-'}</td>
                <td class="py-4 px-6">
                    <span class="px-3 py-1.5 rounded uppercase text-[10px] font-bold tracking-wider ${badgeClass}">
                        ${item.status.toUpperCase()}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <span class="font-bold text-gray-900 block text-sm">${item.ultimo_servico_nome || '-'}</span>
                    ${ultimoServData}
                </td>
                <td class="py-4 px-6 text-center whitespace-nowrap">
                    <button onclick="editarVeiculo('${item.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors" title="Editar"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarVeiculo('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Apagar"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

async function salvarVeiculo(event) {
    event.preventDefault();
    const veiculo = {
        nome: document.getElementById('vei-nome').value,
        cliente_nome: document.getElementById('vei-cliente-nome').value,
        cliente_telefone: document.getElementById('vei-cliente-telefone').value,
        cor: document.getElementById('vei-cor').value,
        ano: document.getElementById('vei-ano').value,
        ultimo_servico_nome: document.getElementById('vei-ultimo-nome').value,
        ultimo_servico_data: document.getElementById('vei-ultimo-data').value,
        status: document.getElementById('vei-status').value,
        apagado: 'N'
    };

    if (veiculoEmEdicaoId) {
        await supabaseClient.from('veiculos').update(veiculo).eq('id', veiculoEmEdicaoId);
    } else {
        await supabaseClient.from('veiculos').insert([veiculo]);
    }
    closeModalVeiculo();
    loadVeiculos();
}

async function editarVeiculo(id) {
    const { data } = await supabaseClient.from('veiculos').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('vei-nome').value = data.nome;
        document.getElementById('vei-cliente-nome').value = data.cliente_nome;
        document.getElementById('vei-cliente-telefone').value = data.cliente_telefone || '';
        document.getElementById('vei-cor').value = data.cor || '';
        document.getElementById('vei-ano').value = data.ano || '';
        document.getElementById('vei-ultimo-nome').value = data.ultimo_servico_nome || '';
        document.getElementById('vei-ultimo-data').value = data.ultimo_servico_data || '';
        document.getElementById('vei-status').value = data.status;
        
        veiculoEmEdicaoId = id;
        openModalVeiculo();
    }
}

async function deletarVeiculo(id) {
    if(confirm('Tem certeza que deseja apagar este veículo?')) {
        await supabaseClient.from('veiculos').update({ apagado: 'S' }).eq('id', id);
        loadVeiculos();
    }
}

function pesquisarVeiculos() {
    let input = document.getElementById("pesquisa-veiculos").value.toLowerCase();
    let tr = document.getElementById("tabela-veiculos").getElementsByTagName("tr");
    for (let i = 1; i < tr.length; i++) {
        if ((tr[i].textContent || tr[i].innerText).toLowerCase().indexOf(input) > -1) {
            tr[i].style.display = "";
        } else { tr[i].style.display = "none"; }
    }
}
