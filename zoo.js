// zoo.js - Central initialization for Zoo Management System
import { initSecurity, verifySecureProtocol } from './Security.js';
import { initializeMembershipForm, setupBookingForm, setupMembershipForm } from './formsubmission.js';
import { populateAnimalDropdown, loadAnimals, animals} from './AnimalData.js';
import { toggleZooStatus, updateVisitorCount, displayZooStatistics, toggleAnimalHealth, toggleAnimalStatus } from './ZooOperations.js';
import { updateAdminDashboard } from './AdminDashboard.js';
import { displayError, displaySuccess } from './UiFeedback.js';
import { exhibits, emergencyStations } from './zooLocations.js';
import "./Components/zoo-animal-card.js";
import "./Components/z-hover-highlight.js";

const renderAnimalCards = () => {
  const container = document.getElementById("animalContainer");
  container.innerHTML = "";
  window.animals.forEach(a => {
    const el = document.createElement("zoo-animal-card");
    el.data = a;
    container.appendChild(el);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Zoo Management System Loaded');

  try {

    (() => {
  // make the pill once
  const pill = document.createElement('span');
  pill.className = 'hover-pill';
  document.body.appendChild(pill);

  let activeEl = null;

  const positionTo = (el) => {
    const r = el.getBoundingClientRect();
    const pad = 4; 
    pill.style.width  = `${r.width}px`;
    pill.style.height = `${r.height}px`;
    pill.style.transform = `translate(${r.left + window.scrollX}px, ${r.top + window.scrollY - pad}px)`;
    pill.style.opacity = '1';
  };

  const onEnter = (e) => { activeEl = e.currentTarget; positionTo(activeEl); };
  const onLeave = () => { activeEl = null; pill.style.opacity = '0'; };
  const onReposition = () => { if (activeEl) positionTo(activeEl); };

  const statusEl   = document.getElementById('zooStatus');
  const visitorsEl = document.getElementById('visitorCounter');

  // make them keyboard-focusable for accessibility
  [statusEl, visitorsEl].forEach(el => {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('focus', onEnter);
    el.addEventListener('blur', onLeave);
  });

  window.addEventListener('scroll', onReposition, { passive: true });
  window.addEventListener('resize', onReposition);
  })();

    // Security verification
    if (!verifySecureProtocol()) return;

    // Initialize CSRF tokens and security for forms
    initSecurity();

    // Load existing animals and populate dropdown
    loadAnimals();
    populateAnimalDropdown(animals);
    
    window.animals = animals;
    renderAnimalCards();

    // Setup form event listeners
    initializeMembershipForm();
    setupMembershipForm();
    setupBookingForm();

    // Admin dashboard real-time updates
    updateAdminDashboard();

    // Attach global functions for buttons
window.toggleZooStatus = () => {
  const zooStatusEl = document.getElementById("zooStatus");
  const current = zooStatusEl.textContent.includes("Open") ? "Open" : "Closed";

  // This mutates animals[] and returns the new status (adjust to your function’s return)
  const { zooStatus } = toggleZooStatus(current, animals);

  // Update the header text without re-rendering the list
  zooStatusEl.textContent = `Zoo Status: ${zooStatus}`;

  // Refresh the status label inside each existing card (no re-create)
  document.querySelectorAll("zoo-animal-card").forEach(card => {
    const id = card.data?.id;
    const latest = window.animals.find(a => String(a.id) === String(id));
    if (!latest) return;

    // update the card’s internal label
    const lbl = card.shadowRoot?.getElementById(`status-${id}`);
    if (lbl) lbl.textContent = latest.status;

    // keep the card’s data in sync (so later actions read the new value)
    card.data = latest;
  });
}

    window.updateHealth = (id) => {
      toggleAnimalHealth(id, animals);
    };    

    window.displayZooStatistics = () => {
      displayZooStatistics(animals);
    };

    window.updateVisitorCount = (count) => {
      updateVisitorCount(count);
    };

    window.toggleStatus = (id) => {
  toggleAnimalStatus(id, animals);
  const updatedAnimal = animals.find(a => a.id === id);
  if (updatedAnimal) {
    import('./AnimalData.js').then(({ notifyAnimalStatusChange }) => {
      notifyAnimalStatusChange(updatedAnimal);
    });
  }
};

    // Error and success messaging
    window.displayError = displayError;
    window.displaySuccess = displaySuccess;

    console.group("📍 Geolocation Data");
    console.table(exhibits);
    console.table(emergencyStations);
    console.groupEnd();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/Sprint-C3-Zoo/serviceworker.js')
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("SW registration failed", err));
    }


  } catch (error) {
    console.error("Critical Error: Unable to initialize Zoo Management System.", error);
    displayError("A serious error occurred. Please reload the page.");
  }
});

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      console.log("🟢 Notification permission granted");
    }
  });
}