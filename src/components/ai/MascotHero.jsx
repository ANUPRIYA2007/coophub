import { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export default function MascotHero({ customerName = 'Guest', currentRoute = '/home', activeBookingsCount = 0 }) {
    const { language } = useTranslation();
    const [greeting, setGreeting] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMascotGreeting = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:3000/api/ai/mascot-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customerName, currentRoute, activeBookingsCount, language })
                });
                const data = await res.json();

                if (res.ok && data.message) {
                    setGreeting(data.message);
                } else {
                    setGreeting('Hello! How can I help you today?'); // Fallback
                }
            } catch (err) {
                console.error('Failed to get mascot greeting:', err);
                setGreeting('Welcome to COOP HUB!'); // Fallback if server is not running
            } finally {
                setLoading(false);
            }
        };

        fetchMascotGreeting();
    }, [customerName, currentRoute, activeBookingsCount, language]);

    return (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-navy-900 to-navy-700 shadow-xl p-6 sm:p-8 flex items-center justify-between mb-8 mt-4 isolate">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="relative z-10 max-w-[60%] sm:max-w-md my-auto">
                {/* Speech Bubble */}
                <div className="relative bg-white text-navy-800 rounded-2xl rounded-bl-sm p-4 shadow-lg mb-2 text-sm sm:text-base">
                    {loading ? (
                        <div className="flex space-x-1 items-center h-5">
                            <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    ) : (
                        <p className="font-medium animate-fade-in">{greeting}</p>
                    )}
                </div>
            </div>

            <div className="relative z-10 w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0 animate-float ml-4 bg-white/10 rounded-full border-4 border-white/20 p-2 shadow-2xl">
                <img
                    src="/src/assets/branding/mascot-ai.jpg"
                    alt="COOP HUB Mascot"
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
        </div>
    );
}
