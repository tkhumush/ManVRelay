import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

// Custom font can be added here if needed
// import '@fontsource-variable/<font-name>';

createRoot(document.getElementById("root")!).render(<App />);
