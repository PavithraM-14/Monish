import Groq from 'groq-sdk';
import ChatLog from '../models/ChatLog.js';
import {
  extractMachineFromText,
  buildChatContext,
} from '../utils/chatContextBuilder.js';
import {
  INTENT_CLASSIFICATION_PROMPT,
  GROUNDED_ASSISTANT_SYSTEM_PROMPT,
} from '../utils/promptTemplates.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

let groqClient = null;
if (GROQ_API_KEY && GROQ_API_KEY.trim() !== '' && !GROQ_API_KEY.includes('your_groq_api_key')) {
  try {
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
  } catch (e) {
    console.error('Groq initialization error:', e.message);
  }
}

/**
 * Fallback diagnostic generator when Groq is not configured or offline
 */
function generateDeterministicGroundedResponse(question, intent, machineId, contextText, sourcesUsed) {
  const qLower = question.toLowerCase();

  if (machineId) {
    return (
      `**PredictaMaint Diagnostic Report for ${machineId}:**\n\n` +
      `Based on the live telemetry database:\n` +
      contextText
        .split('\n')
        .filter((l) => l.startsWith('•') || l.startsWith('Operating Status') || l.startsWith('Safety') || l.startsWith('Estimated'))
        .slice(0, 5)
        .join('\n') +
      `\n\n**Actionable Recommendations:**\n` +
      `• Immediately dispatch technician to inspect ${machineId} for mechanical vibration and thermal dissipation.\n` +
      `• Verify lubrication levels and bearing raceway integrity.\n` +
      `• Review open maintenance tickets and update operating parameters.`
    );
  }

  // Fleet question
  return (
    `**Fleet Health & Risk Assessment Summary:**\n\n` +
    `Telemetry monitoring is actively tracking the fleet:\n` +
    contextText
      .split('\n')
      .filter((l) => l.startsWith('•') || l.includes('Attention'))
      .slice(0, 6)
      .join('\n') +
    `\n\n**Engineering Recommendation:** Prioritize maintenance on machines exhibiting elevated vibration or thermal runaway to prevent unscheduled downtime.`
  );
}

export const handleChatMessage = async (req, res) => {
  try {
    const { question, machineId: clientMachineId } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    let detectedMachineId = clientMachineId || extractMachineFromText(question);
    let detectedIntent = 'machine_health';

    // Step 1: LLM Intent Classification (if Groq is available)
    if (groqClient) {
      try {
        const intentCompletion = await groqClient.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
            { role: 'user', content: question },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 150,
        });

        const parsed = JSON.parse(intentCompletion.choices[0]?.message?.content || '{}');
        if (parsed.machineId && !clientMachineId) {
          detectedMachineId = parsed.machineId;
        }
        if (parsed.intent) {
          detectedIntent = parsed.intent;
        }
      } catch (err) {
        console.warn('Groq Step 1 Intent Classification error, falling back to heuristics:', err.message);
        // Fallback to heuristic parser
        if (!detectedMachineId) detectedMachineId = extractMachineFromText(question);
      }
    }

    // Step 2: Fetch Grounded MongoDB Context
    const { contextText, sourcesUsed } = await buildChatContext(detectedIntent, detectedMachineId);

    // Step 3: Grounded Answer Generation
    let answer = '';
    let modelUsed = groqClient ? DEFAULT_MODEL : 'rule-based-grounded-rag';

    if (groqClient) {
      try {
        const userPrompt = `
USER INQUIRY: "${question}"
INTENT: ${detectedIntent}
TARGET MACHINE: ${detectedMachineId || 'Fleet-wide'}

LIVE MONGODB DATABASE CONTEXT:
${contextText}

Generate a concise, grounded diagnostic response addressing the engineer's question based strictly on the above facts. Include sensor values and technical reasoning.
`;

        const chatCompletion = await groqClient.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: GROUNDED_ASSISTANT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        answer = chatCompletion.choices[0]?.message?.content || 'Unable to generate response from model.';
      } catch (err) {
        console.error('Groq Step 2 Completion error:', err.message);
        // Try fallback Groq model if gpt-oss-20b is not enabled
        try {
          const fallbackModel = 'llama-3.3-70b-versatile';
          const retryCompletion = await groqClient.chat.completions.create({
            model: fallbackModel,
            messages: [
              { role: 'system', content: GROUNDED_ASSISTANT_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `USER QUESTION: "${question}"\n\nDATABASE CONTEXT:\n${contextText}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          });
          answer = retryCompletion.choices[0]?.message?.content || '';
          modelUsed = fallbackModel;
        } catch (retryErr) {
          console.warn('Groq fallback model also failed. Using deterministic RAG fallback.');
          answer = generateDeterministicGroundedResponse(
            question,
            detectedIntent,
            detectedMachineId,
            contextText,
            sourcesUsed
          );
          modelUsed = 'local-rag-fallback';
        }
      }
    } else {
      // Deterministic Grounded RAG Response
      answer = generateDeterministicGroundedResponse(
        question,
        detectedIntent,
        detectedMachineId,
        contextText,
        sourcesUsed
      );
    }

    // Step 4: Audit Log in MongoDB
    try {
      await ChatLog.create({
        userId: req.user ? req.user._id : 'anonymous',
        question,
        intent: detectedIntent,
        machineId: detectedMachineId,
        answer,
        sources: sourcesUsed,
        model: modelUsed,
      });
    } catch (logErr) {
      console.error('Chat audit logging error:', logErr.message);
    }

    // Step 5: Return to client
    res.json({
      answer,
      sources: sourcesUsed,
      intent: detectedIntent,
      machineId: detectedMachineId,
      modelUsed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const logs = await ChatLog.find({}).sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
