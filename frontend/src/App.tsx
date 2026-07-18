import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes';
import { ToastProvider } from './utils/ToastContext';
import { SettingsProvider } from './utils/SettingsContext';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
