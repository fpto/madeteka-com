/**
 * Google Apps Script — Backend para Cotizaciones Madeteka
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Ir a https://script.google.com y crear un nuevo proyecto
 * 2. Pegar este código en el archivo Code.gs
 * 3. Ir a Configuración del proyecto > Mostrar archivo de manifiesto "appsscript.json"
 * 4. En appsscript.json, agregar: "oauthScopes": ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/gmail.send"]
 * 5b. IMPORTANTE: Para enviar desde hola@madeteka.com, ese alias debe estar configurado en Gmail:
 *     Gmail > Configuración > Cuentas > "Enviar como" > agregar hola@madeteka.com
 * 5. Desplegar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Tu cuenta
 *    - Acceso: Cualquier persona
 * 6. Copiar la URL de despliegue y pegarla en cotizar.html (constante APPS_SCRIPT_URL)
 *
 * SPREADSHEET ID: 10LORdoEZqpgQiB-2KPPl_Nf_jKO5mOa4S51l3eq2ofM
 */

const SPREADSHEET_ID = '10LORdoEZqpgQiB-2KPPl_Nf_jKO5mOa4S51l3eq2ofM';
const SHEET_NAME = 'Cotizaciones'; // Nombre de la hoja — se crea si no existe

// URL del logo para el email (versión oscura sobre fondo claro)
const LOGO_URL = 'https://www.novacasahn.com/wp-content/uploads/2026/01/Logo-horizontal-Madeteka-1.png';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. Guardar en Google Sheet
    saveToSheet(data);

    // 2. Enviar email al cliente
    sendQuoteEmail(data);

    // 3. Enviar notificación interna
    sendInternalNotification(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Cotización registrada' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Cotizaciones Madeteka API activa' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────
// GUARDAR EN GOOGLE SHEET
// ─────────────────────────────────────────────
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Crear la hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Fecha',
      'Nombre',
      'Apellido',
      'Teléfono',
      'Email',
      'Cantidad Puertas',
      'Detalle Puertas',
      'Total (L)',
      'Idioma',
      'Estado',
    ]);
    // Formatear encabezado
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#2D4221').setFontColor('#F5F2E9');
    sheet.setFrozenRows(1);
  } else {
    // Si la hoja existe pero no tiene la columna "Estado", agregarla
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('Estado') === -1) {
      const nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue('Estado')
        .setFontWeight('bold').setBackground('#2D4221').setFontColor('#F5F2E9');
    }
  }

  // Construir detalle de puertas
  const doorDetails = data.doors.map(function(d) {
    return '#' + d.numero + ' ' + d.modelo + ' — ' + (d.sizeType === 'standard' ? 'Estándar' : 'Personalizado: ' + d.boquete) + ' — L ' + formatNumber(d.precio);
  }).join('\n');

  // Agregar fila
  sheet.appendRow([
    new Date(),
    data.customer.nombre,
    data.customer.apellido,
    data.customer.telefono,
    data.customer.email,
    data.totalDoors,
    doorDetails,
    data.totalPrice,
    data.lang || 'es',
    'Cotización Enviada',
  ]);
}

// ─────────────────────────────────────────────
// EMAIL AL CLIENTE
// ─────────────────────────────────────────────
function sendQuoteEmail(data) {
  const isEnglish = data.lang === 'en';
  const customerName = data.customer.nombre;

  const subject = isEnglish
    ? 'Madeteka — Your Custom Quote'
    : 'Madeteka — Su Cotización Personalizada';

  const htmlBody = buildEmailHTML(data, isEnglish);

  GmailApp.sendEmail(data.customer.email, subject, '', {
    htmlBody: htmlBody,
    name: 'Madeteka',
    from: 'hola@madeteka.com',
    replyTo: 'hola@madeteka.com',
  });
}

// ─────────────────────────────────────────────
// NOTIFICACIÓN INTERNA
// ─────────────────────────────────────────────
function sendInternalNotification(data) {
  const subject = 'Nueva Cotización — ' + data.customer.nombre + ' ' + data.customer.apellido + ' (' + data.totalDoors + ' puertas)';

  const doorLines = data.doors.map(function(d) {
    return '  #' + d.numero + ' ' + d.modelo + ' — ' + (d.sizeType === 'standard' ? 'Estándar' : d.boquete) + ' — L ' + formatNumber(d.precio);
  }).join('\n');

  const body = 'NUEVA COTIZACIÓN MADETEKA\n'
    + '========================\n\n'
    + 'Cliente: ' + data.customer.nombre + ' ' + data.customer.apellido + '\n'
    + 'Teléfono: ' + data.customer.telefono + '\n'
    + 'Email: ' + data.customer.email + '\n\n'
    + 'Puertas (' + data.totalDoors + '):\n'
    + doorLines + '\n\n'
    + 'TOTAL: L ' + formatNumber(data.totalPrice) + '\n';

  // Enviar al email del propietario del script
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), subject, body, {
    name: 'Sistema Madeteka',
    from: 'hola@madeteka.com',
  });
}

// ─────────────────────────────────────────────
// CONSTRUIR HTML DEL EMAIL
// ─────────────────────────────────────────────
function buildEmailHTML(data, isEnglish) {
  var doorRows = '';
  for (var i = 0; i < data.doors.length; i++) {
    var d = data.doors[i];
    var sizeText = d.sizeType === 'standard'
      ? (isEnglish ? 'Standard (36" × 80")' : 'Estándar (36" × 80")')
      : (isEnglish ? 'Custom: ' : 'Personalizado: ') + d.boquete;

    doorRows += '<tr style="border-bottom:1px solid #e5e5e5;">'
      + '<td style="padding:12px 16px; font-size:14px; color:#5E6B56;">' + d.numero + '</td>'
      + '<td style="padding:12px 16px; font-size:14px; font-weight:600; color:#2D4221;">' + d.modelo + '</td>'
      + '<td style="padding:12px 16px; font-size:14px; color:#5E6B56;">' + sizeText + '</td>'
      + '<td style="padding:12px 16px; font-size:14px; font-weight:600; color:#2D4221; text-align:right;">L ' + formatNumber(d.precio) + '</td>'
      + '</tr>';
  }

  var greeting = isEnglish
    ? 'Dear ' + data.customer.nombre + ','
    : 'Estimado/a ' + data.customer.nombre + ',';

  var intro = isEnglish
    ? 'Thank you for your interest in Madeteka. Here is your personalized quote:'
    : 'Gracias por su interés en Madeteka. A continuación, su cotización personalizada:';

  var paymentTitle = isEnglish ? 'Payment Terms' : 'Condiciones de Pago';
  var paymentItems = isEnglish
    ? [
        'Deposit upon order confirmation, balance upon delivery.',
        'Estimated delivery time: 1 month.',
        'Includes mahogany door frame and trim (contramarco y mochetas).',
        'Free delivery within the urban area of San Pedro Sula.',
      ]
    : [
        'Anticipo al confirmar el pedido, saldo contra entrega.',
        'Tiempo de entrega estimado: 1 mes.',
        'Incluye contramarco y mochetas de caoba.',
        'Envío gratis en el casco urbano de San Pedro Sula.',
      ];

  var validityText = isEnglish
    ? 'This quote is valid for 15 days from the date of issue.'
    : 'Esta cotización tiene una validez de 15 días a partir de la fecha de emisión.';

  var ctaText = isEnglish ? 'Confirm via WhatsApp' : 'Confirmar por WhatsApp';
  var closingText = isEnglish
    ? 'We look forward to crafting your doors.'
    : 'Será un gusto fabricar sus puertas.';

  var paymentItemsHTML = '';
  for (var j = 0; j < paymentItems.length; j++) {
    paymentItemsHTML += '<li style="margin-bottom:6px; color:#5E6B56; font-size:14px;">' + paymentItems[j] + '</li>';
  }

  var whatsappMsg = encodeURIComponent('Hola, acabo de recibir mi cotización. Me gustaría confirmar el pedido. Mi nombre es ' + data.customer.nombre + ' ' + data.customer.apellido + '.');

  var html = '<!DOCTYPE html>'
    + '<html><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0; padding:0; background-color:#F5F2E9; font-family:Arial, Helvetica, sans-serif;">'
    + '<div style="max-width:600px; margin:0 auto; background-color:#F5F2E9;">'

    // Header
    + '<div style="background-color:#2D4221; padding:30px 40px; text-align:center;">'
    + '<img src="' + LOGO_URL + '" width="180" alt="Madeteka" style="display:inline-block; filter:brightness(0) invert(1);">'
    + '</div>'

    // Content
    + '<div style="padding:40px 40px 20px 40px;">'
    + '<h1 style="color:#2D4221; font-size:24px; font-weight:300; margin:0 0 8px 0;">'
    + (isEnglish ? 'Your Custom Quote' : 'Cotización Personalizada')
    + '</h1>'
    + '<div style="width:50px; height:2px; background-color:#C5A059; margin-bottom:24px;"></div>'
    + '<p style="color:#2D4221; font-size:16px; margin:0 0 8px 0;">' + greeting + '</p>'
    + '<p style="color:#5E6B56; font-size:15px; line-height:1.6; margin:0 0 24px 0;">' + intro + '</p>'
    + '</div>'

    // Quote Table
    + '<div style="padding:0 40px;">'
    + '<table style="width:100%; border-collapse:collapse; margin-bottom:24px;" cellpadding="0" cellspacing="0">'
    + '<thead>'
    + '<tr style="background-color:#2D4221;">'
    + '<th style="padding:12px 16px; font-size:12px; font-weight:700; color:#F5F2E9; text-align:left; text-transform:uppercase; letter-spacing:1px;">#</th>'
    + '<th style="padding:12px 16px; font-size:12px; font-weight:700; color:#F5F2E9; text-align:left; text-transform:uppercase; letter-spacing:1px;">' + (isEnglish ? 'Model' : 'Modelo') + '</th>'
    + '<th style="padding:12px 16px; font-size:12px; font-weight:700; color:#F5F2E9; text-align:left; text-transform:uppercase; letter-spacing:1px;">' + (isEnglish ? 'Size' : 'Tamaño') + '</th>'
    + '<th style="padding:12px 16px; font-size:12px; font-weight:700; color:#F5F2E9; text-align:right; text-transform:uppercase; letter-spacing:1px;">' + (isEnglish ? 'Price' : 'Precio') + '</th>'
    + '</tr>'
    + '</thead>'
    + '<tbody style="background-color:#ffffff;">'
    + doorRows
    + '</tbody>'
    + '<tfoot>'
    + '<tr style="background-color:#2D4221;">'
    + '<td colspan="3" style="padding:14px 16px; font-size:16px; font-weight:700; color:#F5F2E9;">TOTAL</td>'
    + '<td style="padding:14px 16px; font-size:18px; font-weight:700; color:#C5A059; text-align:right;">L ' + formatNumber(data.totalPrice) + '</td>'
    + '</tr>'
    + '</tfoot>'
    + '</table>'
    + '</div>'

    // Payment Terms
    + '<div style="padding:0 40px 20px 40px;">'
    + '<div style="background-color:#ffffff; border-left:4px solid #C5A059; padding:20px 24px; border-radius:0 8px 8px 0;">'
    + '<h3 style="color:#2D4221; font-size:14px; font-weight:700; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:1px;">' + paymentTitle + '</h3>'
    + '<ul style="margin:0; padding-left:20px;">'
    + paymentItemsHTML
    + '</ul>'
    + '</div>'
    + '</div>'

    // Validity
    + '<div style="padding:0 40px 24px 40px;">'
    + '<p style="color:#5E6B56; font-size:13px; font-style:italic;">' + validityText + '</p>'
    + '</div>'

    // CTA Button
    + '<div style="padding:0 40px 30px 40px; text-align:center;">'
    + '<a href="https://wa.me/50432945241?text=' + whatsappMsg + '" style="display:inline-block; background-color:#2D4221; color:#F5F2E9; padding:14px 36px; border-radius:30px; text-decoration:none; font-size:16px; font-weight:600;">'
    + ctaText
    + '</a>'
    + '</div>'

    // Closing
    + '<div style="padding:0 40px 30px 40px;">'
    + '<p style="color:#2D4221; font-size:15px;">' + closingText + '</p>'
    + '<p style="color:#2D4221; font-size:15px; font-weight:600; margin:4px 0 0 0;">— Madeteka</p>'
    + '</div>'

    // Footer
    + '<div style="background-color:#2D4221; padding:24px 40px; text-align:center;">'
    + '<p style="color:#F5F2E9; font-size:13px; margin:0 0 4px 0; opacity:0.9;">Madeteka · Artesanía en Caoba</p>'
    + '<p style="color:#F5F2E9; font-size:12px; margin:0 0 4px 0; opacity:0.6;">Plaza Mahanaim, Sector Palenque, San Pedro Sula, Honduras</p>'
    + '<p style="color:#F5F2E9; font-size:12px; margin:0 0 12px 0; opacity:0.6;">WhatsApp: +504 3294 5241</p>'
    + '<div style="margin-top:12px;">'
    + '<a href="https://www.instagram.com/lamadeteka/" style="color:#C5A059; text-decoration:none; font-size:12px; margin:0 8px;">Instagram</a>'
    + '<a href="https://www.facebook.com/lamadeteka" style="color:#C5A059; text-decoration:none; font-size:12px; margin:0 8px;">Facebook</a>'
    + '<a href="https://madeteka.com" style="color:#C5A059; text-decoration:none; font-size:12px; margin:0 8px;">madeteka.com</a>'
    + '</div>'
    + '</div>'

    + '</div>'
    + '</body></html>';

  return html;
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────
function formatNumber(num) {
  return Number(num).toLocaleString('es-HN');
}

// ─────────────────────────────────────────────
// FUNCIÓN DE PRUEBA
// ─────────────────────────────────────────────
function testQuote() {
  var testData = {
    customer: {
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '+504 9999-0000',
      email: 'test@example.com',
    },
    doors: [
      { numero: 1, modelo: 'Toscana', sizeType: 'standard', boquete: '38" × 81"', puerta: '36" × 80"', areaM2: '1.85', precio: 25000 },
      { numero: 2, modelo: 'Tokio', sizeType: 'custom', boquete: '48" × 96"', puerta: '46" × 95"', areaM2: '2.81', precio: 30000 },
    ],
    totalDoors: 2,
    totalPrice: 55000,
    lang: 'es',
  };

  // Solo construir el email para previsualizar (no enviar)
  var html = buildEmailHTML(testData, false);
  Logger.log(html);
}

// ─────────────────────────────────────────────
// MIGRACIÓN: Agregar columna "Estado" al sheet existente
// Ejecutar UNA VEZ desde el editor de Apps Script
// ─────────────────────────────────────────────
function addEstadoColumn() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('Hoja no encontrada'); return; }

  // Si la hoja está vacía, crear los headers completos
  if (sheet.getLastColumn() === 0) {
    sheet.appendRow([
      'Fecha', 'Nombre', 'Apellido', 'Teléfono', 'Email',
      'Cantidad Puertas', 'Detalle Puertas', 'Total (L)', 'Idioma', 'Estado'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#2D4221').setFontColor('#F5F2E9');
    sheet.setFrozenRows(1);
    Logger.log('Headers creados con columna "Estado"');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('Estado') !== -1) {
    Logger.log('La columna "Estado" ya existe');
    return;
  }

  const nextCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextCol).setValue('Estado')
    .setFontWeight('bold').setBackground('#2D4221').setFontColor('#F5F2E9');

  // Poner "Cotización Enviada" en todas las filas existentes
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const range = sheet.getRange(2, nextCol, lastRow - 1, 1);
    const values = [];
    for (var i = 0; i < lastRow - 1; i++) {
      values.push(['Cotización Enviada']);
    }
    range.setValues(values);
  }

  Logger.log('Columna "Estado" agregada exitosamente con ' + (lastRow - 1) + ' filas actualizadas');
}
