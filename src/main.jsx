import './styles/fonts.scss';
import 'normalize.css';
import './styles/global.scss';

import { Provider } from './components/ui/provider.jsx';
import { Provider as ReduxProvider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from './App.jsx';
import store from './redux/store/store.js';

createRoot(document.getElementById('root')).render(
  <ReduxProvider store={store}>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </ReduxProvider>,
);
