// Shared server configuration.
// JWT_SECRET wajib ada — gagal fast kalau tidak diset (cegah token palsu).
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const JWT_SECRET = secret;
