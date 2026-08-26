import { useState, useCallback } from 'react';
import AppRoutes from './routes/AppRoutes';
import SplashScreen from './components/common/SplashScreen';

export default function App() {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-navy-800">
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            {!showSplash && <AppRoutes />}
        </div>
    );
}
