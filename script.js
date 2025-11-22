// ===================================
// VARIABLES GLOBALES Y ESTADO
// ===================================

// Array para almacenar los participantes
let participants = [];

// Referencia a Luxon DateTime
const DateTime = luxon.DateTime;

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar la fecha por defecto (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    document.getElementById('meetingDate').value = dateString;

    // Agregar participantes de ejemplo
    addParticipantToList('Equipo Buenos Aires', 'America/Buenos_Aires');
    addParticipantToList('Equipo New York', 'America/New_York');

    // Event listeners para los botones
    document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);
    document.getElementById('calculateBtn').addEventListener('click', calculateTimezones);
    document.getElementById('generateMessageBtn').addEventListener('click', generateMessage);
    document.getElementById('copyBtn').addEventListener('click', copyMessage);

    // Permitir agregar participante con Enter
    document.getElementById('participantName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });
});

// ===================================
// GESTIÓN DE PARTICIPANTES
// ===================================

/**
 * Agrega un nuevo participante desde el formulario
 */
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const timezoneSelect = document.getElementById('participantTimezone');
    
    const name = nameInput.value.trim();
    const timezone = timezoneSelect.value;
    
    // Validación
    if (!name) {
        showError('Please, add a name for the participant');
        return;
    }
    
    // Agregar a la lista
    addParticipantToList(name, timezone);
    
    // Limpiar el formulario
    nameInput.value = '';
    timezoneSelect.selectedIndex = 0;
    nameInput.focus();
    
    // Ocultar mensaje de error si existe
    hideError();
}

/**
 * Agrega un participante a la lista interna y actualiza la UI
 */
function addParticipantToList(name, timezone) {
    // Crear objeto participante
    const participant = {
        id: Date.now() + Math.random(), // ID único
        name: name,
        timezone: timezone
    };
    
    // Agregar al array
    participants.push(participant);
    
    // Actualizar la UI
    renderParticipants();
}

/**
 * Elimina un participante de la lista
 */
function removeParticipant(id) {
    participants = participants.filter(p => p.id !== id);
    renderParticipants();
}

/**
 * Renderiza la lista de participantes en el DOM
 */
function renderParticipants() {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = participants.map(participant => {
        // Obtener nombre legible de la zona horaria (solo ciudad)
        const cityName = getCityName(participant.timezone);
        
        return `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-name">${escapeHtml(participant.name)}</div>
                    <div class="participant-timezone">${cityName}</div>
                </div>
                <button 
                    class="btn btn-danger" 
                    onclick="removeParticipant(${participant.id})"
                >
                    Delete
                </button>
            </div>
        `;
    }).join('');
}

// ===================================
// CÁLCULO DE ZONAS HORARIAS
// ===================================

/**
 * Calcula y muestra los horarios convertidos para todos los participantes
 */
function calculateTimezones() {
    // Validaciones
    const title = document.getElementById('meetingTitle').value.trim();
    const date = document.getElementById('meetingDate').value;
    const time = document.getElementById('meetingTime').value;
    const baseTimezone = document.getElementById('baseTimezone').value;
    
    if (!title) {
        showError('Please, add a heading title');
        return;
    }
    
    if (!date || !time) {
        showError('Please fill in the date, time, and base time zone.');
        return;
    }
    
    if (participants.length === 0) {
        showError('Please add at least one participant.');
        return;
    }
    
    hideError();
    
    // Crear DateTime en la zona horaria base
    const baseDateTime = DateTime.fromISO(`${date}T${time}`, { zone: baseTimezone });
    
    // Verificar que la fecha sea válida
    if (!baseDateTime.isValid) {
        showError('La fecha y hora seleccionadas no son válidas');
        return;
    }
    
    // Calcular conversiones para cada participante
    const conversions = participants.map(participant => {
        // Convertir a la zona horaria del participante
        const participantDateTime = baseDateTime.setZone(participant.timezone);
        
        return {
            name: participant.name,
            timezone: participant.timezone,
            cityName: getCityName(participant.timezone),
            dateTime: participantDateTime,
            formatted: formatDateTime(participantDateTime, 'es') // Siempre en español para la tabla
        };
    });
    
    // Renderizar resultados
    renderTimezoneResults(conversions, baseDateTime, baseTimezone);
}

/**
 * Renderiza los resultados de las conversiones de zona horaria
 */
function renderTimezoneResults(conversions, baseDateTime, baseTimezone) {
    const container = document.getElementById('timezoneResults');
    const baseCityName = getCityName(baseTimezone);
    const baseFormatted = formatDateTime(baseDateTime, 'es');
    
    // Renderizar como tabla (para desktop)
    const tableHTML = `
        <h3>
            📍 Hora base: <strong>${baseFormatted}</strong> (${baseCityName})
        </h3>
        <table class="timezone-table">
            <thead>
                <tr>
                    <th>Participante</th>
                    <th>Ubicación</th>
                    <th>Hora local</th>
                </tr>
            </thead>
            <tbody>
                ${conversions.map(conv => `
                    <tr>
                        <td>
                            <div class="timezone-name">${escapeHtml(conv.name)}</div>
                        </td>
                        <td>
                            <div class="timezone-location">${conv.cityName}</div>
                        </td>
                        <td>
                            <div class="timezone-time">${conv.formatted}</div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Renderizar como cards (para móvil)
    const cardsHTML = `
        <div class="timezone-cards">
            ${conversions.map(conv => `
                <div class="timezone-card">
                    <div class="timezone-card-header">
                        <div class="timezone-name">${escapeHtml(conv.name)}</div>
                        <div class="timezone-location">${conv.cityName}</div>
                    </div>
                    <div class="timezone-card-time">${conv.formatted}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = tableHTML + cardsHTML;
    container.style.display = 'block';
}

// ===================================
// GENERACIÓN DEL MENSAJE
// ===================================

/**
 * Genera el mensaje de invitación
 */
function generateMessage() {
    // Validaciones
    const title = document.getElementById('meetingTitle').value.trim();
    const date = document.getElementById('meetingDate').value;
    const time = document.getElementById('meetingTime').value;
    const baseTimezone = document.getElementById('baseTimezone').value;
    const language = document.getElementById('language').value;
    
    if (!title) {
        showError('Por favor, ingresa un título para la reunión');
        return;
    }
    
    if (!date || !time) {
        showError('Por favor, selecciona una fecha y hora para la reunión');
        return;
    }
    
    if (participants.length === 0) {
        showError('Por favor, agrega al menos un participante antes de generar el mensaje');
        return;
    }
    
    hideError();
    
    // Crear DateTime en la zona horaria base
    const baseDateTime = DateTime.fromISO(`${date}T${time}`, { zone: baseTimezone });
    
    if (!baseDateTime.isValid) {
        showError('La fecha y hora seleccionadas no son válidas');
        return;
    }
    
    // Calcular conversiones
    const conversions = participants.map(participant => {
        const participantDateTime = baseDateTime.setZone(participant.timezone);
        return {
            name: participant.name,
            timezone: participant.timezone,
            cityName: getCityName(participant.timezone),
            dateTime: participantDateTime,
            formatted: formatDateTime(participantDateTime, language)
        };
    });
    
    // Generar el mensaje según el idioma
    let message;
    if (language === 'es') {
        message = generateSpanishMessage(title, baseDateTime, baseTimezone, conversions);
    } else {
        message = generateEnglishMessage(title, baseDateTime, baseTimezone, conversions);
    }
    
    // Mostrar el mensaje
    document.getElementById('generatedMessage').value = message;
    document.getElementById('messageSection').style.display = 'block';
    document.getElementById('copySuccess').style.display = 'none';
    
    // Scroll suave al mensaje
    document.getElementById('messageSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Genera el mensaje en español
 */
function generateSpanishMessage(title, baseDateTime, baseTimezone, conversions) {
    const baseFormatted = formatDateTime(baseDateTime, 'es');
    const baseCityName = getCityName(baseTimezone);
    
    let message = `Hola,

Te comparto los detalles de nuestra reunión: "${title}".

_____________________________________________

Fecha y hora de referencia:
${baseFormatted}
${baseCityName}

Horario para cada participante:

`;
    
    conversions.forEach(conv => {
        message += `- ${conv.name}\n  ${conv.formatted}\n  ${conv.cityName}\n\n`;
    });
    
    message += `_____________________________________________

Si ves algún error en tu horario local, por favor avísame.

¡Nos vemos en la reunión!`;
    
    return message;
}

/**
 * Genera el mensaje en inglés
 */
function generateEnglishMessage(title, baseDateTime, baseTimezone, conversions) {
    const baseFormatted = formatDateTime(baseDateTime, 'en');
    const baseCityName = getCityName(baseTimezone);
    
    let message = `Hi,

Here are the details for our meeting: "${title}".

_____________________________________________

Reference date and time:
${baseFormatted}
${baseCityName}

Local time for each participant:

`;
    
    conversions.forEach(conv => {
        message += `- ${conv.name}\n  ${conv.formatted}\n  ${conv.cityName}\n\n`;
    });
    
    message += `_____________________________________________

If you notice any issue with your local time, please let me know.

Looking forward to our meeting!`;
    
    return message;
}

/**
 * Copia el mensaje al portapapeles
 */
async function copyMessage() {
    const messageText = document.getElementById('generatedMessage').value;
    
    try {
        await navigator.clipboard.writeText(messageText);
        
        // Mostrar mensaje de éxito
        const successMsg = document.getElementById('copySuccess');
        successMsg.style.display = 'block';
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    } catch (err) {
        // Fallback para navegadores que no soportan clipboard API
        const textarea = document.getElementById('generatedMessage');
        textarea.select();
        document.execCommand('copy');
        
        const successMsg = document.getElementById('copySuccess');
        successMsg.style.display = 'block';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }
}

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

/**
 * Formatea una fecha/hora de Luxon a un string legible
 */
function formatDateTime(dateTime, language = 'es') {
    if (language === 'es') {
        // Formato español: Lunes, 22 de noviembre de 2025 – 15:00
        return dateTime.setLocale('es').toFormat("cccc, d 'de' LLLL 'de' yyyy – HH:mm");
    } else {
        // Formato inglés: Monday, November 22, 2025 – 3:00 PM
        return dateTime.setLocale('en').toFormat('cccc, LLLL d, yyyy – h:mm a');
    }
}

/**
 * Obtiene un nombre de ciudad limpio de una zona horaria IANA
 */
function getCityName(timezone) {
    // Extraer la ciudad de la zona horaria
    const parts = timezone.split('/');
    
    if (parts.length >= 2) {
        const city = parts[parts.length - 1].replace(/_/g, ' ');
        return city;
    }
    
    return timezone;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Scroll suave al error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Oculta el mensaje de error
 */
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

// ===================================
// NOTAS ADICIONALES
// ===================================

/*
Este script utiliza la librería Luxon para el manejo de zonas horarias.
Luxon maneja automáticamente:
- Conversiones entre zonas horarias
- Horario de verano (DST)
- Diferencias de offset
- Validación de fechas

El flujo principal es:
1. Usuario ingresa fecha/hora base y zona horaria
2. Usuario agrega participantes con sus zonas horarias
3. Al calcular, se convierte la fecha/hora base a cada zona horaria
4. Se generan los mensajes en el idioma seleccionado
5. Usuario puede copiar el mensaje al portapapeles

La aplicación valida que:
- Haya título de reunión
- Haya fecha y hora válidas
- Haya al menos un participante antes de calcular/generar
*/
