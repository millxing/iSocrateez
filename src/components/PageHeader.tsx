import type { ReactNode } from "react";

interface PageHeaderProps {
  step?: string;
  title: string;
  children?: ReactNode;
}

/** Shared heading block for wizard pages: step eyebrow, title, one-line guidance. */
export function PageHeader({ step, title, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      {step && <p className="eyebrow">{step}</p>}
      <h2 className="wizard-title">{title}</h2>
      {children && <p className="wizard-subtitle">{children}</p>}
    </header>
  );
}
