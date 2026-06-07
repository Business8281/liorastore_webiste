import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * This ensures that conflicting classes are handled correctly.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee (INR) with the Indian numbering system.
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted price string.
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // Traditional for INR in many contexts, but can be 2 if needed
  }).format(amount);
}
