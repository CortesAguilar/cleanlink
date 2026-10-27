import { FeedView } from './components/feed-view';
import { LandingView } from './components/landing-view';
import { ResultsView } from './components/results-view';

// Selección temporal de vista por URL hasta que agreguemos el enrutador:
// /feed es la pantalla principal con sesión, /resultados la búsqueda; cualquier otra ruta, la landing.
function App() {
  switch (window.location.pathname) {
    case '/feed':
      return <FeedView />;
    case '/resultados':
      return <ResultsView />;
    default:
      return <LandingView />;
  }
}

export default App;
