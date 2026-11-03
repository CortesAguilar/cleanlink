import { FeedView } from './components/feed-view';
import { LandingView } from './components/landing-view';
import { LoginView } from './components/login-view';
import { ResultsView } from './components/results-view';
import { TenantDashboardView } from './components/tenant-dashboard-view';
import { TenantSignupView } from './components/tenant-signup-view';

// Selección temporal de vista por URL hasta que agreguemos el enrutador:
// /feed es la pantalla principal con sesión, /resultados la búsqueda; cualquier otra ruta, la landing.
// /login, /registro/proveedor (alta de tenant) y /mi-negocio (gestión del tenant) son de la demo multi-tenant.
function App() {
  switch (window.location.pathname) {
    case '/feed':
      return <FeedView />;
    case '/resultados':
      return <ResultsView />;
    case '/login':
      return <LoginView />;
    case '/registro/proveedor':
      return <TenantSignupView />;
    case '/mi-negocio':
      return <TenantDashboardView />;
    default:
      return <LandingView />;
  }
}

export default App;
