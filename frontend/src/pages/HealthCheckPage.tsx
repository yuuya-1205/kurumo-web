import { useState } from 'react'
import { ENDPOINTS, probe, type Endpoint, type ProbeResult } from '../api/health'

/*
 * 開発者向けの画面なので Figma のデザインは無い。
 * 配色は index.css の --text / --border などを参照する（ダークモードに追従する）。
 */
const buttonClass =
  'shrink-0 whitespace-nowrap rounded-md border border-[var(--accent-border)] ' +
  'bg-[var(--accent-bg)] px-[18px] py-2 text-[15px] text-[var(--text-h)] cursor-pointer ' +
  'hover:not-disabled:border-[var(--accent)] disabled:opacity-50 disabled:cursor-default'

const codeClass =
  'inline-flex rounded-sm bg-[var(--code-bg)] px-2 py-1 font-mono text-[15px] ' +
  'leading-[135%] text-[var(--text-h)]'

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
    <main className="mx-auto box-border w-full max-w-[780px] px-8 py-12 text-left max-sm:px-5 max-sm:py-8">
      <header>
        <h1 className="mb-3 text-[36px] font-medium tracking-[-1px] text-[var(--text-h)]">
          API 疎通確認
        </h1>
        <p className="mb-6 text-[15px] leading-[160%]">
          backend の各エンドポイントを叩いて結果を表示します。接続先は{' '}
          <code className={codeClass}>{import.meta.env.VITE_API_BASE_URL ?? '/api'}</code>
          （dev サーバーの proxy 経由で <code className={codeClass}>localhost:8080</code>）。
        </p>
        <button type="button" className={buttonClass} onClick={runAll} disabled={busy}>
          すべて実行
        </button>
      </header>

      <ul className="mt-8 flex list-none flex-col gap-4 p-0">
        {ENDPOINTS.map((endpoint) => (
          <li key={endpoint.id} className="rounded-lg border border-[var(--border)] p-5">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
              <div>
                <h2 className="mb-1.5 text-[18px] font-medium text-[var(--text-h)]">
                  {endpoint.label}
                </h2>
                <p className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[12px] tracking-[0.5px] text-[var(--accent)]">
                    {endpoint.method}
                  </span>
                  <code className={codeClass}>{endpoint.path}</code>
                </p>
                <p className="text-[14px]">{endpoint.description}</p>
              </div>
              <button
                type="button"
                className={buttonClass}
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
  const frameClass = 'mt-4 border-t border-[var(--border)] pt-4'

  if (!result) {
    return (
      <p className={`${frameClass} text-[14px] opacity-70`} aria-live="polite">
        まだ実行していません
      </p>
    )
  }

  const badgeClass = result.ok
    ? 'bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-200'
    : 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200'

  return (
    <div className={frameClass} aria-live="polite">
      <p className="flex flex-wrap items-center gap-3 font-mono text-[13px]">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${badgeClass}`}>
          {/* サーバーに届かなかった場合は status が無いのでその旨を出す */}
          {result.status ?? '接続失敗'}
        </span>
        <span>{result.durationMs} ms</span>
        {result.error && <span className="text-red-700 dark:text-red-300">{result.error}</span>}
      </p>

      {/* 本文が空のエラーレスポンスもあるので、中身がある時だけ出す */}
      {result.body !== null && result.body !== '' && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-[var(--code-bg)] px-3.5 py-3 font-mono text-[13px] leading-[150%] text-[var(--text-h)]">
          {JSON.stringify(result.body, null, 2)}
        </pre>
      )}
    </div>
  )
}
