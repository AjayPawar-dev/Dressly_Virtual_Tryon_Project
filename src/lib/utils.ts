export type ClassValue =
  | string
  | false
  | null
  | undefined
  | ClassValue[]

export function cn(...inputs: ClassValue[]) {
  const classes: string[] = []

  const append = (value: ClassValue): void => {
    if (!value) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach(append)
      return
    }

    classes.push(value)
  }

  inputs.forEach(append)
  return classes.join(' ')
}
