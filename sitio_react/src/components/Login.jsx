import React, { useState } from 'react';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  const [usu, setUsu] = useState("");
  const [pas, setPas] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Estado para errores
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const closeErrorMessage = () => {
    setErrorMessage(""); // Limpia el mensaje de error
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Limpia cualquier error previo

    try {
      const userRef = ref(database, `Administradores/${usu}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const adminData = snapshot.val();

        if (adminData.clave === pas) {
          localStorage.setItem("usuarioAutenticado", JSON.stringify({ usu }));
          onLogin(usu);
        } else {
          setErrorMessage("Contraseña incorrecta");
          setPas("");
        }
      } else {
        setErrorMessage("Usuario no encontrado");
        setUsu("");
        setPas("");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMessage("Hubo un problema al iniciar sesión. Intenta de nuevo.");
    }
  };

  return (
    <div className="body-login">
      <div className="container-login">
        <form id="form_login" onSubmit={iniciarSesion}>
          <img src={require("../images/logowalkee.jpg")} alt="Logo Walkee" className="logo-login" />
          <h1 className="h1-login">INICIO DE SESIÓN ADMINISTRADOR</h1>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
              <span className="close-error" onClick={closeErrorMessage}>&times;</span>
            </div>
          )}

          <div>
            <label htmlFor="txtusu">NOMBRE DE USUARIO</label>
            <input
              type="text"
              id="txtusu"
              className="form-control-login"
              value={usu}
              onChange={(e) => setUsu(e.target.value)}
              required
            />
          </div>
          <div className="password-container">
            <label htmlFor="txtpas">CONTRASEÑA</label>
            <input
              type={showPassword ? "text" : "password"}
              id="txtpas"
              className="form-control-login"
              value={pas}
              onChange={(e) => setPas(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={togglePasswordVisibility}>
              <i className={`bi ${showPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
            </span>
          </div>
          <input type="submit" className="btn-primary" value="Iniciar Sesión" />
        </form>
      </div>
    </div>
  );
};

export default Login;
