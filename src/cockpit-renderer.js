import { fromQ16 } from "./core.js";

export function renderSpaceSector(ctx, state) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = "#060b14";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.10)";
  ctx.lineWidth = 1;
  for (let x = 68; x < width; x += 68) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 70; y < height; y += 70) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = state.system.starColor;
  ctx.beginPath();
  ctx.arc(54, 58, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 186, 44, 44);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "10px monospace";
  ctx.fillText("CORIOLIS", 70, 178);

  for (const ast of state.asteroids) {
    const ax = fromQ16(ast.xQ16);
    const ay = fromQ16(ast.yQ16);
    ctx.fillStyle = ast.yieldCommodity === "shards" ? "#10b981" : "#78716c";
    ctx.strokeStyle = ast.yieldCommodity === "shards" ? "#6ee7b7" : "#d6d3d1";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(ax, ay, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(ast.yieldCommodity === "shards" ? "SHARD" : "ORE", ax, ay + 3);
    ctx.textAlign = "left";
  }

  for (const r of state.raiders) {
    const rx = fromQ16(r.xQ16);
    const ry = fromQ16(r.yQ16);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(rx - 14, ry);
    ctx.lineTo(rx + 12, ry - 10);
    ctx.lineTo(rx + 6, ry);
    ctx.lineTo(rx + 12, ry + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fca5a5";
    ctx.font = "9px monospace";
    ctx.fillText("HP:" + r.hp, rx - 14, ry - 14);
  }

  const sx = fromQ16(state.ship.xQ16);
  const sy = fromQ16(state.ship.yQ16);
  const scanRange = state.sleeve.id === "bio" ? 210 : 155;

  ctx.strokeStyle = state.sphereMode ? "rgba(250, 204, 21, 0.35)" : "rgba(56, 189, 248, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(sx, sy, scanRange, 0, Math.PI * 2);
  ctx.stroke();

  if (state.sphereMode) {
    for (const ast of state.asteroids) {
      ctx.strokeStyle = "rgba(253, 224, 71, 0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(fromQ16(ast.xQ16), fromQ16(ast.yQ16));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 95 + Math.sin(state.tick * 0.05) * 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const shot of state.enemyShots || []) {
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    ctx.lineTo(shot.x2, shot.y2);
    ctx.stroke();
  }

  if (state.laserBeamTicks > 0) {
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(state.ship.headingRad) * scanRange, sy + Math.sin(state.ship.headingRad) * scanRange);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(state.ship.headingRad);
  ctx.fillStyle = "#f59e0b";
  ctx.strokeStyle = "#fef3c7";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-12, 10);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (state.docked) {
    ctx.fillStyle = "rgba(6, 11, 20, 0.78)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DOCKED: " + state.system.name.toUpperCase(), width * 0.5, height * 0.46);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "12px monospace";
    ctx.fillText("Use Station Controls below to Trade, Resleeve, Upgrade Hull, or Jump", width * 0.5, height * 0.54);
    ctx.textAlign = "left";
  }
}
