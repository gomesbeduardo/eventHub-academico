import { useState, useRef, useEffect } from "react";

/**
 * Menu de configurações (hambúrguer) exibido no canto da navbar.
 * Recebe os itens como children e fecha ao clicar fora ou em um item.
 */
export default function SettingsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="settings-menu" ref={ref}>
      <button
        className="btn btn-ghost btn-sm settings-toggle"
        onClick={() => setOpen((o) => !o)}
        title="Configurações"
        aria-label="Configurações"
        aria-expanded={open}
      >
        ☰
      </button>
      {open && (
        <div className="settings-dropdown" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
