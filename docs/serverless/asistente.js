// EJEMPLO (no se despliega por defecto). Función serverless estilo Vercel/Netlify
// que conecta el asistente con Claude SIN exponer la clave en el frontend.
// Requisitos: npm i @anthropic-ai/sdk  ·  variable de entorno ANTHROPIC_API_KEY (solo en el servidor).
// Para activarla: cópiala a api/asistente.js (Vercel) o netlify/functions/ y pon
// ASSISTANT.endpoint = '/api/asistente' en src/data/site.js.
import Anthropic from '@anthropic-ai/sdk';
import kb from '../../public/data/conocimiento.json' with { type: 'json' };

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno del servidor

const SYSTEM = `Eres el asistente virtual de Eco Hotel Panchápolis Rivera (Rivera, Huila, Colombia).
Responde en español colombiano, breve y cordial, usando ÚNICAMENTE esta base de conocimiento verificada:
${JSON.stringify(kb.temas.map(({ id, respuesta }) => ({ id, respuesta })))}
Reglas: no inventes datos. Nunca des tarifas, disponibilidad, descuentos, pagos, horarios ni políticas
que no estén arriba. Si la respuesta no está en la base, responde exactamente: DERIVAR`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const message = String(req.body?.message || '').slice(0, 300);
  if (!message) return res.status(400).json({ handoff: true });
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: message }],
    });
    if (response.stop_reason === 'refusal') return res.json({ handoff: true });
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    if (!text || text.includes('DERIVAR')) return res.json({ handoff: true });
    return res.json({ reply: text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ handoff: true });
    return res.status(500).json({ handoff: true }); // ante cualquier fallo: pasar a WhatsApp
  }
}
