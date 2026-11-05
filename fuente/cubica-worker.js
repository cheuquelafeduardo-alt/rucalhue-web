// Servicio opcional para el Modo automatico de Cubica tu Obra (Cloudflare Worker).
// Secretos requeridos: ANTHROPIC_API_KEY y CLAVE_ACCESO. Nunca guardarlos en este repositorio.
const ORIGEN = 'https://rucalhuearquitectura.cl';
const CORS = { 'access-control-allow-origin': ORIGEN, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return new Response('Metodo no permitido', { status: 405, headers: CORS });
    const b = await req.json().catch(() => null);
    if (!b || b.clave !== env.CLAVE_ACCESO) return new Response('Clave incorrecta', { status: 401, headers: CORS });
    const content = (b.images || []).slice(0, 8).map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
    content.push({ type: 'text', text: String(b.prompt || '').slice(0, 30000) });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.MODELO || 'claude-sonnet-5-5', max_tokens: 4000, messages: [{ role: 'user', content }] }),
    });
    if (!r.ok) return new Response('Servicio no disponible', { status: 502, headers: CORS });
    const j = await r.json();
    const t = (j.content || []).map((c) => c.text || '').join('');
    const m = t.match(/\{[\s\S]*\}/);
    return new Response(m ? m[0] : '{}', { headers: { ...CORS, 'content-type': 'application/json' } });
  },
};
