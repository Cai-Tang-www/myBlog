"use client";

import { useEffect, useRef } from "react";

// ── Exact port of canvas-nest.min.js ──
// Original config: color="0,0,255" opacity="0.5" count="99" zIndex="-1"
// We use zIndex:0 because body bg is transparent (see globals.css)

const CONFIG = {
  color: "8,25,100",     // very deep blue for lines
  opacity: 0.5,         // canvas opacity
  count: 115,           // particle count
  particleMax: 6000,   // max dist² between particles (~77px)
  mouseMax: 20000,     // max dist² from mouse (~141px)
};

interface Dot {
  x: number;
  y: number;
  xa: number;  // velocity x
  ya: number;  // velocity y
  max: number; // max dist² for connections
}

export function CanvasNest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dots: Dot[] = [];
    const mouse: Dot = { x: -9999, y: -9999, xa: 0, ya: 0, max: CONFIG.mouseMax };
    let animId = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onMouseOut = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseOut);

    // Init: velocity in [-1, 1] (matches original 2*Math.random()-1)
    for (let i = 0; i < CONFIG.count; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        xa: 2 * Math.random() - 1,
        ya: 2 * Math.random() - 1,
        max: CONFIG.particleMax,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      // Build draw list: mouse (if onscreen) + all dots
      const hasMouse = mouse.x !== -9999 && mouse.y !== -9999;
      const drawList: Dot[] = hasMouse ? [mouse, ...dots] : [...dots];

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Move
        d.x += d.xa;
        d.y += d.ya;

        // Bounce off edges (exact original behavior)
        d.xa *= (d.x > W || d.x < 0) ? -1 : 1;
        d.ya *= (d.y > H || d.y < 0) ? -1 : 1;

        // Dot — much deeper blue, visible even when no connections nearby
        ctx.fillStyle = "#030e24";
        ctx.fillRect(d.x - 0.5, d.y - 0.5, 1, 1);

        // Draw connections from this dot to all others in drawList
        for (let j = 0; j < drawList.length; j++) {
          const other = drawList[j];
          if (other === d) continue;
          if (other.x === -9999 || other.y === -9999) continue;

          const dx = d.x - other.x;
          const dy = d.y - other.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < other.max) {
            // Mouse repulsion ring (exact original): push dots away at 100-141px
            if (other === mouse && distSq >= other.max / 2) {
              d.x -= 0.03 * dx;
              d.y -= 0.03 * dy;
            }

            const ratio = (other.max - distSq) / other.max;
            ctx.beginPath();
            ctx.lineWidth = ratio / 2;
            ctx.strokeStyle = `rgba(${CONFIG.color},${(ratio + 0.2).toFixed(3)})`;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Remove processed dot from drawList (original pattern to avoid duplicate lines)
        const idx = drawList.indexOf(d);
        if (idx !== -1) drawList.splice(idx, 1);
      }

      animId = requestAnimationFrame(animate);
    };

    setTimeout(() => {
      animId = requestAnimationFrame(animate);
    }, 100);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        opacity: CONFIG.opacity,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
