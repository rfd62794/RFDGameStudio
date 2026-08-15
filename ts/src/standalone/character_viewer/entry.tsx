import ReactDOM from 'react-dom/client';
import '../../index.css';
import './styles.css';
import CharacterViewer from './CharacterViewer';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<CharacterViewer />);
}
