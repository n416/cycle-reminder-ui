import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './app/store.ts';
import { BrowserRouter } from 'react-router-dom';
import { ThemeRegistry } from './components/ThemeRegistry.tsx';
import { setupErrorInterceptors } from './api/client.ts'; // ★ インポート

setupErrorInterceptors(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* 2. ThemeProviderの代わりにThemeRegistryでラップする */}
      <ThemeRegistry>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeRegistry>
    </Provider>
  </React.StrictMode>,
);