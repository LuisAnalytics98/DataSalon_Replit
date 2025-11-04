import { Armchair } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full py-4 px-6 border-b border-border/40" data-testid="header-main">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-md" data-testid="logo-icon">
          <Armchair className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground" data-testid="brand-name">
          Data Salon
        </span>
      </div>
    </header>
  );
}
