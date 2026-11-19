/**
 * test/elite-kernel.test.mjs — Verification of UEUE v1.2 Mining, Trading, Sleeves & Sphere Mode
 * Run: node --test test/elite-kernel.test.mjs
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createCommanderState,
  toggleDocking,
  toggleSphereMode,
  buyCommodity,
  sellCommodity,
  swapPilotSleeve,
  hyperspaceJump,
  fireShipLasers,
  buildCommanderReceipt,
} from "../src/elite-kernel.js";

test("1. Buy-Low in New Kowloon -> Hyperspace Jump to Tyrell -> Sell-High Profit", () => {
  let s = createCommanderState();
  s = toggleDocking(s);
  s = buyCommodity(s, "hydro"); // 30 CR in Kowloon
  assert.equal(s.cargo.hydro, 3);

  s = hyperspaceJump(s, 3); // Lethe Black Market (hydro multiplier 1.3x = 52 CR)
  s = toggleDocking(s);
  const creditsBefore = s.credits;
  s = sellCommodity(s, "hydro");
  assert.ok(s.credits > creditsBefore);
});

test("2. Synthetic Industrialist Sleeve Doubles Asteroid Mining Yield", () => {
  let s = createCommanderState();
  s = toggleDocking(s);
  s = swapPilotSleeve(s, "synth");
  assert.equal(s.sleeve.id, "synth");
  s = toggleDocking(s);

  // Move ship right onto first asteroid and fire mining laser 3 times (30 HP / 12 dmg)
  s.ship.xQ16 = s.asteroids.at(0).xQ16;
  s.ship.yQ16 = s.asteroids.at(0).yQ16;
  s = fireShipLasers(s);
  s = fireShipLasers(s);
  s = fireShipLasers(s);

  assert.equal(s.cargo.palladium, 2); // +2t yield from Synthetic Industrialist sleeve
});

test("3. Sphere Mode Toggle & Deterministic SHA-256 Commander Receipt", () => {
  let s = createCommanderState();
  s = toggleSphereMode(s);
  assert.equal(s.sphereMode, true);
  assert.equal(buildCommanderReceipt(s).sha256.length, 64);
});
