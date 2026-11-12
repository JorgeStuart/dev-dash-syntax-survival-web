// Banco expandido de desafios de JavaScript (Terminais & Merge Conflicts)
// Organizado por tópico, dificuldade, modalidade e efeito na arena.
// Validação 100% determinística e segura (sem eval / Function).

export const ARENA_EFFECT_TYPES = {
  filter_purge: {
    id: 'filter_purge',
    icon: '💥',
    label: '💥 Purga 4 Bugs Próximos',
    shortTag: 'PURGA BUGS',
    color: '#00e5ff',
  },
  async_overclock: {
    id: 'async_overclock',
    icon: '⚡',
    label: '⚡ +45% Cadência (10s)',
    shortTag: 'OVERCLOCK 10s',
    color: '#ffb020',
  },
  memory_gc: {
    id: 'memory_gc',
    icon: '🧲',
    label: '🧲 +35 HP & Ímã XP (12s)',
    shortTag: 'CURA + ÍMÃ',
    color: '#33ff88',
  },
  logic_firewall: {
    id: 'logic_firewall',
    icon: '🔥',
    label: '🔥 Pulso Firewall & +25% Dano (10s)',
    shortTag: 'FIREWALL + DANO',
    color: '#ff2d95',
  },
};

export const JS_SPEED_SNIPPETS = [
  // 1. ARRAYS
  {
    id: 'filter-alive',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'filter_purge',
    desc: 'Filtre apenas os devs que estão com HP positivo:',
    promptCode: 'const alive = devs.___(d => d.hp > 0);',
    code: 'const alive = devs.filter(d => d.hp > 0);',
    options: [
      'const alive = devs.filter(d => d.hp > 0);',
      'const alive = devs.map(d => d.hp > 0);',
      'const alive = devs.forEach(d => d.hp > 0);',
      'const alive = devs.reduce(d => d.hp > 0);',
    ],
    acceptedAliases: ['devs.filter(d => d.hp > 0)', 'const alive = devs.filter((d) => d.hp > 0);', 'filter'],
    commitsReward: 180,
    xpReward: 130,
    explanation: '`.filter()` retorna um novo array apenas com os itens para os quais a função retorna `true`.',
  },
  {
    id: 'reduce-xp',
    topic: 'arrays',
    difficulty: 'intermediario',
    mode: 'typing',
    effectType: 'memory_gc',
    desc: 'Some o total de XP acumulado pelo squad com reduce:',
    promptCode: 'const totalXp = squad.__((s, d) => s + d.xp, 0);',
    code: 'const totalXp = squad.reduce((s, d) => s + d.xp, 0);',
    options: [
      'const totalXp = squad.reduce((s, d) => s + d.xp, 0);',
      'const totalXp = squad.map((s, d) => s + d.xp, 0);',
      'const totalXp = squad.filter((s, d) => s + d.xp, 0);',
      'const totalXp = squad.concat((s, d) => s + d.xp, 0);',
    ],
    acceptedAliases: ['squad.reduce((s, d) => s + d.xp, 0)', 'reduce'],
    commitsReward: 210,
    xpReward: 150,
    explanation: 'Em `.reduce((acc, item) => ..., 0)`, o `0` inicial evita erros com arrays vazios e soma números corretamente.',
  },
  {
    id: 'map-damage',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'logic_firewall',
    desc: 'Dobre o dano base de todas as armas equipadas:',
    promptCode: 'const buffed = weapons.___(w => w.dmg * 2);',
    code: 'const buffed = weapons.map(w => w.dmg * 2);',
    options: [
      'const buffed = weapons.map(w => w.dmg * 2);',
      'const buffed = weapons.filter(w => w.dmg * 2);',
      'const buffed = weapons.every(w => w.dmg * 2);',
      'const buffed = weapons.find(w => w.dmg * 2);',
    ],
    acceptedAliases: ['weapons.map(w => w.dmg * 2)', 'map'],
    commitsReward: 175,
    xpReward: 125,
    explanation: '`.map()` transforma cada elemento do array original em um novo valor, mantendo o mesmo tamanho.',
  },
  {
    id: 'find-boss',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'complete',
    effectType: 'filter_purge',
    desc: 'Complete a expressão para localizar o primeiro inimigo que é boss:',
    promptCode: 'const boss = enemies.___(e => e.isBoss === true);',
    code: 'const boss = enemies.find(e => e.isBoss === true);',
    options: [
      'const boss = enemies.find(e => e.isBoss === true);',
      'const boss = enemies.filter(e => e.isBoss === true);',
      'const boss = enemies.some(e => e.isBoss === true);',
      'const boss = enemies.includes(e => e.isBoss === true);',
    ],
    acceptedAliases: ['enemies.find(e => e.isBoss === true)', 'enemies.find(e => e.isBoss)', 'find'],
    commitsReward: 185,
    xpReward: 135,
    explanation: '`.find()` retorna o primeiro elemento que satisfaz a condição (enquanto `.filter()` retornaria um array).',
  },
  {
    id: 'some-low-hp',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'complete',
    effectType: 'memory_gc',
    desc: 'Verifique se pelo menos um aliado está com HP crítico (< 25):',
    promptCode: 'const needsHeal = party.___(p => p.hp < 25);',
    code: 'const needsHeal = party.some(p => p.hp < 25);',
    options: [
      'const needsHeal = party.some(p => p.hp < 25);',
      'const needsHeal = party.every(p => p.hp < 25);',
      'const needsHeal = party.map(p => p.hp < 25);',
      'const needsHeal = party.reduce(p => p.hp < 25);',
    ],
    acceptedAliases: ['party.some(p => p.hp < 25)', 'some'],
    commitsReward: 180,
    xpReward: 130,
    explanation: '`.some()` retorna `true` assim que encontra o primeiro elemento que cumpre o predicado.',
  },
  {
    id: 'every-ready',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'fix_code',
    effectType: 'logic_firewall',
    desc: 'A partida só deve iniciar se TODOS os jogadores estiverem prontos (`ready`), mas usaram `.some()`:',
    promptCode: 'const allReady = players.some(p => p.ready);',
    code: 'const allReady = players.every(p => p.ready);',
    options: [
      'const allReady = players.every(p => p.ready);',
      'const allReady = players.find(p => p.ready);',
      'const allReady = players.filter(p => p.ready);',
      'const allReady = players.forEach(p => p.ready);',
    ],
    acceptedAliases: ['players.every(p => p.ready)', 'players.every(p => p.ready === true)'],
    commitsReward: 190,
    xpReward: 140,
    explanation: '`.every()` exige que todos os elementos retornem `true`; se um falhar, retorna `false` imediatamente.',
  },

  // 2. OBJETOS & ESTRUTURAS
  {
    id: 'spread-clone',
    topic: 'objetos',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'memory_gc',
    desc: 'Crie um clone imutável do estado do servidor com shield ativo:',
    promptCode: 'const nextState = { ___state, shield: true };',
    code: 'const nextState = { ...state, shield: true };',
    options: [
      'const nextState = { ...state, shield: true };',
      'const nextState = { *state, shield: true };',
      'const nextState = { &state, shield: true };',
      'const nextState = { $state, shield: true };',
    ],
    acceptedAliases: ['{ ...state, shield: true }', '...state'],
    commitsReward: 195,
    xpReward: 140,
    explanation: 'O operador spread `...` copia as propriedades próprias enumeráveis para um novo objeto e sobrescreve `shield`.',
  },
  {
    id: 'set-dedupe',
    topic: 'arrays',
    difficulty: 'intermediario',
    mode: 'typing',
    effectType: 'filter_purge',
    desc: 'Remova IDs duplicados da fila de pacotes usando Set:',
    promptCode: 'const uniqueIds = [...new ___(packetIds)];',
    code: 'const uniqueIds = [...new Set(packetIds)];',
    options: [
      'const uniqueIds = [...new Set(packetIds)];',
      'const uniqueIds = [...new Map(packetIds)];',
      'const uniqueIds = [...new WeakSet(packetIds)];',
      'const uniqueIds = [...new Array(packetIds)];',
    ],
    acceptedAliases: ['Array.from(new Set(packetIds))', '[...new Set(packetIds)]', 'Set'],
    commitsReward: 180,
    xpReward: 130,
    explanation: '`Set` armazena apenas valores únicos; espalhar com `[...new Set(arr)]` reconverte para array sem duplicatas.',
  },
  {
    id: 'destructure-config',
    topic: 'objetos',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'memory_gc',
    desc: 'Extraia `host` e `port` do objeto `config` via desestruturação:',
    promptCode: 'const { host, port } = ___;',
    code: 'const { host, port } = config;',
    options: [
      'const { host, port } = config;',
      'const [host, port] = config;',
      'const { host, port } : config;',
      'const (host, port) = config;',
    ],
    acceptedAliases: ['const { port, host } = config;', 'config'],
    commitsReward: 175,
    xpReward: 125,
    explanation: 'A desestruturação `const { host, port } = config` cria variáveis locais diretamente a partir das chaves do objeto.',
  },
  {
    id: 'object-entries- sum',
    topic: 'objetos',
    difficulty: 'intermediario',
    mode: 'complete',
    effectType: 'memory_gc',
    desc: 'Obtenha apenas a lista com os valores numéricos de latência do objeto `pings`:',
    promptCode: 'const values = Object.___(pings);',
    code: 'const values = Object.values(pings);',
    options: [
      'const values = Object.values(pings);',
      'const values = Object.keys(pings);',
      'const values = Object.assign(pings);',
      'const values = Object.freeze(pings);',
    ],
    acceptedAliases: ['Object.values(pings)', 'values'],
    commitsReward: 185,
    xpReward: 135,
    explanation: '`Object.values(obj)` retorna um array com os valores das propriedades enumeráveis próprias do objeto.',
  },
  {
    id: 'optional-chaining-guild',
    topic: 'objetos',
    difficulty: 'intermediario',
    mode: 'fix_code',
    effectType: 'memory_gc',
    desc: 'Evite `TypeError` quando `player.clan` for `undefined` ao acessar `tag`:',
    promptCode: 'const clanTag = player.clan.tag;',
    code: 'const clanTag = player.clan?.tag;',
    options: [
      'const clanTag = player.clan?.tag;',
      'const clanTag = player.clan!.tag;',
      'const clanTag = player.clan..tag;',
      'const clanTag = player?.clan.tag();',
    ],
    acceptedAliases: ['player.clan?.tag', 'player?.clan?.tag', 'const clanTag = player?.clan?.tag;'],
    commitsReward: 195,
    xpReward: 140,
    explanation: 'O encadeamento opcional `?.` avalia como `undefined` sem lançar erro se a referência anterior for `null` ou `undefined`.',
  },
  {
    id: 'has-own-prop',
    topic: 'objetos',
    difficulty: 'avancado',
    mode: 'spot_bug',
    effectType: 'logic_firewall',
    desc: 'Identifique o método moderno seguro para checar se `cache` possui a chave própria `token`:',
    promptCode: '// Qual expressão verifica apenas propriedades próprias sem herança do prototype?',
    code: 'Object.hasOwn(cache, "token")',
    options: [
      'Object.hasOwn(cache, "token")',
      '"toString" in cache',
      'cache.token !== null',
      'Object.keys(cache).length',
    ],
    acceptedAliases: ['Object.hasOwn(cache, "token")', 'Object.prototype.hasOwnProperty.call(cache, "token")'],
    commitsReward: 215,
    xpReward: 155,
    explanation: '`Object.hasOwn(obj, prop)` verifica apenas propriedades próprias do objeto, ignorando a cadeia de protótipos.',
  },

  // 3. CONDIÇÕES & OPERADORES
  {
    id: 'nullish-port',
    topic: 'condicoes',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'logic_firewall',
    desc: 'Defina a porta padrão 8080 usando nullish coalescing:',
    promptCode: 'const port = process.env.PORT ___ 8080;',
    code: 'const port = process.env.PORT ?? 8080;',
    options: [
      'const port = process.env.PORT ?? 8080;',
      'const port = process.env.PORT || 8080;',
      'const port = process.env.PORT && 8080;',
      'const port = process.env.PORT ?: 8080;',
    ],
    acceptedAliases: ['process.env.PORT ?? 8080', '??'],
    commitsReward: 165,
    xpReward: 120,
    explanation: 'O operador `??` só usa o valor padrão quando o lado esquerdo é `null` ou `undefined` (preservando `0` ou `""`).',
  },
  {
    id: 'nullish-zero-ammo',
    topic: 'condicoes',
    difficulty: 'intermediario',
    mode: 'spot_bug',
    effectType: 'logic_firewall',
    desc: 'Quando `player.ammo` é `0`, o código abaixo recarrega para `10` por engano! Qual correção preserva `0`?',
    promptCode: 'const ammo = player.ammo || 10; // Bug quando ammo === 0',
    code: 'const ammo = player.ammo ?? 10;',
    options: [
      'const ammo = player.ammo ?? 10;',
      'const ammo = player.ammo && 10;',
      'const ammo = Boolean(player.ammo);',
      'const ammo = player.ammo == 10;',
    ],
    acceptedAliases: ['player.ammo ?? 10'],
    commitsReward: 200,
    xpReward: 145,
    explanation: 'Como `0` é falsy, `0 || 10` avalia para `10`. Já `0 ?? 10` preserva `0` porque `0` não é `null` nem `undefined`.',
  },
  {
    id: 'strict-inequality',
    topic: 'condicoes',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'logic_firewall',
    desc: 'Verifique com igualdade estrita se o status do pacote é diferente de 200:',
    promptCode: 'const failed = res.status ___ 200;',
    code: 'const failed = res.status !== 200;',
    options: [
      'const failed = res.status !== 200;',
      'const failed = res.status != 200;',
      'const failed = res.status <> 200;',
      'const failed = res.status =/= 200;',
    ],
    acceptedAliases: ['res.status !== 200', '!=='],
    commitsReward: 170,
    xpReward: 125,
    explanation: '`!==` compara valor e tipo sem coerção implícita, evitando falsos positivos entre strings e números.',
  },
  {
    id: 'clamp-hp-math',
    topic: 'condicoes',
    difficulty: 'intermediario',
    mode: 'complete',
    effectType: 'memory_gc',
    desc: 'Garanta que o HP curado nunca ultrapasse `maxHp`:',
    promptCode: 'player.hp = Math.___(player.maxHp, player.hp + 25);',
    code: 'player.hp = Math.min(player.maxHp, player.hp + 25);',
    options: [
      'player.hp = Math.min(player.maxHp, player.hp + 25);',
      'player.hp = Math.max(player.maxHp, player.hp + 25);',
      'player.hp = Math.floor(player.maxHp, player.hp + 25);',
      'player.hp = Math.round(player.maxHp + 25);',
    ],
    acceptedAliases: ['Math.min(player.maxHp, player.hp + 25)', 'Math.min(player.hp + 25, player.maxHp)', 'min'],
    commitsReward: 185,
    xpReward: 135,
    explanation: '`Math.min(limite, valor)` aplica um teto máximo porque retorna o menor entre o valor calculado e o limite.',
  },

  // 4. FUNÇÕES & ESCOPO
  {
    id: 'default-param-mult',
    topic: 'funcoes',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'logic_firewall',
    desc: 'Declare uma arrow function que multiplica `dmg` por `mult` (com padrão 1):',
    promptCode: 'const calcDmg = (dmg, mult = 1) => ___;',
    code: 'const calcDmg = (dmg, mult = 1) => dmg * mult;',
    options: [
      'const calcDmg = (dmg, mult = 1) => dmg * mult;',
      'const calcDmg = (dmg, mult = 1) => dmg + mult;',
      'const calcDmg = (dmg, mult = 1) => dmg ** mult;',
      'const calcDmg = (dmg, mult = 1) => { dmg * mult };',
    ],
    acceptedAliases: ['(dmg, mult = 1) => dmg * mult', 'function calcDmg(dmg, mult = 1) { return dmg * mult; }', 'dmg * mult'],
    commitsReward: 190,
    xpReward: 135,
    explanation: 'Parâmetros padrão (`mult = 1`) são aplicados automaticamente quando o argumento é omitido ou `undefined`.',
  },
  {
    id: 'arrow-implicit-object',
    topic: 'funcoes',
    difficulty: 'avancado',
    mode: 'fix_code',
    effectType: 'memory_gc',
    desc: 'Corrija a arrow function para retornar um objeto literal `{ x, y }` implicitamente:',
    promptCode: 'const makePoint = (x, y) => { x, y }; // Retorna undefined!',
    code: 'const makePoint = (x, y) => ({ x, y });',
    options: [
      'const makePoint = (x, y) => ({ x, y });',
      'const makePoint = (x, y) => [x, y];',
      'const makePoint = (x, y) => { x: x, y: y };',
      'const makePoint = (x, y) => return { x, y };',
    ],
    acceptedAliases: ['(x, y) => ({ x, y })', 'const makePoint = (x, y) => { return { x, y }; };'],
    commitsReward: 220,
    xpReward: 160,
    explanation: 'Em arrow functions, `{}` após `=>` abre um bloco de código; envolver com parênteses `({ x, y })` retorna o objeto literal.',
  },
  {
    id: 'rest-params-sum',
    topic: 'funcoes',
    difficulty: 'intermediario',
    mode: 'complete',
    effectType: 'filter_purge',
    desc: 'Use rest parameters para agrupar todos os argumentos em um array `nums`:',
    promptCode: 'const sumAll = (___nums) => nums.reduce((a, b) => a + b, 0);',
    code: 'const sumAll = (...nums) => nums.reduce((a, b) => a + b, 0);',
    options: [
      'const sumAll = (...nums) => nums.reduce((a, b) => a + b, 0);',
      'const sumAll = (*nums) => nums.reduce((a, b) => a + b, 0);',
      'const sumAll = (&nums) => nums.reduce((a, b) => a + b, 0);',
      'const sumAll = ([nums]) => nums.reduce((a, b) => a + b, 0);',
    ],
    acceptedAliases: ['(...nums) => nums.reduce((a, b) => a + b, 0)', '...nums'],
    commitsReward: 195,
    xpReward: 145,
    explanation: 'A sintaxe rest `(...nums)` coleta um número variável de argumentos em um array verdadeiro.',
  },
  {
    id: 'closure-counter',
    topic: 'funcoes',
    difficulty: 'intermediario',
    mode: 'spot_bug',
    effectType: 'logic_firewall',
    desc: 'Por que `nextId()` falha ao tentar incrementar `id` na segunda linha?',
    promptCode: 'const id = 0;\nconst nextId = () => ++id;',
    code: 'let id = 0;',
    options: [
      'let id = 0;',
      'const id == 0;',
      'static id = 0;',
      'final id = 0;',
    ],
    acceptedAliases: ['let id = 0', 'let id = 0; const nextId = () => ++id;'],
    commitsReward: 190,
    xpReward: 140,
    explanation: 'Variáveis declaradas com `const` não podem ser reatribuídas (`++id` lança `TypeError: Assignment to constant variable`).',
  },

  // 5. PROMISES & ASYNC/AWAIT
  {
    id: 'async-deploy',
    topic: 'async_await',
    difficulty: 'iniciante',
    mode: 'typing',
    effectType: 'async_overclock',
    desc: 'Aguarde o build terminar antes de liberar o deploy:',
    promptCode: '___ buildProd(); console.log("Deploy OK!");',
    code: 'await buildProd(); console.log("Deploy OK!");',
    options: [
      'await buildProd(); console.log("Deploy OK!");',
      'yield buildProd(); console.log("Deploy OK!");',
      'defer buildProd(); console.log("Deploy OK!");',
      'wait buildProd(); console.log("Deploy OK!");',
    ],
    acceptedAliases: ['await buildProd();', 'await'],
    commitsReward: 190,
    xpReward: 140,
    explanation: '`await` pausa a execução da função `async` até que a Promise de `buildProd()` seja resolvida.',
  },
  {
    id: 'promise-all-sync',
    topic: 'promises',
    difficulty: 'intermediario',
    mode: 'complete',
    effectType: 'async_overclock',
    desc: 'Aguarde o carregamento paralelo do mapa e dos jogadores em uma única Promise:',
    promptCode: 'const [map, players] = await Promise.___([loadMap(), loadPlayers()]);',
    code: 'const [map, players] = await Promise.all([loadMap(), loadPlayers()]);',
    options: [
      'const [map, players] = await Promise.all([loadMap(), loadPlayers()]);',
      'const [map, players] = await Promise.race([loadMap(), loadPlayers()]);',
      'const [map, players] = await Promise.any([loadMap(), loadPlayers()]);',
      'const [map, players] = await Promise.resolve([loadMap(), loadPlayers()]);',
    ],
    acceptedAliases: ['Promise.all([loadMap(), loadPlayers()])', 'all'],
    commitsReward: 215,
    xpReward: 155,
    explanation: '`Promise.all()` executa as Promises em paralelo e resolve quando todas concluem, retornando os resultados na mesma ordem.',
  },
  {
    id: 'try-catch-fetch',
    topic: 'async_await',
    difficulty: 'intermediario',
    mode: 'fix_code',
    effectType: 'async_overclock',
    desc: 'Adicione a palavra-chave que falta na assinatura para permitir o uso de `await` dentro da função:',
    promptCode: 'function syncState() { return await fetchState(); }',
    code: 'async function syncState() { return await fetchState(); }',
    options: [
      'async function syncState() { return await fetchState(); }',
      'defer function syncState() { return await fetchState(); }',
      'await function syncState() { return await fetchState(); }',
      'promise function syncState() { return await fetchState(); }',
    ],
    acceptedAliases: ['async function syncState() { return await fetchState(); }', 'async function syncState()'],
    commitsReward: 200,
    xpReward: 145,
    explanation: '`await` só é válido dentro de funções marcadas como `async` (ou no top-level de um ES Module).',
  },
  {
    id: 'promise-catch-fallback',
    topic: 'promises',
    difficulty: 'avancado',
    mode: 'typing',
    effectType: 'async_overclock',
    desc: 'Capture falhas na Promise `pingServer()` retornando `-1` como fallback:',
    promptCode: 'const ms = await pingServer().___(() => -1);',
    code: 'const ms = await pingServer().catch(() => -1);',
    options: [
      'const ms = await pingServer().catch(() => -1);',
      'const ms = await pingServer().then(() => -1);',
      'const ms = await pingServer().finally(() => -1);',
      'const ms = await pingServer().error(() => -1);',
    ],
    acceptedAliases: ['pingServer().catch(() => -1)', 'catch'],
    commitsReward: 225,
    xpReward: 165,
    explanation: 'Encadear `.catch(() => -1)` trata a rejeição da Promise e resolve com o valor de fallback `-1`.',
  },
];

export const JS_MERGE_CHALLENGES = [
  {
    id: 'bug-strict-equal',
    topic: 'condicoes',
    difficulty: 'iniciante',
    mode: 'fix_code',
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
    acceptedAliases: [
      'if (player.hp <= 0) {',
      'if (player.hp === 0) {',
      'player.hp <= 0',
      'player.hp === 0',
    ],
    explanation: 'Um único `=` faz atribuição (`0` é falsy). Use `<= 0` ou `=== 0` para comparar valores.',
  },
  {
    id: 'bug-array-map',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'fix_code',
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
    acceptedAliases: [
      'return scores.map(s => s * 2);',
      'return scores.map(s => { return s * 2; });',
      'scores.map(s => s * 2)',
      'scores.map(s => { return s * 2; })',
    ],
    explanation: 'Em arrow functions, chaves `{}` exigem `return` explícito; sem chaves (`s => s * 2`), o retorno é implícito.',
  },
  {
    id: 'bug-async-await',
    topic: 'async_await',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #3: Método JSON Não Invocado no Fetch',
    description: 'A função retorna a referência do método em vez do JSON porque esqueceram os parênteses em `res.json()`!',
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
    acceptedAliases: ['return await res.json();', 'return res.json();', 'await res.json()', 'res.json()'],
    explanation: '`res.json()` é um método que retorna uma Promise com os dados parseados; sem `()`, nada é executado.',
  },
  {
    id: 'bug-off-by-one',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'fix_code',
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
    explanation: 'Como os índices vão de `0` até `length - 1`, a condição correta de parada é `i < items.length`.',
  },
  {
    id: 'bug-sort-numbers',
    topic: 'arrays',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #5: Sort Ordenando Números como Strings',
    description: '`[10, 2, 30].sort()` em JS ordena em ordem alfabética (`[10, 2, 30]`). Passe o comparador numérico crescente:',
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
    acceptedAliases: ['return list.sort((a, b) => a - b);', 'list.sort((a, b) => a - b)', '(a, b) => a - b'],
    explanation: 'Sem função de comparação, `.sort()` converte elementos para string UTF-16. `(a, b) => a - b` ordena numericamente.',
  },
  {
    id: 'bug-filter-mutating',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #6: Filter Ignorando Retorno',
    description: '`.filter()` não altera o array original in-place! Atribua ou retorne o resultado filtrado:',
    buggyCode: `function removeDeadEnemies(enemies) {
  enemies.filter(e => e.hp > 0);
  // BUG NA LINHA ABAIXO:
  return enemies;
}`,
    options: [
      'return enemies.filter(e => e.hp > 0);',
      'return enemies.forEach(e => e.hp > 0);',
      'return enemies.push(e => e.hp > 0);',
      'return enemies.pop();',
    ],
    correctAnswer: 'return enemies.filter(e => e.hp > 0);',
    acceptedAliases: ['return enemies.filter(e => e.hp > 0);', 'enemies.filter(e => e.hp > 0)'],
    explanation: '`.filter()` é imutável e retorna um novo array; descartar seu retorno mantém o array antigo intacto.',
  },
  {
    id: 'bug-object-reference',
    topic: 'objetos',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #7: Mutação Acidental do Estado Base',
    description: '`const copy = baseStats` copia apenas a referência! Crie uma cópia rasa independente com spread:',
    buggyCode: `function createPlayerStats(baseStats) {
  // BUG NA LINHA ABAIXO:
  const copy = baseStats;
  copy.hp = 100;
  return copy;
}`,
    options: [
      'const copy = { ...baseStats };',
      'const copy = [ ...baseStats ];',
      'const copy = baseStats.slice();',
      'const copy = Object.keys(baseStats);',
    ],
    correctAnswer: 'const copy = { ...baseStats };',
    acceptedAliases: [
      'const copy = { ...baseStats };',
      'const copy = Object.assign({}, baseStats);',
      'const copy = structuredClone(baseStats);',
      '{ ...baseStats }',
    ],
    explanation: 'Atribuir um objeto a outra variável compartilha a mesma referência na memória; `{ ...baseStats }` clona as propriedades de topo.',
  },
  {
    id: 'bug-nan-comparison',
    topic: 'condicoes',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #8: Comparação Direta com NaN',
    description: 'Em JavaScript, `NaN === NaN` é sempre `false`! Use o método adequado para detectar `NaN`:',
    buggyCode: `function sanitizeDamage(dmg) {
  // BUG NA LINHA ABAIXO:
  if (dmg === NaN) {
    return 0;
  }
  return dmg;
}`,
    options: [
      'if (Number.isNaN(dmg)) {',
      'if (dmg == NaN) {',
      'if (typeof dmg === "NaN") {',
      'if (dmg instanceof NaN) {',
    ],
    correctAnswer: 'if (Number.isNaN(dmg)) {',
    acceptedAliases: ['if (Number.isNaN(dmg)) {', 'if (isNaN(dmg)) {', 'Number.isNaN(dmg)'],
    explanation: 'Pelo padrão IEEE 754, `NaN` nunca é igual a si mesmo. Use `Number.isNaN(valor)` para testar com segurança.',
  },
  {
    id: 'bug-async-forEach',
    topic: 'async_await',
    difficulty: 'avancado',
    mode: 'spot_bug',
    title: 'CONFLITO #9: forEach Não Aguarda Promises',
    description: '`.forEach()` dispara callbacks assíncronos sem esperar! Qual estrutura aguarda todas as Promises em paralelo?',
    buggyCode: `async function saveAllProfiles(users) {
  // BUG NA LINHA ABAIXO:
  users.forEach(async (u) => await saveUser(u));
  return "Salvo!";
}`,
    options: [
      'await Promise.all(users.map(u => saveUser(u)));',
      'await users.forEach(u => saveUser(u));',
      'users.filter(async u => await saveUser(u));',
      'Promise.resolve(users.forEach(saveUser));',
    ],
    correctAnswer: 'await Promise.all(users.map(u => saveUser(u)));',
    acceptedAliases: [
      'await Promise.all(users.map(u => saveUser(u)));',
      'Promise.all(users.map(u => saveUser(u)))',
      'for (const u of users) { await saveUser(u); }',
    ],
    explanation: '`.forEach()` ignora as Promises retornadas pelo callback. Use `await Promise.all(users.map(...))` ou `for...of`.',
  },
  {
    id: 'bug-reduce-initial',
    topic: 'arrays',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #10: Reduce Quebrando com Array de Objetos',
    description: 'Sem o valor inicial `0`, o acumulador `acc` começa como o 1º objeto do array e concatena `[object Object]`:',
    buggyCode: `function totalCommits(players) {
  // BUG NA LINHA ABAIXO:
  return players.reduce((acc, p) => acc + p.commits);
}`,
    options: [
      'return players.reduce((acc, p) => acc + p.commits, 0);',
      'return players.reduce((acc, p) => acc * p.commits);',
      'return players.map((acc, p) => acc + p.commits, 0);',
      'return players.reduce(0, (acc, p) => acc + p.commits);',
    ],
    correctAnswer: 'return players.reduce((acc, p) => acc + p.commits, 0);',
    acceptedAliases: [
      'return players.reduce((acc, p) => acc + p.commits, 0);',
      'players.reduce((acc, p) => acc + p.commits, 0)',
    ],
    explanation: 'Ao somar propriedades de objetos com `.reduce()`, passe sempre `0` como segundo argumento (valor inicial do acumulador).',
  },
  {
    id: 'bug-string-replace-all',
    topic: 'funcoes',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #11: Replace Substituindo Apenas a 1ª Ocorrência',
    description: '`.replace(" ", "-")` troca apenas o primeiro espaço! Use o método que substitui todas as ocorrências:',
    buggyCode: `function slugifyRoom(name) {
  // BUG NA LINHA ABAIXO:
  return name.trim().replace(" ", "-");
}`,
    options: [
      'return name.trim().replaceAll(" ", "-");',
      'return name.trim().replaceMany(" ", "-");',
      'return name.trim().split("-").join(" ");',
      'return name.trim().indexOf(" ", "-");',
    ],
    correctAnswer: 'return name.trim().replaceAll(" ", "-");',
    acceptedAliases: [
      'return name.trim().replaceAll(" ", "-");',
      'name.trim().replaceAll(" ", "-")',
      'return name.trim().replace(/ /g, "-");',
    ],
    explanation: '`.replaceAll(busca, substituto)` (ou regex com flag `/g`) substitui todas as ocorrências na string.',
  },
  {
    id: 'bug-typeof-null',
    topic: 'objetos',
    difficulty: 'avancado',
    mode: 'fix_code',
    title: 'CONFLITO #12: Armadilha Clássica do typeof null',
    description: 'Em JS, `typeof null === "object"` é `true`! Garanta que `payload` não seja `null` antes de ler suas chaves:',
    buggyCode: `function isValidObject(payload) {
  // BUG NA LINHA ABAIXO:
  return typeof payload === "object";
}`,
    options: [
      'return payload !== null && typeof payload === "object";',
      'return typeof payload === "null";',
      'return payload === "object";',
      'return Object.isNull(payload);',
    ],
    correctAnswer: 'return payload !== null && typeof payload === "object";',
    acceptedAliases: [
      'return payload !== null && typeof payload === "object";',
      'return typeof payload === "object" && payload !== null;',
      'payload !== null && typeof payload === "object"',
    ],
    explanation: 'Por um legado histórico do JS, `typeof null` retorna `"object"`. Sempre verifique `payload !== null`.',
  },
  {
    id: 'bug-set-size',
    topic: 'objetos',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #13: Set Não Usa .length',
    description: 'Instâncias de `Set` e `Map` retornam `undefined` em `.length`! Use a propriedade correta para contar conexões:',
    buggyCode: `function countActivePeers(peerSet) {
  // BUG NA LINHA ABAIXO:
  return peerSet.length;
}`,
    options: [
      'return peerSet.size;',
      'return peerSet.count();',
      'return peerSet.total;',
      'return Object.keys(peerSet).length;',
    ],
    correctAnswer: 'return peerSet.size;',
    acceptedAliases: ['return peerSet.size;', 'peerSet.size'],
    explanation: 'Coleções ES6 (`Set` e `Map`) expõem a quantidade de elementos na propriedade `.size`, não `.length`.',
  },
  {
    id: 'bug-json-stringify-parse',
    topic: 'objetos',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #14: Parse vs Stringify Invertidos',
    description: 'Ao receber uma string JSON da rede WebRTC, usaram `JSON.stringify` em vez de converter para objeto:',
    buggyCode: `function decodePacket(rawString) {
  // BUG NA LINHA ABAIXO:
  return JSON.stringify(rawString);
}`,
    options: [
      'return JSON.parse(rawString);',
      'return JSON.decode(rawString);',
      'return JSON.toObject(rawString);',
      'return Object.fromJSON(rawString);',
    ],
    correctAnswer: 'return JSON.parse(rawString);',
    acceptedAliases: ['return JSON.parse(rawString);', 'JSON.parse(rawString)'],
    explanation: '`JSON.parse()` converte uma string JSON em objeto JS; `JSON.stringify()` faz o inverso (objeto para string).',
  },
  {
    id: 'bug-promise-reject-order',
    topic: 'promises',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #15: Parâmetros Invertidos no Construtor da Promise',
    description: 'No executor `new Promise((resolve, reject) => ...)`, o 1º parâmetro sempre resolve a Promise!',
    buggyCode: `function waitMs(ms) {
  // BUG NA LINHA ABAIXO:
  return new Promise((reject, resolve) => setTimeout(resolve, ms));
}`,
    options: [
      'return new Promise((resolve) => setTimeout(resolve, ms));',
      'return new Promise(setTimeout(ms));',
      'return Promise.all(setTimeout(ms));',
      'return new Promise.resolve(ms);',
    ],
    correctAnswer: 'return new Promise((resolve) => setTimeout(resolve, ms));',
    acceptedAliases: [
      'return new Promise((resolve) => setTimeout(resolve, ms));',
      'return new Promise((resolve, reject) => setTimeout(resolve, ms));',
      'new Promise(resolve => setTimeout(resolve, ms))',
    ],
    explanation: 'O construtor `new Promise((resolve, reject) => ...)` passa `resolve` como primeiro argumento e `reject` como segundo.',
  },
  {
    id: 'bug-includes-index',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'fix_code',
    title: 'CONFLITO #16: indexOf Checando Truthy em Vez de !== -1',
    description: 'Se o admin estiver no índice `0`, `if (admins.indexOf(id))` dá `false` porque `0` é falsy!',
    buggyCode: `function isAdmin(admins, id) {
  // BUG NA LINHA ABAIXO:
  return Boolean(admins.indexOf(id));
}`,
    options: [
      'return admins.includes(id);',
      'return admins.indexOf(id) === 0;',
      'return admins.find(id);',
      'return admins.has(id);',
    ],
    correctAnswer: 'return admins.includes(id);',
    acceptedAliases: [
      'return admins.includes(id);',
      'admins.includes(id)',
      'return admins.indexOf(id) !== -1;',
      'return admins.indexOf(id) >= 0;',
    ],
    explanation: '`.includes(id)` retorna diretamente um booleano (`true`/`false`), evitando o bug do índice `0` ser falsy.',
  },
  {
    id: 'bug-default-destructuring',
    topic: 'objetos',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #17: Valor Padrão na Desestruturação Usou Dois-Pontos',
    description: 'Em desestruturação, `:` renomeia a variável! Para definir um valor padrão (`100`), use `=`:',
    buggyCode: `function readShield(config) {
  // BUG NA LINHA ABAIXO:
  const { shield: 100 } = config;
  return shield;
}`,
    options: [
      'const { shield = 100 } = config;',
      'const { shield == 100 } = config;',
      'const { shield ?? 100 } = config;',
      'const [ shield = 100 ] = config;',
    ],
    correctAnswer: 'const { shield = 100 } = config;',
    acceptedAliases: ['const { shield = 100 } = config;', '{ shield = 100 } = config'],
    explanation: 'Na desestruturação de objetos, `{ prop = padrao }` define o valor padrão caso `prop` seja `undefined`.',
  },
  {
    id: 'bug-slice-end',
    topic: 'arrays',
    difficulty: 'iniciante',
    mode: 'complete',
    title: 'CONFLITO #18: Top 3 do Ranking Sem Mutar a Lista',
    description: '`.splice(0, 3)` arranca os elementos e altera o array original! Use o método imutável que fatia os 3 primeiros:',
    buggyCode: `function getTopThree(players) {
  // BUG NA LINHA ABAIXO:
  return players.splice(0, 3);
}`,
    options: [
      'return players.slice(0, 3);',
      'return players.split(0, 3);',
      'return players.shift(3);',
      'return players.pop(3);',
    ],
    correctAnswer: 'return players.slice(0, 3);',
    acceptedAliases: ['return players.slice(0, 3);', 'players.slice(0, 3)'],
    explanation: '`.slice(inicio, fim)` retorna uma cópia superficial da fatia sem modificar o array original (ao contrário de `.splice()`).',
  },
  {
    id: 'bug-async-return-await-try',
    topic: 'async_await',
    difficulty: 'avancado',
    mode: 'fix_code',
    title: 'CONFLITO #19: Try/Catch Não Captura Promise Sem Await',
    description: 'Dentro de um bloco `try/catch`, retornar uma Promise sem `await` faz a rejeição escapar do `catch` local!',
    buggyCode: `async function safeFetch(url) {
  try {
    // BUG NA LINHA ABAIXO:
    return fetchJson(url);
  } catch (err) {
    return { ok: false };
  }
}`,
    options: [
      'return await fetchJson(url);',
      'return Promise.reject(url);',
      'throw fetchJson(url);',
      'return async fetchJson(url);',
    ],
    correctAnswer: 'return await fetchJson(url);',
    acceptedAliases: ['return await fetchJson(url);', 'await fetchJson(url)'],
    explanation: 'Dentro de `try { ... } catch`, usar `return await promise` garante que uma rejeição seja capturada pelo `catch` local.',
  },
  {
    id: 'bug-logical-and-precedence',
    topic: 'condicoes',
    difficulty: 'intermediario',
    mode: 'fix_code',
    title: 'CONFLITO #20: Precedência Entre && e || no Permissão de Acesso',
    description: '`&&` tem precedência maior que `||`! Envolva a condição de cargo entre parênteses para exigir `isActive`:',
    buggyCode: `function canDeploy(user) {
  // BUG: admin inativo consegue fazer deploy!
  return user.isAdmin || user.isLead && user.isActive;
}`,
    options: [
      'return (user.isAdmin || user.isLead) && user.isActive;',
      'return user.isAdmin && user.isLead || user.isActive;',
      'return !(user.isAdmin || user.isLead) && user.isActive;',
      'return user.isAdmin ?? user.isLead && user.isActive;',
    ],
    correctAnswer: 'return (user.isAdmin || user.isLead) && user.isActive;',
    acceptedAliases: [
      'return (user.isAdmin || user.isLead) && user.isActive;',
      'return user.isActive && (user.isAdmin || user.isLead);',
      '(user.isAdmin || user.isLead) && user.isActive',
    ],
    explanation: 'Como `&&` é avaliado antes de `||`, os parênteses em `(user.isAdmin || user.isLead) && user.isActive` são indispensáveis.',
  },
];

export function normalizeCode(input) {
  return String(input || '').trim().replace(/\s+/g, ' ');
}

/**
 * Normalização estrutural de tokens JS sem usar eval() para aceitar soluções equivalentes:
 * - Unifica aspas simples e duplas
 * - Remove ponto-e-vírgula opcional no final
 * - Normaliza parênteses opcionais em parâmetro único de arrow function: `(x) =>` -> `x =>`
 * - Normaliza `{ return expr; }` em arrow function para `expr`
 * - Normaliza espaços ao redor de operadores e pontuação
 */
export function canonicalizeJsCode(input) {
  let s = String(input || '').trim();
  if (!s) return '';

  // Unifica aspas simples em aspas duplas para comparação
  s = s.replace(/'([^'\\]*)'/g, '"$1"');

  // Remove ponto-e-vírgula final repetido
  s = s.replace(/;+\s*$/g, '');

  // Simplifica bloco de arrow function de linha única `=> { return expr; }` para `=> expr`
  s = s.replace(/=>\s*\{\s*return\s+([^;{}]+?)\s*;?\s*\}/g, '=> $1');

  // Normaliza espaços ao redor de pontuação e operadores compostos/simples
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*=>/g, '$1 =>');
  s = s.replace(/\s*(\.\.\.|===|!==|=>|<=|>=|==|!=|\?\?|\?\.|&&|\|\||[(){}[\],;:+*\-/<>=?])\s*/g, '$1');

  return s.trim();
}

export function isEquivalentJsAnswer(candidate, challengeOrSnippet) {
  if (!challengeOrSnippet) return false;
  const rawCandidate = String(candidate || '');
  if (!rawCandidate.trim()) return false;

  const targets = [
    challengeOrSnippet.code,
    challengeOrSnippet.correctAnswer,
    ...(challengeOrSnippet.acceptedAliases || []),
  ].filter(Boolean);

  const normCand = normalizeCode(rawCandidate);
  const canonCand = canonicalizeJsCode(rawCandidate);

  return targets.some(
    (t) => normalizeCode(t) === normCand || (canonCand.length > 0 && canonicalizeJsCode(t) === canonCand)
  );
}
