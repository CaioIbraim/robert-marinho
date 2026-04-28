import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import { HelmetProvider } from 'react-helmet-async';


const queryClient = new QueryClient();

const VERSION = '1.0.1-' + Date.now();
console.log('Main: Version', VERSION);
console.log('Main: Attempting to mount React...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Main: FATAL - Root element #root not found!');
  document.body.innerHTML = '<h1 style="color: red">FATAL: Root element missing!</h1>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>
    );
    console.log('Main: Render successful');
  } catch (err) {
    console.error('Main: Render error', err);
    rootElement.innerHTML = '<h1 style="color: red">Render Error: ' + err + '</h1>';
  }
}
