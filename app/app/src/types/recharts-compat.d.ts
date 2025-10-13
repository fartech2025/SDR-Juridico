// Recharts + React 19 JSX compatibility shim for Legend
import type { ComponentType } from 'react'

declare module 'recharts' {
  // Relax Legend typing to be used as a JSX component
  // without pulling in deprecated React.Component classes
  // that conflict with React 19 JSX typings.
  export const Legend: ComponentType<any>
}

