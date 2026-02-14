import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sorts classes naturally: JS1, JS2, JS3 before S1, S2, S3.
 * Handles variations like "JS 1" and "JS10".
 */
export function sortClasses<T extends { name: string }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const aName = a.name.toUpperCase();
    const bName = b.name.toUpperCase();

    // Custom prefix order: JS (Junior) then S (Senior)
    const getPrefixRank = (name: string) => {
      if (name.startsWith('JS')) return 1;
      if (name.startsWith('S')) return 2;
      return 3;
    };

    const aRank = getPrefixRank(aName);
    const bRank = getPrefixRank(bName);

    if (aRank !== bRank) return aRank - bRank;

    // Same prefix group, sort by numeric part
    const aNumMatch = aName.match(/\d+/);
    const bNumMatch = bName.match(/\d+/);
    const aNum = aNumMatch ? parseInt(aNumMatch[0], 10) : 0;
    const bNum = bNumMatch ? parseInt(bNumMatch[0], 10) : 0;

    if (aNum !== bNum) return aNum - bNum;

    // Fallback to alphabetical for tie-breaking
    return aName.localeCompare(bName);
  });
}
