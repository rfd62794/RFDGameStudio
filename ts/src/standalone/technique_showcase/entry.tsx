import ReactDOM from 'react-dom/client';
import TechniqueShowcase from './TechniqueShowcase';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<TechniqueShowcase />);
}
