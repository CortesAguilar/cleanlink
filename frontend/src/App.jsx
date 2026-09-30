import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [api, setApi] = useState('Consultando...');
  const [db, setDb] = useState('Consultando...');

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApi(data.status === 'ok' ? 'Conectada' : 'Con errores'))
      .catch(() => setApi('Sin conexión'));

    fetch(`${API_URL}/api/db-health`)
      .then((res) => res.json())
      .then((data) => setDb(data.database === 'connected' ? 'Conectada' : 'Con errores'))
      .catch(() => setDb('Sin conexión'));
  }, []);

  return (
    <main style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>CleanLink</h1>
      <p>Plataforma que conecta empresas con proveedores de limpieza.</p>
      <p>Prueba de commit 7:10 pm.</p>
      <p>API: {api}</p>
      <p>Base de datos: {db}</p>
    </main>
  );
}

export default App;