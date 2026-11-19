/**
 * src/ueue-universe-data.js — UEUE v1.2 Universe Data (L1-L10):
 * 5 Outer Rim Star Systems, 4 Factions, 4 Commodities, 3 Ship Hulls, 4 Pilot Sleeves & 3 Tactical Stances
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

export const FACTIONS = [
  { id: "corporate", name: "Corporate Bloc", desc: "High-security orbital megacorps levying trade tariffs." },
  { id: "guild", name: "Outer Rim Merchant Guild", desc: "Independent haulers and deep-core asteroid miners." },
  { id: "resistance", name: "Resistance Cell", desc: "Decentralized anti-monopoly scouts guarding Lanternway rifts." },
  { id: "syndicate", name: "Orbital Syndicate", desc: "Black-market smugglers dealing in restricted neuro-stims." },
];

export const COMMODITIES = [
  { id: "hydro", name: "Hydro-Cells", basePrice: 40, contraband: false },
  { id: "palladium", name: "Refined Palladium", basePrice: 120, contraband: false },
  { id: "stims", name: "Neuro-Stims", basePrice: 210, contraband: true },
  { id: "shards", name: "Lanternway Shards", basePrice: 340, contraband: false },
];

export const STAR_SYSTEMS = [
  {
    id: "kowloon",
    name: "New Kowloon Spire",
    factionId: "corporate",
    starColor: "#38bdf8",
    asteroidRichness: 1,
    pirateThreat: 1,
    priceMultipliers: { hydro: 0.75, palladium: 1.35, stims: 0.9, shards: 1.25 },
    dispatch: "L1 Dispatch: Neon rain streaks across New Kowloon's orbital ring. Corporate tariffs are active.",
  },
  {
    id: "bru9",
    name: "Brú-9 Asteroid Belt",
    factionId: "guild",
    starColor: "#fbbf24",
    asteroidRichness: 4,
    pirateThreat: 2,
    priceMultipliers: { hydro: 1.25, palladium: 0.65, stims: 1.15, shards: 1.1 },
    dispatch: "L3 Exploration: Rich Palladium veins gleam across Brú-9. Watch for Syndicate raiders.",
  },
  {
    id: "tyrell",
    name: "Tyrell Orbital Refinery",
    factionId: "corporate",
    starColor: "#f97316",
    asteroidRichness: 2,
    pirateThreat: 1,
    priceMultipliers: { hydro: 0.85, palladium: 1.45, stims: 0.8, shards: 1.3 },
    dispatch: "L5 Economy: Tyrell smelting foundries pay top credits for Refined Palladium.",
  },
  {
    id: "lethe",
    name: "Lethe Black Market",
    factionId: "syndicate",
    starColor: "#a855f7",
    asteroidRichness: 1,
    pirateThreat: 3,
    priceMultipliers: { hydro: 1.3, palladium: 1.05, stims: 1.55, shards: 0.95 },
    dispatch: "L4 Faction Alert: Orbital Syndicate shadow-docks buy Neuro-Stims with zero questions.",
  },
  {
    id: "lanternway",
    name: "Lanternway Rift",
    factionId: "resistance",
    starColor: "#34d399",
    asteroidRichness: 3,
    pirateThreat: 2,
    priceMultipliers: { hydro: 1.4, palladium: 1.15, stims: 1.2, shards: 0.6 },
    dispatch: "L8 Cosmic Anomaly: Dimensional fractures hum near the Resistance outpost. Shards abundant.",
  },
];

export const SHIP_HULLS = [
  { id: "dart", name: "Dart Courier", cargoCap: 8, maxShield: 60, laserPower: 12, cost: 0 },
  { id: "viper", name: "Viper Multi-Role", cargoCap: 16, maxShield: 100, laserPower: 20, cost: 650 },
  { id: "taurus", name: "Taurus Heavy Hauler", cargoCap: 32, maxShield: 150, laserPower: 26, cost: 1600 },
];

export const PILOT_SLEEVES = [
  { id: "bio", name: "Biological Explorer", bonusLabel: "+35% Anomaly & Scan Range", cost: 0 },
  { id: "synth", name: "Synthetic Industrialist", bonusLabel: "+40% Mining Laser Yield", cost: 300 },
  { id: "combat", name: "Combat Morph", bonusLabel: "+35% Laser & Shield Output", cost: 450 },
  { id: "stealth", name: "Stealth Cyber-Sleeve", bonusLabel: "Bypasses Contraband Scans", cost: 500 },
];

export const COMBAT_STANCES = [
  { id: "BALANCED", label: "Balanced", dmgMult: 1.0, shieldMult: 1.0 },
  { id: "OVERCHARGE", label: "Weapons Overcharge", dmgMult: 1.45, shieldMult: 0.75 },
  { id: "FORTIFY", label: "Shield Fortify", dmgMult: 0.75, shieldMult: 1.45 },
];
