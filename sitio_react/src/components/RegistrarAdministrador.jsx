import React, { useState } from 'react';
import { database } from '../firebase'; // Importa la configuración de Firebase
import { ref, set } from 'firebase/database'; // Importa `ref` y `set` para interactuar con la base de datos
import '../styles/RegistrarAdministrador.css'; // Importa un archivo CSS para estilos personalizados

const RegistrarAdministrador = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Función para cerrar el mensaje de error
  const closeErrorMessage = () => {
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!username) {
      setErrorMessage('El nombre de usuario es obligatorio.');
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{5,}$/.test(password)) {
      setErrorMessage(
        'La contraseña debe tener al menos 5 caracteres, incluir letras y números.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      const adminRef = ref(database, `Administradores/${username}`); // Referencia a la base de datos
      await set(adminRef, {
        clave: password,
        email: 'admin@walkee.cl',
      });

      // Mensaje de éxito
      setSuccessMessage(`Administrador "${username}" registrado con éxito.`);
      setErrorMessage('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error al registrar administrador:', error);
      setErrorMessage('Hubo un error al registrar el administrador. Intenta nuevamente.');
    }
  };

  return (
    <div className="registrar-admin-container">
      <form onSubmit={handleSubmit} className="registrar-admin-form">
        {errorMessage && (
          <div className="error-message">
            <span>{errorMessage}</span>
            <button className="close-button" onClick={closeErrorMessage}>&times;</button>
          </div>
        )}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <div className="form-group">
          <label htmlFor="username">Nombre de Usuario:</label>
          <input
            type="text"
            id="username"
            placeholder="Escribe tu primer nombre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Mínimo 5 caracteres, incluye letras y números"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirma tu contraseña"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value="admin@walkee.cl"
            readOnly
            style={{
              backgroundColor: '#f9f9f9', // Color de fondo gris claro
              border: 'none', // Sin borde
              color: '#333', // Color del texto
            }}
          />
        </div>
        <button type="submit" className="registrar-admin-button">Registrar</button>
      </form>
    </div>
  );
};

export default RegistrarAdministrador;

