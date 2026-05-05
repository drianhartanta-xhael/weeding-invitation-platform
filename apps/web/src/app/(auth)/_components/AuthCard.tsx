import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-[14px] bg-card p-12 shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
      <div className="mb-9 flex items-center gap-3">
        <Logo size={40} />
        <div>
          <div className="text-lg font-bold text-foreground">WeddingApp</div>
          <div className="text-xs text-muted-foreground">Admin Portal</div>
        </div>
      </div>
      <h1 className="mb-1.5 text-[22px] font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mb-7 text-[13px] text-muted-foreground">{subtitle}</p>
      {children}
      {footer && <div className="mt-4 text-center text-[11px] text-muted-foreground">{footer}</div>}
    </div>
  );
}
