export async function getConfig() {
  const fromFile = await import("./config.js").catch(() => ({}));

  return {
    users: {
      admin: process.env.ADMIN_PASSWORD ?? fromFile.users.admin,
    },
    tibber: {
      token: process.env.TIBBER_TOKEN ?? fromFile.tibber.token,
    },
    google: JSON.parse(process.env.GOOGLE_TOKEN ?? "null") ?? fromFile.google,
    famly: process.env.FAMLY_TOKEN ?? fromFile.famly,
  };
}
