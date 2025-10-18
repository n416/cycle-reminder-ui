import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './app/store.ts';
import { BrowserRouter } from 'react-router-dom';
import { ThemeRegistry } from './components/ThemeRegistry.tsx';
import { setupInterceptors } from './api/client.ts'; // ★ インポート名を変更

setupInterceptors(store); // ★ 関数名を変更

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeRegistry>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeRegistry>
    </Provider>
  </React.StrictMode>,
);