// Portado de progression_config.gd e enemy_stats.gd

export function getPowerupThreshold(upgradesDone) {
  const n = Math.max(upgradesDone, 0);
  return Math.floor(110 + 150 * n + 70 * n * n);
}

export function getBugStats(tier, playerLevel) {
  const lvl = Math.max(playerLevel, 1);
  switch (tier) {
    case 1:
      return { hp: 22 + 7 * lvl, speed: 155 + 3 * lvl, scale: 1.0, xp: 14 + 3 * lvl };
    case 2:
      return { hp: 48 + 14 * lvl, speed: 175 + 4 * lvl, scale: 1.1, xp: 24 + 5 * lvl };
    case 3:
      return { hp: 105 + 26 * lvl, speed: 135, scale: 1.35, xp: 45 + 8 * lvl };
    default:
      return { hp: 280 + 60 * lvl, speed: 150 + 2 * lvl, scale: 1.85, xp: 90 + 14 * lvl };
  }
}

export function getHackerStats(playerLevel) {
  const lvl = Math.max(playerLevel, 1);
  return {
    hp: 65 + 18 * lvl,
    speed: 165 + 3.5 * lvl,
    scale: 1.35,
    xp: 38 + 10 * lvl,
  };
}

export function getBossStats(bossType, playerLevel, bossTier = 1) {
  const lvl = Math.max(playerLevel, 1);
  const mult = 1.0 + (Math.max(bossTier, 1) - 1) * 0.24;
  const baseHp = (520 + 110 * lvl) * mult;
  const baseSpeed = 115 + 2 * lvl;
  const xp = (220 + 35 * lvl) * mult;

  switch (bossType) {
    case 'kernel_panic':
      return { hp: baseHp * 0.92, speed: baseSpeed * 1.2, scale: 2.25, xp };
    case 'stack_overflow':
      return { hp: baseHp * 1.08, speed: baseSpeed * 0.9, scale: 2.4, xp };
    case 'memory_leak':
      return { hp: baseHp * 1.05, speed: baseSpeed * 0.96, scale: 2.25, xp };
    case 'blue_screen':
    default:
      return { hp: baseHp, speed: baseSpeed * 1.05, scale: 2.35, xp };
  }
}
