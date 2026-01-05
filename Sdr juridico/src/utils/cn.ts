export type ClassValue = string | number | null | undefined | false

export const cn = (...values: ClassValue[]) =>
  values.filter(Boolean).join(' ')
