const bookingView = document.getElementById('bookingView');
const ticketView = document.getElementById('ticketView');
const flightView = document.getElementById('flightView');
const landingView = document.getElementById('landingView');
const form = document.getElementById('flightForm');
const toast = document.getElementById('flightToast');
let flightTimer;
let remainingSeconds = 2700;
let activeFlight;
let toastTimer;
let currentPhase;
const fallbackClip = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const masterClip = '../media/flight/clips/gemini_generated_video_09c1b3d1.mp4';
const phaseClips = {
  BOARDING: '/media/flight/clips/boarding.mp4',
  PUSHBACK: '/media/flight/clips/pushback.mp4',
  CRUISE: '/media/flight/clips/gemini_generated_video_09c1b3d1.mp4',
  DESCENT: '/media/flight/clips/descent.mp4',
  LANDING: '/media/flight/clips/landing.mp4'
};
const windowVideo = document.querySelector('.window-video');

windowVideo.addEventListener('error', () => {
  if (windowVideo.dataset.fallback === 'true') return;
  windowVideo.dataset.fallback = 'true';
  windowVideo.src = fallbackClip;
  windowVideo.load();
  windowVideo.play().catch(() => {});
  document.querySelector('.window-source').textContent = `${document.getElementById('hudPhase').textContent} VIEW · ONLINE FALLBACK`;
});

const airports = {
  MAA: 'Chennai', BOM: 'Mumbai', DEL: 'New Delhi', BLR: 'Bengaluru', HYD: 'Hyderabad',
  SIN: 'Singapore', BKK: 'Bangkok', HKG: 'Hong Kong', ICN: 'Seoul', NRT: 'Tokyo Narita', SYD: 'Sydney', MEL: 'Melbourne',
  DXB: 'Dubai', DOH: 'Doha', LHR: 'London Heathrow', AMS: 'Amsterdam', CDG: 'Paris Charles de Gaulle', FRA: 'Frankfurt', IST: 'Istanbul',
  JFK: 'New York', SFO: 'San Francisco', LAX: 'Los Angeles', ORD: 'Chicago', YYZ: 'Toronto'
};
const airportCodes = ['MAA', 'BOM', 'DEL', 'BLR', 'HYD', 'SIN', 'BKK', 'HKG', 'ICN', 'NRT', 'SYD', 'MEL', 'DXB', 'DOH', 'LHR', 'AMS', 'CDG', 'FRA', 'IST', 'JFK', 'SFO', 'LAX', 'ORD', 'YYZ'];

function populateAirportSelect(id) {
  const select = document.getElementById(id);
  const selected = select.value;
  select.innerHTML = airportCodes.map((code) => `<option value="${code}">${airports[code]} (${code})</option>`).join('');
  select.value = airports[selected] ? selected : (id === 'departure' ? 'MAA' : 'SIN');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function getChoice(name) { return document.querySelector(`input[name="${name}"]:checked`).value; }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function updatePreview() {
  const departure = document.getElementById('departure').value;
  const destination = document.getElementById('destination').value;
  document.getElementById('mapDeparture').textContent = departure;
  document.getElementById('mapDestination').textContent = destination;
  const ticketLink = document.querySelector('a[href^="ticket-showcase.html"]');
  if (ticketLink) ticketLink.href = `ticket-showcase.html?from=${departure}&destination=${destination}`;
  const duration = Number(getChoice('duration'));
  const landing = new Date(Date.now() + duration * 60000);
  document.getElementById('landingTime').textContent = landing.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

document.querySelectorAll('input[name="duration"], input[name="category"]').forEach((input) => input.addEventListener('change', (event) => {
  const group = event.target.name;
  document.querySelectorAll(`input[name="${group}"]`).forEach((item) => item.closest('label').classList.toggle('selected', item.checked));
  updatePreview();
}));
document.querySelectorAll('select').forEach((select) => select.addEventListener('change', updatePreview));

function populateFlight(data) {
  const route = `${data.departure} → ${data.destination}`;
  document.getElementById('flightRoute').textContent = route;
  document.getElementById('activeFlightNumber').textContent = data.number;
  document.getElementById('flightCategory').textContent = `${data.category.toUpperCase()} · IN FLIGHT`;
  document.getElementById('hudRoute').textContent = route;
  document.getElementById('hudCategory').textContent = data.category.toUpperCase();
  document.getElementById('hudSeat').textContent = `${data.seat} WINDOW`;
  document.getElementById('hudFlightNumber').textContent = data.number;
  document.getElementById('largeDeparture').textContent = airports[data.departure];
  document.getElementById('largeDepartureCode').textContent = data.departure;
  document.getElementById('largeDestination').textContent = airports[data.destination];
  document.getElementById('largeDestinationCode').textContent = data.destination;
  document.getElementById('detailCategory').textContent = data.category;
  document.getElementById('detailDuration').textContent = `${data.duration} minutes`;
  document.getElementById('completedRoute').textContent = route;
  document.getElementById('completedCategory').textContent = data.category;
  document.getElementById('completedDuration').textContent = `${data.duration} min`;
  document.getElementById('ticketDepartureCode').textContent = data.departure;
  document.getElementById('ticketDepartureName').textContent = airports[data.departure];
  document.getElementById('ticketDestinationCode').textContent = data.destination;
  document.getElementById('ticketDestinationName').textContent = airports[data.destination];
  document.getElementById('ticketNumber').textContent = data.number;
  document.getElementById('ticketLanding').textContent = data.landingTime;
  document.getElementById('ticketCategory').textContent = data.category.toUpperCase();
  document.getElementById('ticketDuration').textContent = `${data.duration} minutes`;
  document.getElementById('ticketSeat').textContent = data.seat;
  document.getElementById('ticketGate').textContent = data.gate;
  document.getElementById('ticketGroup').textContent = data.group;
}

function showTicket(data) {
  activeFlight = data;
  populateFlight(data);
  bookingView.hidden = true;
  flightView.hidden = true;
  landingView.hidden = true;
  ticketView.hidden = false;
  showToast('Ticket issued. Boarding is ready.');
}

function beginFlight(data) {
  activeFlight = data;
  remainingSeconds = data.duration * 60;
  localStorage.setItem('focusFlightActive', JSON.stringify({ ...data, startedAt: Date.now() }));
  window.location.href = 'cruise.html';
}

function tick() {
  const formattedTime = formatTime(remainingSeconds);
  document.getElementById('countdown').textContent = formattedTime;
  document.getElementById('topCountdown').textContent = formattedTime;
  const progress = ((activeFlight.duration * 60 - remainingSeconds) / (activeFlight.duration * 60)) * 100;
  document.getElementById('timerProgress').style.width = `${Math.max(3, progress)}%`;
  document.getElementById('topProgress').style.width = `${Math.max(3, progress)}%`;
  const phase = progress < 3 ? 'BOARDING' : progress < 12 ? 'PUSHBACK' : progress < 78 ? 'CRUISE' : progress < 94 ? 'DESCENT' : 'LANDING';
  document.getElementById('hudPhase').textContent = phase;
  document.querySelector('.window-source').textContent = `${phase} VIEW · ${windowVideo.dataset.fallback === 'true' ? 'ONLINE FALLBACK' : 'MASTER LOOP'}`;
  if (phase !== currentPhase) {
    currentPhase = phase;
    if (windowVideo.dataset.masterClip !== 'true') {
      windowVideo.dataset.fallback = 'false';
      windowVideo.src = phaseClips[phase];
      windowVideo.load();
      windowVideo.play().catch(() => {});
    }
  }
  if (remainingSeconds <= 0) completeFlight();
  remainingSeconds -= 1;
}

function completeFlight() {
  clearInterval(flightTimer);
  localStorage.removeItem('focusFlightActive');
  localStorage.setItem('focusFlightLastCompleted', JSON.stringify({ ...activeFlight, completedAt: Date.now() }));
  flightView.hidden = true;
  landingView.hidden = false;
  document.getElementById('landingMessage').textContent = `${activeFlight.duration} minutes of focused work are now yours.`;
  showToast('Flight landed. Focus time credited.');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const duration = Number(getChoice('duration'));
  const landing = new Date(Date.now() + duration * 60000);
  showTicket({ departure: document.getElementById('departure').value, destination: document.getElementById('destination').value, duration, category: getChoice('category'), number: document.getElementById('flightNumber').textContent, landingTime: landing.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), seat: '14A', gate: 'F04', group: 'FOCUS 1' });
});

document.getElementById('boardButton').addEventListener('click', () => beginFlight(activeFlight));
document.getElementById('editTicketButton').addEventListener('click', () => { ticketView.hidden = true; bookingView.hidden = false; });

document.getElementById('endFlightButton').addEventListener('click', () => {
  if (!confirm('End this flight early? No focus time will be credited.')) return;
  clearInterval(flightTimer);
  localStorage.removeItem('focusFlightActive');
  flightView.hidden = true;
  ticketView.hidden = true;
  bookingView.hidden = false;
  showToast('Flight abandoned. No focus time credited.');
});
document.getElementById('bookAgainButton').addEventListener('click', () => { landingView.hidden = true; ticketView.hidden = true; bookingView.hidden = false; });
document.getElementById('ambientButton').addEventListener('click', (event) => { event.currentTarget.textContent = event.currentTarget.textContent.includes('on') ? '◉ Ambient' : '◉ Ambient on'; showToast('Ambient cabin setting updated'); });
document.getElementById('soundButton').addEventListener('click', (event) => { event.currentTarget.textContent = event.currentTarget.textContent.includes('on') ? '♬ Sound off' : '♬ Sound on'; showToast('Sound setting updated'); });

const recovered = JSON.parse(localStorage.getItem('focusFlightActive') || 'null');
if (recovered) { localStorage.removeItem('focusFlightActive'); showToast('Previous flight marked abandoned after recovery.'); }
populateAirportSelect('departure');
populateAirportSelect('destination');
updatePreview();
