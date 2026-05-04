'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderAction {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  target?: '_blank' | '_self';
  loading?: boolean;
  disabled?: boolean;
}

export interface PageHeaderState {
  title: string;
  subtitle?: string;
  action?: PageHeaderAction;
}

interface PageHeaderContextValue {
  header: PageHeaderState;
  setHeader: (next: PageHeaderState) => void;
  resetHeader: () => void;
}

const DEFAULT_HEADER: PageHeaderState = { title: 'Dashboard' };

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeaderState>(DEFAULT_HEADER);

  const setHeader = useCallback((next: PageHeaderState) => {
    setHeaderState(next);
  }, []);

  const resetHeader = useCallback(() => {
    setHeaderState(DEFAULT_HEADER);
  }, []);

  const value = useMemo<PageHeaderContextValue>(
    () => ({ header, setHeader, resetHeader }),
    [header, setHeader, resetHeader]
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageHeaderContext must be used within <PageHeaderProvider>');
  }
  return ctx;
}

/**
 * Page hook — call once per page (in a useEffect) to set the topbar contents.
 * Resets to the default ({ title: "Dashboard" }) on unmount.
 *
 * The `deps` array follows React useEffect rules — pass dependencies the header
 * derives from (e.g. dynamic title from a fetched object).
 */
export function usePageHeader(state: PageHeaderState, deps: unknown[] = []): void {
  const { setHeader, resetHeader } = usePageHeaderContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHeader(state);
    return () => resetHeader();
  }, deps);
}
