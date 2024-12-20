import React, { useState, useEffect } from 'react';
import '../styles/MenuAdmin.css'; // Asegúrate de importar los estilos correctamente
import logo from '../images/logowalkee.jpg'; // Asegúrate de importar el logo correctamente
import { database } from '../firebase'; // Importa la base de datos desde firebase.js
import { ref, onValue, update, off } from 'firebase/database'; // Agrega "update" para actualizar datos
import { Bar, Line } from 'react-chartjs-2'; // Importamos también 'Line' para gráficos de línea
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'; // Componentes
import Modal from 'react-modal'; // Importar React-modal
import BuzonPropietario from './BuzonPropietario';
import BuzonColaborador from './BuzonColaborador';
import CerrarSesionModal from './CerrarSesion';
import RegistrarAdministrador from './RegistrarAdministrador';
import Reportes from './Reportes';

// Configura el elemento raíz para el modal
Modal.setAppElement('#root'); // Ajusta si tu `id` del root es diferente

// Registrar los componentes de Chart.js, incluyendo los necesarios para gráficos de línea
Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const MenuAdmin = ({ usu, onLogout }) => {
  const [selectedOption, setSelectedOption] = useState('ingresos');
  const [isCollaboratorMenuOpen, setIsCollaboratorMenuOpen] = useState(false);
  const [isOwnerMenuOpen, setIsOwnerMenuOpen] = useState(false);
  const [isStatisticsMenuOpen, setIsStatisticsMenuOpen] = useState(false);
  const [isSupervisionMenuOpen, setIsSupervisionMenuOpen] = useState(false); // Nuevo estado
  const [collaborators, setCollaborators] = useState([]);
  const [owners, setOwners] = useState([]); // Estado para almacenar los propietarios
  const [pendingRequests, setPendingRequests] = useState([]);
  const [expandedCollaborators, setExpandedCollaborators] = useState({}); // Para controlar los detalles expandidos
  const [searchTerm, setSearchTerm] = useState(''); // Estado para la barra de búsqueda
  const [filteredCollaborators, setFilteredCollaborators] = useState([]); // Colaboradores filtrados por la búsqueda
  const [filteredOwners, setFilteredOwners] = useState([]); // Propietarios filtrados por la búsqueda
  const [filteredRequests, setFilteredRequests] = useState([]); // Solicitudes filtradas por la búsqueda
  const [enabledUsers, setEnabledUsers] = useState({ paseador: 0, propietario: 0 }); // Estado para usuarios habilitados
  const maxUsers = Math.max(enabledUsers.paseador, enabledUsers.propietario);
  const suggestedMax = maxUsers + 3; // Esto da un margen de 3 por encima del máximo valor
  const [disabledUsers, setDisabledUsers] = useState({ paseador: 0, propietario: 0 }); // Estado para usuarios deshabilitados
  const [monthlyData, setMonthlyData] = useState({colaboradores: [],propietarios: []});
  const [monthlyDisabledData, setMonthlyDisabledData] = useState({ colaboradores: [], propietarios: [] }); // Añadir estado para usuarios deshabilitados
  const [totalUsers, setTotalUsers] = useState({ habilitados: { paseador: 0, propietario: 0 }, deshabilitados: { paseador: 0, propietario: 0 }}); // Total de usuarios
  const [showPendingNotification, setShowPendingNotification] = useState(false); // Estado para mostrar alerta
  const [showOwnerNotification, setShowOwnerNotification] = useState(false);
  const [previousOwnerCount, setPreviousOwnerCount] = useState(0); // Para comparar los registros anteriores
  const [year, setYear] = useState(2024); // Estado para el año actual
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [selectedRut, setSelectedRut] = useState('');
  const [isDisableOwnerModalOpen, setDisableOwnerModalOpen] = useState(false); // Controla la apertura del modal de deshabilitación del propietario
  const [motivoDeshabilitacionOwner, setMotivoDeshabilitacionOwner] = useState(''); // Almacena el motivo de la deshabilitación del propietario
  const [selectedOwnerRut, setSelectedOwnerRut] = useState(''); // Almacena el RUT del propietario que se va a deshabilitar
  const [isDisableCollaboratorModalOpen, setDisableCollaboratorModalOpen] = useState(false); // Controla la apertura del modal del paseador
  const [motivoDeshabilitacionColaborador, setMotivoDeshabilitacionColaborador] = useState(''); // Almacena el motivo de la deshabilitación del paseador
  const [selectedRutColaborador, setSelectedRutColaborador] = useState(''); // Almacena el RUT del paseador que se va a deshabilitar
  const [ownerPets, setOwnerPets] = useState([]); // Para almacenar las mascotas del propietario actual
  const [currentPetIndex, setCurrentPetIndex] = useState(0); // Índice de la mascota que se muestra en el modal
  const [isPetsModalOpen, setIsPetsModalOpen] = useState(false); // Controla si el modal está abierto o cerrado
  const [isNoPetsModalOpen, setIsNoPetsModalOpen] = useState(false); // Nuevo estado
  const [petCount, setPetCount] = useState(0); // Nuevo estado para la cantidad de mascotas
  const [isImageLoading, setIsImageLoading] = useState(true); // Nuevo estado de carga de la imagen
  const [monthlyIncome, setMonthlyIncome] = useState(Array(12).fill(0)); // Inicializa un array de 12 elementos en 0 para los ingresos de cada mes
  const [incomeYear, setIncomeYear] = useState(new Date().getFullYear()); // Estado para el año actual de ingresos
  const [propietarios, setPropietarios] = useState([]);
  const [listaDePropietarios, setListaDePropietarios] = useState([]);
  const [totalEgresos, setTotalEgresos] = useState(0); // Estado para los egresos
  const [monthlyEgresos, setMonthlyEgresos] = useState(Array(12).fill(0));
  const [monthlyDifference, setMonthlyDifference] = useState(Array(12).fill(0));
  const [hasUnreadColaboradorMessages, setHasUnreadColaboradorMessages] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Declara el estado aquí
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false); // Nuevo estado para notificación de mensajes no leídos
  const [monthlyIncomeByPlan, setMonthlyIncomeByPlan] = useState({
    'Plan Mi Amigo': Array(12).fill(0),
    'Plan Amigo Feliz': Array(12).fill(0),
    'Plan Super Amigo': Array(12).fill(0),
    'sin plan': Array(12).fill(0),
  });

  const [monthlyPurchasesByPlan, setMonthlyPurchasesByPlan] = useState({
    'Plan Mi Amigo': Array(12).fill(0),
    'Plan Amigo Feliz': Array(12).fill(0),
    'Plan Super Amigo': Array(12).fill(0),
    'sin plan': Array(12).fill(0),
  });  
  
    // Verificar mensajes no leídos
    useEffect(() => {
      const mensajesRef = ref(database, 'Mensajeria');
    
      const unsubscribe = onValue(mensajesRef, (snapshot) => {
        const mensajesData = snapshot.val();
        let foundUnreadMessage = false;
    
        if (mensajesData) {
          Object.entries(mensajesData).forEach(([rut, mensajesUsuario]) => {
            const clienteRef = ref(database, `Clientes/${rut}`);
            onValue(clienteRef, (snapshotCliente) => {
              const clienteData = snapshotCliente.val();
    
              if (clienteData && clienteData.categoria === "Dueno") {
                Object.values(mensajesUsuario).forEach((mensaje) => {
                  if (!mensaje.leido) {
                    foundUnreadMessage = true; // Encontró un mensaje no leído
                  }
                });
              }
            });
          });
        }
    
        setHasUnreadMessages(foundUnreadMessage); // Actualiza el estado para propietarios
      });
    
      return () => unsubscribe(); // Limpia el listener al desmontar
    }, []);    

    // Verificar mensajes no leídos en colaboradores
    useEffect(() => {
      const mensajesRef = ref(database, 'Mensajeria');
    
      const unsubscribe = onValue(mensajesRef, (snapshot) => {
        const mensajesData = snapshot.val();
        let foundUnreadMessage = false;
    
        if (mensajesData) {
          Object.entries(mensajesData).forEach(([rut, mensajesUsuario]) => {
            const clienteRef = ref(database, `Clientes/${rut}`);
            onValue(clienteRef, (snapshotCliente) => {
              const clienteData = snapshotCliente.val();
    
              if (clienteData && clienteData.categoria === "Paseador") {
                Object.values(mensajesUsuario).forEach((mensaje) => {
                  if (!mensaje.leido) {
                    foundUnreadMessage = true; // Encontró un mensaje no leído
                  }
                });
              }
            });
          });
        }
    
        setHasUnreadColaboradorMessages(foundUnreadMessage); // Actualiza el estado para colaboradores
      });
    
      return () => unsubscribe(); // Limpia el listener al desmontar
    }, []); 
    
    useEffect(() => {
      // Desplazar al inicio cuando cambie la sección
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, [selectedOption]);

    useEffect(() => {
      // Limpiar la barra de búsqueda al cambiar de sección
      setSearchTerm('');
      window.scrollTo({
        top: 0, // Desplazar al inicio
        behavior: 'smooth', // Animación suave
      });
    }, [selectedOption]); // Ejecutar cuando cambie la opción seleccionada
  
  useEffect(() => {
    const fetchMonthlyPurchasesByPlan = () => {
      const pagosRef = ref(database, 'Pagos');
  
      onValue(pagosRef, (snapshot) => {
        const pagosData = snapshot.val();
  
        // Inicializamos el objeto para almacenar la cantidad de compras mensuales por plan
        const monthlyPurchasesTemp = {
          'Plan Mi Amigo': Array(12).fill(0),
          'Plan Amigo Feliz': Array(12).fill(0),
          'Plan Super Amigo': Array(12).fill(0),
          'sin plan': Array(12).fill(0),
        };
  
        if (pagosData) {
          Object.values(pagosData).forEach((pago) => {
            Object.values(pago).forEach((detalle) => {
              const [day, month, yearStr] = detalle.fecha.split('-'); // Dividimos la fecha
              const monthIndex = parseInt(month, 10) - 1; // Convertimos el mes a índice (0-11)
              const pagoYear = parseInt(yearStr, 10); // Año del pago
              const plan = detalle.plan || 'sin plan'; // Usamos "sin plan" si no hay dato
  
              // Procesar la compra solo si el año coincide
              if (pagoYear === incomeYear && monthlyPurchasesTemp[plan] !== undefined) {
                monthlyPurchasesTemp[plan][monthIndex] += 1; // Incrementamos la cantidad de compras
              }
            });
          });
        }
  
        setMonthlyPurchasesByPlan(monthlyPurchasesTemp); // Actualizamos el estado
      });
    };
  
    fetchMonthlyPurchasesByPlan();
  }, [database, incomeYear]); // Cambia cuando el año cambia  
    
  useEffect(() => {
    // Calcula la diferencia mensual entre ingresos y egresos
    const difference = monthlyIncome.map((income, index) => income - (monthlyEgresos[index] || 0));
    setMonthlyDifference(difference);
  }, [monthlyIncome, monthlyEgresos]); // Ejecutar cada vez que cambien ingresos o egresos

  // Función para cambiar el año de ingresos
  const changeIncomeYear = (direction) => {
    if (direction === 'previous') {
      setIncomeYear((prevYear) => prevYear - 1);
     } else if (direction === 'next') {
       setIncomeYear((prevYear) => prevYear + 1);
     }
   };

  const sanitizeRutForPets = (rut) => {
    // Eliminar guiones y dígito verificador
    const sanitizedRut = rut.split('-')[0]; // Separa por el guion y toma la primera parte
    console.log(`RUT Sanitizado: ${sanitizedRut}`);
    return sanitizedRut;
  };
  
  const fetchAndShowPets = (ownerRut) => {
    const sanitizedRut = sanitizeRutForPets(ownerRut);
    console.log(`Intentando cargar mascotas para el RUT Sanitizado: ${sanitizedRut}`);
    
    const petsRef = ref(database, 'Mascotas');
    
    onValue(petsRef, (snapshot) => {
      const petsData = snapshot.val();
      console.log("Datos de todas las mascotas:", petsData); 
  
      // Filtrar las mascotas que coincidan con el RUT del propietario
      const filteredPets = Object.values(petsData || {}).filter(pet => {
        console.log(`Comparando ${pet.mascotaId} con ${sanitizedRut}`);
        return pet.mascotaId.startsWith(sanitizedRut);
      });
  
      console.log("Mascotas filtradas:", filteredPets); 
    
      // Verifica si hay mascotas en el resultado filtrado
      if (filteredPets.length > 0) {
        // Si hay mascotas, mostrar el modal con las mascotas
        setOwnerPets(filteredPets);
        setCurrentPetIndex(0);
        setIsNoPetsModalOpen(false); // Asegurarse de cerrar el modal de "No hay mascotas" si estaba abierto
        setIsPetsModalOpen(true); 
        setIsImageLoading(true); // Mostrar la pantalla de carga al abrir el modal por primera vez
      } else {
        // Si no hay mascotas, mostrar el modal de "No hay mascotas"
        setIsPetsModalOpen(false); // Asegurarse de cerrar el modal de mascotas si estaba abierto
        setIsNoPetsModalOpen(true);
      }
    });
  };   
  
  const goToNextPet = () => {
    setCurrentPetIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ownerPets.length;
        console.log("Navegando a la siguiente mascota, índice:", nextIndex);
        setIsImageLoading(true); // Mostrar la pantalla de carga al cambiar de mascota
        return nextIndex;
    });
  };

  const goToPreviousPet = () => {
    setCurrentPetIndex((prevIndex) => {
        const previousIndex = (prevIndex - 1 + ownerPets.length) % ownerPets.length;
        console.log("Navegando a la mascota anterior, índice:", previousIndex);
        setIsImageLoading(true); // Mostrar la pantalla de carga al cambiar de mascota
        return previousIndex;
    });
  };
  
  const closePetsModal = () => {
    setIsPetsModalOpen(false);
  };
    
  // Función para abrir el modal de deshabilitación del paseador
  const openDisableCollaboratorModal = (rut) => {
    setSelectedRutColaborador(rut); // Guardar el rut del paseador
    setDisableCollaboratorModalOpen(true); // Abre el modal
  };

  // Función para cerrar el modal de deshabilitación del paseador
  const closeDisableCollaboratorModal = () => {
    setDisableCollaboratorModalOpen(false);
    setMotivoDeshabilitacionColaborador(''); // Limpia el motivo al cerrar
  };

  // Función para manejar la deshabilitación con motivo
  const handleDisableCollaboratorWithReason = (rut, motivo) => {
    if (motivo.trim()) {
      toggleCollaboratorStatus(rut, 'deshabilitado', 'deshabilitarCuentaPaseador', motivo); // Enviar el motivo
      closeDisableCollaboratorModal(); // Cerrar el modal
    } else {
      alert("Por favor ingrese un motivo antes de enviar.");
    }
  };

  // Función para abrir el modal de deshabilitación del propietario
  const openDisableOwnerModal = (rut) => {
    setSelectedOwnerRut(rut); // Guardar el rut del propietario
    setDisableOwnerModalOpen(true); // Abre el modal
  };

  // Función para cerrar el modal de deshabilitación del propietario
  const closeDisableOwnerModal = () => {
    setDisableOwnerModalOpen(false);
    setMotivoDeshabilitacionOwner(''); // Limpia el motivo al cerrar
  };

  // Función para manejar la deshabilitación con motivo
  const handleDisableOwnerWithReason = (rut, motivo) => {
    if (motivo.trim()) {
      toggleCollaboratorStatus(rut, 'deshabilitado', 'deshabilitarCuentaPropietario', motivo); // Enviar el motivo
      closeDisableOwnerModal(); // Cerrar el modal
    } else {
      alert("Por favor ingrese un motivo antes de enviar.");
    }
  };

  const openRejectModal = (rut) => {
    setSelectedRut(rut); // Guardar el rut para usarlo después
    setRejectModalOpen(true); // Abrir el modal
  };
  
  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setMotivoRechazo(''); // Limpiar el motivo después de cerrar
  };
  
  const handleRejectWithReason = (rut, motivo) => {
    if (motivo.trim()) {
      toggleCollaboratorStatus(rut, 'deshabilitado', 'rechazarSolicitud', motivo); // Enviar el motivo
      closeRejectModal(); // Cerrar el modal después de enviar
    } else {
      alert("Por favor ingrese un motivo antes de enviar.");
    }
  };

  const handleNotificationClick = () => {
    setSelectedOption('buzonPropietario'); // Cambiar a la vista del buzón de propietarios
  };
  
  const handleNotificationClickC = () => {
    setSelectedOption('buzonColaborador'); // Cambiar a la vista del buzón de colaboradores
  };  

  useEffect(() => {
    const fetchIncomeByPlanAndMonth = () => {
      const pagosRef = ref(database, 'Pagos');
  
      onValue(pagosRef, (snapshot) => {
        const pagosData = snapshot.val();
  
        // Inicializamos un objeto para almacenar ingresos mensuales por plan
        const monthlyIncomeByPlanTemp = {
          'Plan Mi Amigo': Array(12).fill(0),
          'Plan Amigo Feliz': Array(12).fill(0),
          'Plan Super Amigo': Array(12).fill(0),
          'sin plan': Array(12).fill(0),
        };
  
        if (pagosData) {
          Object.values(pagosData).forEach((pago) => {
            Object.values(pago).forEach((detalle) => {
              const [day, month, yearStr] = detalle.fecha.split('-'); // Descomponemos la fecha
              const monto = parseFloat(detalle.monto.replace('$', '').replace('.', '')); // Convertimos el monto
              const monthIndex = parseInt(month, 10) - 1; // Convertimos el mes a índice (0-11)
              const pagoYear = parseInt(yearStr, 10); // Año del pago
              const plan = detalle.plan || 'sin plan'; // Usamos "sin plan" si no se especifica
  
              // Procesar ingresos solo si el año coincide
              if (pagoYear === incomeYear && monthlyIncomeByPlanTemp[plan] !== undefined) {
                monthlyIncomeByPlanTemp[plan][monthIndex] += monto; // Sumar al plan correspondiente
              }
            });
          });
        }
  
        setMonthlyIncomeByPlan(monthlyIncomeByPlanTemp); // Actualizamos el estado
      });
    };
  
    fetchIncomeByPlanAndMonth();
  }, [database, incomeYear]);  

  useEffect(() => {
    const petsRef = ref(database, 'Mascotas');
    
    onValue(petsRef, (snapshot) => {
      const petsData = snapshot.val();
      const numberOfPets = petsData ? Object.keys(petsData).length : 0;
      setPetCount(numberOfPets); // Actualiza el estado con la cantidad de mascotas
    });
  }, []);

  useEffect(() => {
    const propietariosRef = ref(database, 'Ruta/De/Propietarios'); // Coloca la ruta correcta de Firebase
    onValue(propietariosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const propietariosArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setListaDePropietarios(propietariosArray);
      }
    });
  }, []);

  useEffect(() => {
    // Referencia a la base de datos de mensajes en Firebase
    const propietariosRef = ref(database, 'Mensajeria');

    // Cargar datos desde Firebase cuando el componente se monte
    onValue(propietariosRef, (snapshot) => {
      const propietariosData = snapshot.val();
      if (propietariosData) {
        const propietariosArray = Object.keys(propietariosData).map((key) => {
          const mensajes = propietariosData[key];
          const ultimoMensajeKey = Object.keys(mensajes).pop(); // Obtener la clave del último mensaje
          const ultimoMensaje = mensajes[ultimoMensajeKey];

          return {
            id: key,
            nombre: key, // Puedes reemplazar esto con el nombre real si está disponible en tu estructura de datos
            ultimoMensaje: ultimoMensaje.contenido,
            hora: new Date(ultimoMensajeKey.split('_')[2]).toLocaleTimeString(), // Extrae la hora del mensaje
            avatarUrl: 'default_avatar_url.jpg', // Define una URL predeterminada o carga una URL desde la base de datos si está disponible
          };
        });
        setPropietarios(propietariosArray);
      }
    });
  }, []);

  useEffect(() => {
    const fetchMonthlyIncome = () => {
      const pagosRef = ref(database, 'Pagos');
      onValue(pagosRef, (snapshot) => {
        const pagosData = snapshot.val();
        const monthlyIncomeTemp = Array(12).fill(0); // Array temporal para almacenar los ingresos de cada mes

        if (pagosData) {
          Object.values(pagosData).forEach((pago) => {
            Object.values(pago).forEach((detalle) => {
              const [day, month, yearStr] = detalle.fecha.split('-');
              const monto = parseFloat(detalle.monto.replace('$', '').replace('.', '')); // Convierte el monto a número eliminando símbolo y punto decimal
              const pagoYear = parseInt(yearStr, 10); // Año del pago

              // Solo agrega el monto si coincide con el año seleccionado
              if (pagoYear === incomeYear) {
                const monthIndex = parseInt(month, 10) - 1; // Índice del mes (0 para enero, 1 para febrero, etc.)
                monthlyIncomeTemp[monthIndex] += monto; // Suma el monto al mes correspondiente
              }
            });
          });
        }

        setMonthlyIncome(monthlyIncomeTemp); // Actualiza el estado con los ingresos mensuales
      });
    };

    fetchMonthlyIncome();
  }, [database, incomeYear]);

  useEffect(() => {
    if (!localStorage.getItem("usuarioAutenticado")) {
      onLogout();
    }
  }, [onLogout]);
  

  useEffect(() => { 
    const clientesRef = ref(database, 'Clientes');
  
    if (selectedOption === 'registroColaboradores') {
      onValue(clientesRef, (snapshot) => {
        const data = snapshot.val();
        const filteredClientes = Object.values(data || {}).filter(
          (cliente) =>
            cliente.categoria === 'Paseador' &&
            (cliente.estado === 'habilitado' || cliente.estado === 'deshabilitado')
        );
        setCollaborators(filteredClientes);
        setFilteredCollaborators(filteredClientes); // Inicializa con todos los colaboradores
      });
    } else if (selectedOption === 'solicitudesRegistro') {
      onValue(clientesRef, (snapshot) => {
        const data = snapshot.val();
        const filteredPendientes = Object.values(data || {}).filter(
          (cliente) => cliente.categoria === 'Paseador' && cliente.estado === 'pendiente'
        );
        setPendingRequests(filteredPendientes);
        setFilteredRequests(filteredPendientes); // Inicializa con todas las solicitudes
  
        // Mostrar la alerta si hay solicitudes pendientes
        setShowPendingNotification(filteredPendientes.length > 0); // Aquí añadimos esta línea para la notificación
      });
    } else if (selectedOption === 'registroPropietarios') {
      onValue(clientesRef, (snapshot) => {
        const data = snapshot.val();
        const filteredOwnersList = Object.values(data || {}).filter(
          (cliente) => cliente.categoria === 'Dueno'
        );
        setOwners(filteredOwnersList);
        setFilteredOwners(filteredOwnersList); // Inicializa con todos los propietarios
  
        // Mostrar la alerta si hay nuevos registros de propietarios
        setShowOwnerNotification(filteredOwnersList.length > 0); // Aquí añadimos esta línea para la notificación de propietarios
      });
    } else if (selectedOption === 'usuarios') {
      onValue(clientesRef, (snapshot) => {
        const data = snapshot.val();
        const habilitados = {
          paseador: 0,
          propietario: 0,
        };
        const deshabilitados = {
          paseador: 0,
          propietario: 0,
        };
        const total = {
          habilitados: { paseador: 0, propietario: 0 },
          deshabilitados: { paseador: 0, propietario: 0 },
        };
  
        // Contar los usuarios habilitados y deshabilitados
        Object.values(data || {}).forEach((cliente) => {
          if (cliente.estado === 'habilitado') {
            if (cliente.categoria === 'Paseador') {
              habilitados.paseador += 1;
              total.habilitados.paseador += 1;
            } else if (cliente.categoria === 'Dueno') {
              habilitados.propietario += 1;
              total.habilitados.propietario += 1;
            }
          } else if (cliente.estado === 'deshabilitado') {
            if (cliente.categoria === 'Paseador') {
              deshabilitados.paseador += 1;
              total.deshabilitados.paseador += 1;
            } else if (cliente.categoria === 'Dueno') {
              deshabilitados.propietario += 1;
              total.deshabilitados.propietario += 1;
            }
          }
        });
  
        setEnabledUsers(habilitados); // Actualiza el estado de usuarios habilitados para el gráfico
        setDisabledUsers(deshabilitados); // Actualiza el estado de usuarios deshabilitados para el gráfico
        setTotalUsers(total); // Actualiza el estado del total de usuarios
      });

      // Mapeo de meses en inglés a español
      const monthMap = {
        January: 'Enero',
        February: 'Febrero',
        March: 'Marzo',
        April: 'Abril',
        May: 'Mayo',
        June: 'Junio',
        July: 'Julio',
        August: 'Agosto',
        September: 'Septiembre',
        October: 'Octubre',
        November: 'Noviembre',
        December: 'Diciembre',
      };
  
      // Cargar datos mensuales de habilitados y deshabilitados desde la colección MonthlyUserCounts según el año
      const monthlyDataRef = ref(database, `MonthlyUserCounts/${year}`); // Ref actualizado con el año dinámico
      onValue(monthlyDataRef, (snapshot) => {
        const data = snapshot.val();
        const colaboradores = Array(12).fill(0); // Inicializa un array para 12 meses
        const propietarios = Array(12).fill(0); // Inicializa un array para 12 meses
        const colaboradoresDeshabilitados = Array(12).fill(0); // Usuarios deshabilitados
        const propietariosDeshabilitados = Array(12).fill(0); // Usuarios deshabilitados
  
        if (data) {
          Object.keys(data).forEach((month) => {
            const monthInSpanish = monthMap[month]; // Convierte el mes a español
            const monthIndex = Object.values(monthMap).indexOf(monthInSpanish); // Encuentra el índice del mes en español
            if (monthIndex !== -1) {
              colaboradores[monthIndex] = data[month].habilitados.paseadores || 0;
              propietarios[monthIndex] = data[month].habilitados.duenos || 0;
              colaboradoresDeshabilitados[monthIndex] = data[month].deshabilitados.paseadores || 0;
              propietariosDeshabilitados[monthIndex] = data[month].deshabilitados.duenos || 0;
            }
          });
        }
  
        setMonthlyData({ colaboradores, propietarios }); // Datos para el gráfico de usuarios habilitados anualmente
        setMonthlyDisabledData({ colaboradores: colaboradoresDeshabilitados, propietarios: propietariosDeshabilitados }); // Datos para usuarios deshabilitados anualmente
      });
    }
  }, [selectedOption, year]); // Añadir el estado "year" como dependencia para que los datos cambien según el año

  // useEffect para calcular los egresos mensuales
  useEffect(() => {
    const solicitudesRef = ref(database, 'Solicitudes'); // Ruta de Firebase para las solicitudes

    // Listener para calcular los egresos
    const unsubscribe = onValue(solicitudesRef, (snapshot) => {
      const solicitudesData = snapshot.val();
      const monthlyEgressTemp = Array(12).fill(0); // Inicializa un array de 12 ceros

      if (solicitudesData) {
        Object.values(solicitudesData).forEach((solicitud) => {
          // Verifica que la solicitud esté terminada y que los datos estén completos
          if (solicitud.estado === 'terminada' && solicitud.fecha && solicitud.cantidadMascotas) {
            const [yearStr, month] = solicitud.fecha.split('-'); // Divide la fecha en año y mes
            const solicitudYear = parseInt(yearStr, 10); // Año como número
            const monthIndex = parseInt(month, 10) - 1; // Mes como índice (0-11)

            // Verifica que el año de la solicitud coincide con el año actual
            if (solicitudYear === incomeYear) {
              const egreso = 1500 * parseInt(solicitud.cantidadMascotas, 10); // Calcula el egreso
              monthlyEgressTemp[monthIndex] += egreso; // Suma el egreso al mes correspondiente
            }
          }
        });
      }

      setMonthlyEgresos(monthlyEgressTemp); // Actualiza el estado con los egresos mensuales
    });

    // Limpia el listener al desmontar
    return () => unsubscribe();
  }, [incomeYear]); // Ejecuta el efecto cada vez que cambie el año

// Notificaciones se muestren en todo momento
useEffect(() => {
  const clientesRef = ref(database, 'Clientes');

  // Escuchar las solicitudes pendientes
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    const filteredPendientes = Object.values(data || {}).filter(
      (cliente) => cliente.categoria === 'Paseador' && cliente.estado === 'pendiente'
    );
    setPendingRequests(filteredPendientes);

    // Mostrar la alerta si hay solicitudes pendientes
    setShowPendingNotification(filteredPendientes.length > 0);
  });

  // Escuchar los nuevos registros de propietarios
  onValue(clientesRef, (snapshot) => {
    const data = snapshot.val();
    const filteredOwnersList = Object.values(data || {}).filter(
      (cliente) => cliente.categoria === 'Dueno'
    );
    setOwners(filteredOwnersList);

    // Mostrar la alerta si hay nuevos propietarios **solo si no estás en "Registro de Propietarios"**
    if (selectedOption === 'registroPropietarios') {
      setShowOwnerNotification(false); // Desactivar notificación cuando estás en "Registro de Propietarios"
    } else {
      setShowOwnerNotification(filteredOwnersList.length > previousOwnerCount); // Mostrar notificación si estás en otra opción
    }

    // Actualizar la cantidad anterior de propietarios
    setPreviousOwnerCount(filteredOwnersList.length);
  });
}, [selectedOption, previousOwnerCount]); // Agregar selectedOption para que el useEffect se ejecute al cambiar de opción

  const changeYear = (direction) => {
    if (direction === 'previous') {
      setYear((prevYear) => prevYear - 1);
    } else if (direction === 'next') {
      setYear((prevYear) => prevYear + 1);
    }
  };

// Datos para el gráfico de diferencia mensual entre ingresos y egresos
const differenceChartData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  datasets: [
    {
      label: `Utilidad ${incomeYear}`,
      data: monthlyDifference,
      borderColor: '#007BFF', // Color de la línea (azul fuerte)
      backgroundColor: 'rgba(0, 123, 255, 0.2)', // Fondo de la línea (azul claro con transparencia)
      fill: true,
      tension: 0.1, // Curvatura suave
    },
  ],
};

// Opciones para el gráfico de diferencia mensual
const differenceChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: `Utilidad Mensual en ${incomeYear}`,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Monto en Pesos Chilenos ($)',
      },
      ticks: {
        stepSize: 300000, // Ajusta el paso para la escala Y
      },
      suggestedMax: Math.max(...monthlyDifference) + 300000, // Margen de 300,000 sobre el valor máximo
    },
    x: {
      title: {
        display: true,
        text: 'Mes',
      },
    },
  },
};
    
const monthlyPurchasesChartData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  datasets: [
    {
      label: 'Sin Plan',
      data: monthlyPurchasesByPlan['sin plan'],
      borderColor: '#FF6384',
      fill: false,
      tension: 0.1,
    },
    {
      label: 'Plan Mi Amigo',
      data: monthlyPurchasesByPlan['Plan Mi Amigo'],
      borderColor: '#4BC0C0', // Color de la línea
      fill: false, // Sin área de relleno
      tension: 0.1, // Suavidad en las líneas
    },
    {
      label: 'Plan Amigo Feliz',
      data: monthlyPurchasesByPlan['Plan Amigo Feliz'],
      borderColor: '#FFCE56',
      fill: false,
      tension: 0.1,
    },
    {
      label: 'Plan Super Amigo',
      data: monthlyPurchasesByPlan['Plan Super Amigo'],
      borderColor: '#36A2EB',
      fill: false,
      tension: 0.1,
    },
  ],
};
  
const monthlyPurchasesChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: `Cantidad de Compras Mensuales por Plan en ${incomeYear}`,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cantidad de Compras',
      },
      ticks: {
        stepSize: 1, // Incrementos en 1
      },
      suggestedMax: Math.max(
        ...monthlyPurchasesByPlan['sin plan'],
        ...monthlyPurchasesByPlan['Plan Mi Amigo'],
        ...monthlyPurchasesByPlan['Plan Amigo Feliz'],
        ...monthlyPurchasesByPlan['Plan Super Amigo']
      ) + 2, // Agrega un margen dinámico
    },
    x: {
      title: {
        display: true,
        text: 'Mes',
      },
    },
  },
};

// Configuración de datos para el gráfico de barras
const monthlyPlanIncomeChartData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  datasets: [
    {
      label: 'Sin Plan',
      data: monthlyIncomeByPlan['sin plan'],
      borderColor: '#FF6384',
      fill: false,
      tension: 0.1,
    },
    {
      label: 'Plan Mi Amigo',
      data: monthlyIncomeByPlan['Plan Mi Amigo'],
      borderColor: '#4BC0C0', // Color de la línea
      fill: false, // Sin área de relleno
      tension: 0.1, // Suavidad en las líneas
    },
    {
      label: 'Plan Amigo Feliz',
      data: monthlyIncomeByPlan['Plan Amigo Feliz'],
      borderColor: '#FFCE56',
      fill: false,
      tension: 0.1,
    },
    {
      label: 'Plan Super Amigo',
      data: monthlyIncomeByPlan['Plan Super Amigo'],
      borderColor: '#36A2EB',
      fill: false,
      tension: 0.1,
    },
  ],
};

const monthlyPlanIncomeChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: `Ingresos Mensuales por Plan en ${incomeYear}`,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Monto en Pesos Chilenos ($)',
      },
      ticks: {
        stepSize: 100000, // Ajusta el paso según tus valores
      },
      suggestedMax: Math.max(
        ...monthlyIncomeByPlan['sin plan'],
        ...monthlyIncomeByPlan['Plan Mi Amigo'],
        ...monthlyIncomeByPlan['Plan Amigo Feliz'],
        ...monthlyIncomeByPlan['Plan Super Amigo']
      ) + 100000, // Margen dinámico
    },
    x: {
      title: {
        display: true,
        text: 'Mes',
      },
    },
  },
};

  // Datos para el gráfico
  const egresosChartData = {
    labels: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    datasets: [
      {
        label: `Egresos Mensuales - ${incomeYear}`,
        data: monthlyEgresos,
        borderColor: '#FF6384', // Color de la línea
        fill: false, // Sin relleno
        tension: 0.1, // Suavidad de la curva
      },
    ],
  };

  // Opciones del gráfico
  const egresosChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Egresos Mensuales del Año ${incomeYear}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto en Pesos Chilenos ($)',
        },
        ticks: {
          stepSize: 50000, // Paso de 300,000
        },
        suggestedMax: Math.max(...monthlyEgresos) + 50000, // Margen adicional en el eje Y
      },
      x: {
        title: {
          display: true,
          text: 'Mes',
        },
      },
    },
  };

  // Datos para el gráfico de ingresos
  const incomeChartData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: `Ingresos Mensuales - ${incomeYear}`,
        data: monthlyIncome,
        borderColor: '#4CAF50',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const incomeChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Ingresos Mensuales del Año ${incomeYear}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto en Pesos Chilenos($)',
        },
        ticks: {
          stepSize: 300000, // Define el paso entre cada línea horizontal en el eje Y
        },
        suggestedMax: Math.max(...monthlyIncome) + 300000, // Margen de 300,000 por encima del valor máximo de ingresos
      },
      x: {
        title: {
          display: true,
          text: 'Mes',
        },
      },
    },
  };

  // Abre el modal de imagen y muestra la imagen seleccionada
  const openImageModal = (src) => {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    modal.style.display = "flex"; // Mostrar el modal
    modalImage.src = src; // Asignar la fuente de la imagen al modal
  };

  // Cierra el modal de imagen
  const closeImageModal = () => {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none"; // Ocultar el modal
  };

  const dataHabilitados = {
    labels: ['Colaboradores', 'Propietarios'], // Etiquetas para el eje X
    datasets: [
      {
        label: 'Usuarios Habilitados', // Título del gráfico
        data: [enabledUsers.paseador, enabledUsers.propietario], // Datos de la cantidad de usuarios habilitados
        backgroundColor: ['#FA9580', '#91B44E'], // Colores de las barras 
      },
    ],
  };

  const optionsHabilitados = {
    responsive: true,
    maintainAspectRatio: true, // Desactivar relación de aspecto fija
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Usuarios Habilitados',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true, 
          text: 'Cantidad de Usuarios', // Texto del título del eje Y
        },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          },
        },
        max: Math.max(enabledUsers.paseador, enabledUsers.propietario) + 3
      },
      x: {
        title: {
          display: true,
          text: 'Categoría',
        },
      },
    },
  };

  const dataDeshabilitados = {
    labels: ['Colaboradores', 'Propietarios'], // Etiquetas para el eje X
    datasets: [
      {
        label: 'Usuarios Deshabilitados', // Título del gráfico
        data: [disabledUsers.paseador, disabledUsers.propietario], // Datos de la cantidad de usuarios deshabilitados
        backgroundColor: ['#FA9580', '#91B44E'], // Colores de las barras 
      },
    ],
  };

  const optionsDeshabilitados = {
    responsive: true,
    maintainAspectRatio: true, // Desactivar relación de aspecto fija
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Usuarios Deshabilitados',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true, 
          text: 'Cantidad de Usuarios', // Texto del título del eje Y
        },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          },
        },
        max: Math.max(disabledUsers.paseador, disabledUsers.propietario) + 3
      },
      x: {
        title: {
          display: true,
          text: 'Categoría',
        },
      },
    },
  };
  
  // Datos para el gráfico de línea de usuarios habilitados anual
  const dataAnualHabilitados = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Colaboradores Habilitados',
        data: monthlyData.colaboradores,
        borderColor: '#FA9580',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Propietarios Habilitados',
        data: monthlyData.propietarios,
        borderColor: '#91B44E',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  
  const optionsAnualHabilitados = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Gráfica Anual de Usuarios Habilitados',
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Comenzar en 0
        title: {
          display: true,
          text: 'Cantidad de Usuarios',
        },
        ticks: {
          stepSize: 1, // Incrementos de 1 para que solo muestre números naturales
          callback: function(value) {
            return Number.isInteger(value) ? value : ''; // Mostrar solo valores enteros
          },
        },
        suggestedMax: Math.max(...monthlyData.colaboradores, ...monthlyData.propietarios) + 3, // Establece el máximo dinámico con margen de 5
      },
      x: {
        title: {
          display: true,
          text: 'Mes',
        },
      },
    },
  };

  // Datos para el gráfico de línea de usuarios deshabilitados anual
  const dataAnualDeshabilitados = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Colaboradores Deshabilitados',
        data: monthlyDisabledData.colaboradores,
        borderColor: '#FA9580',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Propietarios Deshabilitados',
        data: monthlyDisabledData.propietarios,
        borderColor: '#91B44E',
        fill: false,
        tension: 0.1,
      },
    ],
  };
  
  const optionsAnualDeshabilitados = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Gráfica Anual de Usuarios Deshabilitados',
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Comenzar en 0
        title: {
          display: true,
          text: 'Cantidad de Usuarios',
        },
        ticks: {
          stepSize: 1, // Incrementos de 1 para que solo muestre números naturales
          callback: function(value) {
            return Number.isInteger(value) ? value : ''; // Mostrar solo valores enteros
          },
        },
        suggestedMax: Math.max(...monthlyDisabledData.colaboradores, ...monthlyDisabledData.propietarios) + 3, // Establece el máximo dinámico con margen de 5
      },
      x: {
        title: {
          display: true,
          text: 'Mes',
        },
      },
    },
  };

  const dataTotalUsuarios = {
    labels: ['Colaboradores', 'Propietarios', 'Mascotas'], 
    datasets: [
      {
        data: [
          totalUsers.habilitados.paseador + totalUsers.deshabilitados.paseador, // Suma de habilitados y deshabilitados para colaboradores
          totalUsers.habilitados.propietario + totalUsers.deshabilitados.propietario, // Suma de habilitados y deshabilitados para propietarios
          petCount // Cantidad total de mascotas
        ],
        backgroundColor: ['#FA9580', '#91B44E', '#FFD700'], 
      }
    ],
  };

  const optionsTotalUsuarios = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: true,
        text: 'Gráfico Total de Usuarios y Mascotas', // Actualiza el título
      },
      legend: {
        display: false, // Oculta la leyenda si no es necesaria
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Usuarios / Mascotas',
        },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          },
        },
        suggestedMax: Math.max(
          totalUsers.habilitados.paseador + totalUsers.deshabilitados.paseador,
          totalUsers.habilitados.propietario + totalUsers.deshabilitados.propietario,
          petCount // Incluir el conteo de mascotas en el cálculo
        ) + 3,
      },
      x: {
        title: {
          display: true,
          text: 'Categoría',
        },
      },
    },
  };  
  
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);

    setExpandedCollaborators({});

    // Filtrar colaboradores
    const filtered = collaborators.filter(collaborator => 
      collaborator.nombres.toLowerCase().startsWith(query) ||  // Busca solo al inicio de los nombres
      collaborator.rut.toLowerCase().startsWith(query) ||      // Busca solo al inicio del RUT
      collaborator.email.toLowerCase().startsWith(query)       // Busca solo al inicio del email
    );
    setFilteredCollaborators(filtered);

    // Filtrar propietarios
    const filteredOwnersList = owners.filter(owner => 
      owner.nombres.toLowerCase().startsWith(query) ||  // Busca solo al inicio de los nombres
      owner.rut.toLowerCase().startsWith(query) ||      // Busca solo al inicio del RUT
      owner.email.toLowerCase().startsWith(query)       // Busca solo al inicio del email
    );
    setFilteredOwners(filteredOwnersList);

    // Filtrar solicitudes pendientes
    const filteredReq = pendingRequests.filter(request => 
      request.nombres.toLowerCase().startsWith(query) ||  // Busca solo al inicio de los nombres
      request.rut.toLowerCase().startsWith(query) ||      // Busca solo al inicio del RUT
      request.email.toLowerCase().startsWith(query)       // Busca solo al inicio del email
    );
    setFilteredRequests(filteredReq);
  };


  const getContentTitle = () => {
    switch (selectedOption) {
      case 'ingresos': return 'Estadísticas Financieras';
      case 'usuarios': return 'Estadísticas de Uso';
      case 'solicitudesRegistro': return 'Solicitudes de Registro';
      case 'registroColaboradores': return 'Registro de Colaboradores';
      case 'buzonColaborador': return 'Buzón de Mensajería para Colaboradores';
      case 'registroPropietarios': return 'Registro de Propietarios de Caninos';
      case 'buzonPropietario': return 'Buzón de Mensajería para Propietarios';
      case 'registrarAdministrador': return 'Registrar Administrador';
      case 'reportes': return 'Reportes de Paseos';
      default: return '';
    }
  };

  const sanitizeRut = (rut) => {
    return rut.replace(/[.-]/g, ''); // Reemplaza '.' y '-' con una cadena vacía
  };

// Función para enviar correo a través del backend
const sendEmail = async (toEmail, toName, variables, action) => {
  try {
      const response = await fetch('http://localhost:5000/send-email', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ toEmail, toName, variables, action }), // Enviar 'action' en lugar de 'templateID'
      });

      if (response.ok) {
          console.log('Correo enviado correctamente');
      } else {
          console.error('Error al enviar el correo');
      }
  } catch (error) {
      console.error('Error en la solicitud:', error);
  }
};


// Esta función maneja el cambio de estado y envía correos si es necesario
const toggleCollaboratorStatus = (collaboratorId, newStatus, action, motivoRechazo = '') => {
  const sanitizedRut = sanitizeRut(collaboratorId); // Limpia el RUT antes de usarlo
  const collaboratorRef = ref(database, `Clientes/${sanitizedRut}`); // Usa el RUT limpiado

  // Obtener el colaborador desde Firebase
  onValue(collaboratorRef, (snapshot) => {
    const collaborator = snapshot.val(); // Asegúrate de obtener el colaborador correctamente

    // Actualizar el estado del colaborador
    update(collaboratorRef, { estado: newStatus, motivoRechazo }) // Guarda el motivo si se rechaza o deshabilita
      .then(() => {
        console.log(`Estado actualizado a ${newStatus}`);

        // Limpiar el campo de búsqueda
        setSearchTerm('');

        // Restablecer los detalles expandidos (colapsar todos)
        setExpandedCollaborators({});

        // Refresca los datos después de actualizar el estado
        const clientesRef = ref(database, 'Clientes');
        onValue(clientesRef, (snapshot) => {
          const data = snapshot.val();

          // Verificar si la opción seleccionada es "Registro de Colaboradores"
          if (selectedOption === 'registroColaboradores') {
            const filteredClientes = Object.values(data).filter(cliente => cliente.categoria === 'Paseador' && (cliente.estado === 'habilitado' || cliente.estado === 'deshabilitado'));
            setCollaborators(filteredClientes);
            setFilteredCollaborators(filteredClientes); // Mostrar solo los colaboradores habilitados/deshabilitados
          }

          // Verificar si la opción seleccionada es "Solicitudes de Registro"
          if (selectedOption === 'solicitudesRegistro') {
            const filteredPendientes = Object.values(data).filter(cliente => cliente.categoria === 'Paseador' && cliente.estado === 'pendiente');
            setPendingRequests(filteredPendientes);
            setFilteredRequests(filteredPendientes); // Mostrar solo las solicitudes pendientes
          }
        });

        // Enviar un correo cuando se acepte una solicitud
        if (action === 'aceptarSolicitud' && newStatus === 'habilitado') {
          sendEmail(
            collaborator.email, // El correo del colaborador
            `${collaborator.nombres}`, // Nombre completo del colaborador para personalización
            {
              nombres: collaborator.nombres,
            },
            'aceptarSolicitud' // Enviar 'aceptarSolicitud' como acción para usar la plantilla correcta
          );
        }

        // Enviar un correo cuando se rechace una solicitud
        if (action === 'rechazarSolicitud' && newStatus === 'deshabilitado') {
          sendEmail(
            collaborator.email, // El correo del colaborador
            `${collaborator.nombres}`, // Nombre completo del colaborador para personalización
            {
              nombres: collaborator.nombres,
              motivo: motivoRechazo // Agrega el motivo del rechazo al email
            },
            'rechazarSolicitud' // Enviar 'rechazarSolicitud' como acción para usar la plantilla correcta
          );
        }

        // Enviar un correo cuando se habilite la cuenta de un paseador
        if (action === 'habilitarCuentaPaseador' && newStatus === 'habilitado') {
          sendEmail(
            collaborator.email, // El correo del paseador
            `${collaborator.nombres}`, // Nombre completo del paseador
            {
              nombres: collaborator.nombres,
            },
            'habilitarCuentaPaseador' // Enviar 'habilitarCuentaPaseador' como acción para usar la plantilla correcta
          );
        }

        // Enviar un correo cuando se habilite la cuenta de un propietario
        if (action === 'habilitarCuentaPropietario' && newStatus === 'habilitado') {
          sendEmail(
            collaborator.email, // El correo del propietario
            `${collaborator.nombres}`, // Nombre completo del propietario
            {
              nombres: collaborator.nombres,
            },
            'habilitarCuentaPropietario' // Enviar 'habilitarCuentaPropietario' como acción para usar la plantilla correcta
          );
        }

        // Enviar un correo cuando se deshabilite la cuenta de un paseador
        if (action === 'deshabilitarCuentaPaseador' && newStatus === 'deshabilitado') {
          sendEmail(
            collaborator.email, // El correo del paseador
            `${collaborator.nombres}`, // Nombre completo del paseador
            {
              nombres: collaborator.nombres,
              motivo: motivoRechazo // Agrega el motivo de deshabilitación al email
            },
            'deshabilitarCuentaPaseador' // Enviar 'deshabilitarCuentaPaseador' como acción para usar la plantilla correcta
          );
        }

        // Enviar un correo cuando se deshabilite la cuenta de un propietario
        if (action === 'deshabilitarCuentaPropietario' && newStatus === 'deshabilitado') {
          sendEmail(
            collaborator.email, // El correo del propietario
            `${collaborator.nombres}`, // Nombre completo del propietario
            {
              nombres: collaborator.nombres,
              motivo: motivoRechazo // Agrega el motivo de deshabilitación al email
            },
            'deshabilitarCuentaPropietario' // Enviar 'deshabilitarCuentaPropietario' como acción para usar la plantilla correcta
          );
        }

      })
      .catch((error) => {
        console.error('Error al cambiar el estado del colaborador:', error);
      });
  }, {
    onlyOnce: true
  });
};

  const toggleDetails = (index) => {
    setExpandedCollaborators((prevState) => ({
      ...prevState,
      [index]: !prevState[index], // Alterna entre expandido o colapsado
    }));
  };

  return (
    <div className="menu-admin-container">
      <nav className="menu-admin-sidebar">
      <div className="menu-options">
        <h2 className="menu-admin-welcome">Bienvenido, {usu}</h2>
        <ul className="menu-admin-nav">
          <li
            className={`menu-admin-nav-item ${selectedOption === 'estadisticas' ? 'menu-admin-nav-item-active' : ''}`}
            onClick={() => {
              setSelectedOption('ingresos');
              setIsStatisticsMenuOpen(!isStatisticsMenuOpen);
              setIsSupervisionMenuOpen(false); 
              setIsCollaboratorMenuOpen(false);
              setIsOwnerMenuOpen(false);
            }}
          >
            Estadísticas
          </li>
          {isStatisticsMenuOpen && (
            <ul className="menu-admin-statistics-submenu">
              <li
                className={`menu-admin-statistics-submenu-item ${selectedOption === 'ingresos' ? 'menu-admin-statistics-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('ingresos')}
              >
                Estadísticas Financieras
              </li>
              <li
                className={`menu-admin-nav-item ${selectedOption === 'usuarios' ? 'menu-admin-nav-item-active' : ''}`}
                onClick={() => setSelectedOption('usuarios')}
              >
                Estadísticas de Uso
              </li>
            </ul>
          )}
          <li
            className={`menu-admin-nav-item ${selectedOption === 'gestionColaboradores' ? 'menu-admin-nav-item-active' : ''}`}
            onClick={() => {
              setSelectedOption('solicitudesRegistro');
              setIsCollaboratorMenuOpen(!isCollaboratorMenuOpen);
              setIsSupervisionMenuOpen(false); 
              setIsOwnerMenuOpen(false);
              setIsStatisticsMenuOpen(false);
            }}
          >
            Gestionar Colaboradores
          </li>
          {isCollaboratorMenuOpen && (
            <ul className="menu-admin-collaborator-submenu">
              <li
                className={`menu-admin-collaborator-submenu-item ${selectedOption === 'solicitudesRegistro' ? 'menu-admin-collaborator-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('solicitudesRegistro')}
              >
                Solicitudes de Registros
              </li>
              <li
                className={`menu-admin-collaborator-submenu-item ${selectedOption === 'registroColaboradores' ? 'menu-admin-collaborator-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('registroColaboradores')}
              >
                Registro de Colaboradores
              </li>
              <li
                className={`menu-admin-collaborator-submenu-item ${selectedOption === 'buzonColaborador' ? 'menu-admin-collaborator-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('buzonColaborador')}
              >
                Panel de Mensajería
              </li>
            </ul>
          )}

            <li
            className={`menu-admin-nav-item ${selectedOption === 'gestionPropietarios' ? 'menu-admin-nav-item-active' : ''}`}
            onClick={() => {
              setSelectedOption('registroPropietarios');
              setIsOwnerMenuOpen(!isOwnerMenuOpen);
              setIsCollaboratorMenuOpen(false);
              setIsSupervisionMenuOpen(false); 
              setIsStatisticsMenuOpen(false);
            }}
          >
            Gestionar Propietarios de Caninos
          </li>
          {isOwnerMenuOpen && (
            <ul className="menu-admin-owner-submenu">
              <li
                className={`menu-admin-owner-submenu-item ${selectedOption === 'registroPropietarios' ? 'menu-admin-owner-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('registroPropietarios')}
              >
                Registro de Propietarios de Caninos
              </li>
              <li
                className={`menu-admin-owner-submenu-item ${selectedOption === 'buzonPropietario' ? 'menu-admin-owner-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('buzonPropietario')}
              >
                Panel de Mensajería
              </li>
            </ul>
          )}

              <li
            className={`menu-admin-nav-item ${selectedOption === 'supervision' ? 'menu-admin-nav-item-active' : ''}`}
            onClick={() => {
              setSelectedOption('reportes');
              setIsSupervisionMenuOpen(!isSupervisionMenuOpen); 
              setIsOwnerMenuOpen(false); 
              setIsCollaboratorMenuOpen(false);
              setIsStatisticsMenuOpen(false);
            }}
          >
            Supervisión
          </li>
          {isSupervisionMenuOpen && (
            <ul className="menu-admin-owner-submenu">
              <li
                className={`menu-admin-owner-submenu-item ${selectedOption === 'reportes' ? 'menu-admin-owner-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('reportes')}
              >
                Reportes
              </li>
              <li
                className={`menu-admin-owner-submenu-item ${selectedOption === 'registrarAdministrador' ? 'menu-admin-owner-submenu-item-active' : ''}`}
                onClick={() => setSelectedOption('registrarAdministrador')}
              >
                Registrar Administrador
              </li>
            </ul>
          )}          
        </ul>
        </div>
        <CerrarSesionModal onLogout={onLogout} />
      </nav>

      <main className="menu-admin-content">
        <div className="menu-admin-header">
          <img src={logo} alt="Logo Walkee" className="menu-admin-logo" />
          <h1 className="menu-admin-title">{getContentTitle()}</h1>
          <div className="notification-icons">
            <div
              className="notification-icon-container"
              onClick={() => setSelectedOption('solicitudesRegistro')}
              style={{ cursor: 'pointer' }} // Agrega estilo para mostrar que es clickeable
            >
              <i className="bi bi-person-plus-fill"></i>
              {pendingRequests.length > 0 && <div className="notification-badge"></div>} {/* Punto rojo */}
            </div>
            <div className="notification-icon-container" onClick={handleNotificationClickC}>
              <i className="bi bi-chat-square-text-fill"></i>
              {hasUnreadColaboradorMessages && <div className="notification-badge"></div>} {/* Punto rojo */}
            </div>
            <div className="notification-icon-container" onClick={handleNotificationClick}>
            <i className="bi bi-chat-square-text-fill"></i>
            {hasUnreadMessages && <div className="notification-badge"></div>} {/* Punto rojo */}
          </div>
          </div>
        </div>

        <div className="menu-admin-content-section">
          {(selectedOption === 'registroColaboradores' || selectedOption === 'solicitudesRegistro' || selectedOption === 'registroPropietarios') && (
            <div className="search-bar-container">
            <input
              type="text"
              placeholder="Buscar por RUT, correo o nombres..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-bar-input"
            />
            <button
              className="search-bar-clear-button"
              onClick={() => {
                setSearchTerm(''); // Limpia el término de búsqueda
                setFilteredCollaborators(collaborators); // Restaura la lista completa de colaboradores
                setFilteredOwners(owners); // Restaura la lista completa de propietarios
                setFilteredRequests(pendingRequests); // Restaura la lista completa de solicitudes pendientes
              }}
            >
              Limpiar
            </button>
          </div>
          )}

          {/* Mostrar el gráfico si la opción seleccionada es 'ingresos' */}
          {selectedOption === 'ingresos' && (
            <div className="grafico-container">
              {/* Gráfico de Ingresos Mensuales */}
              <h3>Gráfico de Ingresos Mensuales</h3>
              <div className="grafico-cuadro">
                <div className="year-navigation">
                  <button onClick={() => changeIncomeYear('previous')} className="year-button">
                    <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                  </button>
                  <span className="year-label">Año {incomeYear}</span> {/* Muestra el año actual */}
                  <button onClick={() => changeIncomeYear('next')} className="year-button">
                    <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                  </button>
                </div>
                <Line data={incomeChartData} options={incomeChartOptions} />
              </div>

              {/* Gráfico de Egresos Mensuales */}
              <h3>Gráfico de Egresos Mensuales</h3>
              <div className="grafico-cuadro">
              {/* Navegación del año */}
              <div className="year-navigation">
                <button onClick={() => changeIncomeYear('previous')} className="year-button">
                  <i className="bi bi-arrow-left-circle-fill"></i> {/* Botón de año anterior */}
                </button>
                <span className="year-label">Año {incomeYear}</span>
                <button onClick={() => changeIncomeYear('next')} className="year-button">
                  <i className="bi bi-arrow-right-circle-fill"></i> {/* Botón de año siguiente */}
                </button>
              </div>
              
              {/* Renderizar el gráfico de egresos */}
              <Line data={egresosChartData} options={egresosChartOptions} />
            </div>

              {/* Gráfico de Diferencia Mensual entre Ingresos y Egresos */}
              <h3>Gráfico de Utilidad Mensual</h3>
              <div className="grafico-cuadro">
                <div className="year-navigation">
                  <button onClick={() => changeIncomeYear('previous')} className="year-button">
                    <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                  </button>
                  <span className="year-label">Año {incomeYear}</span> {/* Muestra el año actual */}
                  <button onClick={() => changeIncomeYear('next')} className="year-button">
                    <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                  </button>
                </div>
                <Line data={differenceChartData} options={differenceChartOptions} />
              </div>

              {/* Gráfico de Ingresos por Plan */}
              <h3>Gráfico de Ingresos Mensuales por Plan</h3>
                <div className="grafico-cuadro">
                  <div className="year-navigation">
                    <button onClick={() => changeIncomeYear('previous')} className="year-button">
                      <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                    </button>
                    <span className="year-label">Año {incomeYear}</span> {/* Muestra el año actual */}
                    <button onClick={() => changeIncomeYear('next')} className="year-button">
                      <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                    </button>
                  </div>
                  <Line data={monthlyPlanIncomeChartData} options={monthlyPlanIncomeChartOptions} />
                </div>

              {/* Gráfico de Ingresos por Plan */}
              <h3>Gráfico de Cantidad de Compras Mensuales por Plan</h3>
                <div className="grafico-cuadro">
                  <div className="year-navigation">
                    <button onClick={() => changeIncomeYear('previous')} className="year-button">
                      <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                    </button>
                    <span className="year-label">Año {incomeYear}</span> {/* Muestra el año actual */}
                    <button onClick={() => changeIncomeYear('next')} className="year-button">
                      <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                    </button>
                  </div>
                  <Line data={monthlyPurchasesChartData} options={monthlyPurchasesChartOptions} />
                </div>
            </div>        
          )}

          {/* Mostrar el gráfico si la opción seleccionada es 'usuarios' */}
          
          {selectedOption === 'usuarios' && (
            <div className="grafico-container">
              {/* Gráfico de Usuarios Habilitados */}
              <h3>Gráfico de Usuarios Habilitados</h3>
              <div className="grafico-cuadro"> {/* Contenedor cuadrado */}
                <Bar data={dataHabilitados} options={optionsHabilitados} />
              </div>
      
              {/* Gráfico de Usuarios Deshabilitados */}
              <h3>Gráfico de Usuarios Deshabilitados</h3>
              <div className="grafico-cuadro"> {/* Contenedor cuadrado */}
                <Bar data={dataDeshabilitados} options={optionsDeshabilitados} />
              </div>

              {/* Gráfico Anual de Usuarios Habilitados */}
              <h3>Gráfica Anual de Usuarios Habilitados</h3>
              <div className="grafico-cuadro">
                <div className="year-navigation">
                  <button onClick={() => changeYear('previous')} className="year-button">
                    <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                  </button>
                  <span className="year-label">Año {year}</span> {/* Muestra el año actual */}
                  <button onClick={() => changeYear('next')} className="year-button">
                    <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                  </button>
                </div>
                
                <Line data={dataAnualHabilitados} options={optionsAnualHabilitados} />
              </div>

              {/* Gráfico Anual de Usuarios Deshabilitados */}
              <h3>Gráfica Anual de Usuarios Deshabilitados</h3>
              <div className="grafico-cuadro">
                <div className="year-navigation">
                  <button onClick={() => changeYear('previous')} className="year-button">
                    <i className="bi bi-arrow-left-circle-fill"></i> {/* Icono de año anterior */}
                  </button>
                  <span className="year-label">Año {year}</span> {/* Muestra el año actual */}
                   <button onClick={() => changeYear('next')} className="year-button">
                     <i className="bi bi-arrow-right-circle-fill"></i> {/* Icono de año siguiente */}
                   </button>
                 </div>

                 <Line data={dataAnualDeshabilitados} options={optionsAnualDeshabilitados} />
               </div>

              {/* Gráfico Total de Usuarios */}
              <h3>Gráfico Total de Usuarios</h3>
              <div className="grafico-cuadro">
                <Bar data={dataTotalUsuarios} options={optionsTotalUsuarios} />
              </div>
            </div>
          )} 

          {/* Modal para ver la imagen ampliada */}
          <div id="imageModal" className="modal" onClick={closeImageModal}>
            <span className="close">&times;</span>
            <img className="modal-content" id="modalImage" />
          </div>
 
          {selectedOption === 'registroColaboradores' && (
            <div className="collaborator-list">
              {filteredCollaborators.map((collaborator, index) => (
                <div key={index} className="collaborator-card">
                  {/* Imagen de perfil */}
                  <div className="collaborator-image">
                    <img 
                      src={collaborator.profileImageUrl || 'default-profile.jpg'} 
                      alt="Imagen de perfil" 
                      onClick={() => openImageModal(collaborator.profileImageUrl || 'default-profile.jpg')} 
                    />
                  </div>
                  <div className="collaborator-info">
                    <div className="collaborator-info-row">
                      <p><strong>Nombre:</strong> {collaborator.nombres}</p>
                      <p><strong>RUT:</strong> {collaborator.rut}</p>
                      <p><strong>Teléfono:</strong> {collaborator.telefono}</p>
                    </div>
                    <div className="collaborator-info-row">
                      <p><strong>Apellidos:</strong> {collaborator.apellidos}</p>
                      <p><strong>Email:</strong> {collaborator.email}</p>
                      <p><strong>Género:</strong> {collaborator.genero}</p>
                    </div>
                  </div>
                  {expandedCollaborators[index] && (
                    <div className="collaborator-expanded">
                      <div className="collaborator-text-info">
                        <p><strong>Descripción de Incapacidad:</strong> {collaborator.descripincapacidad || 'N/A'}</p>
                        <p><strong>Dirección:</strong> {collaborator.direccion || 'N/A'}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {collaborator.fechaNac || 'N/A'}</p>
                      </div>
                      <div className="collaborator-media-info">
                        <p><strong>Carnet Frontal:</strong> <a href={collaborator.carnetFrontUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                        <p><strong>Carnet Posterior:</strong> <a href={collaborator.carnetBackUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                        <p><strong>PDF Antecedentes:</strong> <a href={collaborator.pdfAnteUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                        <p><strong>PDF Residencia:</strong> <a href={collaborator.pdfRecUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                      </div>
                      <div className="collaborator-bank-info">
                        <p><strong>Banco:</strong> {collaborator.banco || 'N/A'}</p>
                        <p><strong>Cuenta:</strong> {collaborator.ncuenta || 'N/A'}</p>
                        <p><strong>Email de Cuenta:</strong> {collaborator.emailcuenta || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="collaborator-actions">
                    <button 
                      className="collaborator-button" 
                      onClick={() => toggleDetails(index)}
                    >
                      {expandedCollaborators[index] ? 'Ver menos detalles' : 'Ver más detalles'}
                    </button>
                    {/* Botón para habilitar/deshabilitar la cuenta del paseador */}
                    <button 
                      className={`collaborator-button ${collaborator.estado === 'habilitado' ? 'disable-button' : 'enable-button'}`}
                      onClick={() => {
                        const newStatus = collaborator.estado === 'habilitado' ? 'deshabilitado' : 'habilitado';
                        const action = newStatus === 'habilitado' ? 'habilitarCuentaPaseador' : 'deshabilitarCuentaPaseador';
                        
                        if (newStatus === 'deshabilitado') {
                          openDisableCollaboratorModal(collaborator.rut); // Abre el modal si se va a deshabilitar
                        } else {
                          toggleCollaboratorStatus(collaborator.rut, newStatus, action); // Habilita directamente si el estado es 'habilitado'
                        }
                      }}
                    >
                      {collaborator.estado === 'habilitado' ? 'Deshabilitar' : 'Habilitar'}
                    </button>

                    {/* Modal para escribir el motivo de deshabilitación del paseador */}
                    <Modal isOpen={isDisableCollaboratorModalOpen} onRequestClose={closeDisableCollaboratorModal} className="modern-modal">
                      <div className="modal-content">
                        <h2 className="modal-title">Motivo de la Deshabilitación</h2>
                        <textarea
                          className="modal-textarea"
                          value={motivoDeshabilitacionColaborador}
                          onChange={(e) => setMotivoDeshabilitacionColaborador(e.target.value)}
                          placeholder="Escribe el motivo para deshabilitar la cuenta del paseador..."
                        />
                        <div className="modal-buttons">
                          <button className="modal-button send" onClick={() => handleDisableCollaboratorWithReason(selectedRutColaborador, motivoDeshabilitacionColaborador)}>Enviar</button>
                          <button className="modal-button cancel" onClick={closeDisableCollaboratorModal}>Cancelar</button>
                        </div>
                      </div>
                    </Modal>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedOption === 'buzonPropietario' && (
                <BuzonPropietario />    
              )}
          {selectedOption === 'buzonColaborador' && (
                <BuzonColaborador />    
              )}

          {selectedOption === 'registrarAdministrador' && <RegistrarAdministrador />}

          {selectedOption === 'reportes' && <Reportes />}
              
          {selectedOption === 'solicitudesRegistro' && (
            <div className="solicitudes-list">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => (
                  <div key={index} className="collaborator-card solicitud-card">
                    {/* Imagen de perfil */}
                    <div className="collaborator-image">
                      <img 
                        src={request.profileImageUrl || 'default-profile.jpg'} 
                        alt="Imagen de perfil" 
                        onClick={() => openImageModal(request.profileImageUrl || 'default-profile.jpg')} 
                      />
                    </div>
                    <div className="collaborator-info">
                      <div className="collaborator-info-row">
                        <p><strong>Nombre:</strong> {request.nombres}</p>
                        <p><strong>RUT:</strong> {request.rut}</p>
                        <p><strong>Teléfono:</strong> {request.telefono}</p>
                      </div>
                      <div className="collaborator-info-row">
                        <p><strong>Apellidos:</strong> {request.apellidos}</p>
                        <p><strong>Email:</strong> {request.email}</p>
                        <p><strong>Género:</strong> {request.genero}</p>
                      </div>
                    </div>
                    {expandedCollaborators[index] && (
                      <div className="collaborator-expanded">
                        <div className="collaborator-text-info">
                          <p><strong>Descripción de Incapacidad:</strong> {request.descripincapacidad || 'N/A'}</p>
                          <p><strong>Dirección:</strong> {request.direccion || 'N/A'}</p>
                          <p><strong>Fecha de Nacimiento:</strong> {request.fechaNac || 'N/A'}</p>
                        </div>
                        <div className="collaborator-media-info">
                          <p><strong>Carnet Frontal:</strong> <a href={request.carnetFrontUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                          <p><strong>Carnet Posterior:</strong> <a href={request.carnetBackUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                          <p><strong>PDF Antecedentes:</strong> <a href={request.pdfAnteUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                          <p><strong>PDF Residencia:</strong> <a href={request.pdfRecUrl} target="_blank" rel="noopener noreferrer">Ver</a></p>
                        </div>
                        <div className="collaborator-bank-info">
                          <p><strong>Banco:</strong> {request.banco || 'N/A'}</p>
                          <p><strong>Cuenta:</strong> {request.ncuenta || 'N/A'}</p>
                          <p><strong>Email de Cuenta:</strong> {request.emailcuenta || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    <div className="collaborator-actions">
                      <button 
                        className="collaborator-button" 
                        onClick={() => toggleDetails(index)}
                      >
                        {expandedCollaborators[index] ? 'Ver menos detalles' : 'Ver más detalles'}
                      </button>
                      <button 
                        className="approve-button"
                        onClick={() => toggleCollaboratorStatus(request.rut, 'habilitado', 'aceptarSolicitud')}
                      >
                        Aceptar
                      </button>
                      {/* Botón para rechazar solicitudes */}
                      <button 
                        className="reject-button"
                        onClick={() => openRejectModal(request.rut)}
                      >
                        Rechazar
                      </button>

                      {/* Modal para escribir el motivo de rechazo */}
                      <Modal isOpen={isRejectModalOpen} onRequestClose={closeRejectModal} className="modern-modal">
                        <div className="modal-content">
                          <h2 className="modal-title">Motivo del Rechazo</h2>
                          <textarea
                            className="modal-textarea"
                            value={motivoRechazo}
                            onChange={(e) => setMotivoRechazo(e.target.value)}
                            placeholder="Escribe el motivo del rechazo..."
                          />
                          <div className="modal-buttons">
                            <button className="modal-button send" onClick={() => handleRejectWithReason(selectedRut, motivoRechazo)}>Enviar</button>
                            <button className="modal-button cancel" onClick={closeRejectModal}>Cancelar</button>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-requests-message">
                  <p>No hay solicitudes de registro pendientes.</p>
                </div>
              )}
            </div>
          )}

          {selectedOption === 'registroPropietarios' && (
            <div className="owner-list">
              {filteredOwners.map((owner, index) => (
                <div key={index} className="collaborator-card">
                  {/* Imagen de perfil */}
                  <div className="collaborator-image">
                    <img 
                      src={owner.profileImageUrl || 'default-profile.jpg'} 
                      alt="Imagen de perfil" 
                      onClick={() => openImageModal(owner.profileImageUrl || 'default-profile.jpg')} 
                    />
                  </div>
                  <div className="collaborator-info">
                    <div className="collaborator-info-row">
                      <p><strong>Nombre:</strong> {owner.nombres}</p>
                      <p><strong>RUT:</strong> {owner.rut}</p>
                      <p><strong>Email:</strong> {owner.email}</p>
                      <p><strong>Género:</strong> {owner.genero}</p>
                    </div>
                    <div className="collaborator-info-row">
                      <p><strong>Apellidos:</strong> {owner.apellidos}</p>
                      <p><strong>Teléfono:</strong> {owner.telefono}</p>
                      <p><strong>Fecha de Nacimiento:</strong> {owner.fechaNac}</p>
                      <p><strong>Dirección:</strong> {owner.direccion}</p>
                    </div>
                  </div>

                  <div className="collaborator-actions">
                    {/* Botón "Ver mascotas" */}
                    <button 
                      className="collaborator-button" 
                      onClick={() => fetchAndShowPets(owner.rut)}
                    >
                      Ver mascotas
                    </button>
                    {/* Modal Ver mascotas de propietarios */}
                    <Modal 
                      isOpen={isPetsModalOpen} 
                      onRequestClose={closePetsModal} 
                      className="modern-modal" 
                    >
                      {ownerPets.length > 0 && (
                        <div className="modal-content-horizontal">
                          <button className="close-modal-button" onClick={closePetsModal}>&times;</button>
                          <h2 className="modal-title">{ownerPets[currentPetIndex].nomMasc}</h2>
                          <div className="pet-info-container">
                            <div className="pet-image-horizontal">
                              {/* Pantalla de carga, visible solo si `isImageLoading` es true */}
                              {isImageLoading && (
                                <div className="loading-spinner">
                                  <div className="spinner"></div>
                                </div>
                              )}
                              
                              {/* Imagen de la mascota */}
                              <img 
                                src={ownerPets[currentPetIndex].imagenesMascotasUrl} 
                                alt={`Imagen de ${ownerPets[currentPetIndex].nomMasc}`} 
                                onLoad={() => setIsImageLoading(false)} // Cambia el estado cuando la imagen se carga
                                style={{ display: isImageLoading ? 'none' : 'block' }} // Oculta la imagen si está cargando
                              />
                            </div>

                            <div className="pet-info-horizontal">
                              <p><strong>Raza:</strong> {ownerPets[currentPetIndex].razaMasc}</p>
                              <p><strong>Fecha de Nacimiento:</strong> {ownerPets[currentPetIndex].fechaNacMasc}</p>
                              <p><strong>Género:</strong> {ownerPets[currentPetIndex].genMasc || 'N/A'}</p>
                              <p><strong>Descripción Especial:</strong> {ownerPets[currentPetIndex].descripcionEspecial || 'N/A'}</p>
                              <p><strong>Tipo de Mascota:</strong> {ownerPets[currentPetIndex].tipoMascota}</p>
                              <p><strong>Chip:</strong> {ownerPets[currentPetIndex].numChip}</p>
                              <p><strong>Registro:</strong> {ownerPets[currentPetIndex].regMascota}</p>
                            </div>
                          </div>

                          {/* Contador de mascotas */}
                          <div className="pet-counter">
                            <span>{currentPetIndex + 1} / {ownerPets.length}</span> {/* Agrega el contador aquí */}
                          </div>

                          <div className="modal-navigation">
                            <button 
                              onClick={goToPreviousPet} 
                              disabled={ownerPets.length === 1} // Desactiva si solo hay una mascota
                            >
                              &larr; Anterior
                            </button>
                            <button 
                              onClick={goToNextPet} 
                              disabled={ownerPets.length === 1} // Desactiva si solo hay una mascota
                            >
                              Siguiente &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </Modal>

                      {/* Modal sin registro de mascotas para propietarios */}
                      <Modal 
                        isOpen={isNoPetsModalOpen} 
                        onRequestClose={() => setIsNoPetsModalOpen(false)} 
                        className="modern-modal"
                      >
                        <div className="modal-content">
                          <h2 className="modal-title">Sin Mascotas Registradas</h2>
                          <p>Este usuario no tiene mascotas registradas.</p>
                          <button 
                            className="modal-button cancel" 
                            onClick={() => setIsNoPetsModalOpen(false)}
                          >
                            Cerrar
                          </button>
                        </div>
                      </Modal>
                    {/* Botón de habilitar/deshabilitar para propietarios */}
                    <button 
                      className={`collaborator-button ${owner.estado === 'habilitado' ? 'disable-button' : 'enable-button'}`}
                      onClick={() => {
                        const newStatus = owner.estado === 'habilitado' ? 'deshabilitado' : 'habilitado';
                        const action = newStatus === 'habilitado' ? 'habilitarCuentaPropietario' : 'deshabilitarCuentaPropietario';
                        
                        if (newStatus === 'deshabilitado') {
                          openDisableOwnerModal(owner.rut); // Abre el modal si se va a deshabilitar
                        } else {
                          toggleCollaboratorStatus(owner.rut, newStatus, action); // Habilita directamente si el estado es 'habilitado'
                        }
                      }}
                    >
                      {owner.estado === 'habilitado' ? 'Deshabilitar' : 'Habilitar'}
                    </button>

                    {/* Modal para escribir el motivo de deshabilitación del propietario */}
                    <Modal className="modern-modal" isOpen={isDisableOwnerModalOpen} onRequestClose={closeDisableOwnerModal}>
                      <div className="modal-content">
                        <h2 className="modal-title">Motivo de la Deshabilitación</h2>
                        <textarea
                          className="modal-textarea"
                          value={motivoDeshabilitacionOwner}
                          onChange={(e) => setMotivoDeshabilitacionOwner(e.target.value)}
                          placeholder="Escribe el motivo para deshabilitar la cuenta del propietario..."
                        />
                        <div className="modal-buttons">
                          <button className="modal-button send" onClick={() => handleDisableOwnerWithReason(selectedOwnerRut, motivoDeshabilitacionOwner)}>Enviar</button>
                          <button className="modal-button cancel" onClick={closeDisableOwnerModal}>Cancelar</button>
                        </div>
                      </div>
                    </Modal>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default MenuAdmin;
