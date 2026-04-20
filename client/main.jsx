import 'meteor-node-stubs';
import { createRoot } from 'react-dom/client';
import './main.css';
import { App } from '../imports/ui/App';

createRoot(document.getElementById('app')).render(<App />);
