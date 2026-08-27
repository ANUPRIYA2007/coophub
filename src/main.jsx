import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider as PillarLanguageProvider } from './i18n/LanguageContext';
import { LanguageProvider as CustomerLanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';

// Styles
import './styles/variables.css';
import './styles/global.css';
import './styles/hero-animations.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CustomerLanguageProvider>
        <PillarLanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PillarLanguageProvider>
      </CustomerLanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
