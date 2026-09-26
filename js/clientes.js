// ==========================================
// MÓDULO CLIENTES
// ==========================================

// Função para abrir NOVO Cliente do zero
function abrirModalNovoCliente() {
    clienteEmEdicaoId = null;
    document.getElementById('form-cliente').reset();
    
    // Título novo
    document.getElementById('titulo-modal-cliente').innerText = "Cadastro de Cliente";
    
    // Esconde o menu de abas e força exibir a aba de Dados
    document.getElementById('cli-tabs-nav').classList.add('hidden');
    switchCliTab('dados');
    
    // Esconde as áreas de exibição da edição
    document.getElementById('cli-veiculos-cadastrados-container').classList.add('hidden');
    
    // Em um novo cliente, NÃO escondemos o form do veículo, apenas deixamos ele aguardando o clique do botão
    toggleNovoVeiculoForm(true); // true força a esconder e resetar o botão
    
    openModal('modal-cliente');
}

// Controle das Abas (Dados vs Histórico)
function switchCliTab(tab) {
    const btnDados = document.getElementById('tab-cli-btn-dados');
    const btnHist = document.getElementById('tab-cli-btn-historico');
    const contDados = document.getElementById('tab-cli-dados');
    const contHist = document.getElementById('tab-cli-historico');

    if (tab === 'dados') {
        btnDados.className = 'px-4 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600';
        btnHist.className = 'px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors';
        contDados.classList.remove('hidden');
        contHist.classList.add('hidden');
    } else {
        btnHist.className = 'px-4 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600';
        btnDados.className = 'px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors';
        contHist.classList.remove('hidden');
        contDados.classList.add('hidden');
    }
}

// Mostra/Esconde a sessão de Adicionar Veículo
function toggleNovoVeiculoForm(forceHide = false) {
    const formContainer = document.getElementById('cli-novo-veiculo-form');
    const btn = document.getElementById('btn-revelar-veiculo');

    if (forceHide || !formContainer.classList.contains('hidden')) {
        formContainer.classList.add('hidden');
        btn.innerHTML = '<i class="ph ph-plus-circle text-lg"></i> Adicionar Veículo a este cliente';
        btn.classList.remove('text-red-500');
        btn.classList.add('text-blue-600');
        
        // Limpa os campos se fechar
        document.getElementById('cli-veiculo-modelo').value = '';
        document.getElementById('cli-veiculo-cor').value = '';
        document.getElementById('cli-veiculo-ano').value = '';
    } else {
        formContainer.classList.remove('hidden');
        btn.innerHTML = '<i class="ph ph-x-circle text-lg"></i> Cancelar adição de veículo';
        btn.classList.remove('text-blue-600');
        btn.classList.add('text-red-500');
    }
}

// Expande a lista de veículos existentes
function toggleListaVeiculos() {
    const btn = document.getElementById('btn-mostrar-veiculos');
    const extras = document.querySelectorAll('.veiculo-extra');
    const isExpanded = btn.getAttribute('data-expanded') === 'true';

    if (isExpanded) {
        extras.forEach(el => el.classList.add('hidden'));
        btn.innerText = `Mostrar mais veículos (+${extras.length})`;
        btn.setAttribute('data-expanded', 'false');
    } else {
        extras.forEach(el => el.classList.remove('hidden'));
        btn.innerText = `Ocultar veículos extras`;
        btn.setAttribute('data-expanded', 'true');
    }
}

async function loadClientes() {
    if (!supabaseClient) return;
    
    let { data, error } = await supabaseClient
        .from('clientes')
        .select('*')
        .eq('apagado', 'N')
        .order('created_at', { ascending: false });

    if (error) {
        const fallback = await supabaseClient.from('clientes').select('*').eq('apagado', 'N');
        data = fallback.data || [];
    }

    const tbody = document.getElementById('tabela-clientes-body');
    if (!tbody) return; 

    tbody.innerHTML = '';
    const contador = document.getElementById('contador-clientes');
    if(contador) contador.innerText = data.length;
    const pesquisa = document.getElementById('pesquisa-clientes');
    if(pesquisa) pesquisa.value = ''; 

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="py-12 text-center text-gray-400"><div class="flex flex-col items-center justify-center"><i class="ph ph-folder-open text-4xl mb-3 text-gray-300"></i><p>Nenhuma informação cadastrada.</p></div></td></tr>
        `;
        return;
    }

    data.forEach(cliente => {
        let telefoneSeguro = cliente.telefone || '';
        let waNumber = telefoneSeguro.replace(/\D/g, '');
        if (waNumber.length >= 10 && !waNumber.startsWith('55')) waNumber = '55' + waNumber;
        let cssZap = waNumber ? "text-green-500 hover:text-green-600" : "text-gray-300 cursor-not-allowed pointer-events-none";

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-6 font-medium text-gray-900">${cliente.nome || '-'}</td>
                <td class="py-3 px-6">
                    <div class="flex items-center gap-2">
                        <span>${telefoneSeguro || '-'}</span>
                        <a href="https://wa.me/${waNumber}" target="_blank" title="Chamar no WhatsApp" class="transition-colors flex items-center ${cssZap}"><i class="ph ph-whatsapp-logo text-xl"></i></a>
                    </div>
                </td>
                <td class="py-3 px-6 text-gray-500 truncate max-w-[200px]">${cliente.endereco || '-'}</td>
                <td class="py-3 px-6 text-gray-500">${cliente.email || '-'}</td>
                <td class="py-3 px-6 text-gray-500">${cliente.ultimo_servico || 'Sem registros'}</td>
                <td class="py-3 px-6 text-center whitespace-nowrap">
                    <button onclick="editarCliente('${cliente.id}')" class="text-gray-400 hover:text-blue-600 mx-1 transition-colors"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="deletarCliente('${cliente.id}')" class="text-gray-400 hover:text-red-600 mx-1 transition-colors"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `;
    });
}

async function salvarCliente(event) {
    event.preventDefault();
    
    const nomeCliente = document.getElementById('cli-nome').value;
    const telefoneCliente = document.getElementById('cli-telefone').value;

    const cliente = {
        nome: nomeCliente,
        telefone: telefoneCliente,
        email: document.getElementById('cli-email').value,
        endereco: document.getElementById('cli-endereco').value,
        apagado: 'N'
    };

    const veiculoModelo = document.getElementById('cli-veiculo-modelo').value;
    const veiculoCor = document.getElementById('cli-veiculo-cor').value;
    const veiculoAno = document.getElementById('cli-veiculo-ano').value;

    if (clienteEmEdicaoId) {
        await supabaseClient.from('clientes').update(cliente).eq('id', clienteEmEdicaoId);
    } else {
        await supabaseClient.from('clientes').insert([cliente]);
    }

    if (veiculoModelo && veiculoModelo.trim() !== '') {
        const novoVeiculo = {
            nome: veiculoModelo.trim(),
            cliente_nome: nomeCliente,
            cliente_telefone: telefoneCliente,
            cor: veiculoCor,
            ano: veiculoAno,
            status: 'Ativo',
            apagado: 'N'
        };
        await supabaseClient.from('veiculos').insert([novoVeiculo]);
        if (typeof loadVeiculos === 'function') loadVeiculos();
    }

    closeModal('modal-cliente');
    loadClientes();
}

async function editarCliente(id) {
    const { data } = await supabaseClient.from('clientes').select('*').eq('id', id).single();
    if (data) {
        clienteEmEdicaoId = id;

        // Reseta tudo e exibe a Aba de Dados
        document.getElementById('titulo-modal-cliente').innerText = `Editar: ${data.nome}`;
        document.getElementById('cli-tabs-nav').classList.remove('hidden');
        switchCliTab('dados');
        toggleNovoVeiculoForm(true); 

        // Popula os Dados do Cliente
        document.getElementById('cli-nome').value = data.nome || '';
        document.getElementById('cli-telefone').value = data.telefone || '';
        document.getElementById('cli-email').value = data.email || '';
        document.getElementById('cli-endereco').value = data.endereco || '';

        // ==========================================
        // 1. CARREGAR VEÍCULOS EXISTENTES
        // ==========================================
        const { data: veiculos } = await supabaseClient.from('veiculos').select('*').eq('cliente_nome', data.nome).eq('apagado', 'N');
        const contVeiculos = document.getElementById('cli-veiculos-cadastrados-container');
        const listaVeiculos = document.getElementById('cli-lista-veiculos');
        const btnMostrar = document.getElementById('btn-mostrar-veiculos');
        
        listaVeiculos.innerHTML = '';
        
        if (veiculos && veiculos.length > 0) {
            contVeiculos.classList.remove('hidden');
            veiculos.forEach((v, index) => {
                let hiddenClass = index > 0 ? 'hidden veiculo-extra' : '';
                listaVeiculos.innerHTML += `
                    <div class="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center ${hiddenClass}">
                        <div>
                            <p class="text-sm font-bold text-gray-800">${v.nome} <span class="text-xs font-normal text-gray-500">(${v.ano || 'S/ Ano'})</span></p>
                            <p class="text-[10px] text-gray-500 uppercase mt-0.5">Cor: ${v.cor || '-'} | Status: ${v.status}</p>
                        </div>
                        <i class="ph ph-car text-blue-400 text-2xl"></i>
                    </div>
                `;
            });
            
            if (veiculos.length > 1) {
                btnMostrar.classList.remove('hidden');
                btnMostrar.innerText = `Mostrar mais veículos (+${veiculos.length - 1})`;
                btnMostrar.setAttribute('data-expanded', 'false');
            } else {
                btnMostrar.classList.add('hidden');
            }
        } else {
            contVeiculos.classList.add('hidden');
        }

        // ==========================================
        // 2. CARREGAR HISTÓRICO DE AGENDAMENTOS NA ABA
        // ==========================================
        const { data: agendamentos } = await supabaseClient.from('agendamentos').select('*').eq('cliente_nome', data.nome).eq('apagado', 'N').order('data_agendamento', { ascending: false });
        const listaAgendamentos = document.getElementById('cli-lista-agendamentos');
        
        listaAgendamentos.innerHTML = '';
        
        if (agendamentos && agendamentos.length > 0) {
            agendamentos.forEach(a => {
                let badgeClass = "bg-gray-200 text-gray-700";
                if(a.status === 'Finalizado') badgeClass = "bg-green-100 text-green-700";
                else if(a.status === 'Em Andamento') badgeClass = "bg-yellow-100 text-yellow-700";
                else if(a.status === 'Cancelado') badgeClass = "bg-red-100 text-red-700";
                else if(a.status === 'Agendado') badgeClass = "bg-blue-100 text-blue-700";
                
                const dataFormatada = a.data_agendamento.split('-').reverse().join('/');
                listaAgendamentos.innerHTML += `
                    <div class="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <div>
                            <p class="text-sm font-bold text-gray-800">${dataFormatada} às ${a.horario.substring(0,5)}</p>
                            <p class="text-[11px] text-gray-500 mt-1 uppercase w-56 truncate" title="${a.descricao}">${a.descricao}</p>
                            <p class="text-[10px] text-gray-400 mt-0.5">Veículo: ${a.veiculo || 'Não informado'}</p>
                        </div>
                        <div class="text-right">
                            <span class="px-2 py-1 rounded uppercase text-[10px] font-bold ${badgeClass} tracking-wide">${a.status}</span>
                            <p class="text-sm font-bold text-gray-900 mt-2">R$ ${parseFloat(a.valor_total).toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            listaAgendamentos.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                    <i class="ph ph-clock text-4xl mb-2 text-gray-300"></i>
                    <p class="text-sm">Nenhum histórico de agendamento.</p>
                </div>
            `;
        }

        openModal('modal-cliente');
    }
}

async function deletarCliente(id) {
    if(confirm('Tem certeza que deseja apagar este cliente?')) {
        await supabaseClient.from('clientes').update({ apagado: 'S' }).eq('id', id);
        loadClientes();
    }
}

function pesquisarClientes() {
    let input = document.getElementById("pesquisa-clientes").value.toLowerCase();
    let tr = document.getElementById("tabela-clientes").getElementsByTagName("tr");
    let count = 0;
    for (let i = 1; i < tr.length; i++) {
        if ((tr[i].textContent || tr[i].innerText).toLowerCase().indexOf(input) > -1) {
            tr[i].style.display = ""; count++;
        } else { tr[i].style.display = "none"; }
    }
    const contador = document.getElementById('contador-clientes');
    if(contador) contador.innerText = count;
}

function chamarWhatsappModal() {
    let phoneInput = document.getElementById('cli-telefone').value || '';
    let numbers = phoneInput.replace(/\D/g, '');
    if (numbers.length >= 10) {
        if (!numbers.startsWith('55')) numbers = '55' + numbers;
        window.open(`https://wa.me/${numbers}`, '_blank');
    } else {
        alert("Por favor, insira um número de telefone válido antes de chamar no WhatsApp.");
    }
}
