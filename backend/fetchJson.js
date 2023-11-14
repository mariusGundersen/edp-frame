
export async function fetchJson(input, init = {}) {

  init.headers = new Headers(init.headers);

  init.headers.set('User-Agent', 'https://github.com/mariusGundersen/edp-frame');

  const response = await fetch(input, init);

  if (!response.ok) throw new Error(`Failed to fetch ${response.url}, ${await response.text()}`);

  return await response.json();
}
