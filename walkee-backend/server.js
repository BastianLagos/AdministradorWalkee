const express = require('express');
const cors = require('cors');
const Mailjet = require('node-mailjet');

// Configura Mailjet
const mailjet = Mailjet.apiConnect('c8277618b14a77ff5e898efb6f43c86e', 'e00a1cdf2bdc5728c3405b2b3f06667a');

const app = express();

// Configura CORS para permitir solicitudes desde tu frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'POST',
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Función para enviar correos
const sendEmail = (toEmail, toName, variables, action) => {
  console.log('Iniciando el envío de correo a:', toEmail);

  // Seleccionar la plantilla correcta según la acción
  let templateId;
  if (action === 'aceptarSolicitud') {
    templateId = 6410581; // ID de la plantilla para aceptación
  } else if (action === 'rechazarSolicitud') {
    templateId = 6414218; // ID de la plantilla para rechazo
  } else if (action === 'habilitarCuentaPaseador') {
    templateId = 6414247; // ID de la plantilla para habilitar cuenta de paseador
  } else if (action === 'habilitarCuentaPropietario') {
    templateId = 6414276; // ID de la plantilla para habilitar cuenta de propietario
  } else if (action === 'deshabilitarCuentaPaseador') {
    templateId = 6414248; // ID de la plantilla para deshabilitar cuenta de paseador
  } else if (action === 'deshabilitarCuentaPropietario') {
    templateId = 6414291; // ID de la plantilla para deshabilitar cuenta de propietario
  }

  // Verifica si el templateId está correctamente definido
  if (!templateId) {
    console.error('TemplateID no definido. No se puede enviar el correo.');
    return Promise.reject(new Error('TemplateID no definido.'));
  }

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: "walkeeapp@gmail.com",
          Name: "Administración Oficial de Walkee",
        },
        To: [
          {
            Email: toEmail,
            Name: toName,
          },
        ],
        TemplateID: templateId, 
        TemplateLanguage: true,
        Variables: {
          nombres: variables.nombres,
          motivo: variables.motivo // Incluye el motivo si es un correo de rechazo o deshabilitación
        },
      },
    ],
  });

  return request;
};

// Endpoint para manejar el envío de correos
app.post('/send-email', (req, res) => {
  const { toEmail, toName, variables, action } = req.body;

  sendEmail(toEmail, toName, variables, action)
    .then((result) => {
      console.log('Correo enviado:', result.body);
      res.status(200).send('Correo enviado');
    })
    .catch((err) => {
      console.error('Error al enviar el correo:', err);
      res.status(500).send('Error al enviar el correo');
    });
});

// Iniciar el servidor
app.listen(5000, () => {
  console.log('Servidor corriendo en el puerto 5000');
});

