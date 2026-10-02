/** Hash apenas visual. Não usa RNG da simulação, idade, foto externa ou persistência. */
export function avatarAppearance(id: string) {
  let hash = 2166136261
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const skins = ['#d7a17c', '#b97d57', '#8d573d', '#edbd95', '#704736', '#c29170']
  const hairs = ['#29272c', '#4e352e', '#a27748', '#271f1a', '#725344']
  const shirts = ['#729ba8', '#81996d', '#8f82a5', '#bb9475', '#688d91']
  return { skin: skins[hash % skins.length], hair: hairs[(hash >>> 3) % hairs.length], shirt: shirts[(hash >>> 7) % shirts.length],
    hairstyle: (hash >>> 11) % 4, beard: (hash >>> 15) % 3 === 0, brow: 28 + (hash >>> 18) % 3 }
}
