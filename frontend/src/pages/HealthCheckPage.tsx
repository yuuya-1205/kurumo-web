import { useState } from 'react'
import { ENDPOINTS, probe, type Endpoint, type ProbeResult } from '../api/health'
import './HealthCheckPage.css'

export function HealthCheckPage() {
  const [results, setResults] = useState<Record<string, ProbeResult>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const run = async (endpoint: Endpoint) => {
    setPending((prev) => ({ ...prev, [endpoint.id]: true }))
    const result = await probe(endpoint)
    setResults((prev) => ({ ...prev, [endpoint.id]: result }))
    setPending((prev) => ({ ...prev, [endpoint.id]: false }))
  }

  const runAll = () => {
    for (const endpoint of ENDPOINTS) {
      void run(endpoint)
    }
  }

  const busy = Object.values(pending).some(Boolean)

  return (
    <main className="app">
      <header className="app-header">
        <h1>API 疎通確認</h1>
        <p>
          backend の各エンドポイントを叩いて結果を表示します。接続先は{' '}
          <code>{import.meta.env.VITE_API_BASE_URL ?? '/api'}</code>
          （dev サーバーの proxy 経由で <code>localhost:8080</code>）。
        </p>
        <button type="button" onClick={runAll} disabled={busy}>
          すべて実行
        </button>
      </header>

      <ul className="endpoints">
        {ENDPOINTS.map((endpoint) => (
          <li key={endpoint.id} className="endpoint">
            <div className="endpoint-head">
              <div>
                <h2>{endpoint.label}</h2>
                <p className="endpoint-path">
                  <span className="method">{endpoint.method}</span>
                  <code>{endpoint.path}</code>
                </p>
                <p className="endpoint-desc">{endpoint.description}</p>
              </div>
              <button
                type="button"
                onClick={() => void run(endpoint)}
                disabled={pending[endpoint.id]}
              >
                {pending[endpoint.id] ? '実行中…' : '実行'}
              </button>
            </div>

            <ResultView result={results[endpoint.id]} />
          </li>
        ))}
      </ul>
    </main>
  )
}

function ResultView({ result }: { result: ProbeResult | undefined }) {
  if (!result) {
    return (
      <p className="result-empty" aria-live="polite">
        まだ実行していません
      </p>
    )
  }

  return (
    <div className="result" aria-live="polite">
      <p className="result-meta">
        <span className={result.ok ? 'badge ok' : 'badge ng'}>
          {/* サーバーに届かなかった場合は status が無いのでその旨を出す */}
          {result.status ?? '接続失敗'}
        </span>
        <span>{result.durationMs} ms</span>
        {result.error && <span className="result-error">{result.error}</span>}
      </p>

      {/* 本文が空のエラーレスポンスもあるので、中身がある時だけ出す */}
      {result.body !== null && result.body !== '' && (
        <pre className="result-body">{JSON.stringify(result.body, null, 2)}</pre>
      )}
    </div>
  )
}
