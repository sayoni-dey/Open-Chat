// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export const darkMode = 'class';
export const content = [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Add any other paths where your components live
];
export const theme = {
    extend: {},
};
export const plugins = [];