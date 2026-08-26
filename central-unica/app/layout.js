import { Taviraj, Readex_Pro } from 'next/font/google';
import './globals.css';

const display = Taviraj({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
});

const body = Readex_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Central Única · Loretto Scarpa',
  description: 'A central de operações da Loretto Scarpa: vendas, estoque, financeiro e marketing em um só lugar.',
};

// Aplica o tema salvo antes da primeira pintura, para não piscar claro→escuro.
const themeInit = `try{var t=localStorage.getItem('cu_tema');if(t==='escuro')document.documentElement.dataset.theme='escuro'}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
