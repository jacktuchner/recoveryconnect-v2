/**
 * Returns the public display name for a user based on their privacy settings.
 * - If showRealName is true, returns their real name
 * - If showRealName is false, returns their displayName or a fallback
 */
export function getPublicDisplayName(user: {
  name?: string | null;
  displayName?: string | null;
  showRealName?: boolean | null;
}): string {
  // Default to showing real name if not explicitly set to false
  const showReal = user.showRealName !== false;

  if (showReal) {
    return user.name || "Anonymous";
  }

  // User wants to be anonymous
  if (user.displayName) {
    return user.displayName;
  }

  // Generate a friendly fallback from their name initial
  if (user.name) {
    return `${user.name[0].toUpperCase()}. (Anonymous)`;
  }

  return "Anonymous Guide";
}

/**
 * Returns the initial for avatar display
 */
export function getDisplayInitial(user: {
  name?: string | null;
  displayName?: string | null;
  showRealName?: boolean | null;
}): string {
  const displayName = getPublicDisplayName(user);
  return displayName[0]?.toUpperCase() || "?";
}
