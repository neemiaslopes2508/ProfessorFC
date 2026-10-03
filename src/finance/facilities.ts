import type { ClubId } from '../core/ids'

export type FacilityType = 'TRAINING' | 'YOUTH' | 'MEDICAL' | 'SHOP' | 'STADIUM'
export interface Facility { readonly id: string; readonly clubId: ClubId; readonly type: FacilityType; readonly level: number; readonly construction?: { readonly startedAt: string; readonly completionDate: string; readonly targetLevel: number } }
export interface FacilityLevel { readonly upgradeCostCents: number; readonly upgradeDays: number; readonly maintenanceCents: number; readonly monthlyIncomeCents: number }
export interface FacilityDefinition { readonly type: FacilityType; readonly name: string; readonly description: string; readonly benefit: string; readonly levels: readonly FacilityLevel[] }
export interface FacilityConfig { readonly paymentDay: number; readonly definitions: readonly FacilityDefinition[] }
const definitions = [
  { type: 'TRAINING', name: 'Centro de Treinamento', description: 'Instalações de preparação do elenco profissional.', benefit: 'Benefício preparado para sistema futuro: desenvolvimento de jogadores.', cost: 50000000, maintenance: 500000 },
  { type: 'YOUTH', name: 'Categorias de Base', description: 'Estrutura de formação das próximas gerações.', benefit: 'Benefício preparado para sistema futuro: geração e desenvolvimento de jovens.', cost: 40000000, maintenance: 300000 },
  { type: 'MEDICAL', name: 'Departamento Médico', description: 'Estrutura de atendimento e recuperação.', benefit: 'Benefício preparado para sistema futuro: lesões e recuperação.', cost: 35000000, maintenance: 400000 },
  { type: 'SHOP', name: 'Loja Oficial', description: 'Ponto de venda de produtos oficiais do clube.', benefit: 'Receita comercial mensal ativa, conforme o nível da Loja.', cost: 25000000, maintenance: 200000 },
  { type: 'STADIUM', name: 'Estádio', description: 'Nível estrutural da arena e das áreas de apoio.', benefit: 'Benefício preparado para sistema futuro. Melhorar estrutura não amplia capacidade ou setores.', cost: 80000000, maintenance: 600000 },
] as const
export const DEVELOPMENT_FACILITY_CONFIG: FacilityConfig = Object.freeze({ paymentDay: 1, definitions: Object.freeze(definitions.map(item => Object.freeze({ type: item.type, name: item.name, description: item.description, benefit: item.benefit, levels: Object.freeze(Array.from({ length: 5 }, (_, index) => Object.freeze({ upgradeCostCents: index ? item.cost * index : 0, upgradeDays: index ? 30 * index : 0, maintenanceCents: item.maintenance * (index + 1), monthlyIncomeCents: item.type === 'SHOP' ? 1200000 * (index + 1) : 0 }))) }))) })
export function createDevelopmentFacilities(clubs: readonly { id: ClubId }[]): readonly Facility[] {
  return Object.freeze(clubs.flatMap(club => DEVELOPMENT_FACILITY_CONFIG.definitions.map(definition => Object.freeze({ id: `facility-${club.id}-${definition.type}`, clubId: club.id, type: definition.type, level: 1 }))))
}
