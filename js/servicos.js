// ==========================================
// MÓDULO SERVIÇOS
// ==========================================
let idEditServico = null;

function openModalServico() {
    openModal('modal-servico');
    if (!idEditServico) {
        document.getElementById('srv-status').value = "Ativo";
    }
}

function closeModalServico() {
    closeModal('modal-servico');
    document.getElementById('form-servico').reset();
    idEditServico = null;
}

async function loadServicos() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient.from('servicos').select('*').eq('apagado', 'N').order('nome', { ascending: true });
    if (error) return console.error(error);

    const tbody = document.getElementById('tabela-servicos-body');
    tbody.innerHTML = '';
    document.getElementById('pesquisa-servicos').value = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-gray-400"><div class="flex flex-col items-center justify-center"><i class="ph ph-list-dashes text-4xl mb-3 text-gray-300"></i><p>Nenhum serviço cadastrado.</p></div></td></tr>`;
        return;
    }

    data.forEach(item => {
        let badgeClass = item.status === 'Ativo' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
        let precoFormat = parseFloat(item.preco || 0).toFixed(2).replace('.', ',');
        
        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 font-bold text-gray-900">${item.nome}</td>
                <td class="py-4 px-6 text-gray-500">${item.categoria}</td>
                <td class="py-4 px-6 text-gray-500 truncate max-w-[200px]" title="${item.descricao}">${item.descricao || '-'}</td>
                <td class="py-4 px-6 text-center text-gray-500">${item.duracao}</td>
                <td class="py-4 px-6 font-bold text-blue-600">R$ ${precoFormat}</td>
                <td class="py-4 px-6 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${badgeClass}">${item.status}</span></td>
                <td class="py-4 px-6 text-center whitespace-nowrap">
                    <button onclick="editarServico('${item.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors"><i class="ph ph-pencil-simple text-xl"></i></button>
                    <button onclick="deletarServico('${item.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors"><i class="ph ph-trash text-xl"></i></button>
                </td>
            </tr>
        `;
    });
}

async function salvarServico(event) {
    event.preventDefault();
    
    let precoPuro = document.getElementById('srv-preco').value;
    let precoCalculado = parseFloat(precoPuro.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

    const servico = {
        nome: document.getElementById('srv-nome').value,
        categoria: document.getElementById('srv-categoria').value,
        duracao: document.getElementById('srv-duracao').value,
        descricao: document.getElementById('srv-descricao').value,
        preco: precoCalculado,
        status: document.getElementById('srv-status').value,
        apagado: 'N'
    };

    if (idEditServico) {
        await supabaseClient.from('servicos').update(servico).eq('id', idEditServico);
    } else {
        await supabaseClient.from('servicos').insert([servico]);
    }
    
    closeModalServico();
    loadServicos();
}

async function editarServico(id) {
    const { data } = await supabaseClient.from('servicos').select('*').eq('id', id).single();
    if (data) {
        idEditServico = id;
        document.getElementById('srv-nome').value = data.nome;
        document.getElementById('srv-categoria').value = data.categoria;
        document.getElementById('srv-duracao').value = data.duracao;
        document.getElementById('srv-descricao').value = data.descricao || '';
        document.getElementById('srv-preco').value = parseFloat(data.preco || 0).toFixed(2).replace('.', ',');
        document.getElementById('srv-status').value = data.status;
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
        if (tr[i].getElementsByTagName("td").length > 1) { 
            if ((tr[i].textContent || tr[i].innerText).toLowerCase().indexOf(input) > -1) {
                tr[i].style.display = "";
            } else { tr[i].style.display = "none"; }
        }
    }
}
