export async function getConfig() {
  const fromFile = await import('./config.js').catch(() => ({}));

  return {
    tibber: {
      token: process.env.TIBBER_TOKEN ?? fromFile.tibber.token
    },
    google: JSON.parse(process.env.GOOGLE_TOKEN ?? 'null') ?? fromFile.google
  }
}
