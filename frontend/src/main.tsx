import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 全局错误兜底：在 React 挂载前若脚本抛错，直接把错误显示出来，避免白屏
function showFatal(msg: string) {
  const root = document.getElementById('root')
  if (root && !window.__APP_BOOTED__) {
    root.innerHTML =
      '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;color:#b91c1c;text-align:center;">' +
      '<div style="font-size:16px;font-weight:600;margin-bottom:10px;">页面出错了</div>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;color:#7f1d1d;max-width:90vw;">' +
      msg +
      '</pre></div>'
  }
}

window.addEventListener('error', (e) => {
  showFatal((e as ErrorEvent).message || '未知脚本错误')
})
window.addEventListener('unhandledrejection', (e) => {
  const r = (e as PromiseRejectionEvent).reason
  showFatal('未处理的异步错误：' + (r && (r as Error).message ? (r as Error).message : String(r)))
})

class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error('App crashed:', error)
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            color: '#b91c1c',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>页面出错了</div>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
              color: '#7f1d1d',
              maxWidth: '90vw',
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// 标记已成功挂载，关闭看门狗
window.__APP_BOOTED__ = true
