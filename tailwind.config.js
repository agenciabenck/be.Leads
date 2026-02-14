export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",

                // Reference Design Colors
                primary: {
                    DEFAULT: '#0068ff',
                    50: '#e5f0ff',
                    100: '#cce0ff',
                    200: '#99c2ff',
                    300: '#66a3ff',
                    400: '#3385ff',
                    500: '#0068ff',
                    600: '#0054cc',
                    700: '#003f99',
                    800: '#002a66',
                    900: '#001533',
                    950: '#000b1a',
                },
                sidebar: {
                    DEFAULT: '#1d2838',      // Main sidebar background
                    plan: '#0d1828',         // Plan card background
                    logout: '#0a0b0c',       // Logout section background
                },
                text: {
                    light: '#faffff',        // Primary light text
                    secondary: '#959fa3',    // Secondary text/icons
                },
                app: {
                    dark: '#08090a',         // Dark theme background
                    cardDark: '#161b22',     // Dark theme cards
                    light: '#e8eeef',        // Light theme background
                    cardLight: '#ffffff'     // Light theme cards
                },
                success: {
                    DEFAULT: '#079160',      // Reference green
                    50: '#e5f9f1',
                    100: '#ccf3e3',
                    500: '#079160',
                    600: '#06754d',
                    700: '#05593a'
                },
                danger: {
                    DEFAULT: '#ff4545',
                    50: '#ffefef',
                    100: '#ffdfdf',
                    600: '#cc3737',
                    700: '#992929'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            }
        }
    },
    plugins: [],
}
