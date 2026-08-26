import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// NVIDIA AI Configuration
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'Llama-3.3-Nemotron-Super-49B-v1.5';

// Gemini API Configuration (Fallback)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Base URL for Gemini standard chat endpoint (if needed) fallback
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Abstracted AI Provider function
async function generateAIResponse(messages, systemPrompt = '') {
    try {
        if (NVIDIA_API_KEY) {
            // Primary: NVIDIA Nemotron
            const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                },
                body: JSON.stringify({
                    model: NVIDIA_MODEL,
                    messages: [
                        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            if (!response.ok) throw new Error(`NVIDIA API Error: ${response.statusText}`);
            const data = await response.json();
            return data.choices[0].message.content;
        }

        // Fallback: Gemini
        if (GEMINI_API_KEY) {
            // Map standard msg format to Gemini format
            let contents = [];
            if (systemPrompt) contents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] });

            messages.forEach(msg => {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            });

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
            });

            if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        }

        throw new Error('No AI Providers configured (API keys missing)');
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
}

// ----------------------------------------------------------------------
// AI Endpoints
// ----------------------------------------------------------------------

// 1. Mascot Context Summarizer
// Expected body: { customerName: 'John', currentRoute: '/home', activeBookingsCount: 0 }
app.post('/api/ai/mascot-context', async (req, res) => {
    try {
        const { customerName, currentRoute, activeBookingsCount, language = 'English' } = req.body;

        const systemPrompt = `You are a helpful, robotic Mascot Assistant 'Mascot Hero' for the COOP HUB platform. 
    You provide short (1-2 sentences), friendly, contextual greetings based on the user's current situation.
    Always respond in the requested language: ${language}.
    Do not invent services or fabricate data.`;

        const userMessage = `Customer Name: ${customerName}. 
    Current Page: ${currentRoute}. 
    Active Bookings: ${activeBookingsCount}.
    Give them a personalized brief welcome and guidance based on this exact context.`;

        const reply = await generateAIResponse([{ role: 'user', content: userMessage }], systemPrompt);
        res.json({ message: reply });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to generate mascot context' });
    }
});

// 2. Chat Agent Conversational Assistant
// Expected body: { messages: [{ role: 'user', content: '...' }], language: 'English' }
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { messages, language = 'English', catalogContext = 'No services available.' } = req.body;

        const systemPrompt = `You are the specific Customer AI Assistant for COOP HUB.
    You help customers find and book household services like plumbing, cleaning, or electrical.
    Strict Rules:
    1. Reply in the requested language: ${language}.
    2. Base all responses ONLY on the Provided Catalog Context.
    3. DO NOT invent or fabricate any services that are not in the Catalog Context.
    4. You cannot perform write actions or arbitrary SQL queries directly.
    5. If a customer desires to book a service, you MUST gather requirements (Service, Date, Location) and clearly ask for explicit confirmation: 'Would you like me to submit this request summary?'.
    6. NEVER hallucinate a confirmation ID or price.
    7. Keep responses friendly, structured, and helpful.
    
    Provided Catalog Context:
    ${catalogContext}`;

        const reply = await generateAIResponse(messages, systemPrompt);
        res.json({ message: reply });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to generate chat response' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend AI Relay Server running on port ${PORT}`);
});
