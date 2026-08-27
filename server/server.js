import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

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
        const langMap = { en: 'English', ta: 'Tamil', hi: 'Hindi', te: 'Telugu', kn: 'Kannada' };
        const targetLang = langMap[language] || language;

        const systemPrompt = `You are a helpful, friendly AI Mascot Guide 'CoopBot / Mascot Hero' for the COOP HUB platform. 
    You provide short (1-2 sentences), friendly, contextual greetings based on the user's current situation.
    Always respond strictly in ${targetLang}.
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

// ----------------------------------------------------------------------
// Sub-Agent Server-Side Controlled Tools (Phase 6 & 7)
// ----------------------------------------------------------------------

const createAuthClient = (token) => {
    return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};

async function AgentRouter(userMsg, token, currentContext) {
    if (!token) return 'NO_CONTEXT'; // Unauthenticated, skip Sub-Agents

    // Evaluate Intent (Phase 7 Expansion)
    const intentPrompt = `Classify user intent into exact strings: 
    'GET_REQUEST_LIST' (active bookings), 
    'GET_REQUEST_DETAILS' (request status/timeline), 
    'GET_HISTORY' (past services),
    'GET_NOTIFICATIONS',
    'MARK_NOTIFICATIONS_READ',
    'GET_CONVERSATION',
    'SEND_MESSAGE',
    'SUBMIT_REVIEW',
    'GET_REVIEW_STATUS',
    'GET_FAQS' (asking for help/faq),
    'GET_SUPPORT_TICKETS' (checking support tickets),
    'CREATE_SUPPORT_TICKET' (opening a support ticket),
    'GET_PROFILE' (checking their account profile/name/phone),
    'UPDATE_PROFILE' (changing name/phone),
    'GET_SETTINGS' (notification/language settings),
    'UPDATE_SETTINGS' (changing language/notifications),
    or 'GENERAL_CHAT' (everything else).
    Extract parameters: {"action": "...", "params": {"message": "...", "subject": "...", "category": "...", "description": "...", "full_name": "...", "phone": "..."}}. 
    Return ONLY valid JSON format: {"action": "...", "params": {}}`;

    let intentResult;
    try {
        const intentRaw = await generateAIResponse([{ role: 'user', content: userMsg }], intentPrompt);
        intentResult = JSON.parse(intentRaw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
        return 'GENERAL_CHAT';
    }

    const supabase = createAuthClient(token);
    // Fetch authorized user identity natively from token
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'UNAUTHORIZED';

    let subAgentContext = '';
    const reqId = currentContext.currentRequestId;
    const action = intentResult.action;
    const params = intentResult.params || {};

    // ==========================================
    // Phase 5 Controlled Tools
    // ==========================================
    if (action === 'GET_REQUEST_LIST') {
        const { data, error } = await supabase.from('service_requests')
            .select('id, status, created_at, services(name_translations), sub_services(name_translations)')
            .not('status', 'in', '("completed","cancelled")')
            .order('created_at', { ascending: false }).limit(5);
        subAgentContext = !error ? `[Data (Active Requests)]: ${JSON.stringify(data)}` : 'Error fetching active requests.';
    }
    else if (action === 'GET_REQUEST_DETAILS') {
        if (!reqId) {
            subAgentContext = `[Context]: User is lacking a specific request ID in their UI.`;
        } else {
            const { data: details } = await supabase.from('service_requests').select('*').eq('id', reqId).single();
            const { data: history } = await supabase.from('request_status_history').select('*').eq('request_id', reqId).order('created_at', { ascending: true });
            subAgentContext = `[Data (Request ${reqId})]: Details: ${JSON.stringify(details)}. Timeline History: ${JSON.stringify(history)}`;
        }
    }
    // ==========================================
    // Phase 6 Controlled Tools - HISTORY AGENT
    // ==========================================
    else if (action === 'GET_HISTORY') {
        const { data, error } = await supabase.from('service_requests')
            .select('id, status, created_at, services(name_translations)')
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false }).limit(10);
        subAgentContext = !error ? `[Data (History)]: ${JSON.stringify(data)}` : 'Error fetching history.';
    }
    // ==========================================
    // Phase 6 Controlled Tools - NOTIFICATION AGENT
    // ==========================================
    else if (action === 'GET_NOTIFICATIONS') {
        const { data, error } = await supabase.from('notifications')
            .select('*')
            .order('created_at', { ascending: false }).limit(10);
        subAgentContext = !error ? `[Data (Notifications)]: Unread/Recent: ${JSON.stringify(data)}` : 'Error fetching notifications.';
    }
    else if (action === 'MARK_NOTIFICATIONS_READ') {
        if (params.notificationId) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', params.notificationId).eq('customer_id', user.id);
        } else {
            // Mark all read securely bound by JWT
            await supabase.from('notifications').update({ is_read: true }).eq('customer_id', user.id);
        }
        subAgentContext = `[Action Result]: Successfully marked notifications as read. Inform the user gracefully.`;
    }
    // ==========================================
    // Phase 6 Controlled Tools - COMMUNICATION AGENT
    // ==========================================
    else if (action === 'GET_CONVERSATION') {
        if (!reqId) return '[Context]: Missing specific request ID to fetch conversation.';
        // RLS natively prevents reading messages if the user doesn't own the request!
        const { data, error } = await supabase.from('messages')
            .select('*').eq('request_id', reqId).order('created_at', { ascending: true });
        subAgentContext = !error ? `[Data (Conversation ${reqId})]: ${JSON.stringify(data)}` : 'Failed retrieving conversation, may be unauthorized.';
    }
    else if (action === 'SEND_MESSAGE') {
        if (!reqId || !params.message) return '[Context]: Missing request ID or message text to send.';

        // Ensure request belongs to user and is actually assigned before sending (RLS + manual double check)
        const { data: reqCheck } = await supabase.from('service_requests').select('status').eq('id', reqId).single();
        const validComms = ['assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];

        if (reqCheck && validComms.includes(reqCheck.status)) {
            const { error } = await supabase.from('messages').insert({
                request_id: reqId,
                sender_id: user.id,
                sender_type: 'customer',
                content: params.message
            });
            subAgentContext = !error ? `[Action Result]: Successfully sent message: "${params.message}"` : `[Error]: RLS Failed sending message.`;
        } else {
            subAgentContext = `[Action Result]: Cannot send message. Request is in status '${reqCheck?.status || 'Unknown'}'. Pillar not fully assigned.`;
        }
    }
    // ==========================================
    // Phase 6 Controlled Tools - REVIEW AGENT
    // ==========================================
    else if (action === 'GET_REVIEW_STATUS') {
        if (!reqId) return '[Context]: Missing request ID.';
        const { data, error } = await supabase.from('reviews').select('*').eq('request_id', reqId).single();
        subAgentContext = `[Data (Review Status)]: ${data ? 'Review already submitted: ' + JSON.stringify(data) : 'No review submitted yet.'}`;
    }
    else if (action === 'SUBMIT_REVIEW') {
        if (!reqId || !params.rating) return '[Context]: Missing request ID or Rating (1-5).';
        // RLS inherently checks if customer owns request and it is 'completed' before Insert succeeds
        const { error } = await supabase.from('reviews').insert({
            request_id: reqId,
            customer_id: user.id,
            rating: params.rating,
            feedback: params.feedback || null
        });
        subAgentContext = !error ? `[Action Result]: Review successfully submitted!` : `[Error]: Could not submit review. Ensure the request is fully completed and not already reviewed.`;
    }
    // ==========================================
    // Phase 7 Controlled Tools - SUPPORT AGENT
    // ==========================================
    else if (action === 'GET_FAQS') {
        const { data, error } = await supabase.from('faq').select('*').eq('is_active', true);
        subAgentContext = !error ? `[Data (FAQs)]: ${JSON.stringify(data)}` : 'Error fetching FAQs.';
    }
    else if (action === 'GET_SUPPORT_TICKETS') {
        const { data, error } = await supabase.from('support_tickets').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
        subAgentContext = !error ? `[Data (Support Tickets)]: ${JSON.stringify(data)}` : 'Error fetching Support Tickets.';
    }
    else if (action === 'CREATE_SUPPORT_TICKET') {
        if (!params.subject || !params.description) return '[Context]: Missing subject or description for support ticket.';
        const { error } = await supabase.from('support_tickets').insert({
            customer_id: user.id,
            request_id: reqId || null,
            subject: params.subject,
            category: params.category || 'general',
            description: params.description
        });
        subAgentContext = !error ? `[Action Result]: Support Ticket "${params.subject}" successfully created! Support team will review.` : `[Error]: RLS Failed creating ticket.`;
    }
    // ==========================================
    // Phase 7 Controlled Tools - PROFILE AGENT
    // ==========================================
    else if (action === 'GET_PROFILE') {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        subAgentContext = !error ? `[Data (My Profile)]: ${JSON.stringify(data)}` : 'Error fetching Profile.';
    }
    else if (action === 'UPDATE_PROFILE') {
        const payload = {};
        if (params.full_name) payload.full_name = params.full_name;
        if (params.phone) payload.phone = params.phone;

        if (Object.keys(payload).length === 0) return '[Context]: No valid profile fields provided to update.';

        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
        subAgentContext = !error ? `[Action Result]: Profile successfully updated!` : `[Error]: Profile update failed.`;
    }
    // ==========================================
    // Phase 7 Controlled Tools - SETTINGS AGENT
    // ==========================================
    else if (action === 'GET_SETTINGS') {
        const { data, error } = await supabase.from('customer_notification_preferences').select('*').eq('customer_id', user.id).single();
        subAgentContext = `[Data (Settings)]: ${data ? JSON.stringify(data) : 'No preferences set.'}. [Note]: Language setting is controlled entirely locally via UI interactions, inform user to visit /settings.`;
    }
    else if (action === 'UPDATE_SETTINGS') {
        // Simple mockless check for settings updates
        subAgentContext = `[Action Result]: Please advise the customer to manually modify their configurations visually in the /settings dashboard.`;
    }

    return subAgentContext;
}

// 2. Chat Agent Conversational Assistant
// Expected body: { messages: [{...}], language: 'English', token: 'jwt...', contextData: {...} }
app.post('/api/ai/chat', async (req, res) => {
    try {
        // Support both Customer messages and Pillar prompt format
        const { prompt, route = '/', messages, language = 'English', catalogContext = 'No services available.', token, contextData = {} } = req.body;

        if (prompt !== undefined) {
            // --- PILLAR PORTAL AI HANDLER ---
            const authoritativeSystemPrompt = `You are CoopBot, the official 24/7 AI mascot and guide for the COOP HUB Pillar Portal.
The user is currently viewing the ${route} page.
Rules:
1. Provide helpful, polite, and practical guidance for service technicians and technicians joining the platform.
2. NEVER generate, suggest, or execute arbitrary SQL queries.
3. NEVER reveal or invent private user orders, financial earnings, or account credentials.
4. Keep replies concise, clean, and well-structured.`;

            const reply = await generateAIResponse([{ role: 'user', content: prompt }], authoritativeSystemPrompt);
            res.json({
                success: true,
                text: reply,
                provider: NVIDIA_API_KEY ? 'nvidia' : 'gemini'
            });
            return;
        }

        // --- CUSTOMER PORTAL AI HANDLER ---
        // Extract latest message for Intent Router
        const latestMsg = messages[messages.length - 1]?.content || '';

        // Execute Internal Router & Controlled Tools using RLS Token
        const subAgentData = await AgentRouter(latestMsg, token, contextData);

        const systemPrompt = `You are the specific Customer AI Assistant for COOP HUB.
    Strict Rules:
    1. Reply in the requested language: ${targetLang}.
    2. Base all responses ONLY on the Provided Contexts.
    3. DO NOT invent or fabricate any services, booking IDs, timestamps, locations, or statuses.
    4. You cannot perform write actions or arbitrary SQL queries directly.
    5. Keep responses friendly, structured, and helpful.
    
    Provided Catalog Context:
    ${catalogContext}
    
    ${subAgentData !== 'NO_CONTEXT' && subAgentData !== 'GENERAL_CHAT' ? `Active Database Context (Answer the user using this real data): ${subAgentData}` : ''}`;

        const reply = await generateAIResponse(messages, systemPrompt);
        res.json({ message: reply });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to generate chat response' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend AI Relay Server running on port ${PORT}`);
});
