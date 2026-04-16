import type { ReactNode } from 'react';

export default function PageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container page-shell ${className}`.trim()}>{children}</div>;
}

