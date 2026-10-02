export type MatchDayScene = 'HUB' | 'ARRIVAL' | 'MATCH_INTRO' | 'LINEUPS' | 'ENTERING_PITCH' | 'MATCH'
const next: Readonly<Record<MatchDayScene, MatchDayScene>> = { HUB: 'ARRIVAL', ARRIVAL: 'MATCH_INTRO', MATCH_INTRO: 'LINEUPS', LINEUPS: 'ENTERING_PITCH', ENTERING_PITCH: 'MATCH', MATCH: 'MATCH' }
export const MATCH_DAY_TIMING = Object.freeze({ arrival: 3200, entering: 800 })
export function advanceMatchDayScene(scene: MatchDayScene, action: 'CONTINUE' | 'SKIP'): MatchDayScene { return action === 'SKIP' ? 'MATCH' : next[scene] }
