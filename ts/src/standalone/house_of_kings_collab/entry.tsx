import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/house_of_kings_collab/App';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={null as any} />);
}
