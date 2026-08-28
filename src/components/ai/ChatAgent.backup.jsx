import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX, ArrowRight } from 'lucide-react';

export default function ChatAgentBackup({ contextData }) {
    const { t, language } = useTranslation();
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const messagesEndRef = useRef(null);

    // Listen for custom event to open customer chat (from hero bubble or other triggers)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-customer-chat', handleOpen);
        return () => window.removeEventListener('open-customer-chat', handleOpen);
    }, []);

    // Initial greeting based on language
    useEffect(() => {
        const greetings = {
            ta: 'வணக்கம்! நான் உங்கள் CoopBot AI உதவியாளர். சேவைகளைத் தேட, உங்கள் கோரிக்கைகளைக் கண்காணிக்க அல்லது உதவி பெற என்னிடம் கேட்கலாம்.',
            hi: 'नमस्ते! मैं आपका CoopBot AI सहायक हूँ। सेवाएं खोजने, अनुरोध ट्रैक करने या सहायता के लिए मुझसे पूछें।',
            te: 'నమస్కారం! నేను మీ CoopBot AI సహాయకుడిని. సేవలను శోధించడానికి లేదా మీ అభ్యర్థనలను ట్రాక్ చేయడానికి నన్ను అడగండి.',
            kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ CoopBot AI ಸಹಾಯಕ. ಸೇವೆಗಳನ್ನು ಹುಡುಕಲು ಅಥವಾ ನಿಮ್ಮ ವಿನಂತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನನ್ನನ್ನು ಕೇಳಿ.',
            en: 'Hello! I am CoopBot, your 24/7 AI Customer Assistant. Ask me about booking home services, tracking requests, pricing, or support.'
        };

        setMessages([
            {
                id: 'welcome-1',
                role: 'assistant',
                content: greetings[language] || greetings.en,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    }, [language]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Native Speech Synthesis (TTS Voice output)
    const speakText = (text, msgId) => {
        if (!('speechSynthesis' in window)) {
            alert('Text-to-speech is not supported in this browser.');
        }
        if (speakingMsgId === msgId) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langCodeMap = {
            ta: 'ta-IN',
            hi: 'hi-IN',
            te: 'te-IN',
            kn: 'kn-IN',
            en: 'en-US'
        };
        utterance.lang = langCodeMap[language] || 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        utterance.onstart = () => setSpeakingMsgId(msgId);
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);

        window.speechSynthesis.speak(utterance);
    };

    // Speech-To-Text (Voice input)
    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            const langCodeMap = {
                ta: 'ta-IN',
                hi: 'hi-IN',
                te: 'te-IN',
                kn: 'kn-IN',
                en: 'en-US'
            };
            recognition.lang = langCodeMap[language] || 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInput(transcript);
                }
            };

            recognition.start();
        } catch (err) {
            console.error('STT error:', err);
            setIsListening(false);
        }
    };

    return null; // Backup component
}
