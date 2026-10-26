# Conectar el asistente a un modelo de lenguaje (opcional)

El asistente funciona **sin backend**: reglas + `public/data/conocimiento.json`. Si una pregunta no está en la base de conocimiento, deriva a WhatsApp con un mensaje prellenado.

## Arquitectura propuesta

```
Navegador ──POST {message}──▶ /api/asistente (función serverless propia)
                                  │  ANTHROPIC_API_KEY solo en variables de entorno del servidor
                                  ▼
                           API de Claude (Messages)
                                  │
Navegador ◀── {reply} o {handoff:true} ─┘
```

1. El frontend solo llama al modelo cuando las reglas no encuentran respuesta (`askModel` en `src/chat/assistant.js`).
2. La función arma el *system prompt* con la misma base de conocimiento JSON y prohíbe inventar datos.
3. Si el modelo no sabe, rechaza, o falla la red, la respuesta es `{ handoff: true }` y el asistente ofrece WhatsApp.

## Pasos

1. Copia `docs/serverless/asistente.js` a `api/asistente.js` (Vercel) o a `netlify/functions/asistente.js` (Netlify, adaptando la firma del handler).
2. `npm i @anthropic-ai/sdk` y define `ANTHROPIC_API_KEY` en el panel del proveedor. **Nunca** en el código del frontend ni en el repositorio.
3. En `src/data/site.js`, cambia `ASSISTANT.endpoint` a `'/api/asistente'` y vuelve a compilar.
4. Recomendado: limitar peticiones por IP (rate limit) y registrar preguntas sin respuesta para ampliar la base de conocimiento.

El ejemplo usa el modelo `claude-opus-5-5` con esfuerzo bajo (respuestas cortas de chat) y el respaldo automático del servidor ante rechazos (`fallbacks: 'default'`).
