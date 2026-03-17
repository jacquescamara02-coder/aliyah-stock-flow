import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const themes = [
  {
    name: "Chrome",
    primary: "30 85% 55%",
    desc: "Orange industriel",
    preview: "hsl(30, 85%, 55%)",
  },
  {
    name: "Émeraude",
    primary: "155 65% 42%",
    desc: "Vert émeraude",
    preview: "hsl(155, 65%, 42%)",
  },
  {
    name: "Saphir",
    primary: "210 80% 55%",
    desc: "Bleu saphir",
    preview: "hsl(210, 80%, 55%)",
  },
  {
    name: "Rubis",
    primary: "350 75% 55%",
    desc: "Rouge rubis",
    preview: "hsl(350, 75%, 55%)",
  },
  {
    name: "Améthyste",
    primary: "270 60% 58%",
    desc: "Violet améthyste",
    preview: "hsl(270, 60%, 58%)",
  },
  {
    name: "Or",
    primary: "45 90% 50%",
    desc: "Or doré",
    preview: "hsl(45, 90%, 50%)",
  },
];

function applyTheme(primary: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--chart-1", primary);
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState(() => localStorage.getItem("aliyah-theme") || "30 85% 55%");

  useEffect(() => {
    applyTheme(current);
  }, []);

  const select = (primary: string) => {
    setCurrent(primary);
    applyTheme(primary);
    localStorage.setItem("aliyah-theme", primary);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground w-full justify-start px-3 py-2.5">
          <Palette className="w-4 h-4" />
          <span className="text-sm">Thème</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" side="right" align="end">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono px-2 pb-2">Couleur</p>
        {themes.map((t) => (
          <button
            key={t.primary}
            onClick={() => select(t.primary)}
            className="flex items-center gap-3 w-full px-2 py-2 rounded text-sm hover:bg-accent transition-colors"
          >
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center" style={{ backgroundColor: t.preview }}>
              {current === t.primary && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="text-left">
              <p className="text-foreground font-medium text-xs">{t.name}</p>
              <p className="text-muted-foreground text-[10px]">{t.desc}</p>
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
