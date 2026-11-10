export const JS_SPEED_SNIPPETS = [
  {
    id: 'filter-alive',
    desc: 'Filtre apenas os devs que estão com HP positivo:',
    code: 'const alive = devs.filter(d => d.hp > 0);',
    commitsReward: 180,
    xpReward: 130,
  },
  {
    id: 'reduce-xp',
    desc: 'Some o total de XP acumulado pelo squad com reduce:',
    code: 'const totalXp = squad.reduce((s, d) => s + d.xp, 0);',
    commitsReward: 210,
    xpReward: 150,
  },
  {
    id: 'async-deploy',
    desc: 'Aguarde o build terminar antes de liberar o deploy:',
    code: 'await buildProd(); console.log("Deploy OK!");',
    commitsReward: 190,
    xpReward: 140,
  },
  {
    id: 'map-damage',
    desc: 'Dobre o dano base de todas as armas equipadas:',
    code: 'const buffed = weapons.map(w => w.dmg * 2);',
    commitsReward: 175,
    xpReward: 125,
  },
  {
    id: 'find-boss',
    desc: 'Localize o primeiro inimigo da categoria boss na arena:',
    code: 'const boss = enemies.find(e => e.isBoss === true);',
    commitsReward: 185,
    xpReward: 135,
  },
  {
    id: 'spread-clone',
    desc: 'Crie um clone imutável do estado do servidor com shield ativo:',
    code: 'const nextState = { ...state, shield: true };',
    commitsReward: 195,
    xpReward: 140,
  },
  {
    id: 'set-dedupe',
    desc: 'Remova IDs duplicados da fila de pacotes usando Set:',
    code: 'const uniqueIds = [...new Set(packetIds)];',
    commitsReward: 180,
    xpReward: 130,
  },
  {
    id: 'nullish-port',
    desc: 'Defina a porta padrão 8080 usando nullish coalescing:',
    code: 'const port = process.env.PORT ?? 8080;',
    commitsReward: 165,
    xpReward: 120,
  },
];

export const JS_MERGE_CHALLENGES = [
  {
    id: 'bug-strict-equal',
    title: 'CONFLITO #1: Atribuição Acidental no If',
    description: 'A função deveria verificar se `hp <= 0`, mas está atribuindo 0 e nunca detecta o Game Over corretamente!',
    buggyCode: `function isDead(player) {
  // BUG NA LINHA ABAIXO:
  if (player.hp = 0) {
    return true;
  }
  return false;
}`,
    options: [
      'if (player.hp <= 0) {',
      'if (player.hp = -1) {',
      'while (player.hp == 0) {',
      'if (player.hp => 0) {',
    ],
    correctAnswer: 'if (player.hp <= 0) {',
    acceptedAliases: ['if (player.hp <= 0) {', 'if (player.hp === 0) {', 'if(player.hp<=0){', 'if(player.hp===0){', 'player.hp <= 0', 'player.hp === 0'],
  },
  {
    id: 'bug-array-map',
    title: 'CONFLITO #2: Arrow Function Sem Return',
    description: 'O `.map()` está retornando `[undefined, undefined]` porque faltou retornar o valor dentro das chaves `{}`!',
    buggyCode: `function doubleScores(scores) {
  // BUG NA LINHA ABAIXO:
  return scores.map(s => { s * 2 });
}`,
    options: [
      'return scores.map(s => s * 2);',
      'return scores.forEach(s => s * 2);',
      'return scores.map(s => { s + 2 });',
      'return scores.filter(s => s * 2);',
    ],
    correctAnswer: 'return scores.map(s => s * 2);',
    acceptedAliases: ['return scores.map(s => s * 2);', 'return scores.map(s => { return s * 2; });', 'scores.map(s => s * 2)'],
  },
  {
    id: 'bug-async-await',
    title: 'CONFLITO #3: Promise Pendente no Fetch',
    description: 'A função retorna a função não invocada em vez do JSON porque esqueceram `await` e `()` em `res.json()`!',
    buggyCode: `async function loadConfig(url) {
  const res = await fetch(url);
  // BUG NA LINHA ABAIXO:
  return res.json;
}`,
    options: [
      'return await res.json();',
      'return res.toString();',
      'await return res.json;',
      'return JSON.stringify(res);',
    ],
    correctAnswer: 'return await res.json();',
    acceptedAliases: ['return await res.json();', 'return res.json();'],
  },
  {
    id: 'bug-off-by-one',
    title: 'CONFLITO #4: Loop Passando do Limite do Array',
    description: 'O loop acessa `items[items.length]` que é `undefined` e quebra o servidor! Corrija a condição do `for`:',
    buggyCode: `function sumDamage(items) {
  let total = 0;
  // BUG NA LINHA ABAIXO:
  for (let i = 0; i <= items.length; i++) {
    total += items[i].dmg;
  }
  return total;
}`,
    options: [
      'for (let i = 0; i < items.length; i++) {',
      'for (let i = 1; i <= items.length; i++) {',
      'for (let i = 0; i == items.length; i++) {',
      'for (let i = 0; i > items.length; i++) {',
    ],
    correctAnswer: 'for (let i = 0; i < items.length; i++) {',
    acceptedAliases: ['for (let i = 0; i < items.length; i++) {', 'i < items.length'],
  },
  {
    id: 'bug-sort-numbers',
    title: 'CONFLITO #5: Sort Ordenando Números como Strings',
    description: '`[10, 2, 30].sort()` em JS ordena em ordem alfabética. Passe o comparador numérico crescente:',
    buggyCode: `function rankScoresAsc(list) {
  // BUG NA LINHA ABAIXO:
  return list.sort();
}`,
    options: [
      'return list.sort((a, b) => a - b);',
      'return list.sort((a, b) => a && b);',
      'return list.split().sort();',
      'return list.sort(true);',
    ],
    correctAnswer: 'return list.sort((a, b) => a - b);',
    acceptedAliases: ['return list.sort((a, b) => a - b);', 'list.sort((a, b) => a - b)'],
  },
];

export function normalizeCode(input) {
  return String(input || '').trim().replace(/\s+/g, ' ');
}
