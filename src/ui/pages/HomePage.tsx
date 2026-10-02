export function HomePage({ onNewGame }: { onNewGame?: () => void }) {
  return (
    <main className="welcome">
      <span className="eyebrow">Development Build · temporada 2026</span>
      <h1>Professor FC</h1>
      <p>Gerenciador de futebol em desenvolvimento</p>
      <h2>Gerenciador de Futebol</h2>
      <p className="intro">Sua escalação. Sua tática. Uma temporada para escrever sua história.</p>
      <button className="primary" onClick={onNewGame}>NOVO JOGO</button>
      <p className="muted">Protótipo com seis clubes fictícios. Progresso apenas nesta sessão; recarregar reinicia o jogo.</p>
    </main>
  )
}
