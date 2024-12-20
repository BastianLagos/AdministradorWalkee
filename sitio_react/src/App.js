import React, { useState, useEffect } from 'react';
import Login from './components/Login'; // Ajusta la ruta según sea necesario
import MenuAdmin from './components/MenuAdmin'; // Ajusta la ruta según sea necesario

function App() {
  // Inicializa el estado de autenticación leyendo `localStorage`
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("usuarioAutenticado"));
  const [user, setUser] = useState(localStorage.getItem("usuarioAutenticado") || '');

  // Función para manejar el inicio de sesión exitoso
  const handleLogin = (username) => {
    setIsAuthenticated(true);
    setUser(username);
    localStorage.setItem("usuarioAutenticado", username); // Guarda el usuario en `localStorage`
  };

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser('');
    localStorage.removeItem("usuarioAutenticado"); // Limpia el `localStorage`
  };

  return (
    <div>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <MenuAdmin usu={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

