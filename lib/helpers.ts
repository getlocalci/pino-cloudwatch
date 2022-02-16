export function castArray(value: any): any[] {
  return Array.isArray(value) ? value : [value];
}
