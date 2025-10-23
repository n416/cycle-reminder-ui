import React, { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// 各Reducerを個別にインポートする代わりに、まとまったrootReducerをインポートする
import { rootReducer } from '@/app/store';

function render(
  ui: ReactElement,
  {
    preloadedState = {},
    // configureStoreの呼び出しをシンプル化
    store = configureStore({ reducer: rootReducer, preloadedState }),
    route = '/',
    path = '/',
    ...renderOptions
  }: any = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render };