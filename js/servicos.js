// ==========================================
// MÓDULO SERVIÇOS
// ==========================================
function openModalServico() {
    document.getElementById('modal-servico').classList.remove('hidden');
    if (!servicoEmEdicaoId) {
        document.getElementById('srv-status').value = "Ativo";
    }
}

function closeModalServico() {
    document.getElementById('modal-servico').classList.add('hidden');
    document.getElementById('form-servico').reset();
    servicoEmEdicaoId = null;
}

async function loadServicos() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('servicos')
        .select('*')
        .eq('apagado', 'N')
        .order('nome', { ascending: true });

    if (error) return console.error('Erro', error);

    const tbody = document.getElementById('tabela-servicos-body');
    tbody.innerHTML = '';
    document.getElementById('pesquisa-servicos').value = ''; 

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-gray-400">
                    <div class="flex flex-col items-center justify-center">
                        <i class="ph ph-list-dashes text-4xl mb-3 text-gray-300"></i>
                        <p>Nenhum serviço cadastrado.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        // Formatar Badge de Status para ficar igual ao Mocap
        let badgeClass = "bg-gray-200 text-gray-700";
        if(item.status === 'Ativo') badgeClass = "bg-[#4ade80] text-green-900"; // Verde
        else if(item.status === 'Inativo') badgeClass = "bg-[#f87171] text-red-900"; // Vermelho

        tbody.innerHTML += `
            <tr class="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 font-bold text-gray-900">${item.nome}</td>
                <td class="py-4 px-6 text-gray-700">${item.categoria}</td>
                <td class="py-4 px-6 text-gray-500 truncate max-w-[200px]">${item.descricao || '-'}</td>
                <td class="py-4 px-6 text-center text-gray-800 font-medium">
                    ${item.duracao || '-'}
                    <span class="block text-[10px] text-gray-400">Horas</span>
                </td>
                <td class="py-4 px-6 font-bold text-gray-900">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}</td>
                <td class="py-4 px-6 text-center">
                    <span class="px-3 py-1.5 rounded uppercase text-[10px] font-bold tracking-wider ${badgeClass}">
                        ${item.status.toUpperCase()}
                    </span>
                </td>
                <td class="py-4 px-6 text-center whitespace-nowrap">
                    <button onclick="editarServico('${item.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors" title="Editar"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarServico('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Apagar"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

async function salvarServico(event) {
    event.preventDefault();
    const servico = {
        nome: document.getElementById('srv-nome').value,
        categoria: document.getElementById('srv-categoria').value,
        duracao: document.getElementById('srv-duracao').value,
        descricao: document.getElementById('srv-descricao').value,
        preco: desformatarMoeda(document.getElementById('srv-preco').value),
        status: document.getElementById('srv-status').value,
        apagado: 'N'
    };

    if (servicoEmEdicaoId) {
        await supabaseClient.from('servicos').update(servico).eq('id', servicoEmEdicaoId);
    } else {
        await supabaseClient.from('servicos').insert([servico]);
    }
    closeModalServico();
    loadServicos();
}

async function editarServico(id) {
    const { data } = await supabaseClient.from('servicos').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('srv-nome').value = data.nome;
        document.getElementById('srv-categoria').value = data.categoria;
        document.getElementById('srv-duracao').value = data.duracao || '';
        document.getElementById('srv-descricao').value = data.descricao || '';
        document.getElementById('srv-preco').value = formatarNumeroParaMoeda(data.preco);
        document.getElementById('srv-status').value = data.status;
        
        servicoEmEdicaoId = id;
        openModalServico();
    }
}

async function deletarServico(id) {
    if(confirm('Tem certeza que deseja apagar este serviço?')) {
        await supabaseClient.from('servicos').update({ apagado: 'S' }).eq('id', id);
        loadServicos();
    }
}

function pesquisarServicos() {
    let input = document.getElementById("pesquisa-servicos").value.toLowerCase();
    let tr = document.getElementById("tabela-servicos").getElementsByTagName("tr");
    for (let i = 1; i < tr.length; i++) {
        if ((tr[i].textContent || tr[i].innerText).toLowerCase().indexOf(input) > -1) {
            tr[i].style.display = "";
        } else { tr[i].style.display = "none"; }
    }
}
