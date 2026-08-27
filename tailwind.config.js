/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Primary — Navy / Dark Blue (from logo)
                navy: {
                    50: '#f0f4f8',
                    100: '#d9e2ec',
                    200: '#bcccdc',
                    300: '#9fb3c8',
                    400: '#829ab1',
                    500: '#14243A',
                    600: '#0F1B2D',
                    700: '#0b1421',
                    800: '#080e18',
                    900: '#04070c',
                    950: '#020306',
                },
                // Accent — Orange (from logo)
                orange: {
                    50: '#fff7ed',
                    100: '#ffeed4',
                    200: '#fdd8a8',
                    300: '#fbc071',
                    400: '#f9a03c',
                    500: '#F58220',
                    600: '#E66F0D',
                    700: '#b8520b',
                    800: '#934110',
                    900: '#783711',
                    950: '#411a06',
                },
                // Neutrals for backgrounds, borders, muted text
                surface: '#F7F9FC',
                border: '#E2E8F0',
                muted: '#64748B',
            },
            borderRadius: {
                '4xl': '2rem',
            },
            animation: {
                'spl-enter': 'spl-enter 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'float': 'float 4s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                'spl-enter': {
                    '0%': { transform: 'translateY(100px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
};
