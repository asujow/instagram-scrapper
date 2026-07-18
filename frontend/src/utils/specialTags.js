// Mirrors the reserved tag names in backend/utils/db.js. Kept as plain
// string constants (not imported across the client/server boundary)
// since the frontend and backend are separate apps here.
export const DELETED_TAG = "deleted";
export const ALT_ACCOUNT_TAG = "alt-account";
export const RESERVED_TAGS = [DELETED_TAG, ALT_ACCOUNT_TAG];

/**
 * Tailwind classes for a tag pill. Reserved tags get a fixed, meaningful
 * color everywhere a tag is rendered (grid cards, profile detail, the
 * Tags page) instead of the default neutral gray used for regular tags.
 */
export function getTagColorClasses(tag) {
  if (tag === DELETED_TAG) {
    return "bg-red-100 text-red-700";
  }

  if (tag === ALT_ACCOUNT_TAG) {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-zinc-200 text-zinc-800";
}
