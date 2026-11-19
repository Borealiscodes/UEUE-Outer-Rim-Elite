/**
 * src/elite-kernel.js — UEUE v1.2 Q16.16 Flight, Mining, Trading, Stance Combat & Sphere Mode Kernel (Ledger 1)
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

import { toQ16, fromQ16, qAdd, qMul, createSeededRng, sha256Hex } from "./core.js";
import {
  STAR_SYSTEMS,
  COMMODITIES,
  SHIP_HULLS,
  PILOT_SLEEVES,
  COMBAT_STANCES,
} from "./ueue-universe-data.js";

export const SECTOR_W = 680;
export const SECTOR_H = 420;

function spawnSectorEntities(system, rng, sphereChaos = false) {
  const asteroidCount = system.asteroidRichness + (sphereChaos ? 2 : 1);
  const asteroids = Array.from({ length: asteroidCount }, (_, i) => ({
    id: i,
    xQ16: toQ16(120 + (rng() % 460)),
    yQ16: toQ16(70 + (rng() % 280)),
    vxQ16: toQ16(((rng() % 40) - 20) * 0.6),
    vyQ16: toQ16(((rng() % 40) - 20) * 0.6),
    hp: 30,
    yieldCommodity: system.id === "lanternway" && i === 0 ? "shards" : "palladium",
  }));

  const raiderCount = Math.min(3, system.pirateThreat + (sphereChaos ? 1 : 0));
  const raiders = Array.from({ length: raiderCount }, (_, i) => ({
    id: i,
    xQ16: toQ16(460 + (rng() % 160)),
    yQ16: toQ16(80 + i * 110),
    hp: 45,
  }));

  return { asteroids, raiders };
}

export function createCommanderState(seed = 20261119) {
  const rng = createSeededRng(seed);
  const system = STAR_SYSTEMS.at(0);
  const hull = SHIP_HULLS.at(0);
  const sleeve = PILOT_SLEEVES.at(0);
  const { asteroids, raiders } = spawnSectorEntities(system, rng, false);

  return {
    tick: 0,
    seed,
    credits: 500,
    systemIndex: 0,
    system,
    hull,
    sleeve,
    stanceIndex: 0,
    stance: COMBAT_STANCES.at(0),
    docked: false,
    sphereMode: false, // UEUE L10: Sparkle + Chaos overlay
    ship: {
      xQ16: toQ16(140),
      yQ16: toQ16(210),
      vxQ16: 0,
      vyQ16: 0,
      headingRad: 0,
      shield: hull.maxShield,
    },
    cargo: { hydro: 2, palladium: 0, stims: 0, shards: 0 },
    reputation: { corporate: 10, guild: 15, resistance: 5, syndicate: 0 },
    asteroids,
    raiders,
    laserBeamTicks: 0,
    lastEventLog: system.dispatch,
  };
}

export function getCargoUsed(cargo) {
  return Object.values(cargo).reduce((sum, n) => sum + (n | 0), 0);
}

export function getCommodityPrice(state, commodityId) {
  const item = COMMODITIES.find((c) => c.id === commodityId);
  if (!item) return 0;
  const mult = state.system.priceMultipliers[commodityId] || 1.0;
  const rep = state.reputation[state.system.factionId] || 0;
  const repDiscount = Math.max(-0.15, Math.min(0.15, rep * 0.003));
  return Math.max(10, Math.round(item.basePrice * mult * (1 - repDiscount)));
}

export function toggleDocking(state) {
  const nextDocked = !state.docked;
  return {
    ...state,
    docked: nextDocked,
    ship: nextDocked
      ? { ...state.ship, vxQ16: 0, vyQ16: 0, shield: state.hull.maxShield }
      : state.ship,
    lastEventLog: nextDocked
      ? `Docked at ${state.system.name} Orbital Station. Shields recharged.`
      : `Launched into ${state.system.name} space.`,
  };
}

export function toggleSphereMode(state) {
  const nextSphere = !state.sphereMode;
  return {
    ...state,
    sphereMode: nextSphere,
    lastEventLog: nextSphere
      ? "L10 Sphere Mode ACTIVE: Sparkle trade vectors & Chaos anomaly surges engaged."
      : "Sphere Mode disengaged. Standard D4–D6 stability active.",
  };
}

export function cycleCombatStance(state) {
  const nextIdx = (state.stanceIndex + 1) % COMBAT_STANCES.length;
  const stance = COMBAT_STANCES.at(nextIdx);
  return {
    ...state,
    stanceIndex: nextIdx,
    stance,
    lastEventLog: `L7 Tactical Stance switched to ${stance.label}.`,
  };
}

export function buyCommodity(state, commodityId) {
  if (!state.docked) return state;
  const price = getCommodityPrice(state, commodityId);
  const used = getCargoUsed(state.cargo);
  if (state.credits < price || used >= state.hull.cargoCap) return state;

  const factionId = state.system.factionId;
  return {
    ...state,
    credits: state.credits - price,
    cargo: { ...state.cargo, [commodityId]: (state.cargo[commodityId] || 0) + 1 },
    reputation: { ...state.reputation, [factionId]: (state.reputation[factionId] || 0) + 1 },
    lastEventLog: `Purchased 1t ${commodityId.toUpperCase()} for ${price} CR.`,
  };
}

export function sellCommodity(state, commodityId) {
  if (!state.docked) return state;
  const held = state.cargo[commodityId] || 0;
  if (held <= 0) return state;
  const price = getCommodityPrice(state, commodityId);
  const factionId = state.system.factionId;

  return {
    ...state,
    credits: state.credits + price,
    cargo: { ...state.cargo, [commodityId]: held - 1 },
    reputation: { ...state.reputation, [factionId]: (state.reputation[factionId] || 0) + 2 },
    lastEventLog: `Sold 1t ${commodityId.toUpperCase()} for ${price} CR (+2 Faction Rep).`,
  };
}

export function equipShipHull(state, hullId) {
  if (!state.docked) return state;
  const target = SHIP_HULLS.find((h) => h.id === hullId);
  if (!target || target.id === state.hull.id || state.credits < target.cost) return state;

  return {
    ...state,
    credits: state.credits - target.cost,
    hull: target,
    ship: { ...state.ship, shield: target.maxShield },
    lastEventLog: `Shipyard Transfer: Commissioned ${target.name} (${target.cargoCap}t cargo).`,
  };
}

export function swapPilotSleeve(state, sleeveId) {
  if (!state.docked) return state;
  const target = PILOT_SLEEVES.find((s) => s.id === sleeveId);
  if (!target || target.id === state.sleeve.id || state.credits < target.cost) return state;

  return {
    ...state,
    credits: state.credits - target.cost,
    sleeve: target,
    lastEventLog: `L2/L6 Mindstate Transfer complete: Resleeved into ${target.name}.`,
  };
}

export function hyperspaceJump(state, targetSystemIndex) {
  const idx = Math.max(0, Math.min(STAR_SYSTEMS.length - 1, targetSystemIndex | 0));
  if (idx === state.systemIndex) return state;

  const system = STAR_SYSTEMS.at(idx);
  const rng = createSeededRng((state.seed + idx * 9973 + state.tick) >>> 0);
  const { asteroids, raiders } = spawnSectorEntities(system, rng, state.sphereMode);

  // Contraband scan check when entering Corporate systems with Neuro-Stims
  let credits = state.credits;
  let log = `Hyperspace jump complete: Arrived at ${system.name}.`;
  if (system.factionId === "corporate" && (state.cargo.stims || 0) > 0 && state.sleeve.id !== "stealth") {
    const fine = Math.min(credits, 120);
    credits -= fine;
    log = `Corporate Scan Alert! Contraband Neuro-Stims detected (-${fine} CR tariff). Use Stealth Sleeve to evade.`;
  }

  return {
    ...state,
    credits,
    systemIndex: idx,
    system,
    docked: false,
    ship: { ...state.ship, xQ16: toQ16(120), yQ16: toQ16(210), vxQ16: 0, vyQ16: 0 },
    asteroids,
    raiders,
    lastEventLog: log,
  };
}

export function fireShipLasers(state) {
  if (state.docked) return state;
  const sx = fromQ16(state.ship.xQ16);
  const sy = fromQ16(state.ship.yQ16);
  const scanRange = state.sleeve.id === "bio" ? 210 : 155;
  const sleeveDmgMult = state.sleeve.id === "combat" ? 1.35 : 1.0;
  const dmg = Math.round(state.hull.laserPower * state.stance.dmgMult * sleeveDmgMult);

  let credits = state.credits;
  let cargo = { ...state.cargo };
  let log = "Pulse lasers fired.";

  // 1. Check Raider Combat Hits
  const nextRaiders = [];
  for (const r of state.raiders) {
    const dist = Math.hypot(sx - fromQ16(r.xQ16), sy - fromQ16(r.yQ16));
    if (dist <= scanRange) {
      const remHp = r.hp - dmg;
      if (remHp <= 0) {
        const bounty = state.sphereMode ? 140 : 95;
        credits += bounty;
        log = `Raider neutralized! Collected ${bounty} CR bounty.`;
        continue;
      }
      log = `Hit Syndicate Raider (-${dmg} HP, ${remHp} HP remaining).`;
      nextRaiders.push({ ...r, hp: remHp });
    } else {
      nextRaiders.push(r);
    }
  }

  // 2. Check Asteroid Mining Yield
  const nextAsteroids = [];
  for (const ast of state.asteroids) {
    const dist = Math.hypot(sx - fromQ16(ast.xQ16), sy - fromQ16(ast.yQ16));
    if (dist <= scanRange) {
      const remHp = ast.hp - dmg;
      if (remHp <= 0) {
        const yieldUnits = state.sleeve.id === "synth" ? 2 : 1;
        const space = state.hull.cargoCap - getCargoUsed(cargo);
        const added = Math.min(space, yieldUnits);
        if (added > 0) {
          cargo[ast.yieldCommodity] = (cargo[ast.yieldCommodity] || 0) + added;
          log = `Asteroid fractured! Collected +${added}t ${ast.yieldCommodity.toUpperCase()}.`;
        } else {
          log = "Asteroid fractured, but cargo hold is full!";
        }
        continue;
      }
      log = `Mining beam on asteroid (${remHp} integrity left).`;
      nextAsteroids.push({ ...ast, hp: remHp });
    } else {
      nextAsteroids.push(ast);
    }
  }

  return {
    ...state,
    credits,
    cargo,
    asteroids: nextAsteroids,
    raiders: nextRaiders,
    laserBeamTicks: 10,
    lastEventLog: log,
  };
}

export function stepEliteFrame(state, thrustXQ16 = 0, thrustYQ16 = 0) {
  const tick = state.tick + 1;
  if (state.docked) return { ...state, tick };

  const dtQ16 = toQ16(1.0 / 60.0);
  const dampQ16 = toQ16(0.94);

  let vx = qMul(qAdd(state.ship.vxQ16, qMul(thrustXQ16, dtQ16)), dampQ16);
  let vy = qMul(qAdd(state.ship.vyQ16, qMul(thrustYQ16, dtQ16)), dampQ16);
  let x = qAdd(state.ship.xQ16, qMul(vx, dtQ16));
  let y = qAdd(state.ship.yQ16, qMul(vy, dtQ16));

  const fx = Math.max(30, Math.min(SECTOR_W - 30, fromQ16(x)));
  const fy = Math.max(30, Math.min(SECTOR_H - 30, fromQ16(y)));
  x = toQ16(fx);
  y = toQ16(fy);

  const speed = Math.hypot(fromQ16(vx), fromQ16(vy));
  const headingRad = speed > 3 ? Math.atan2(fromQ16(vy), fromQ16(vx)) : state.ship.headingRad;

  // Drift asteroids slowly across sector
  const nextAsteroids = state.asteroids.map((ast) => {

let ax = fromQ16(qAdd(ast.xQ16, qMul(ast.vxQ16, dtQ16)));
let ay = fromQ16(qAdd(ast.yQ16, qMul(ast.vyQ16, dtQ16)));
if (ax < 30) ax += SECTOR_W - 60;
if (ax > SECTOR_W - 30) ax -= SECTOR_W - 60;
if (ay < 30) ay += SECTOR_H - 60;
if (ay > SECTOR_H - 30) ay -= SECTOR_H - 60;
return { ...ast, xQ16: toQ16(ax), yQ16: toQ16(ay) };
});
return {
...state,
tick,
ship: { ...state.ship, xQ16: x, yQ16: y, vxQ16: vx, vyQ16: vy, headingRad },
asteroids: nextAsteroids,
laserBeamTicks: Math.max(0, state.laserBeamTicks - 1),
};
}
export function buildCommanderReceipt(state) {
const payload = {
schema: "ndh.ueue.outer.rim.elite.v1",
system: state.system.id,
credits: state.credits,
hull: state.hull.id,
sleeve: state.sleeve.id,
sphereMode: state.sphereMode,
cargo: state.cargo,
reputation: state.reputation,
};
return {
...payload,
sha256: sha256Hex(JSON.stringify(payload)),
};
}
