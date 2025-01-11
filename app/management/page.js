'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Select from 'react-select'

const getConformidades = async (token) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_CONFORMIDADE_URL;
  if (!baseUrl) {
    throw new Error('URL da API de conformidades não configurada');
  }
  
  const queryParams = new URLSearchParams({
    codimov: '22769',
    web: 'false',
    relatorio: 'true',
    cnpj: '',
    temcnpj: 'false'
  });

  return await axios.get(`${baseUrl}?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const getUserData = async (token) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_ME_URL;
  if (!baseUrl) {
    throw new Error('URL da API de usuário não configurada');
  }

  return await axios.get(baseUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const getClientes = async (token, codcoor) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_CLIENTES_URL;
  if (!baseUrl) {
    throw new Error('URL da API de clientes não configurada');
  }

  return await axios.get(`${baseUrl}?codcoor=${codcoor}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const getUnidades = async (token, codcoor, codcli, uf) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_UNIDADES_URL;
  if (!baseUrl) {
    throw new Error('URL da API de unidades não configurada');
  }

  const queryParams = new URLSearchParams({
    codcoor: codcoor.toString(),
    codcli: codcli.toString(),
    uf: uf || '',
    page: '1'
  });

  const url = `${baseUrl}?${queryParams}`;
  console.log('🚀 Chamando API de unidades:', {
    url,
    params: {
      codcoor: codcoor.toString(),
      codcli: codcli.toString(),
      uf: uf || '',
      page: '1'
    }
  });
  
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log('📦 Resposta da API de unidades:', {
    status: response.status,
    data: response.data
  });

  return response;
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [tableData, setTableData] = useState([])
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedUf, setSelectedUf] = useState(null)
  const [availableUfs, setAvailableUfs] = useState([])
  const [unidades, setUnidades] = useState([])
  const [selectedUnidade, setSelectedUnidade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.push('/')
          return
        }

        // Fetch user data
        const userResponse = await getUserData(token);
        setUserData(userResponse.data)

        // Fetch clients data using user's cod
        const clientsResponse = await getClientes(token, userResponse.data.cod);
        // Limpar espaços em branco do campo fantasia
        const cleanedClients = clientsResponse.data.map(client => ({
          ...client,
          fantasia: client.fantasia.trim()
        }));
        setClients(cleanedClients)

        // Fetch table data
        const tableResponse = await getConformidades(token);
        setTableData(tableResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error?.message || 'Erro ao carregar dados. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (selectedClient) {
      const client = clients.find(c => c.codcli === selectedClient.value);
      if (client && Array.isArray(client.lc_ufs)) {
        // Extrair apenas os valores de UF do array de objetos
        const ufs = client.lc_ufs.map(item => item.uf);
        setAvailableUfs(ufs);
        // Selecionar automaticamente a primeira UF da lista
        if (ufs.length > 0) {
          setSelectedUf(ufs[0]);
        } else {
          setSelectedUf(null);
        }
      } else {
        setAvailableUfs([]);
        setSelectedUf(null);
      }
    } else {
      setAvailableUfs([]);
      setSelectedUf(null);
    }
  }, [selectedClient, clients]);

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        if (selectedClient && selectedUf && userData) {
          const token = localStorage.getItem('access_token');
          if (!token) return;

          const response = await getUnidades(
            token,
            userData.cod,
            selectedClient.value,
            selectedUf
          );

          if (response.data && Array.isArray(response.data.folowups)) {
            const unidadesData = response.data.folowups
              .filter(item => item && item.cadimov)
              .map(item => {
                const tipo = item.cadimov?.tipo?.trim() || '';
                const nome = item.cadimov?.nome?.trim() || '';
                const label = tipo && nome ? `${tipo} - ${nome}` : tipo || nome;
                
                return {
                  codend: item.codend,
                  tipo: label
                };
              });
            
            setUnidades(unidadesData);
            
            if (unidadesData.length > 0) {
              setSelectedUnidade({
                value: unidadesData[0].codend,
                label: unidadesData[0].tipo
              });
            } else {
              setSelectedUnidade(null);
            }
          } else {
            setUnidades([]);
            setSelectedUnidade(null);
          }
        } else {
          setUnidades([]);
          setSelectedUnidade(null);
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
        setSelectedUnidade(null);
      }
    };

    fetchUnidades();
  }, [selectedClient, selectedUf, userData]);

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatArea = (area) => {
    if (typeof area !== 'number') return ''
    return area.toFixed(2)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100">
      <div className="d-flex justify-content-between align-items-center p-3">
        <h5 className="m-0">{userData?.name}</h5>
        <button 
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>

      {/* Área de Comandos */}
      <div className="px-3 mb-3">
        {/* Primeira linha: Clientes, UF e botões */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <span>Clientes</span>
            <Select
              value={selectedClient}
              onChange={(option) => setSelectedClient(option)}
              options={clients.map(client => ({
                value: client.codcli,
                label: client.fantasia
              }))}
              placeholder="Selecione um cliente"
              noOptionsMessage={() => "Nenhum cliente encontrado"}
              loadingMessage={() => "Carregando..."}
              isSearchable={true}
              isClearable={true}
              styles={{
                container: (base) => ({
                  ...base,
                  width: '300px',
                }),
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  backgroundColor: 'white'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: '600px',
                  minHeight: '300px'
                })
              }}
              maxMenuHeight={600}
              minMenuHeight={300}
            />
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span>UF</span>
            <Select
              value={selectedUf ? { value: selectedUf, label: selectedUf } : null}
              onChange={(option) => setSelectedUf(option ? option.value : null)}
              options={availableUfs.map(uf => ({
                value: uf,
                label: uf
              }))}
              isDisabled={!selectedClient || availableUfs.length === 0}
              placeholder="UF"
              noOptionsMessage={() => "Nenhuma UF disponível"}
              isSearchable={true}
              isClearable={true}
              styles={{
                container: (base) => ({
                  ...base,
                  width: '130px'
                }),
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  backgroundColor: 'white'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                })
              }}
            />
          </div>

          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="todasUf" />
            <label className="form-check-label" htmlFor="todasUf">
              Todas UF
            </label>
          </div>

          <button className="btn btn-primary">Planilhas</button>
          <button className="btn btn-primary">Contr: 21972</button>
        </div>

        {/* Segunda linha: Unidades */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <span>Unidades</span>
          <Select
            value={selectedUnidade}
            onChange={(option) => setSelectedUnidade(option)}
            options={unidades.map(unidade => ({
              value: unidade.codend,
              label: unidade.tipo
            }))}
            isDisabled={!selectedClient || !selectedUf}
            placeholder="Selecione uma unidade"
            noOptionsMessage={() => "Nenhuma unidade disponível"}
            loadingMessage={() => "Carregando..."}
            isSearchable={true}
            isClearable={true}
            styles={{
              container: (base) => ({
                ...base,
                width: '500px'
              }),
              control: (base) => ({
                ...base,
                minHeight: '36px',
                backgroundColor: 'white'
              }),
              menu: (base) => ({
                ...base,
                zIndex: 9999,
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }),
              menuList: (base) => ({
                ...base,
                maxHeight: '400px',
                minHeight: '100px'
              })
            }}
          />
        </div>

        {/* Terceira linha: Botões de ação */}
        <div className="bg-secondary rounded-3 p-1 d-inline-flex gap-1">
          <button className="btn btn-light">Editar</button>
          <button className="btn btn-light">Ocorrencias</button>
          <button className="btn btn-light">Custos</button>
          <button className="btn btn-light">Ord. Compra</button>
          <button className="btn btn-light">Edita Tarefas</button>
          <button className="btn btn-light">Rescisão</button>
          <button className="btn btn-light">Pendenciar</button>
        </div>
      </div>

      {/* Área da Tabela */}
      <div className="px-3">
        <div className="tab-conform-wrapper">
          <div className="tab-conform-container">
            <table className="table table-striped table-hover tab-conform">
              <thead>
                <tr>
                  {/* Colunas fixas (1-11) */}
                  <th className="fixed-column fixed-pos-0 col-conf_0 text-center">Web</th>
                  <th className="fixed-column fixed-pos-1 col-conf_1 text-center">Rel.</th>
                  <th className="fixed-column fixed-pos-2 col-conf_2 text-center">Gest.Cli.</th>
                  <th className="fixed-column fixed-pos-3 col-conf_3 text-center">Cod.</th>
                  <th className="fixed-column fixed-pos-4 col-conf_4">Descrição</th>
                  <th className="fixed-column fixed-pos-5 col-conf_5 text-center">PDF</th>
                  <th className="fixed-column fixed-pos-6 col-conf_6">Doc.</th>
                  <th className="fixed-column fixed-pos-7 col-conf_7 text-center">Área</th>
                  <th className="fixed-column fixed-pos-8 col-conf_8 text-center">Emissão</th>
                  <th className="fixed-column fixed-pos-9 col-conf_9 text-center">Vencim.</th>
                  <th className="fixed-column fixed-pos-10 col-conf_10 text-center fixed-column-last">Renov.</th>
                  
                  {/* Colunas não fixas */}
                  <th className="text-center col-w100">Periodicidade</th>
                  <th className="text-center col-w60">Peso</th>
                  <th className="col-w100">Atividade</th>
                  <th className="col-w420 white-space-normal">Obs.</th>
                  <th className="text-center col-w100">Dt.Prov</th>
                  <th className="text-center col-w100">Grupo</th>
                  <th className="col-w100">Compet.</th>
                  <th className="text-center col-w100">Doc.Orig.</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={index}>
                    {/* Colunas fixas (1-11) */}
                    <td className="fixed-column fixed-pos-0 col-conf_0 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.finternet || false} 
                        readOnly 
                        aria-label="Web"
                        className="no-pointer-events"
                      />
                    </td>
                    <td className="fixed-column fixed-pos-1 col-conf_1 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.frelatorio || false} 
                        readOnly 
                        aria-label="Relatório"
                        className="no-pointer-events"
                      />
                    </td>
                    <td className="fixed-column fixed-pos-2 col-conf_2 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.gestaocli || false} 
                        readOnly 
                        aria-label="Gestão Cliente"
                        className="no-pointer-events"
                      />
                    </td>
                    <td className="fixed-column fixed-pos-3 col-conf_3 text-center">{item.codcfor}</td>
                    <td className="fixed-column fixed-pos-4 col-conf_4 white-space-normal">{item.descr}</td>
                    <td className="fixed-column fixed-pos-5 col-conf_5 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.flagtipopdf || false} 
                        readOnly 
                        aria-label="PDF"
                        className="no-pointer-events"
                      />
                    </td>
                    <td className="fixed-column fixed-pos-6 col-conf_6">{item.doc}</td>
                    <td className="fixed-column fixed-pos-7 col-conf_7 text-center">{formatArea(item.area)}</td>
                    <td className="fixed-column fixed-pos-8 col-conf_8 text-center">{formatDate(item.dt)}</td>
                    <td className="fixed-column fixed-pos-9 col-conf_9 text-center">{formatDate(item.dtvenc)}</td>
                    <td className="fixed-column fixed-pos-10 col-conf_10 text-center fixed-column-last">{formatDate(item.dtrenov)}</td>
                    
                    {/* Colunas não fixas */}
                    <td className="text-center col-w100">{item.periodicidade}</td>
                    <td className="text-center">{item.vgraurisco}</td>
                    <td className="col-w100">{item.atividade}</td>
                    <td className="col-w200 white-space-normal">{item.obs}</td>
                    <td className="text-center">{formatDate(item.quando)}</td>
                    <td className="col-w100">{item.grupo}</td>
                    <td className="col-w100">{item.quem}</td>
                    <td className="text-center col-w80">{item.docorig}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mt-4" role="alert">
            {error}
          </div>
        )}


      </div>
    </div>
  )
}
