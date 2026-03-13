import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Shelie's
        "blush-light": "#FFF0F5",
        blush: "#FFCBE9",
        rosa: "#FF70BA",
        fucsia: "#D93879",
        vino: "#5E0B2B",
        // Complementarios
        dorado: "#C9A46A",
        crema: "#FAF7F4",
        carbon: "#121212",
        humo: "#6B6B6B",
        // Legacy (mantener para compatibilidad hasta migrar todo)
        "rosa-nude": "#FFCBE9",
        "rosa-light": "#FFF0F5",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.10)",
      },
      backgroundImage: {
        "hero-glossy":
          "linear-gradient(135deg, #FFF0F5 0%, #FFCBE9 50%, #FF70BA 100%)",
        "cta-gradient":
          "linear-gradient(135deg, #D93879 0%, #5E0B2B 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
