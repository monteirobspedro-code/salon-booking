const sessionStore = require('./sessionStore');
const welcomeStep = require('./steps/welcomeStep');
const serviceStep = require('./steps/serviceStep');
const dateStep = require('./steps/dateStep');
const timeStep = require('./steps/timeStep');
const confirmStep = require('./steps/confirmStep');
const cancelStep = require('./steps/cancelStep');

const CANCEL_KEYWORDS = ['annuler', 'annule', 'cancel', 'supprimer'];
const HELP_KEYWORDS = ['aide', 'help', '?'];

function handle(phone, rawBody) {
  const body = rawBody.trim();
  const lower = body.toLowerCase();
  const session = sessionStore.get(phone) || { state: 'IDLE', data: {} };

  // Keywords globaux
  if (HELP_KEYWORDS.some(k => lower === k)) {
    return 'Commandes disponibles :\n• *annuler* : annuler un rendez-vous\n• Tout autre message : démarrer une réservation';
  }

  if (CANCEL_KEYWORDS.some(k => lower.includes(k)) && session.state !== 'AWAITING_CANCEL_CONFIRM') {
    return cancelStep.handleKeyword(phone);
  }

  switch (session.state) {
    case 'IDLE':
      return welcomeStep.handle(phone);

    case 'AWAITING_SERVICE':
      return serviceStep.handle(phone, body);

    case 'AWAITING_DATE':
      return dateStep.handle(phone, body);

    case 'AWAITING_TIME':
      return timeStep.handle(phone, body, session);

    case 'AWAITING_CONFIRM':
      return confirmStep.handle(phone, body, session);

    case 'AWAITING_CANCEL_CONFIRM':
      return cancelStep.handleConfirm(phone, body, session);

    default:
      sessionStore.reset(phone);
      return welcomeStep.handle(phone);
  }
}

module.exports = { handle };
