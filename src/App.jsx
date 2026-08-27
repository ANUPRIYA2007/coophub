import { useState, useCallback } from 'react';
import AppRoutes from './routes/AppRoutes';
import SplashScreen from './components/common/SplashScreen';
import GlobalHeroAgent from './components/ai/GlobalHeroAgent';
import ChatAgent from './components/ai/ChatAgent';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-navy-800">
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            {!showSplash && (
                <>
                    <GlobalHeroAgent />
                    <ChatAgent />
                    <AppRoutes />
                </>
            )}
        </div>
    );
}
