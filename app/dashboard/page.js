'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

export default function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [tableData, setTableData] = useState([])
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
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">
            {userData && `${userData.tipo} - ${userData.name}`}
          </span>
          <button 
            className="btn btn-outline-danger"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="container my-6">
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

        <div className="row justify-content-center mt-5">
          <div className="col-w100-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title mb-4">Informações do Usuário</h2>
                <div className="row">
                  <div className="col-w100-6">
                    <p><strong>ID:</strong> {userData?.id}</p>
                    <p><strong>Email:</strong> {userData?.email}</p>
                    <p><strong>Nome:</strong> {userData?.name}</p>
                  </div>
                  <div className="col-w100-6">
                    <p><strong>Código:</strong> {userData?.cod}</p>
                    <p><strong>Tipo:</strong> {userData?.tipo}</p>
                    <p><strong>Código Cargo:</strong> {userData?.codcargo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
