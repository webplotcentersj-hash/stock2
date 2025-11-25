/**
 * PlotAI Service - Integración con Gemini AI
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export const plotAI = {
  async call(prompt, systemInstruction = '') {
    if (!API_KEY) {
      console.warn('⚠️ PlotAI: API key no configurada')
      return null
    }

    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      }

      throw new Error('No se recibió respuesta válida de PlotAI')
    } catch (error) {
      console.error('Error llamando a PlotAI:', error)
      return null
    }
  },

  async analyzeStock(article) {
    const prompt = `Analiza el siguiente artículo y proporciona recomendaciones:

Código: ${article.codigo}
Descripción: ${article.descripcion}
Stock actual: ${article.stock_actual || article.stock}
Stock mínimo: ${article.stock_minimo}

Proporciona:
1. Análisis del nivel de stock (1-2 líneas)
2. Cantidad recomendada a comprar
3. Nivel de urgencia (Bajo/Medio/Alto)

Responde SOLO en formato JSON así:
{
  "analisis": "texto del análisis",
  "cantidad_sugerida": número,
  "urgencia": "Bajo/Medio/Alto",
  "razon": "explicación breve"
}`

    const systemInstruction =
      'Eres un experto en gestión de inventario. Responde SOLO en formato JSON válido, sin markdown ni texto adicional.'

    const result = await this.call(prompt, systemInstruction)

    if (result) {
      try {
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned)
      } catch (e) {
        console.error('Error parseando respuesta de PlotAI:', e)
        return {
          analisis: result,
          cantidad_sugerida: 0,
          urgencia: 'Medio',
          razon: 'Análisis manual requerido',
        }
      }
    }

    return null
  },

  async generateDescription(productName, category = '') {
    const prompt = `Genera una descripción profesional y atractiva para: ${productName}${category ? ` (${category})` : ''}.
        
La descripción debe:
- Ser breve (máximo 2 líneas)
- Ser profesional
- Enfocarse en características técnicas
- Orientada a empresas gráficas

Responde SOLO con la descripción, sin comillas ni formato adicional.`

    const systemInstruction =
      'Eres un experto en productos gráficos e imprenta. Genera descripciones concisas y profesionales.'

    return await this.call(prompt, systemInstruction)
  },

  async suggestPurchases(stockData) {
    const stockList = stockData
      .map((item) => `- ${item.descripcion}: Stock ${item.stock_actual || item.stock}/${item.stock_minimo}`)
      .join('\n')

    const prompt = `Basándote en estos datos de stock, sugiere qué comprar prioritariamente:

${stockList}

Proporciona una lista de los 5 productos más urgentes con cantidades sugeridas.
Responde en formato JSON así:
{
  "compras_urgentes": [
    {
      "producto": "nombre",
      "cantidad": número,
      "prioridad": "Alta/Media/Baja",
      "razon": "explicación"
    }
  ],
  "resumen": "análisis general"
}`

    const systemInstruction = 'Eres un asistente de compras experto. Responde SOLO en JSON válido.'

    const result = await this.call(prompt, systemInstruction)

    if (result) {
      try {
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned)
      } catch (e) {
        return { compras_urgentes: [], resumen: result }
      }
    }

    return null
  },

  async chat(userMessage, context = {}) {
    const systemInstruction = `Eres un asistente virtual del sistema Stock Plot Center v2.
Ayudas con consultas sobre:
- Gestión de stock
- Pedidos
- Compras
- Movimientos de caja
- Usuarios

Responde de manera amigable, profesional y concisa en español.`

    let prompt = userMessage

    if (Object.keys(context).length > 0) {
      prompt = `Contexto:\n${JSON.stringify(context, null, 2)}\n\nPregunta: ${userMessage}`
    }

    return await this.call(prompt, systemInstruction)
  },
}

