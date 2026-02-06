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
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",

                // Nova Paleta Sólida e Definida
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
                sidebar: '#0e1721', // Escuro Médio (Sidebar)
                app: {
                    dark: '#08090a',   // Muito escuro (Fundo Profundo)
                    cardDark: '#161b22', // Contraste Sutil com o Fundo Dark (Um pouco mais claro que 08090a)
                    light: '#e8eeef',  // Claro (Fundo Geral)
                    cardLight: '#ffffff' // Branco Puro (Contraste com o e8eeef)
                },
                success: {
                    DEFAULT: '#00c474',
                    50: '#e5f9f1',
                    100: '#ccf3e3',
                    500: '#00c474',
                    600: '#009d5d',
                    700: '#007646'
                },
                danger: {
                    DEFAULT: '#ff4545',
                    50: '#ffefef',
                    100: '#ffdfdf',
                    500: '#ff4545',
                    600: '#cc3737',
                    700: '#992929'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        }
    },
    plugins: [],
}
