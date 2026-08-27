import { Link } from 'react-router-dom';
import coopHubLogo from '../assets/branding/coop-hub-logo.png';

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-navy-50 via-white to-orange-50">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-navy-500/5 blur-3xl pointer-events-none" />

            <div className="relative text-center px-6">
                <img
                    src={coopHubLogo}
                    alt="COOP HUB Logo"
                    className="w-44 sm:w-56 h-auto mx-auto mb-8"
                />
                <p className="text-sm tracking-[0.3em] text-navy-400 font-medium uppercase mb-10">
                    Connect &nbsp;|&nbsp; Serve &nbsp;|&nbsp; Empower
                </p>
                <Link to="/login" className="btn-primary text-base px-10 py-4 shadow-lg shadow-orange-500/20">
                    Get Started
                </Link>
            </div>
        </div>
    );
}
