/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { pubsub } = require("firebase-functions/v2"); // Importar pubsub desde v2
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');

admin.initializeApp(); // Inicializa la aplicación de Firebase

const db = admin.database(); // Referencia a la base de datos

// Función programada para ejecutarse el día 1 de cada mes a las 00:00
exports.saveMonthlyUserCount = pubsub.schedule('0 0 1 * *').onRun(async (context) => {
    try {
        // Obtener la fecha del mes anterior
        const today = new Date();
        today.setMonth(today.getMonth() - 1);
        const month = today.toLocaleString('default', { month: 'long' }); // Mes en texto (ej. Enero)
        const year = today.getFullYear();

        // Obtener la referencia de la base de datos
        const clientesRef = db.ref('Clientes');

        // Obtener los usuarios habilitados y deshabilitados
        const snapshot = await clientesRef.once('value');
        const data = snapshot.val();

        let enabledPaseadores = 0;
        let disabledPaseadores = 0;
        let enabledDuenos = 0;
        let disabledDuenos = 0;

        // Contar usuarios habilitados y deshabilitados por categoría
        Object.values(data).forEach(cliente => {
            if (cliente.categoria === 'Paseador') {
                if (cliente.estado === 'habilitado') {
                    enabledPaseadores++;
                } else if (cliente.estado === 'deshabilitado') {
                    disabledPaseadores++;
                }
            } else if (cliente.categoria === 'Dueno') {
                if (cliente.estado === 'habilitado') {
                    enabledDuenos++;
                } else if (cliente.estado === 'deshabilitado') {
                    disabledDuenos++;
                }
            }
        });

        // Guardar la información en la base de datos
        const monthlyRef = db.ref('MonthlyUserCounts').child(`${year}`).child(month);
        await monthlyRef.set({
            habilitados: {
                paseadores: enabledPaseadores,
                duenos: enabledDuenos
            },
            deshabilitados: {
                paseadores: disabledPaseadores,
                duenos: disabledDuenos
            }
        });

        console.log(`Datos de ${month} guardados correctamente.`);
    } catch (error) {
        console.error('Error al guardar los datos mensuales:', error);
    }
});



// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
