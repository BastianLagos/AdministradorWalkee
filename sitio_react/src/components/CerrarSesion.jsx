import React, { useState } from 'react';
import Modal from 'react-modal';
import '../styles/CerrarSesion.css'; // Archivo CSS para estilos personalizados

const CerrarSesionModal = ({ onLogout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal

  const handleLogout = () => {
    localStorage.removeItem("usuarioAutenticado"); // Limpia el estado de sesión
    onLogout(); // Ejecuta el cierre de sesión
    setIsModalOpen(false); // Cierra el modal
  };

  return (
    <div>
      {/* Botón que abre el modal */}
      <button 
        className="menu-admin-logout-button"
        onClick={() => setIsModalOpen(true)}
      >
        Cerrar Sesión
      </button>

      {/* Modal de confirmación */}
      <Modal 
        isOpen={isModalOpen} 
        onRequestClose={() => setIsModalOpen(false)} 
        className="custom-modal"
        overlayClassName="custom-modal-overlay"
      >
        <div className="modal-content">
          <h2 className="modal-title">Cerrar Sesión</h2>
          <p className="modal-message">¿Estás seguro de que deseas cerrar sesión?</p>
          <div className="modal-buttons">
            <button 
              className="modal-button cancel"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button 
              className="modal-button confirm"
              onClick={handleLogout}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CerrarSesionModal;
