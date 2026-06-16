import { useEffect, useRef } from "react";

const CELL  = 48;   // tamanho de cada quadrado
const GLOW  = 3.5;  // raio em células ao redor do mouse
const DECAY = 0.88; // velocidade com que o brilho some

export default function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ x: -9999, y: -9999 });
  const glows     = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let cols = 0, rows = 0, rafId = 0;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.ceil(canvas.width  / CELL) + 1;
      rows = Math.ceil(canvas.height / CELL) + 1;
      glows.current = new Float32Array(cols * rows);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouse.current = { x: -9999, y: -9999 };
    }

    resize();
    window.addEventListener("resize", resize);
    // ouve no window para pegar o mouse mesmo quando está sobre o card
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    function draw() {
      const { width, height } = canvas;
      const g = glows.current!;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      ctx.clearRect(0, 0, width, height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const cx  = c * CELL;
          const cy  = r * CELL;

          // Centro da célula
          const cellCX = cx + CELL / 2;
          const cellCY = cy + CELL / 2;

          // Distância em células
          const dist = Math.hypot(mx - cellCX, my - cellCY) / CELL;
          const hit  = Math.max(0, 1 - dist / GLOW);

          // Aumenta rapidamente, decai suave
          g[idx] = Math.max(g[idx] * DECAY, hit * hit);

          const v = g[idx];
          if (v < 0.005) continue;

          // Preenche a célula com cor proporcional ao brilho
          ctx.fillStyle = `rgba(129,140,248,${v * 0.25})`;
          ctx.fillRect(cx + 1, cy + 1, CELL - 2, CELL - 2);

          // Borda mais viva nas células próximas
          ctx.strokeStyle = `rgba(165,180,252,${0.04 + v * 0.55})`;
          ctx.lineWidth   = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, CELL, CELL);
        }
      }

      // Grade base sempre visível (sem brilho)
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth   = 1;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL + 0.5);
        ctx.lineTo(width, r * CELL + 0.5);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL + 0.5, 0);
        ctx.lineTo(c * CELL + 0.5, height);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
