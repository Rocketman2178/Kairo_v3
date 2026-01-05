import { createContext, useContext, RefObject } from 'react';

interface DemoModalContextType {
  containerRef: RefObject<HTMLDivElement> | null;
  isDemo: boolean;
}

export const DemoModalContext = createContext<DemoModalContextType>({
  containerRef: null,
  isDemo: false,
});

export function useDemoModal() {
  return useContext(DemoModalContext);
}
