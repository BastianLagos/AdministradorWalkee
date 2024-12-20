import React, { useState, useEffect, useRef } from 'react'; 
import Modal from 'react-modal';
import { database } from '../firebase';
import { ref, onValue, off, set, update } from 'firebase/database';
import '../styles/BuzonPropietario.css';

const BuzonPropietario = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPropietario, setSelectedPropietario] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [propietarios, setPropietarios] = useState([]);
  
  const mensajesEndRef = useRef(null);

  useEffect(() => {
    const mensajesRef = ref(database, 'Mensajeria');
    const propietariosArray = [];
  
    const unsubscribe = onValue(mensajesRef, (snapshotMensajes) => {
      const mensajesData = snapshotMensajes.val();
      if (mensajesData) {
        propietariosArray.length = 0;
  
        const clientesPromises = Object.keys(mensajesData).map((rut) =>
          new Promise((resolve) => {
            const clienteRef = ref(database, `Clientes/${rut}`);
  
            const clienteListener = onValue(
              clienteRef,
              (snapshotCliente) => {
                const clienteData = snapshotCliente.val();
                if (clienteData && clienteData.categoria === "Dueno") {
                  const mensajes = mensajesData[rut];

                  const mensajesOrdenados = Object.keys(mensajes)
                    .map((key) => {
                      const fechaHoraString = `${key.split('_')[1]} ${key.split('_')[2]?.replace(/-/g, ':')}`;
                      const [datePart, timePart] = fechaHoraString.split(' ');
                      const [day, month, year] = datePart.split('-').map(Number);
                      const [hours, minutes, seconds] = timePart.split(':').map(Number);
                      const timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();
                      
                      return {
                        id: key,
                        contenido: mensajes[key]?.contenido || "Mensaje no disponible",
                        timestamp,
                        leido: mensajes[key]?.leido || false,
                      };
                    })
                    .sort((a, b) => b.timestamp - a.timestamp); // Orden descendente por timestamp

                  const ultimoMensaje = mensajesOrdenados[0];

                  propietariosArray.push({
                    id: rut,
                    nombre: clienteData.nombres || "Nombre no disponible",
                    email: clienteData.email || "Correo no disponible",
                    avatarUrl: clienteData.profileImageUrl || 'https://via.placeholder.com/50',
                    ultimoMensaje: ultimoMensaje?.contenido || "Mensaje no disponible",
                    hora: new Date(ultimoMensaje?.timestamp).toLocaleString('es-CL'),
                    tieneNuevoMensaje: mensajesOrdenados.some((msg) => !msg.leido),
                    timestamp: ultimoMensaje?.timestamp || 0,
                  });
                }
                resolve();
              },
              { onlyOnce: true }
            );
  
            return () => off(clienteRef, clienteListener);
          })
        );
  
        Promise.all(clientesPromises).then(() => {
          propietariosArray.sort((a, b) => b.timestamp - a.timestamp); // Ordenar propietarios por último mensaje
          setPropietarios([...propietariosArray]);
        });
      } else {
        setPropietarios([]);
      }
    });
  
    return () => off(mensajesRef, unsubscribe);
  }, []);  

  const openModal = async (propietario) => {
    setSelectedPropietario(propietario);
    setModalIsOpen(true);
  
    const mensajesRef = ref(database, `Mensajeria/${propietario.id}`);
    const snapshot = await new Promise((resolve) => {
      onValue(mensajesRef, resolve, { onlyOnce: true });
    });
  
    const mensajesData = snapshot.val();
    if (mensajesData) {
      const mensajesArray = Object.keys(mensajesData)
        .map((key) => {
          const fechaHoraString = `${key.split('_')[1]} ${key.split('_')[2]?.replace(/-/g, ':')}`;
          const [datePart, timePart] = fechaHoraString.split(' ');
          const [day, month, year] = datePart.split('-').map(Number);
          const [hours, minutes, seconds] = timePart.split(':').map(Number);
          const timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();

          return {
            id: key,
            timestamp,
            ...mensajesData[key],
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp); // Ordenar cronológicamente por timestamp
      setMensajes(mensajesArray);

      const updates = {};
      Object.keys(mensajesData).forEach((key) => {
        updates[`${key}/leido`] = true;
      });
      await update(ref(database, `Mensajeria/${propietario.id}`), updates);
    }
  };  

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedPropietario(null);
    setMensajes([]);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}:${minutes}:${seconds}`;
  };

  const sendMensaje = () => {
    if (nuevoMensaje.trim() !== "" && selectedPropietario) {
      const rut = selectedPropietario.id;
      const now = new Date();
      const fechaHora = formatDate(now);
      const mensajeId = `${rut}_${fechaHora}`;

      const mensajesRef = ref(database, `Mensajeria/${rut}/${mensajeId}`);
      const nuevoMensajeObj = {
        contenido: nuevoMensaje,
        de: "admin@walkee.cl",
        para: selectedPropietario.nombre,
        leido: true,
      };

      set(mensajesRef, nuevoMensajeObj)
        .then(() => {
          setMensajes((prevMensajes) => [
            ...prevMensajes,
            { id: mensajeId, timestamp: now.getTime(), ...nuevoMensajeObj },
          ]);
          setNuevoMensaje("");
        })
        .catch((error) => {
          console.error("Error al enviar el mensaje:", error);
        });
    }
  };

  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  return (
    <div className="buzon-propietario">
      <ul className="lista-propietarios">
        {propietarios.length > 0 ? (
          propietarios.map((propietario, index) => (
            <li
              key={index}
              onClick={() => openModal(propietario)}
              className={`propietario-item ${propietario.tieneNuevoMensaje ? "pendiente" : ""}`}
            >
              <img src={propietario.avatarUrl} alt={propietario.nombre} className="avatar-small" />
              <div className="info">
                <h3>{propietario.nombre}</h3>
                <p>{propietario.email}</p>
                <p>{propietario.ultimoMensaje}</p>
                <span className="hora">{propietario.hora}</span>
              </div>
            </li>
          ))
        ) : (
          <p>No hay propietarios con mensajes</p>
        )}
      </ul>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Chat Modal"
        className="chat-modal"
      >
        {selectedPropietario && (
          <div className="chat-container">
            <div className="modal-header">
              <h2>Chat con {selectedPropietario.nombre}</h2>
              <button className="close-button" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="chat-mensajes">
              {mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`mensaje ${mensaje.de === "admin@walkee.cl" ? "enviado" : "recibido"}`}
                >
                  <p>{mensaje.contenido}</p>
                  <span className="fecha-mensaje">
                    {mensaje.id.split('_')[1]} {mensaje.id.split('_')[2]?.replace(/-/g, ":")}
                  </span>
                </div>
              ))}
              <div ref={mensajesEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
              />
              <button onClick={sendMensaje}>Enviar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BuzonPropietario;

