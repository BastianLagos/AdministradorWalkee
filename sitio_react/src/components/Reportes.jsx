import React, { useState, useEffect } from 'react';
import { database } from '../firebase'; // Conexión a Firebase
import { ref, onValue } from 'firebase/database';
import DatePicker from 'react-datepicker'; // Selector de fechas
import 'react-datepicker/dist/react-datepicker.css'; // Estilos del selector de fechas
import Modal from 'react-modal'; // Modal para comentarios y evaluación
import '../styles/Reportes.css'; // Estilos personalizados
import StarRating from './StarRating';


// Configuración del elemento raíz para React Modal
Modal.setAppElement('#root');

const Reportes = () => {
  const [reportes, setReportes] = useState([]); // Solicitudes filtradas por estado
  const [filteredReportes, setFilteredReportes] = useState([]); // Reportes filtrados por fecha o búsqueda
  const [selectedDate, setSelectedDate] = useState(null); // Fecha seleccionada para el filtro
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda por RUT, correo o nombres
  const [loading, setLoading] = useState(true); // Indicar si los datos están cargando
  const [clientes, setClientes] = useState({}); // Información de paseadores y dueños
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false); // Estado del modal de comentarios
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false); // Estado del modal de evaluación
  const [selectedComments, setSelectedComments] = useState({}); // Comentarios seleccionados para mostrar
  const [selectedEvaluation, setSelectedEvaluation] = useState(0); // Evaluación seleccionada para el modal
  const [selectedState, setSelectedState] = useState(''); // Estado seleccionado para el filtro
  const [evaluaciones, setEvaluaciones] = useState({});
  const [detailedEvaluation, setDetailedEvaluation] = useState({
    dueno: null,
    mascotas: [],
    paseador: null,
  });
  

  useEffect(() => {
    const solicitudesRef = ref(database, 'Solicitudes');
    const clientesRef = ref(database, 'Clientes');
    const evaluacionesRef = ref(database, 'Evaluaciones'); // Referencia a Evaluaciones
  
    const unsubscribeSolicitudes = onValue(solicitudesRef, (snapshot) => {
      const data = snapshot.val();
      const filtradas = [];
  
      if (data) {
        Object.entries(data).forEach(([id, solicitud]) => {
          if (solicitud.estado === 'terminada' || solicitud.estado === 'abortada') {
            filtradas.push({
              id,
              ...solicitud,
            });
          }
        });
  
        filtradas.sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`));
      }
  
      setReportes(filtradas);
      setFilteredReportes(filtradas);
      setLoading(false);
    });
  
    const unsubscribeClientes = onValue(clientesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setClientes(data);
      }
    });
  
    // Cargar evaluaciones
    const unsubscribeEvaluaciones = onValue(evaluacionesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Guardar evaluaciones para su uso
        setEvaluaciones(data);
      }
    });
  
    return () => {
      unsubscribeSolicitudes();
      unsubscribeClientes();
      unsubscribeEvaluaciones();
    };
  }, []);
  
  const getCombinedScore = (evaluaciones, duenoRut, paseadorRut, solicitudId) => {
    let duenoScore = 0;
    let paseadorScore = 0;
  
    if (evaluaciones?.Duenos?.[duenoRut]?.[solicitudId]) {
      duenoScore = evaluaciones.Duenos[duenoRut][solicitudId];
    }
  
    if (evaluaciones?.Paseadores?.[paseadorRut]?.[solicitudId]) {
      paseadorScore = evaluaciones.Paseadores[paseadorRut][solicitudId];
    }
  
    return duenoScore + paseadorScore;
  };

  const getColorFromScore = (score) => {
    if (score === 0 || score === null || score === undefined) {
      return "#FFFFFF"; // Color blanco para la estrella sin evaluaciones
    }
    if (score >= 10) {
      return "#FFFF00"; // Amarillo fluorescente
    }
    if (score >= 7) {
      return "#FFA500"; // Naranja
    }
    return "#FF0000"; // Rojo para calificaciones bajas
  };
  
  

  // Función para cambiar el formato de fecha
const formatDate = (date) => {
  if (!date) return ""; // Devuelve vacío si no hay fecha
  const [year, month, day] = date.split("-"); // Divide la fecha en partes
  return `${day}-${month}-${year}`; // Reorganiza las partes
};

  const applyFilters = () => {
    let filtered = [...reportes];
  
    // Filtrar por fecha
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter((reporte) => reporte.fecha === formattedDate);
    }
  
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((reporte) => {
        const paseador = clientes[reporte.paseadorRut];
        const dueno = clientes[reporte.duenoRut];
        return (
          (paseador &&
            (paseador.nombres.toLowerCase().includes(searchTerm) ||
              paseador.email.toLowerCase().includes(searchTerm) ||
              reporte.paseadorRut.includes(searchTerm))) ||
          (dueno &&
            (dueno.nombres.toLowerCase().includes(searchTerm) ||
              dueno.email.toLowerCase().includes(searchTerm) ||
              reporte.duenoRut.includes(searchTerm)))
        );
      });
    }
  
    // Filtrar por estado
    if (selectedState) {
      filtered = filtered.filter((reporte) => reporte.estado === selectedState);
    }
  
    setFilteredReportes(filtered);
  };  

  useEffect(() => {
    applyFilters();
  }, [selectedDate, searchTerm, selectedState, reportes, clientes]);  

  // Cargar evaluaciones
  const loadDetailedEvaluation = (solicitudId, duenoRut, paseadorRut, mascotasIds) => {
    const evaluacionesRef = ref(database, 'Evaluaciones');
    const mascotasRef = ref(database, 'Mascotas'); // Referencia al nodo de mascotas
    const evaluationData = {
      dueno: null,
      mascotas: [],
      paseador: null,
    };

    onValue(evaluacionesRef, (snapshot) => {
      const evaluaciones = snapshot.val();

      // Evaluación del dueño
      if (evaluaciones.Duenos[duenoRut] && evaluaciones.Duenos[duenoRut][solicitudId]) {
        evaluationData.dueno = evaluaciones.Duenos[duenoRut][solicitudId];
      }

      // Evaluación del paseador
      if (evaluaciones.Paseadores[paseadorRut] && evaluaciones.Paseadores[paseadorRut][solicitudId]) {
        evaluationData.paseador = evaluaciones.Paseadores[paseadorRut][solicitudId];
      }

      // Obtener evaluaciones y nombres de las mascotas
      onValue(mascotasRef, (snapshot) => {
        const mascotasData = snapshot.val();

        mascotasIds.forEach((mascotaId) => {
          if (evaluaciones.Mascotas[mascotaId] && evaluaciones.Mascotas[mascotaId][solicitudId]) {
            const nombreMascota = mascotasData[mascotaId]?.nomMasc || `Mascota ${mascotaId}`;
            evaluationData.mascotas.push({
              id: mascotaId,
              nombre: nombreMascota,
              evaluacion: evaluaciones.Mascotas[mascotaId][solicitudId],
            });
          }
        });

        // Actualizar el estado y abrir el modal
        setDetailedEvaluation(evaluationData);
        setIsRatingModalOpen(true);
      });
    });
  };

  // Función para filtrar reportes por la fecha seleccionada
  const handleDateFilter = (date) => {
    setSelectedDate(date); // Actualiza la fecha seleccionada
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      const filtered = reportes.filter((reporte) => reporte.fecha === formattedDate);
      setFilteredReportes(filtered); // Actualiza la lista con los reportes filtrados
    } else {
      setFilteredReportes(reportes); // Muestra todos los reportes si no hay fecha seleccionada
    }
  };

  // Función para filtrar por término de búsqueda (RUT, correo o nombres)
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = reportes.filter((reporte) => {
      const paseador = clientes[reporte.paseadorRut];
      const dueno = clientes[reporte.duenoRut];
      return (
        (paseador &&
          (paseador.nombres.toLowerCase().includes(term) ||
            paseador.email.toLowerCase().includes(term) ||
            reporte.paseadorRut.includes(term))) ||
        (dueno &&
          (dueno.nombres.toLowerCase().includes(term) ||
            dueno.email.toLowerCase().includes(term) ||
            reporte.duenoRut.includes(term)))
      );
    });

    setFilteredReportes(filtered);
  };

  // Abrir modal con los comentarios
  const openCommentModal = (paseadorComments, duenoComments) => {
    const sanitizeComment = (comment) =>
      !comment || comment.toLowerCase() === 'no hay comentarios'
        ? 'Sin comentarios'
        : comment;

    setSelectedComments({
      paseador: sanitizeComment(paseadorComments),
      dueno: sanitizeComment(duenoComments),
    });
    setIsCommentModalOpen(true);
  };

  // Abrir modal con la evaluación
  const openRatingModal = (solicitudId, duenoRut, paseadorRut, mascotasIds) => {
    loadDetailedEvaluation(solicitudId, duenoRut, paseadorRut, mascotasIds);
  };
  
  // Cerrar modales
  const closeCommentModal = () => {
    setIsCommentModalOpen(false);
  };
  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
  };

  return (
    <div className="reportes-container">
      {loading ? (
        <p>Cargando reportes...</p>
      ) : (
        <>
          {/* Barra de búsqueda y selector de fecha */}
          <div className="filters-container">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateFilter}
              placeholderText="Buscar por fecha"
              dateFormat="yyyy-MM-dd"
              className="date-picker"
            />
            <input
              type="text"
              placeholder="Buscar por RUT, correo o nombres..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="state-filter"
            >
              <option value="">Filtrar por estado</option>
              <option value="terminada">Terminada</option>
              <option value="abortada">Abortada</option>
            </select>
            <button
              className="clear-date-button"
              onClick={() => {
                setSelectedDate(null);
                setSearchTerm('');
                setSelectedState(''); // Reinicia el filtro por estado
              }}              
            >
              Limpiar
            </button>
          </div>

          {/* Mensajes en caso de que no haya resultados */}
          {filteredReportes.length === 0 ? (
            <p>No hay solicitudes que coincidan con los criterios.</p>
          ) : (
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Paseador</th>
                  <th>Dueño</th>
                  <th>Mascotas</th>
                  <th>Evaluación</th>
                  <th>Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportes.map((reporte) => (
                  <tr key={reporte.id}>
                    <td>{formatDate(reporte.fecha)}</td>
                    <td>{reporte.estado === 'terminada' ? 'Terminada' : 'Abortada'}</td>
                    {/* Paseador */}
                    <td>
                      {clientes[reporte.paseadorRut] ? (
                        <div
                          className="reporte-section"
                          title={`${clientes[reporte.paseadorRut].nombres || ''} ${clientes[reporte.paseadorRut].apellidos || ''}`}
                        >
                          <img
                            src={clientes[reporte.paseadorRut].profileImageUrl || 'default-profile.jpg'}
                            alt={clientes[reporte.paseadorRut].nombres || 'Imagen del paseador'}
                            className="reporte-table-image"
                          />
                          <p><strong>RUT:</strong> {reporte.paseadorRut}</p>
                          <p>{clientes[reporte.paseadorRut].email}</p>
                        </div>
                      ) : (
                        <p>Información no disponible</p>
                      )}
                    </td>
                    {/* Dueño */}
                    <td>
                      {clientes[reporte.duenoRut] ? (
                        <div
                          className="reporte-section"
                          title={`${clientes[reporte.duenoRut].nombres || ''} ${clientes[reporte.duenoRut].apellidos || ''}`}
                        >
                          <img
                            src={clientes[reporte.duenoRut].profileImageUrl || 'default-profile.jpg'}
                            alt={clientes[reporte.duenoRut].nombres || 'Imagen del dueño'}
                            className="reporte-table-image"
                          />
                          <p><strong>RUT:</strong> {reporte.duenoRut}</p>
                          <p>{clientes[reporte.duenoRut].email}</p>
                        </div>
                      ) : (
                        <p>Información no disponible</p>
                      )}
                    </td>
                    {/* Mascotas */}
                    <td>{reporte.nombresMascotas || 'No hay información'}</td>
                    {/* Evaluación */}
                    <td>
                      {(() => {
                        const combinedScore = getCombinedScore(
                          evaluaciones, // Estado con las evaluaciones cargadas desde Firebase
                          reporte.duenoRut,
                          reporte.paseadorRut,
                          reporte.id // ID de la solicitud
                        );

                        const starColor = getColorFromScore(combinedScore); // Calcula el color dinámico

                        return (
                          <i
                            className="bi bi-star-fill evaluation-icon"
                            style={{
                              color: starColor,
                              cursor: combinedScore === 0 ? "default" : "pointer", // No interactivo si no hay evaluación
                            }}
                            onClick={() =>
                              combinedScore > 0 &&
                              openRatingModal(
                                reporte.id,
                                reporte.duenoRut,
                                reporte.paseadorRut,
                                reporte.idMascotasSeleccionadas || []
                              )
                            }
                          ></i>
                        );
                      })()}
                    </td>

                    {/* Comentarios */}
                    <td>
                      <i
                        className="bi bi-chat-dots-fill comment-icon"
                        onClick={() =>
                          openCommentModal(reporte.ComentariosPaseador, reporte.ComentariosDueno)
                        }
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Modal para mostrar los comentarios */}
          <Modal
            isOpen={isCommentModalOpen}
            onRequestClose={closeCommentModal}
            className="modern-modal"
          >
            <div className="modal-content">
              <button onClick={closeCommentModal} className="close-modal-button">
                &times;
              </button>
              <div>
                <h4>Comentarios del Paseador:</h4>
                <p>{selectedComments.paseador}</p>
              </div>
              <div>
                <h4>Comentarios del Dueño:</h4>
                <p>{selectedComments.dueno}</p>
              </div>
            </div>
          </Modal>

          {/* Modal para mostrar la evaluación */}
          <Modal
            isOpen={isRatingModalOpen}
            onRequestClose={closeRatingModal}
            className="modern-modal"
          >
            <div className="modal-content">
              <button onClick={closeRatingModal} className="close-modal-button">
                &times;
              </button>
              {/* Evaluación del dueño */}
              <div>
                <h4>Evaluación asignada al Dueño:</h4>
                {detailedEvaluation.dueno ? (
                  <StarRating rating={detailedEvaluation.dueno} />
                ) : (
                  <p>No hay datos de evaluación registrados.</p>
                )}
              </div>
              {/* Evaluaciones asignadas a las mascotas */}
              <div>
                <h4>Evaluaciones asignadas a las Mascotas:</h4>
                {detailedEvaluation.mascotas.length > 0 ? (
                  <ul className="mascotas-list">
                    {detailedEvaluation.mascotas.map((mascota) => (
                      <li key={mascota.id}>
                        <span className="mascota-nombre">{mascota.nombre}:</span>
                        <StarRating rating={mascota.evaluacion} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay datos de evaluación registrados.</p>
                )}
              </div>
              {/* Evaluación del paseador */}
              <div>
                <h4>Evaluación asignada al Paseador:</h4>
                {detailedEvaluation.paseador ? (
                  <StarRating rating={detailedEvaluation.paseador} />
                ) : (
                  <p>No hay datos de evaluación registrados.</p>
                )}
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Reportes;

