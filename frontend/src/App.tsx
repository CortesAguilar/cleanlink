import { AdminView } from './components/admin-view';
import { FeedView } from './components/feed-view';
import { LandingView } from './components/landing-view';
import { LoginView } from './components/login-view';
import { ResultsView } from './components/results-view';
import { TenantDashboardView } from './components/tenant-dashboard-view';
import { TenantSignupView } from './components/tenant-signup-view';
import { VerifyEmailView } from './components/verify-email-view';

// Selección temporal de vista por URL hasta que agreguemos el enrutador:
// /feed es la pantalla principal con sesión, /resultados la búsqueda; cualquier otra ruta, la landing.
// /login, /registro/proveedor (alta de tenant), /mi-negocio (gestión del tenant), /verificar (enlace del correo)
// y /admin (admin de plataforma) son de la demo multi-tenant.
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
    case '/verificar':
      return <VerifyEmailView />;
    case '/admin':
      return <AdminView />;
    default:
      return <LandingView />;
  }
}

export default App;
