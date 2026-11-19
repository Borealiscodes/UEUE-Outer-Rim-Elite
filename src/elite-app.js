/**
 * src/elite-app.js — UEUE Outer Rim Elite Loop, Station Trading & Sleeve/Hull Controls
 *
 * Signed-off-by: Borealis Serenity Hedling <chguard-sentinel@vaked.dev>
 */

import { toQ16, fromQ16 } from "./core.js";
import {
  STAR_SYSTEMS,
  COMMODITIES,
  SHIP_HULLS,
  PILOT_SLEEVES,
  FACTIONS,
} from "./ueue-universe-data.js";
import {
  SECTOR_W,
  SECTOR_H,
  createCommanderState,
  getCargoUsed,
  getCommodityPrice,
  toggleDocking,
  toggleSphereMode,
  cycleCombatStance,
  buyCommodity,
  sellCommodity,
  equipShipHull,
  swapPilotSleeve,
  hyperspaceJump,
  fireShipLasers,
  stepEliteFrame,
  buildCommanderReceipt,
} from "./elite-kernel.js";
import { createSpaceAudio } from "./synthwave-space-audio.js";
import { renderSpaceSector } from "./cockpit-renderer.js";

const FIXED_DT_MS = 1000 / 60;

function initEliteApp() {
  const canvas = document.getElementById("sector-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const audio = createSpaceAudio();

  const hudCredits = document.getElementById("hud-credits");
  const hudSystem = document.getElementById("hud-system");
  const hudLoadout = document.getElementById("hud-loadout");
  const eventLogEl = document.getElementById("event-log");
  const marketListEl = document.getElementById("market-list");
  const shipyardListEl = document.getElementById("shipyard-list");
  const sleeveListEl = document.getElementById("sleeve-list");
  const galaxyListEl = document.getElementById("galaxy-list");
  const factionListEl = document.getElementById("faction-list");

  const dockBtn = document.getElementById("btn-dock");
  const sphereBtn = document.getElementById("btn-sphere");
  const stanceBtn = document.getElementById("btn-stance");
  const audioBtn = document.getElementById("btn-audio");
  const receiptBox = document.getElementById("receipt-output");

  let state = createCommanderState();
  let steerTarget = null;
  const keys = new Set();

  const renderStationPanels = () => {
    const used = getCargoUsed(state.cargo);
    if (hudCredits) hudCredits.textContent = `Credits: ${state.credits} CR | Cargo: ${used}/${state.hull.cargoCap}t`;
    if (hudSystem) hudSystem.textContent = `System: ${state.system.name}`;
    if (hudLoadout) hudLoadout.textContent = `Hull: ${state.hull.name} | Sleeve: ${state.sleeve.name}`;
    if (eventLogEl) eventLogEl.textContent = state.lastEventLog;
    if (dockBtn) dockBtn.textContent = state.docked ? "🚀 Launch to Space" : "🛰️ Dock at Station";
    if (sphereBtn) sphereBtn.textContent = state.sphereMode ? "✨ Sphere Mode: ON" : "✨ Sphere Mode: OFF";
    if (stanceBtn) stanceBtn.textContent = `⚔️ Stance: ${state.stance.label}`;

    // 1. Commodity Market
    if (marketListEl) {
      marketListEl.innerHTML = COMMODITIES.map((c) => {
        const price = getCommodityPrice(state, c.id);
        const held = state.cargo[c.id] || 0;
        return `
          <div class="row-item">
            <span><strong>${c.name}</strong> (${price} CR) • Held: ${held}t</span>
            <div class="btn-group">
              <button data-buy="${c.id}" ${!state.docked ? "disabled" : ""}>Buy</button>
              <button data-sell="${c.id}" ${!state.docked || held === 0 ? "disabled" : ""}>Sell</button>
            </div>
          </div>
        `;
      }).join("");

      marketListEl.querySelectorAll("[data-buy]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state = buyCommodity(state, btn.getAttribute("data-buy"));
          renderStationPanels();
        });
      });
      marketListEl.querySelectorAll("[data-sell]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state = sellCommodity(state, btn.getAttribute("data-sell"));
          renderStationPanels();
        });
      });
    }

    // 2. Ship Hulls
    if (shipyardListEl) {
      shipyardListEl.innerHTML = SHIP_HULLS.map((h) => {
        const active = h.id === state.hull.id;
        return `
          <div class="row-item">
            <span><strong>${h.name}</strong> (${h.cargoCap}t • ${h.cost} CR)</span>
            <button data-hull="${h.id}" ${!state.docked || active ? "disabled" : ""}>
              ${active ? "Equipped" : "Buy Hull"}
            </button>
          </div>
        `;
      }).join("");

      shipyardListEl.querySelectorAll("[data-hull]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state = equipShipHull(state, btn.getAttribute("data-hull"));
          renderStationPanels();
        });
      });
    }

    // 3. Transhuman Pilot Sleeves (L2/L6)
    if (sleeveListEl) {
      sleeveListEl.innerHTML = PILOT_SLEEVES.map((s) => {
        const active = s.id === state.sleeve.id;
        return `
          <div class="row-item">
            <span><strong>${s.name}</strong> — ${s.bonusLabel} (${s.cost} CR)</span>
            <button data-sleeve="${s.id}" ${!state.docked || active ? "disabled" : ""}>
              ${active ? "Active" : "Resleeve"}
            </button>
          </div>
        `;
      }).join("");

      sleeveListEl.querySelectorAll("[data-sleeve]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state = swapPilotSleeve(state, btn.getAttribute("data-sleeve"));
          renderStationPanels();
        });
      });
    }

    // 4. 5-System Hyperspace Jump Map
    if (galaxyListEl) {
      galaxyListEl.innerHTML = STAR_SYSTEMS.map((sys, idx) => {
        const here = idx === state.systemIndex;
        return `
          <button data-jump="${idx}" ${here ? "disabled" : ""}>
            ${here ? "📍" : "🌀"} ${sys.name}
          </button>
        `;
      }).join("");

      galaxyListEl.querySelectorAll("[data-jump]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state = hyperspaceJump(state, Number(btn.getAttribute("data-jump")));
          audio.playJump();
          renderStationPanels();
        });
      });
    }

    // 5. Faction Standing Matrix (L4)
    if (factionListEl) {
      factionListEl.innerHTML = FACTIONS.map((f) => {
        const rep = state.reputation[f.id] || 0;
        return `<div class="faction-row"><span>${f.name}</span><strong>Rep: ${rep}</strong></div>`;
      }).join("");
    }
  };

  renderStationPanels();

  canvas?.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    if (state.docked) return;
    const rect = canvas.getBoundingClientRect();
    steerTarget = {
      x: ((ev.clientX - rect.left) / rect.width) * SECTOR_W,
      y: ((ev.clientY - rect.top) / rect.height) * SECTOR_H,
    };
  });

  canvas?.addEventListener("pointermove", (ev) => {
    if (!steerTarget || state.docked) return;
    const rect = canvas.getBoundingClientRect();
    steerTarget = {
      x: ((ev.clientX - rect.left) / rect.width) * SECTOR_W,
      y: ((ev.clientY - rect.top) / rect.height) * SECTOR_H,
    };
  });

  window.addEventListener("pointerup", () => {
    steerTarget = null;
  });

  window.addEventListener("keydown", (ev) => {
    keys.add(ev.key.toLowerCase());
    if (ev.key === " ") {
      ev.preventDefault();
      state = fireShipLasers(state);
      audio.playLaser();
      renderStationPanels();
    }
  });

  window.addEventListener("keyup", (ev) => {
    keys.delete(ev.key.toLowerCase());
  });

  document.getElementById("btn-fire")?.addEventListener("click", () => {
    state = fireShipLasers(state);
    audio.playLaser();
    renderStationPanels();
  });

  dockBtn?.addEventListener("click", () => {
    state = toggleDocking(state);
    renderStationPanels();
  });

  sphereBtn?.addEventListener("click", () => {
    state = toggleSphereMode(state);
    renderStationPanels();
  });

  stanceBtn?.addEventListener("click", () => {
    state = cycleCombatStance(state);
    renderStationPanels();
  });

  audioBtn?.addEventListener("click", () => {
    const muted = audio.toggleMute();
    audioBtn.textContent = muted ? "Sound: Muted" : "Sound: Space Synth (On)";
  });

  document.getElementById("btn-receipt")?.addEventListener("click", () => {
    if (receiptBox) receiptBox.value = JSON.stringify(buildCommanderReceipt(state), null, 2);
  });

  let lastTime = performance.now();
  let accumulator = 0;

  function loop(now) {
    accumulator += Math.min(100, now - lastTime);
    lastTime = now;

    while (accumulator >= FIXED_DT_MS) {
      let tx = 0;
      let ty = 0;

      if (keys.has("arrowleft") || keys.has("a")) tx -= 360;
      if (keys.has("arrowright") || keys.has("d")) tx += 360;
      if (keys.has("arrowup") || keys.has("w")) ty -= 360;
      if (keys.has("arrowdown") || keys.has("s")) ty += 360;

      if (steerTarget && !state.docked) {
        const dx = steerTarget.x - fromQ16(state.ship.xQ16);
        const dy = steerTarget.y - fromQ16(state.ship.yQ16);
        tx += Math.max(-420, Math.min(420, dx * 3.8));
        ty += Math.max(-420, Math.min(420, dy * 3.8));
      }

      state = stepEliteFrame(state, toQ16(tx), toQ16(ty));
      accumulator -= FIXED_DT_MS;
    }

    if (ctx) renderSpaceSector(ctx, state);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

window.addEventListener("DOMContentLoaded", initEliteApp);
