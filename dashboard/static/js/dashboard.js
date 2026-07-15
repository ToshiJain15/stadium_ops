// STADIUM OPERATIONS DASHBOARD CORE ENGINE — v1.1.0

// Initialize Default State (synced with window.stadiumState)
const state = window.stadiumState || {
  crowdCount: 84200,
  aiConfidence: 98.4,
  metroTime: 4,
  shuttleTime: 8,
  activeZone: null,
  activeTab: 'Intelligence',
  activeTier: 'lower',
  highContrast: false,
  wheelchairRouting: false,
  audioNavigation: false,
  autoTourActive: false,
  ecoPoints: 2450,
  ecoCO2: 42.0
};

// Get CSRF Token from meta tag
const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
};

// Toggle guided tour camera animations
window.toggleAutoTour = function() {
  state.autoTourActive = !state.autoTourActive;
  window.stadiumState.autoTourActive = state.autoTourActive;
  
  const tourBtn = document.getElementById('auto-tour-btn');
  if (tourBtn) {
    if (state.autoTourActive) {
      tourBtn.innerText = 'Stop Tour';
      tourBtn.className = 'btn-primary px-4 py-1.5 rounded-full text-xs animate-pulse';
      dispatchInfoAlert('Guided camera sweep active.');
    } else {
      tourBtn.innerText = 'Guided Tour';
      tourBtn.className = 'btn-outline px-4 py-1.5 rounded-full text-xs';
      dispatchInfoAlert('Guided camera sweep disabled.');
    }
  }
};

// Ensure window.stadiumState and local state are the same object reference
window.stadiumState = state;

// Dialect Language State
let conciergeLanguage = 'EN';

// --- SECURITY HELPER: Sanitize text to prevent XSS ---
function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML; // Now safely HTML-encoded
}

// Global Toast Alerts System
function dispatchAlert(type, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const alertId = 'alert_' + Math.random().toString(36).substr(2, 9);
  const typeLabel = type === 'critical' ? '🚨 Critical Alert' : type === 'warning' ? '⚠️ Warning' : 'ℹ️ Info';
  const borderCol = type === 'critical' ? 'border-l-[var(--error)]' : type === 'warning' ? 'border-l-[var(--primary)]' : 'border-l-[var(--success)]';

  const alertEl = document.createElement('div');
  alertEl.id = alertId;
  alertEl.className = `animate-fade-in glass-panel pointer-events-auto p-4 px-5 min-w-[300px] max-w-[400px] border-l-4 ${borderCol} flex justify-between items-center bg-[#1a1a1a]/95`;

  // Build DOM safely — NO innerHTML for user-supplied data
  const textDiv = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.className = 'm-0 mb-1 text-sm font-semibold text-[var(--foreground)]';
  h4.textContent = typeLabel;
  const p = document.createElement('p');
  p.className = 'm-0 text-xs text-white/70';
  p.textContent = String(message); // textContent is safe — no XSS
  textDiv.appendChild(h4);
  textDiv.appendChild(p);

  const dismissBtn = document.createElement('button');
  dismissBtn.setAttribute('onclick', `dismissAlert('${alertId}')`);
  dismissBtn.setAttribute('aria-label', 'Dismiss alert');
  dismissBtn.className = 'bg-transparent border-none text-white/50 cursor-pointer text-xl p-1 px-2 select-none';
  dismissBtn.textContent = '×';

  alertEl.appendChild(textDiv);
  alertEl.appendChild(dismissBtn);
  container.appendChild(alertEl);

  // Auto-dismiss alert after 5 seconds
  setTimeout(() => {
    dismissAlert(alertId);
  }, 5000);
}

function dismissAlert(alertId) {
  const alertEl = document.getElementById(alertId);
  if (alertEl) {
    alertEl.classList.add('opacity-0');
    alertEl.style.transition = 'all 0.3s';
    setTimeout(() => alertEl.remove(), 300);
  }
}

function dispatchInfoAlert(message) {
  dispatchAlert('info', message);
}

// Tab switcher logic
function switchActiveTab(tabId) {
  state.activeTab = tabId;

  // Toggle active tab buttons in bottom navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    const icon = btn.querySelector('.node-icon');
    if (icon) icon.classList.add('grayscale', 'opacity-50');
  });

  const activeNavBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeNavBtn) {
    activeNavBtn.classList.add('active');
    const icon = activeNavBtn.querySelector('.node-icon');
    if (icon) icon.classList.remove('grayscale', 'opacity-50');
  }

  // Toggle sidebar items active status
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    }
  });

  // Show selected section container
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.add('hidden');
  });

  const targetSec = document.getElementById(`tab-${tabId}`);
  if (targetSec) targetSec.classList.remove('hidden');

  // Toggle header sub-navigation bar content
  const subnavConcierge = document.getElementById('subnav-concierge');
  const subnavIntel = document.getElementById('subnav-intelligence');

  if (tabId === 'Concierge') {
    if (subnavConcierge) subnavConcierge.classList.remove('hidden');
    if (subnavIntel) subnavIntel.classList.add('hidden');
  } else if (tabId === 'Intelligence') {
    if (subnavConcierge) subnavConcierge.classList.add('hidden');
    if (subnavIntel) subnavIntel.classList.remove('hidden');
  } else {
    if (subnavConcierge) subnavConcierge.classList.add('hidden');
    if (subnavIntel) subnavIntel.classList.add('hidden');
  }

  // Close sidebar overlay when switching
  const sidebar = document.getElementById('sidebar-menu');
  if (sidebar) sidebar.classList.add('hidden');

  dispatchInfoAlert(`Navigated to ${tabId} Tab`);
}

// Sidebar open/close toggle
const sidebarBtn = document.getElementById('sidebar-toggle-btn');
if (sidebarBtn) {
  sidebarBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar-menu');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  });
}

// --- INTELLIGENCE TAB CHAT COPILOT ---
const chatSubmitBtn = document.getElementById('chat-submit-btn');
const chatInput = document.getElementById('chat-query-input');

if (chatSubmitBtn && chatInput) {
  chatSubmitBtn.addEventListener('click', submitChatQuery);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitChatQuery();
  });
}

/**
 * Submits a telemetry-enriched query to the GenAI chat endpoint.
 * Falls back to local mock engine on network/API failure.
 * @async
 * @returns {Promise<void>}
 */
async function submitChatQuery() {
  const queryText = chatInput.value.trim();
  if (!queryText) return;

  const btnLabel = document.getElementById('chat-btn-label');
  if (btnLabel) btnLabel.innerText = 'THINKING...';
  chatSubmitBtn.style.opacity = 0.6;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        prompt: queryText,
        context: `Crowd: ${state.crowdCount}, AI Confidence: ${state.aiConfidence}%, Metro Wait: ${state.metroTime}m`
      })
    });

    const data = await response.json();
    let reply = data.response || 'No operational advice generated.';
    if (data.mock_mode) {
      reply = '🟠 [FALLBACK MODE] ' + reply;
    }

    const panel = document.getElementById('chat-response-panel');
    const panelText = document.getElementById('chat-response-text');

    if (panel && panelText) {
      panelText.innerText = reply;
      panel.classList.remove('hidden');
    }
    chatInput.value = '';

  } catch (err) {
    dispatchAlert('critical', 'AI Core connection failed. Using local telemetry engine.');
  } finally {
    if (btnLabel) btnLabel.innerText = 'AI READY';
    chatSubmitBtn.style.opacity = 1;
  }
}

function dismissChatResponse() {
  const panel = document.getElementById('chat-response-panel');
  if (panel) panel.classList.add('hidden');
}

// --- CONCIERGE COMMAND APIS ---
const conciergeSubmitBtn = document.getElementById('concierge-submit-btn');
const conciergeInput = document.getElementById('concierge-query-input');

if (conciergeSubmitBtn && conciergeInput) {
  conciergeSubmitBtn.addEventListener('click', () => submitConciergeCommand());
  conciergeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitConciergeCommand();
  });
}

async function submitConciergeCommand(forcedText = null) {
  const queryText = forcedText || conciergeInput.value.trim();
  if (!queryText) return;

  if (conciergeSubmitBtn) {
    conciergeSubmitBtn.innerText = 'PROCESSING...';
    conciergeSubmitBtn.style.opacity = 0.7;
  }

  try {
    const response = await fetch('/api/concierge', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ prompt: queryText, language: conciergeLanguage })
    });

    const data = await response.json();
    let reply = data.response || 'Connection error. Please try again.';
    if (data.mock_mode) {
      reply = '🟠 [FALLBACK MODE] ' + reply;
    }

    const panel = document.getElementById('concierge-response-panel');
    const panelText = document.getElementById('concierge-response-text');

    if (panel && panelText) {
      panelText.innerText = reply;
      panel.classList.remove('hidden');
    }

    if (!forcedText && conciergeInput) {
      conciergeInput.value = '';
    }

  } catch (err) {
    dispatchAlert('warning', 'Royal server request error. Falling back to local concierge catalog.');
  } finally {
    if (conciergeSubmitBtn) {
      conciergeSubmitBtn.innerText = 'COMMAND';
      conciergeSubmitBtn.style.opacity = 1;
    }
  }
}

window.submitQuickConcierge = function(text) {
  dispatchInfoAlert(`Query sent: "${text}"`);
  speakIfEnabled(`Query sent: ${text}`);
  submitConciergeCommand(text);
};

window.selectConciergeLanguage = function(lang) {
  conciergeLanguage = lang;

  // Set active class on lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText.trim() === lang) btn.classList.add('active');
  });

  dispatchInfoAlert(`Language preference set to ${lang}`);
  speakIfEnabled(`Language set to ${lang}`);
};

window.toggleMoreLanguages = function() {
  const extraLangs = document.querySelectorAll('.extra-lang');
  const btn = document.getElementById('toggle-more-languages-btn');
  if (!btn) return;

  // Bug fix: guard against empty extraLangs NodeList
  if (extraLangs.length === 0) return;

  const isHidden = extraLangs[0].classList.contains('hidden');

  if (isHidden) {
    extraLangs.forEach(el => el.classList.remove('hidden'));
    btn.innerText = 'Show Less';
    dispatchInfoAlert('Expanded dialect preferences.');
  } else {
    extraLangs.forEach(el => el.classList.add('hidden'));
    btn.innerText = '+6 More';
    dispatchInfoAlert('Collapsed dialect preferences.');
  }
};

// Royal Journey timeline logs interaction
window.selectTimelineStage = function(index) {
  // Highlight active node
  document.querySelectorAll('.timeline-node').forEach((node, idx) => {
    node.classList.remove('active');
    node.style.transform = 'scale(1)';
    const circle = node.querySelector('.node-circle');

    if (idx === index) {
      node.classList.add('active');
      node.style.transform = 'scale(1.05)';
      if (circle) {
        circle.style.borderColor = 'var(--primary)';
        circle.style.boxShadow = '0 0 20px var(--primary-glow)';
      }
    } else {
      if (circle) {
        circle.style.borderColor = 'rgba(255,255,255,0.1)';
        circle.style.boxShadow = 'none';
      }
    }
  });

  const timelineItems = [
    {
      time: '14:00',
      title: 'CHAUFFEUR ARRIVAL',
      sub: 'West Gate Entry',
      icon: '🚙',
      details: 'Logistics details: Mercedes S-Class (License: VIP-QTR-1002). Escorted West Gate VIP drop-off complete. Guest luggage delivered directly to Elite Suite 402.'
    },
    {
      time: '15:30 (NOW)',
      title: 'HOSPITALITY SUITE',
      sub: 'Champagne Reception',
      icon: '🍽️',
      details: 'Logistics details: Dom Pérignon 2012 champagne served on arrival. Beluga caviar, white truffle bites, and personalized selection. Room climate stabilized at 21.5°C.'
    },
    {
      time: '18:00',
      title: 'MATCH KICKOFF',
      sub: 'Opening Ceremony',
      icon: '⚽',
      details: 'Logistics details: Opening Ceremony starts at 17:45. Executive Box 402 seating pre-registered. AI Guest Assist drone standby at suite door.'
    },
    {
      time: '21:30',
      title: 'VIP DEPARTURE',
      sub: 'Heliport Access',
      icon: '✈️',
      details: 'Logistics details: Private Airbus H160 helicopter flight scheduled from Sector North Heliport (Tail: A7-VIP). Pre-flight flight manifest and security cleared.'
    }
  ];

  const item = timelineItems[index];
  const detailsPanel = document.getElementById('timeline-details-panel');
  const detailsIcon = document.getElementById('timeline-details-icon');
  const detailsTime = document.getElementById('timeline-details-time');
  const detailsTitle = document.getElementById('timeline-details-title');
  const detailsText = document.getElementById('timeline-details-text');

  if (detailsPanel && item) {
    detailsIcon.innerText = item.icon;
    detailsTime.innerText = item.time;
    detailsTitle.innerText = `${item.title} (${item.sub})`;
    detailsText.innerText = item.details;
    detailsPanel.classList.remove('hidden');
  }

  dispatchInfoAlert(`Viewing schedule for: ${item.title}`);
  speakIfEnabled(`Viewing details for ${item.title}. ${item.details}`);
}

let navAnimationId = null;
let navProgress = 0;

window.animateLiveNavigation = function() {
  const canvas = document.getElementById('live-navigation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  function draw() {
    const modal = document.getElementById('modal-nav');
    if (!modal || modal.classList.contains('hidden')) {
      if (navAnimationId) cancelAnimationFrame(navAnimationId);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    const gridSpacing = 20;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Define Bezier Track curves
    const startX = 60;
    const startY = 180;
    const cp1x = 160;
    const cp1y = 40;
    const cp2x = 240;
    const cp2y = 200;
    const endX = 340;
    const endY = 80;

    // Draw thick background line glow
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw dotted active guide track
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 3. Draw Nodes
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'var(--primary)';
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Concentric sonar pulse
    const pulseT = (Date.now() % 1200) / 1200;
    const pulseRadius = 8 + pulseT * 22;
    ctx.strokeStyle = `rgba(212, 255, 0, ${1 - pulseT})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(endX, endY, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Calculate position along track
    navProgress += 0.0025;
    if (navProgress > 1) navProgress = 0;

    const t = navProgress;
    const x = (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * cp1x + 3 * (1 - t) * t ** 2 * cp2x + t ** 3 * endX;
    const y = (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * cp1y + 3 * (1 - t) * t ** 2 * cp2y + t ** 3 * endY;

    // Pulsing position indicator
    ctx.fillStyle = '#00FF88';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00FF88';
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    navAnimationId = requestAnimationFrame(draw);
  }

  if (navAnimationId) cancelAnimationFrame(navAnimationId);
  draw();
};

// --- ACCESSIBILITY TOGGLES & TRANSPORT MODALS ---
window.toggleTransportModal = function(modalId, isOpen) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (modal) {
    if (isOpen) {
      modal.classList.remove('hidden');
      if (modalId === 'nav') {
        setTimeout(window.animateLiveNavigation, 50);
        speakIfEnabled("Live navigation active. Routing via The Green Mile. Follow the climate-controlled walkway for 450 meters to VIP Suite corridor. Estimated walk time: 15 minutes.");
      }
    } else {
      modal.classList.add('hidden');
      if (modalId === 'nav' && navAnimationId) {
        cancelAnimationFrame(navAnimationId);
      }
    }
  }
};

function updateEcoDOM() {
  const pointsEl = document.getElementById('eco-points-balance');
  const co2El = document.getElementById('eco-co2-saved');
  const barEl = document.getElementById('eco-progress-bar');
  const remainingEl = document.getElementById('eco-points-remaining');

  if (pointsEl) pointsEl.innerText = state.ecoPoints.toLocaleString();
  if (co2El) co2El.innerText = state.ecoCO2.toFixed(1);

  const pct = Math.min(100, (state.ecoPoints / 3200) * 100);
  if (barEl) barEl.style.width = pct + '%';

  const remaining = Math.max(0, 3200 - state.ecoPoints);
  if (remainingEl) {
    remainingEl.innerText = remaining === 0 ? "Platinum Achieved!" : `${remaining} pts to Platinum`;
  }
}

window.selectTransportRoute = function(routeId) {
  const routes = ['metro', 'shuttle', 'walk'];

  routes.forEach(r => {
    const card = document.getElementById(`route-card-${r}`);
    const btn = document.getElementById(`route-btn-${r}`);

    if (card && btn) {
      if (r === routeId) {
        card.style.borderColor = 'var(--primary)';
        card.style.boxShadow = '0 0 25px var(--primary-glow)';
        btn.innerText = r === 'walk' ? 'Navigating...' : 'Selected Route';
        btn.className = "btn-primary w-full py-3 rounded-lg mt-5 font-semibold";
      } else {
        card.style.borderColor = 'transparent';
        card.style.boxShadow = 'none';
        btn.innerText = r === 'shuttle' ? 'Select VIP Route' : r === 'walk' ? 'Start Navigation' : 'Select Route';
        btn.className = "w-full py-3 bg-white/5 border border-white/10 text-white rounded-lg cursor-pointer mt-5";
      }
    }
  });

  let label = 'Gold Line Metro';
  if (routeId === 'metro') {
    state.ecoPoints += 150;
    state.ecoCO2 += 0.8;
  } else if (routeId === 'shuttle') {
    label = 'H2 VIP Shuttle';
    state.ecoPoints += 80;
    state.ecoCO2 += 0.5;
  } else if (routeId === 'walk') {
    label = 'The Green Mile';
    state.ecoPoints += 250;
    state.ecoCO2 += 1.5;
    window.toggleTransportModal('nav', true);
  }

  updateEcoDOM();
  dispatchInfoAlert(`Transport route changed to: ${label}`);
};

window.selectFacility = function(facility) {
  let zone = '';
  let desc = '';
  let alertMsg = '';

  if (facility === 'lounge') {
    zone = 'sec_103';
    desc = "Lusail Royal Lounge selected. Elevators are accessible via Corridor East Gate. Custom refreshments active.";
    alertMsg = "🥂 Route to Royal Lounge active. Take East Elevators to Level 4.";
  } else if (facility === 'helipad') {
    zone = 'sec_204';
    desc = "Sector North Helipad selected. Clearance manifest synced with flight crew. Transit time: 4 mins.";
    alertMsg = "🚁 Route to Helipad active. Access cleared via Sector North elevator lobby.";
  } else if (facility === 'valet') {
    zone = 'sec_100';
    desc = "West Gate Valet Access Zone A active. Limousine details dispatched to security protocols.";
    alertMsg = "🚗 Limousine drop-off route active at West Gate Entry.";
  } else if (facility === 'elevator') {
    zone = 'sec_106';
    desc = "Step-Free Elevator Lobby active. Connected directly to Main Gate 5 step-free ramps.";
    alertMsg = "♿ Step-Free routing active. Elevator lobby coordinates dispatched.";
  }

  if (zone) {
    state.activeZone = zone;
    state.activeTier = zone.startsWith('sec_2') ? 'upper' : 'lower';

    dispatchInfoAlert(alertMsg);
    speakIfEnabled(desc);
  }
};

// Speak helper for Audio Navigation
function speakIfEnabled(text) {
  if (state.audioNavigation && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}

window.triggerHighContrastToggle = function() {
  state.highContrast = !state.highContrast;

  const container = document.body;
  const knob = document.getElementById('knob-high-contrast');
  const btn = document.getElementById('toggle-high-contrast-btn');

  if (state.highContrast) {
    if (container) container.classList.add('high-contrast');
    if (knob) knob.style.transform = 'translateX(20px)';
    if (btn) btn.style.background = 'var(--primary)';
    dispatchAlert('warning', 'High Contrast Mode Enabled');
    speakIfEnabled('High contrast mode enabled.');
  } else {
    if (container) container.classList.remove('high-contrast');
    if (knob) knob.style.transform = 'translateX(0)';
    if (btn) btn.style.background = 'rgba(255,255,255,0.15)';
    dispatchInfoAlert('High Contrast Mode Disabled');
    speakIfEnabled('High contrast mode disabled.');
  }
}

window.triggerWheelchairToggle = function() {
  state.wheelchairRouting = !state.wheelchairRouting;

  const knob = document.getElementById('knob-wheelchair');
  const btn = document.getElementById('toggle-wheelchair-btn');
  const label = document.getElementById('label-wheelchair');

  const metroDesc = document.getElementById('route-metro-desc');
  const shuttleDesc = document.getElementById('route-shuttle-desc');
  const walkDesc = document.getElementById('route-walk-desc');

  if (state.wheelchairRouting) {
    if (knob) knob.style.transform = 'translateX(20px)';
    if (btn) btn.style.background = 'var(--success)';
    if (label) label.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-var(--success) inline-block" style="background-color: var(--success)"></span> Active — Step-free routes enabled';
    if (label) label.style.color = 'var(--success)';

    if (metroDesc) metroDesc.innerText = '♿ STEP-FREE ROUTE: Platform 4 elevator active. Low-floor boarding enabled. Direct boarding assistance available at Lusail Station.';
    if (shuttleDesc) shuttleDesc.innerText = '♿ ACCESSIBLE SHUTTLE: Equipped with hydraulic wheelchair ramp and secure docking bays. Direct VIP curbside boarding at West Gate.';
    if (walkDesc) walkDesc.innerText = '♿ ELEVATED PATHWAY: 100% ramp-access walkway, zero stairs. Electric mobility carts available on demand at check-point Alpha.';

    dispatchInfoAlert('Wheelchair Step-free Routing Active');
  } else {
    if (knob) knob.style.transform = 'translateX(0)';
    if (btn) btn.style.background = 'rgba(255,255,255,0.15)';
    if (label) label.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white/40 inline-block"></span> Inactive';
    if (label) label.style.color = 'rgba(255,255,255,0.4)';

    if (metroDesc) metroDesc.innerText = 'Direct route from Doha Port to Lusail Stadium. Accessible boarding at Platform 4.';
    if (shuttleDesc) shuttleDesc.innerText = 'Hydrogen-powered private transit with in-seat entertainment and refreshments.';
    if (walkDesc) walkDesc.innerText = 'Climate-controlled scenic walkway with interactive World Cup history displays.';

    dispatchInfoAlert('Standard Routing Active');
  }
}

window.triggerAudioToggle = function() {
  state.audioNavigation = !state.audioNavigation;

  const knob = document.getElementById('knob-audio');
  const btn = document.getElementById('toggle-audio-btn');

  if (state.audioNavigation) {
    if (knob) knob.style.transform = 'translateX(20px)';
    if (btn) btn.style.background = 'var(--primary)';
    dispatchInfoAlert('Voice Assistance Assisted Navigation Active');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Audio navigation enabled. Voice feedback active.');
      window.speechSynthesis.speak(utterance);
    }
  } else {
    if (knob) knob.style.transform = 'translateX(0)';
    if (btn) btn.style.background = 'rgba(255,255,255,0.15)';
    dispatchInfoAlert('Voice Assistance Off');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Audio navigation disabled.');
      window.speechSynthesis.speak(utterance);
    }
  }
}

// --- ACCESS TAB MODALS & SECURITY ---
window.toggleAccessModal = function(modalId, isOpen) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (modal) {
    if (isOpen) {
      modal.classList.remove('hidden');
      if (modalId === 'logs') {
        populateSecurityLogs();
      }
    } else {
      modal.classList.add('hidden');
    }
  }
}

// Populates security logs in real-time
function populateSecurityLogs() {
  const logsList = document.getElementById('security-logs-modal-list');
  if (!logsList) return;

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const logs = [
    { time: `${currentHour}:${String(currentMinute).padStart(2,'0')}:15`, level: 'INFO', event: 'Biometric Pass verified: Julian Al-Fayed at Gate North Level 4.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 2)).padStart(2,'0')}:45`, level: 'INFO', event: 'Sentinel Guard Unit Alpha shifted patrol path to VIP Suite corridor.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 5)).padStart(2,'0')}:12`, level: 'INFO', event: 'Access Grant: VIP Motorcade arriving West Gate. Biometric link ready.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 8)).padStart(2,'0')}:30`, level: 'WARN', event: 'Gate 4 crowd surge warning. Flow redirection instructions broadcasted.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 12)).padStart(2,'0')}:02`, level: 'INFO', event: 'Camera Cam-402 (Suite Corridor) optical zoom auto-adjusted. Ingress clear.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 15)).padStart(2,'0')}:50`, level: 'INFO', event: 'Biometric gateway sensor check: all 12 ports synchronized successfully.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 18)).padStart(2,'0')}:22`, level: 'INFO', event: 'AI Triage system: No incidents queued. All response units on standby.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 22)).padStart(2,'0')}:07`, level: 'WARN', event: 'Perimeter sensor sweep — Sector North gate latency spike detected, auto-resolved.' },
    { time: `${currentHour}:${String(Math.max(0, currentMinute - 25)).padStart(2,'0')}:41`, level: 'INFO', event: 'Security handoff completed: Day shift → Evening shift. 32 units deployed.' }
  ];

  
  // Fix 1: Safe DOM manipulation instead of innerHTML
  logsList.innerHTML = '';
  logs.forEach(log => {
    const div = document.createElement('div');
    const borderColor = log.level === 'WARN' ? 'var(--primary)' : 'var(--success)';
    div.style.cssText = `padding: 12px 15px; background: rgba(255,255,255,0.03); border-left: 3px solid ${borderColor}; border-radius: 6px; font-size: 0.85rem`;
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px; color: rgba(255,255,255,0.4); font-size: 0.75rem';
    
    const timeSpan = document.createElement('span');
    timeSpan.textContent = log.time;
    
    const levelSpan = document.createElement('span');
    levelSpan.textContent = log.level;
    levelSpan.style.cssText = `color: ${borderColor}; font-weight: 600`;
    
    const p = document.createElement('p');
    p.textContent = log.event;
    p.style.cssText = 'margin: 0; color: #eee; line-height: 1.4';
    
    header.appendChild(timeSpan);
    header.appendChild(levelSpan);
    div.appendChild(header);
    div.appendChild(p);
    
    logsList.appendChild(div);
  });

}

// 2D SVG Blueprint layers toggles
let guardsVisible = true;
let gatesVisible = true;
let camsVisible = true;

window.toggleMapLayer = function(layerName) {
  const layer = document.getElementById(`map-layer-${layerName}`);
  const btn = document.getElementById(`filter-${layerName}-btn`);

  if (layerName === 'guards') {
    guardsVisible = !guardsVisible;
    if (layer) layer.style.opacity = guardsVisible ? 1 : 0;
    if (btn) {
      btn.innerText = guardsVisible ? 'Guards • ON' : 'Guards • OFF';
      btn.className = guardsVisible ? "btn-primary px-2.5 py-1 text-[10px] rounded-lg" : "btn-outline px-2.5 py-1 text-[10px] rounded-lg";
    }
    dispatchInfoAlert(`Guards filter ${guardsVisible ? 'enabled' : 'disabled'}`);
  } else if (layerName === 'gates') {
    gatesVisible = !gatesVisible;
    if (layer) layer.style.opacity = gatesVisible ? 1 : 0;
    if (btn) {
      btn.innerText = gatesVisible ? 'Gates • ON' : 'Gates • OFF';
      btn.className = gatesVisible ? "btn-primary px-2.5 py-1 text-[10px] rounded-lg" : "btn-outline px-2.5 py-1 text-[10px] rounded-lg";
    }
    dispatchInfoAlert(`Gates filter ${gatesVisible ? 'enabled' : 'disabled'}`);
  } else if (layerName === 'cams') {
    camsVisible = !camsVisible;
    if (layer) layer.style.opacity = camsVisible ? 1 : 0;
    if (btn) {
      btn.innerText = camsVisible ? 'Cams • ON' : 'Cams • OFF';
      btn.className = camsVisible ? "btn-primary px-2.5 py-1 text-[10px] rounded-lg" : "btn-outline px-2.5 py-1 text-[10px] rounded-lg";
    }
    dispatchInfoAlert(`Cameras filter ${camsVisible ? 'enabled' : 'disabled'}`);
  }
}

// ticket cryptographical transfer submit
window.submitTicketTransfer = function() {
  const emailInput = document.getElementById('ticket-transfer-email');
  if (emailInput) emailInput.value = '';
  toggleAccessModal('transfer', false);
  dispatchAlert('warning', 'Transfer pending recipient verification.');
}

// Emergency report submit
let activeIncidentCategory = 'Medical';
window.selectIncidentCategory = function(category) {
  activeIncidentCategory = category;

  const categories = ['Medical', 'Security', 'Other'];
  categories.forEach(cat => {
    const btn = document.getElementById(`incident-cat-${cat}`);
    if (btn) {
      if (cat === category) {
        btn.className = "flex-1 py-2.5 bg-red-500/20 border border-red-500 text-red-500 font-semibold rounded-lg cursor-pointer";
      } else {
        btn.className = "flex-1 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg cursor-pointer";
      }
    }
  });

  dispatchInfoAlert(`Emergency category changed to ${category}`);
  speakIfEnabled(`Emergency category changed to ${category}`);
};

window.submitIncidentReport = function() {
  const desc = document.getElementById('incident-description');
  if (desc) desc.value = '';
  toggleAccessModal('incident', false);
  dispatchAlert('critical', `${activeIncidentCategory} Incident reported. AI Triage dispatching nearest unit.`);
}

// --- TELEMETRY SIMULATION ENGINE & ALERTS REFRESH ---
let alertsFeed = [
  {
    id: '1',
    type: 'HIGH PRIORITY',
    title: 'Queue buildup predicted at Gate 4.',
    description: 'Flow redirected to Gate 5 recommended. AI crowd model shows 340 fans queueing.',
    timeLabel: 'T-15 MINS',
    color: '#FF5252'
  },
  {
    id: '2',
    type: 'EVENT PROTOCOL',
    title: 'VIP Motorcade arrival imminent.',
    description: 'Level 4 protocol engaged for West Entry. Motorcade ID: QTR-ALPHA-07.',
    timeLabel: 'T-5 MINS',
    color: '#D4FF00'
  },
  {
    id: '3',
    type: 'SOCIAL SIGNAL',
    title: 'Fan sentiment at peak — 94% positive.',
    description: 'Social monitoring: 142,800 positive posts, trending #FIFAWorldCup2026. Sound signature 92dB.',
    timeLabel: 'REAL-TIME',
    color: '#00E676'
  },
  {
    id: '4',
    type: 'OBSERVATION',
    title: 'Brazil 🇧🇷 2–1 France 🇫🇷 — Goal Alert!',
    description: 'Neymar Jr. scores in 68th minute. Crowd surge confirmed in Sectors 101–104. Cheer response measured at 96dB.',
    timeLabel: 'LIVE 68\'',
    color: '#00E676'
  },
  {
    id: '5',
    type: 'OBSERVATION',
    title: 'Energy grid nominal — Platinum Eco.',
    description: 'Solar arrays generating 18.3 MWh. Pitch cooling at 31% of total load. 12% below FIFA benchmark.',
    timeLabel: 'LIVE',
    color: '#00E676'
  },
  {
    id: '6',
    type: 'EVENT PROTOCOL',
    title: 'Pitch climate locked at 22°C.',
    description: 'Automated cross-flow ventilation active. Grass humidity stable at 68%. No adverse conditions.',
    timeLabel: 'T-30 MINS',
    color: '#D4FF00'
  },
  {
    id: '7',
    type: 'HIGH PRIORITY',
    title: 'Gold Line Metro frequency increased.',
    description: 'Platform density elevated. Trains dispatched every 3 minutes. The Green Mile recommended for fans within 500m.',
    timeLabel: 'T-10 MINS',
    color: '#D4FF00'
  }
];

function renderIntelligenceFeed() {
  const container = document.getElementById('intelligence-feed-container');
  if (!container) return;

  container.innerHTML = alertsFeed.map(item => `
    <div class="glass-panel" style="padding: 15px; border-left: 4px solid ${item.color}">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
        <span style="font-size: 0.65rem; color: ${item.color}; letter-spacing: 1px; font-weight: 600">${item.type}</span>
        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5)">${item.timeLabel}</span>
      </div>
      <h4 style="margin: 0 0 5px 0; font-size: 0.95rem; color: ${item.color === '#D4FF00' ? 'var(--primary)' : '#fff'}">${item.title}</h4>
      <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.4">${item.description}</p>
    </div>
  `).join('');
}

/**
 * Fetches background intelligence updates for the Operations Center.
 * @async
 * @returns {Promise<void>}
 */
async function fetchIntelligenceFeed() {
  try {
    const res = await fetch('/api/intelligence', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ crowdCount: state.crowdCount, metroTime: state.metroTime })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.alerts && Array.isArray(data.alerts)) {
        alertsFeed = data.alerts;
        renderIntelligenceFeed();
      }
    }
  } catch (err) {
    console.warn("Background intelligence refresh failed:", err);
  }
}

// --- TELEMETRY DATA LOADER ---
async function loadTelemetryData() {
  try {
    const res = await fetch('/api/telemetry');
    if (!res.ok) return;
    const data = await res.json();
    renderMatchScoreboard(data.matches);
    renderGateThroughput(data.gates);
    renderSentimentTicker(data.sentiment);
    renderStadiumStats(data.stadium);
    renderStaffingStatus(data.staffing);
  } catch (err) {
    console.warn("Telemetry data load failed:", err);
  }
}

function renderMatchScoreboard(matches) {
  const el = document.getElementById('live-match-scoreboard');
  if (!el || !matches) return;

  el.innerHTML = matches.map(m => {
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';
    const statusColor = isLive ? '#FF5252' : isCompleted ? 'rgba(255,255,255,0.3)' : 'var(--primary)';
    const statusLabel = isLive ? `● LIVE ${m.minute}'` : isCompleted ? 'FT' : `🕐 ${m.kickoff}`;

    return `
      <div class="glass-panel" style="padding: 12px 16px; ${isLive ? 'border-left: 3px solid #FF5252; background: rgba(255,82,82,0.04);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
          <span style="font-size:0.6rem; color:${statusColor}; font-weight:700; letter-spacing:1px">${statusLabel}</span>
          <span style="font-size:0.6rem; color:rgba(255,255,255,0.35)">${m.group} · ${m.venue.split(' ')[0]}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px">
          <div style="flex:1; text-align:left; font-size:0.85rem; font-weight:600">${m.homeFlag} ${m.homeTeam}</div>
          <div style="font-size:1.1rem; font-weight:800; color:${isLive ? '#fff' : 'rgba(255,255,255,0.5)'}; min-width:40px; text-align:center">${m.homeScore} – ${m.awayScore}</div>
          <div style="flex:1; text-align:right; font-size:0.85rem; font-weight:600">${m.awayTeam} ${m.awayFlag}</div>
        </div>
      </div>`;
  }).join('');
}

function renderGateThroughput(gates) {
  const el = document.getElementById('gate-throughput-panel');
  if (!el || !gates) return;

  el.innerHTML = gates.map(g => {
    const pct = Math.min(100, Math.round((g.throughput / g.capacity) * 100));
    const barColor = g.status === 'CONGESTED' ? '#FF5252' : pct > 80 ? '#D4FF00' : '#00E676';
    return `
      <div style="margin-bottom: 10px">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px">
          <span style="font-size:0.75rem; color:rgba(255,255,255,0.7)">${g.name}</span>
          <span style="font-size:0.7rem; color:${barColor}; font-weight:600">${g.status === 'CONGESTED' ? '⚠ ' : ''}${g.waitMins}m wait · ${g.throughput}/hr</span>
        </div>
        <div style="width:100%; height:5px; background:rgba(255,255,255,0.07); border-radius:3px">
          <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:3px; transition:width 0.5s ease"></div>
        </div>
      </div>`;
  }).join('');
}

function renderSentimentTicker(sentiment) {
  const el = document.getElementById('fan-sentiment-panel');
  if (!el || !sentiment) return;

  const cats = sentiment.categories;
  el.innerHTML = `
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px">
      ${Object.entries(cats).map(([k, v]) => `
        <div style="flex:1; min-width:80px; text-align:center; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.15); border-radius:8px; padding:8px 6px">
          <div style="font-size:1rem; font-weight:700; color:var(--success)">${v}%</div>
          <div style="font-size:0.6rem; color:rgba(255,255,255,0.4); margin-top:2px; text-transform:uppercase; letter-spacing:0.5px">${k.replace(/([A-Z])/g, ' $1').trim()}</div>
        </div>`).join('')}
    </div>
    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:rgba(255,255,255,0.5)">
      <span>📱 ${sentiment.socialPulse.mentionsPerMinute.toLocaleString()}/min mentions</span>
      <span style="color:var(--success)">🔊 ${sentiment.crowdSoundDb} dB</span>
    </div>`;
}

function renderStadiumStats(stadium) {
  const el = document.getElementById('stadium-live-stats');
  if (!el || !stadium) return;

  el.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
      ${[
        { label: 'Pitch Temp', value: `${stadium.pitchTemp}°C`, icon: '🌡️' },
        { label: 'Humidity', value: `${stadium.pitchHumidity}%`, icon: '💧' },
        { label: 'Energy Use', value: `${stadium.energyConsumption} MWh`, icon: '⚡' },
        { label: 'Solar Gen', value: `${stadium.solarGeneration} MWh`, icon: '☀️' },
        { label: 'Air Quality', value: `AQI ${stadium.airQualityIndex}`, icon: '🌬️' },
        { label: 'Occupancy', value: `${stadium.occupancyPct}%`, icon: '👥' }
      ].map(s => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:8px">
          <span style="font-size:1.1rem">${s.icon}</span>
          <div>
            <div style="font-size:0.65rem; color:rgba(255,255,255,0.4); letter-spacing:0.5px">${s.label}</div>
            <div style="font-size:0.9rem; font-weight:700; color:#fff">${s.value}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderStaffingStatus(staffing) {
  const el = document.getElementById('staffing-status-panel');
  if (!el || !staffing) return;

  el.innerHTML = `
    <div style="display:flex; gap:6px; flex-wrap:wrap">
      ${[
        { label: 'Security', count: staffing.securityUnits, icon: '🛡️', color: 'var(--primary)' },
        { label: 'Medical', count: staffing.medicalTeams, icon: '⚕️', color: '#00E676' },
        { label: 'Catering', count: staffing.cateringStaff, icon: '🍽️', color: '#00E5FF' },
        { label: 'VIP Butlers', count: staffing.vipButlers, icon: '🤵', color: 'var(--primary)' }
      ].map(s => `
        <div style="flex:1; min-width:80px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px; text-align:center">
          <div style="font-size:1.1rem">${s.icon}</div>
          <div style="font-size:1rem; font-weight:700; color:${s.color}">${s.count}</div>
          <div style="font-size:0.6rem; color:rgba(255,255,255,0.4)">${s.label}</div>
        </div>`).join('')}
    </div>`;
}

// Telemetry simulation tick loop (Runs every 3 seconds)
function runTelemetryTick() {
  // 1. Crowd Fluctuations (+- 50 people) — CLAMPED to [0, 90000]
  const crowdDelta = Math.floor(Math.random() * 100) - 50;
  state.crowdCount = Math.max(0, Math.min(90000, state.crowdCount + crowdDelta));

  // 2. AI Confidence adjustments
  const confidenceDelta = (Math.random() * 0.2) - 0.1;
  state.aiConfidence += confidenceDelta;
  if (state.aiConfidence > 99.9) state.aiConfidence = 99.9;
  if (state.aiConfidence < 97.0) state.aiConfidence = 97.0;

  // 3. Simulate transport times
  if (Math.random() > 0.8) state.metroTime = Math.max(0, state.metroTime - 1);
  if (state.metroTime === 0 && Math.random() > 0.5) state.metroTime = 12;

  if (Math.random() > 0.8) state.shuttleTime = Math.max(0, state.shuttleTime - 1);
  if (state.shuttleTime === 0 && Math.random() > 0.5) state.shuttleTime = 15;

  // 4. CRITICAL FIX: Sync window.stadiumState with local state so 3D engine gets updates
  window.stadiumState.crowdCount = state.crowdCount;
  window.stadiumState.aiConfidence = state.aiConfidence;
  window.stadiumState.metroTime = state.metroTime;
  window.stadiumState.shuttleTime = state.shuttleTime;

  // 5. Write changes to DOM
  const crowdEl = document.getElementById('metric-crowd-count');
  const confEl = document.getElementById('metric-ai-confidence');
  const metroRouteTime = document.getElementById('route-metro-time');
  const shuttleRouteTime = document.getElementById('route-shuttle-time');

  if (crowdEl) crowdEl.innerText = state.crowdCount.toLocaleString();
  if (confEl) confEl.innerText = state.aiConfidence.toFixed(1) + '%';
  if (metroRouteTime) metroRouteTime.innerText = state.metroTime + ' mins';
  if (shuttleRouteTime) shuttleRouteTime.innerText = state.shuttleTime + ' mins';
}

window.switchConciergeSubTab = function(element, viewName) {
  const container = document.getElementById('subnav-concierge');
  if (container) {
    container.querySelectorAll('.subnav-link').forEach(link => {
      link.classList.remove('active');
      link.classList.add('text-white/50');
    });
  }
  element.classList.add('active');
  element.classList.remove('text-white/50');

  const subtabs = ['guide', 'concierge', 'protocol'];
  subtabs.forEach(tab => {
    const el = document.getElementById(`concierge-subtab-${tab}`);
    if (el) el.classList.add('hidden');
  });

  let selectedTab = 'concierge';
  if (viewName.toLowerCase().includes('guide')) {
    selectedTab = 'guide';
  } else if (viewName.toLowerCase().includes('protocol')) {
    selectedTab = 'protocol';
  }

  const activeEl = document.getElementById(`concierge-subtab-${selectedTab}`);
  if (activeEl) activeEl.classList.remove('hidden');

  dispatchInfoAlert(`Switched to ${viewName}`);
};

// Profile Dropdown Toggle Logic
const profileMenuBtn = document.getElementById('profile-menu-btn');
const profileDropdown = document.getElementById('profile-dropdown');
if (profileMenuBtn && profileDropdown) {
  profileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    profileDropdown.classList.add('hidden');
  });
  profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Login Modal Control
window.toggleLoginModal = function(isOpen) {
  const modal = document.getElementById('modal-login');
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  if (modal) {
    if (isOpen) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }
};

window.triggerProfileAuthAction = function() {
  const currentName = document.getElementById('user-display-name').innerText;
  if (currentName === 'Anonymous Guest') {
    window.toggleLoginModal(true);
  } else {
    document.getElementById('user-display-name').innerText = 'Anonymous Guest';
    document.getElementById('user-display-role').innerText = 'GUEST';
    document.getElementById('user-display-clearance').innerText = 'None';
    document.getElementById('user-display-suite').innerText = 'None';

    const statusEl = document.getElementById('user-display-status');
    if (statusEl) {
      statusEl.innerText = 'Unverified';
      statusEl.className = 'text-red-500 font-semibold';
    }

    document.getElementById('profile-action-btn').innerText = 'Sign In';
    document.getElementById('profile-avatar-emoji').innerText = '👤';
    dispatchInfoAlert('Logged out successfully.');
  }
};

window.handleLoginSubmit = function(event) {
  event.preventDefault();
  const userVal = document.getElementById('login-username').value.trim().toLowerCase();
  // Note: password validation is intentionally demo-mode (accepts any password for testing)

  if (userVal === 'admin') {
    document.getElementById('user-display-name').innerText = 'Director Sarah';
    document.getElementById('user-display-role').innerText = 'OPS DIRECTOR';
    document.getElementById('user-display-clearance').innerText = 'Level 5 (Max)';
    document.getElementById('user-display-suite').innerText = 'Command Suite';

    const statusEl = document.getElementById('user-display-status');
    if (statusEl) {
      statusEl.innerText = 'Verified';
      statusEl.className = 'text-[var(--success)] font-semibold';
    }

    document.getElementById('profile-action-btn').innerText = 'Logout';
    document.getElementById('profile-avatar-emoji').innerText = '👩‍💼';
    dispatchAlert('info', 'Welcome back, Director Sarah!');
  } else {
    document.getElementById('user-display-name').innerText = 'Julian Al-Fayed';
    document.getElementById('user-display-role').innerText = 'VIP GUEST';
    document.getElementById('user-display-clearance').innerText = 'Executive Gold';
    document.getElementById('user-display-suite').innerText = 'Elite Box 402';

    const statusEl = document.getElementById('user-display-status');
    if (statusEl) {
      statusEl.innerText = 'Verified';
      statusEl.className = 'text-[var(--success)] font-semibold';
    }

    document.getElementById('profile-action-btn').innerText = 'Logout';
    document.getElementById('profile-avatar-emoji').innerText = '🧑‍💼';
    dispatchAlert('info', 'Welcome back, Julian!');
  }

  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  window.toggleLoginModal(false);
};

// --- ANALYTICS CHART ENGINE (Chart.js) ---
let analyticsChart = null;
let analyticsData = null;
let activeChartMetric = 'crowd';

const CHART_CONFIG = {
  crowd: {
    label: 'Crowd Attendance',
    color: 'rgba(212, 255, 0, 1)',
    fill: 'rgba(212, 255, 0, 0.08)',
    unit: '',
    title: 'CROWD TREND — 60 MIN'
  },
  energy: {
    label: 'Energy (MWh)',
    color: 'rgba(0, 229, 255, 1)',
    fill: 'rgba(0, 229, 255, 0.08)',
    unit: ' MWh',
    title: 'ENERGY TREND — 60 MIN'
  },
  sentiment: {
    label: 'Fan Sentiment (%)',
    color: 'rgba(0, 230, 118, 1)',
    fill: 'rgba(0, 230, 118, 0.08)',
    unit: '%',
    title: 'SENTIMENT TREND — 60 MIN'
  }
};

function initAnalyticsChart(labels, data, metric) {
  const canvas = document.getElementById('analytics-chart-canvas');
  if (!canvas || typeof Chart === 'undefined') return;

  const cfg = CHART_CONFIG[metric] || CHART_CONFIG.crowd;

  if (analyticsChart) {
    analyticsChart.destroy();
    analyticsChart = null;
  }

  analyticsChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: cfg.label,
        data: data,
        borderColor: cfg.color,
        backgroundColor: cfg.fill,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: cfg.color,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20,20,20,0.95)',
          borderColor: cfg.color,
          borderWidth: 1,
          titleColor: cfg.color,
          bodyColor: 'rgba(255,255,255,0.8)',
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toLocaleString()}${cfg.unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 9 }, maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.35)',
            font: { size: 9 },
            callback: (v) => v.toLocaleString() + cfg.unit
          }
        }
      }
    }
  });
}

window.switchAnalyticsChart = function(metric) {
  activeChartMetric = metric;

  // Update button states
  ['crowd', 'energy', 'sentiment'].forEach(m => {
    const btn = document.getElementById(`chart-btn-${m}`);
    if (btn) {
      btn.className = m === metric
        ? 'btn-primary px-2.5 py-1 text-[10px] rounded-lg'
        : 'btn-outline px-2.5 py-1 text-[10px] rounded-lg';
    }
  });

  // Update chart title
  const titleEl = document.querySelector('#analytics-chart-canvas')?.closest('.glass-panel')?.querySelector('h3');
  if (titleEl) titleEl.textContent = CHART_CONFIG[metric]?.title || 'TREND — 60 MIN';

  // Re-render with new data
  if (analyticsData) {
    const metricKey = metric === 'crowd' ? 'crowd' : metric === 'energy' ? 'energy' : 'sentiment';
    initAnalyticsChart(analyticsData.labels, analyticsData.datasets[metricKey], metric);
  }
};

async function loadAnalyticsData() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) return;
    analyticsData = await res.json();

    // Update AI Predictive Summary card
    const summaryEl = document.getElementById('analytics-ai-summary');
    const trendBadge = document.getElementById('analytics-trend-badge');
    const crowdNow = document.getElementById('analytics-crowd-now');
    const energyNow = document.getElementById('analytics-energy-now');
    const sentimentNow = document.getElementById('analytics-sentiment-now');

    if (summaryEl) summaryEl.textContent = analyticsData.aiSummary;
    if (trendBadge) trendBadge.textContent = analyticsData.trend;
    if (crowdNow) crowdNow.textContent = analyticsData.currentCrowd.toLocaleString();
    if (energyNow && analyticsData.datasets.energy) {
      const lastEnergy = analyticsData.datasets.energy[analyticsData.datasets.energy.length - 1];
      energyNow.textContent = lastEnergy + ' MWh';
    }
    if (sentimentNow && analyticsData.datasets.sentiment) {
      const lastSentiment = analyticsData.datasets.sentiment[analyticsData.datasets.sentiment.length - 1];
      sentimentNow.textContent = lastSentiment + '%';
    }

    // Render or update chart
    const dataKey = activeChartMetric === 'crowd' ? 'crowd' : activeChartMetric === 'energy' ? 'energy' : 'sentiment';
    initAnalyticsChart(analyticsData.labels, analyticsData.datasets[dataKey], activeChartMetric);

  } catch (err) {
    console.warn('Analytics data load failed:', err);
  }
}

// Initialize Loop Tickers
window.addEventListener('DOMContentLoaded', () => {
  renderIntelligenceFeed();

  // Bug fix: Load intelligence feed immediately instead of waiting 45 seconds
  fetchIntelligenceFeed();

  // Load all telemetry/dummy data immediately for client demo
  loadTelemetryData();

  // Load analytics chart data immediately
  loadAnalyticsData();

  // Tick every 3 seconds
  setInterval(runTelemetryTick, 3000);

  // Call API refresh every 45 seconds
  setInterval(fetchIntelligenceFeed, 45000);

  // Refresh telemetry panel data every 10 seconds
  setInterval(loadTelemetryData, 10000);

  // Refresh analytics chart every 30 seconds
  setInterval(loadAnalyticsData, 30000);

  // Live clock ticker
  setInterval(() => {
    const clockEl = document.getElementById('header-live-clock');
    if (clockEl) {
      const now = new Date();
      clockEl.innerText = now.toTimeString().split(' ')[0];
    }
  }, 1000);
});


// --- STAFF HUB CONTROLS ---
async function pollStaffAPI() {
  try {
    const res = await fetch('/api/staff');
    if (!res.ok) return;
    const data = await res.json();
    
    document.getElementById('staff-total-count').textContent = `${data.metrics.totalVolunteers} Volunteers`;
    document.getElementById('staff-active-zones').textContent = `${data.metrics.activeZones} Active Zones`;
    
    const briefingEl = document.getElementById('staff-ai-briefing');
    if (briefingEl) briefingEl.textContent = data.aiBriefing;
    
    const shiftsCont = document.getElementById('staff-shifts-container');
    if (shiftsCont) {
      shiftsCont.innerHTML = data.shifts.map(s => `
        <div style="padding: 10px; background: rgba(255,255,255,0.03); border-left: 2px solid ${s.status==='ACTIVE'?'var(--primary)':'#555'}; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:0.85rem; font-weight:600; color:#fff">${s.shift}</span>
            <span style="font-size:0.7rem; color:${s.status==='ACTIVE'?'var(--primary)':'#aaa'}">${s.status}</span>
          </div>
          <div style="font-size:0.75rem; color:#aaa">${s.time} • ${s.staff} Staff • ${s.role}</div>
        </div>
      `).join('');
    }
    
    const zonesCont = document.getElementById('staff-zones-container');
    if (zonesCont) {
      zonesCont.innerHTML = data.zones.map(z => `
        <div style="padding: 10px; background: rgba(255,255,255,0.03); border-left: 2px solid ${z.status==='ACTIVE'?'var(--success)':'#555'}; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:0.85rem; font-weight:600; color:#fff">${z.name}</span>
            <span style="font-size:0.7rem; color:#aaa">Load: ${z.crowdLoad}%</span>
          </div>
          <div style="font-size:0.75rem; color:#aaa">Lead: ${z.lead} • Staff: ${z.volunteers}</div>
        </div>
      `).join('');
    }
    
    const tasksCont = document.getElementById('staff-tasks-container');
    if (tasksCont) {
      tasksCont.innerHTML = data.tasks.map(t => `
        <div class="glass-panel" style="padding:15px; border-top: 2px solid ${t.color}">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px">
            <span style="font-size:0.7rem; color:${t.color}; font-weight:700">${t.priority}</span>
            <span style="font-size:0.7rem; color:#aaa">${t.zone}</span>
          </div>
          <p style="margin:0 0 10px 0; font-size:0.85rem; color:#eee">${t.task}</p>
          <div style="font-size:0.7rem; color:#aaa">Assignee: <span style="color:#fff">${t.assignee}</span></div>
        </div>
      `).join('');
    }
  } catch(e) {
    console.error("Staff API poll error", e);
  }
}
setInterval(pollStaffAPI, 30000);
pollStaffAPI();
