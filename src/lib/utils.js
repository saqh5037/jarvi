import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilidad para combinar clases de Tailwind de manera segura
 * Combina clsx con tailwind-merge para evitar conflictos de clases
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}