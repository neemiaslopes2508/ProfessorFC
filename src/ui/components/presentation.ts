export const mentalityLabels = { DEFENSIVE: 'Defensiva', BALANCED: 'Equilibrada', ATTACKING: 'Ofensiva' }
export const financialHealthLabels = { EXCELLENT: 'Excelente', HEALTHY: 'Saudável', WARNING: 'Atenção', CRITICAL: 'Crítica' }
export const financeTypeLabels = { PLAYER_WAGES: 'Salários', PLAYER_PURCHASE: 'Compra de jogador', PLAYER_SALE: 'Venda de jogador', MATCH_TICKETS: 'Bilheteria', SPONSORSHIP: 'Patrocínio mensal', SPONSOR_SIGNING_BONUS: 'Bônus de assinatura', SPONSOR_OBJECTIVE_BONUS: 'Bônus por meta', COMPETITION_PRIZE: 'Premiações', FACILITY_UPGRADE: 'Investimento em estrutura', FACILITY_MAINTENANCE: 'Manutenção das instalações', STADIUM_EXPANSION: 'Expansão do estádio', STADIUM_MAINTENANCE: 'Manutenção do estádio', MERCHANDISING: 'Loja Oficial' }
export const squadRoleLabels = { STAR_PLAYER: 'Craque', IMPORTANT: 'Importante', ROTATION: 'Rotação', BACKUP: 'Reserva', PROSPECT: 'Promessa' }
export const styleLabels = { POSSESSION: 'Posse', BALANCED: 'Equilibrado', COUNTER_ATTACK: 'Contra-ataque', PRESSING: 'Pressão' }
import type { Position } from '../../domain/players'
export const positionLabels: Readonly<Record<Position, string>> = { GK: 'Goleiro', RB: 'Lateral-direito', LB: 'Lateral-esquerdo', CB: 'Zagueiro', DM: 'Volante', CM: 'Meio-campista', AM: 'Meia ofensivo', RW: 'Ponta direita', LW: 'Ponta esquerda', ST: 'Centroavante' }
export const shortPositionLabels: Readonly<Record<Position, string>> = { GK: 'GOL', RB: 'LD', LB: 'LE', CB: 'ZAG', DM: 'VOL', CM: 'MC', AM: 'MEI', RW: 'PD', LW: 'PE', ST: 'ATA' }
export function positionLabel(position: Position, short = false) { return (short ? shortPositionLabels : positionLabels)[position] }
export function readableSelectionMessage(message: string) {
  return message.replace(/\b(GK|RB|LB|CB|DM|CM|AM|RW|LW|ST)\b/g, code => positionLabel(code as Position))
    .replace(/\b(AVAILABLE|INJURED|SUSPENDED|RECOVERING)\b/g, code => statusLabels[code as keyof typeof statusLabels])
}
export const statusLabels = { AVAILABLE: 'Disponível', INJURED: 'Lesionado', SUSPENDED: 'Suspenso', RECOVERING: 'Em recuperação' }
export const attributeLabels = { finishing: 'Finalização', passing: 'Passe', technique: 'Técnica', defending: 'Defesa', pace: 'Velocidade', physical: 'Físico', stamina: 'Resistência', decision: 'Decisão' }
export const eventLabels = { GOAL: 'Gol', SHOT: 'Finalização', SHOT_ON_TARGET: 'Finalização no alvo', SAVE: 'Defesa do goleiro', FOUL: 'Falta', YELLOW_CARD: 'Cartão amarelo', CORNER: 'Escanteio', RED_CARD: 'Cartão vermelho', SUBSTITUTION: 'Substituição', INJURY: 'Lesão', PENALTY: 'Pênalti' }
export const statisticLabels = { possession: 'Posse (%)', shots: 'Finalizações', shotsOnTarget: 'Finalizações no alvo', corners: 'Escanteios', fouls: 'Faltas', yellowCards: 'Amarelos', redCards: 'Vermelhos' }
export { formatCurrencyBRL as money } from './currency'
export function dateLabel(date: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) }
import type { PrototypeSession } from '../../application/prototypeSession'
import type { ClubId } from '../../core/ids'

export function clubName(session: PrototypeSession, id: ClubId) { return session.teams.find(team => team.club.id === id)?.club.name ?? id }
