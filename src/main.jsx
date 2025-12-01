import './styles/fonts.scss';
import 'normalize.css';
import './styles/global.scss';

// import { createSystem, defaultConfig } from '@chakra-ui/react';
import { Provider } from './components/ui/provider.jsx';

import { createRoot } from 'react-dom/client';

import App from './App.jsx';

// export const system = createSystem(defaultConfig, {
//   theme: {
//     tokens: {
//       fonts: {
//         heading: { value: `'SF-Pro-Display-Regular', sans-serif` },
//         body: { value: `'SF-Pro-Display-Regular', sans-serif` },
//       },
//     },
//   },
// });

createRoot(document.getElementById('root')).render(
  <Provider>
    <App />
  </Provider>,
);
