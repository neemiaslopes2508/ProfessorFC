import type { Stadium } from '../../finance/stadium'

const stands = [
  { x: 175, y: 82, width: 370, height: 76, labelX: 360, labelY: 107 },
  { x: 82, y: 170, width: 88, height: 208, labelX: 126, labelY: 402 },
  { x: 175, y: 392, width: 370, height: 78, labelX: 360, labelY: 451 },
  { x: 550, y: 170, width: 88, height: 208, labelX: 594, labelY: 153 },
]
const colors = ['#91bf55', '#58a8a4', '#d0b46c', '#8990c4']

/** Cena administrativa decorativa; seleção e rótulos vêm dos setores da sessão. */
export function StadiumModel({ stadium, selected, onSelect, onHover }: { stadium: Stadium; selected: string; onSelect: (id: string) => void; onHover: (id?: string) => void }) {
  return <svg className="stadium-pixel-model" viewBox="0 0 720 540" role="group" aria-label={`Modelo 2D do ${stadium.name}. Selecione um setor para gerenciar.`} shapeRendering="crispEdges">
    <g aria-hidden="true">
      <rect width="720" height="540" fill="#0b1b24" /><path d="M0 448H720V540H0z" fill="#11242a" />
      {Array.from({ length: 14 }, (_, i) => <g key={i}><rect x={i * 57 + 7} y={i % 2 ? 28 : 493} width="31" height="19" fill="#183a32" /><rect x={i * 57 + 13} y={i % 2 ? 18 : 483} width="20" height="14" fill="#285442" /><rect x={i * 57 + 22} y={i % 2 ? 43 : 508} width="4" height="8" fill="#6b624a" /></g>)}
      <path d="M169 58H552L666 168V393L552 504H164L53 397V169z" fill="#061219" /><path d="M169 49H552L656 159V386L549 489H169L63 386V159z" fill="#30464a" /><path d="M175 64H546L640 164V380L542 475H178L80 380V164z" fill="#1a2d35" />
      <rect x="174" y="161" width="372" height="225" fill="#526257" /><rect x="188" y="173" width="344" height="201" fill="#366342" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={192 + i * 33} y="177" width="33" height="193" fill={i % 2 ? '#40794b' : '#477f50'} />)}
      <g fill="none" stroke="#c0d2aa" strokeWidth="2" shapeRendering="geometricPrecision"><rect x="201" y="187" width="318" height="173" /><path d="M360 187V360M201 220H243V326H201M519 220H477V326H519M201 245H216V301H201M519 245H504V301H519" /><circle cx="360" cy="273" r="30" /><path d="M243 250Q270 273 243 296M477 250Q450 273 477 296" /></g>
      <rect x="357" y="270" width="5" height="5" fill="#dce5c2" /><g fill="#dbe3ce"><rect x="187" y="257" width="12" height="33" /><rect x="521" y="257" width="12" height="33" /></g><g fill="#526a62"><rect x="189" y="261" width="8" height="2" /><rect x="189" y="280" width="8" height="2" /><rect x="523" y="261" width="8" height="2" /><rect x="523" y="280" width="8" height="2" /></g>
      <rect x="274" y="27" width="172" height="28" fill="#06151c" stroke="#4c6267" strokeWidth="3" /><text x="360" y="46" textAnchor="middle" fill="#b3e66b" fontSize="12" fontFamily="monospace">PROFESSOR FC</text>
      <rect x="226" y="378" width="49" height="10" fill="#578184" /><rect x="443" y="378" width="49" height="10" fill="#578184" /><path d="M232 388h4m8 0h4m8 0h4m189 0h4m8 0h4m8 0h4" stroke="#abbbb0" strokeWidth="3" />
      {[{ x: 96, y: 73 }, { x: 594, y: 73 }, { x: 96, y: 429 }, { x: 594, y: 429 }].map(({ x, y }) => <g key={`${x}-${y}`}><path d={`M${x + 14} ${y + 12}v53h8`} fill="none" stroke="#75838a" strokeWidth="5" /><rect x={x - 1} y={y - 2} width="33" height="21" fill="#394953" /><rect x={x + 3} y={y + 2} width="7" height="5" fill="#f4e7ad" /><rect x={x + 14} y={y + 2} width="7" height="5" fill="#fff1b6" /><rect x={x + 24} y={y + 2} width="5" height="5" fill="#f4e7ad" /><rect x={x + 3} y={y + 10} width="26" height="4" fill="#d5cb9c" /></g>)}
      <path d="M167 161V132M551 161V132" stroke="#99a8a1" strokeWidth="3" /><path d="M168 132h22v12h-22M552 132h22v12h-22" fill="#a3d861" />
      <rect x="330" y="479" width="60" height="22" fill="#08202b" /><rect x="342" y="484" width="36" height="17" fill="#030c12" /><path d="M330 505h60M339 512h42" stroke="#647472" strokeWidth="3" />
    </g>
    {stadium.sectors.slice(0, 4).map((sector, index) => {
      const stand = stands[index], active = selected === sector.id
      return <g key={sector.id} className={`stadium-model-sector ${active ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`Selecionar setor ${sector.name}`} aria-pressed={active} onClick={() => onSelect(sector.id)} onMouseEnter={() => onHover(sector.id)} onMouseLeave={() => onHover()} onFocus={() => onHover(sector.id)} onBlur={() => onHover()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(sector.id) } }}>
        <title>{sector.name} · {sector.capacity.toLocaleString('pt-BR')} lugares</title>
        <rect className="stadium-sector-outline" x={stand.x - 4} y={stand.y - 4} width={stand.width + 8} height={stand.height + 8} fill={active ? '#718b49' : '#314653'} stroke={active ? '#b6ef58' : '#47606a'} strokeWidth="3" />
        <rect x={stand.x} y={stand.y} width={stand.width} height={stand.height} fill={active ? '#344e37' : '#1f3740'} />
        {Array.from({ length: index % 2 ? 10 : 4 }, (_, row) => <rect key={row} x={stand.x + 5} y={stand.y + 6 + row * (index % 2 ? 20 : 17)} width={stand.width - 10} height="4" fill={colors[index]} opacity=".5" />)}
        {Array.from({ length: index % 2 ? 80 : 120 }, (_, i) => { const cols = index % 2 ? 8 : 30; const x = stand.x + 7 + (i % cols) * (index % 2 ? 9 : 12); const y = stand.y + 11 + Math.floor(i / cols) * (index % 2 ? 20 : 17); return <g key={i} aria-hidden="true"><rect x={x} y={y} width="3" height="3" fill={i % 4 === 0 ? '#c9aa81' : '#86978d'} /><rect x={x - 1} y={y + 3} width="5" height="4" fill={i % 5 === 0 ? '#d5ddc0' : i % 3 === 0 ? '#263d45' : colors[index]} /></g> })}
        {sector.construction && <g aria-label="Setor em obras"><path d={`M${stand.x + 5} ${stand.y + 5}l${stand.width - 10} ${stand.height - 10}m-${stand.width - 10} 0l${stand.width - 10}-${stand.height - 10}`} stroke="#f4c45e" strokeWidth="7" opacity=".68" /><text x={stand.labelX} y={stand.labelY + 31} textAnchor="middle" fill="#ffe18a" fontFamily="monospace" fontSize="11" fontWeight="bold">OBRA</text></g>}
        <rect x={stand.labelX - 61} y={stand.labelY - 14} width="122" height="23" fill="#091a23" stroke={active ? '#b6ef58' : colors[index]} strokeWidth="2" />
        <text x={stand.labelX} y={stand.labelY + 1} textAnchor="middle" fill={active ? '#c4f57b' : '#dde9df'} fontFamily="monospace" fontWeight="bold" fontSize="12">{sector.name.toLocaleUpperCase('pt-BR')}</text>
      </g>
    })}
    <text aria-hidden="true" x="30" y="525" fill="#788f94" fontFamily="monospace" fontSize="10">VISTA ADMINISTRATIVA · MODELO ILUSTRATIVO</text>
  </svg>
}
