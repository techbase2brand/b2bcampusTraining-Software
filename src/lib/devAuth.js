// DEV ONLY. Temporary login so the training flow can be built before real auth exists.
// This is NOT security: any valid-looking credentials are accepted and nothing is verified.
// Replace `devLogin` with a real auth call (and server-side session) later.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_RE = /^[A-Za-z0-9_-]{3,}$/;

export function devLogin(identifier, password, currentProfile) {
  const id = identifier.trim();
  if (!EMAIL_RE.test(id) && !STUDENT_ID_RE.test(id)) {
    return { ok: false, error: "Enter a valid email or Student ID." };
  }
  if (password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }
  return { ok: true, profile: { ...currentProfile, name: nameFrom(id, currentProfile.name) } };
}

function nameFrom(id, fallback) {
  const local = id.split("@")[0];
  if (id.includes("@") && /^[A-Za-z][A-Za-z._-]+$/.test(local)) {
    const word = local.split(/[._-]/)[0];
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return fallback;
}
