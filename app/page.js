'use client'
    import { useState } from 'react'
    import axios from 'axios'
    import { useRouter } from 'next/navigation'

    export default function Home() {
      const [email, setEmail] = useState('')
      const [password, setPassword] = useState('')
      const [error, setError] = useState('')
      const [loading, setLoading] = useState(false)
      const router = useRouter()

      const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!email || !password) {
          setError('Por favor, preencha todos os campos')
          setLoading(false)
          return
        }

        try {
          const response = await axios.post('https://amenirealestate.com.br:5601/login', {
            email,
            password
          })

          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token)
            router.push('/dashboard')
          }
        } catch (err) {
          setError('Credenciais inválidas')
        } finally {
          setLoading(false)
        }
      }

      return (
        <div className="min-vh-100 d-flex align-items-center">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-5">
                <div className="card shadow-sm">
                  <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                      <h1 className="h3 mb-3 fw-normal">Bem-vindo de volta</h1>
                      <p className="text-muted">Entre para acessar sua conta</p>
                    </div>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="password" className="form-label">Senha</label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-100 btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Carregando...</span>
                            </div>
                            Entrando...
                          </div>
                        ) : (
                          'Entrar'
                        )}
                      </button>
                    </form>
                    <div className="text-center mt-4">
                      <p className="text-muted mb-0">
                        Não tem uma conta?{' '}
                        <a href="#" className="text-decoration-none">
                          Cadastre-se
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
