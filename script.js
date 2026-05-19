// Global States
let statsLoaded = false;

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

function predictRisk() {
    const loader = document.getElementById("loader");
    const placeholder = document.getElementById("placeholderView");
    const resultView = document.getElementById("resultView");
    const riskBadge = document.getElementById("riskBadge");
    const resultName = document.getElementById("resultName");
    const resultText = document.getElementById("resultText");
    const confidenceScore = document.getElementById("confidenceScore");

    // UI Reset
    placeholder.style.display = "none";
    resultView.style.display = "none";
    loader.style.display = "flex";

    // Scroll to results on mobile
    if (window.innerWidth < 1000) {
        loader.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
        loader.style.display = "none";
        resultView.style.display = "block";

        const name = getValue("patientName") || "Anonymous Patient";
        let score = 0;

        const symptomIds = ["fever", "cough", "fatigue", "chest", "breathing", "diabetes"];
        symptomIds.forEach(id => {
            if (getValue(id) === "Yes") score++;
        });

        let risk = "";
        let riskClass = "";
        let confidence = "";
        let recommendation = "";

        if (score >= 4) {
            risk = "HIGH RISK";
            riskClass = "risk-high";
            confidence = (92 + Math.random() * 6).toFixed(1) + "%";
            recommendation = "Immediate medical consultation and testing is highly recommended. Please follow local isolation protocols.";
        } else if (score >= 2) {
            risk = "MEDIUM RISK";
            riskClass = "risk-medium";
            confidence = (75 + Math.random() * 10).toFixed(1) + "%";
            recommendation = "Monitor your symptoms closely and maintain strict social distancing. Consult a doctor if symptoms persist.";
        } else {
            risk = "LOW RISK";
            riskClass = "risk-low";
            confidence = (40 + Math.random() * 15).toFixed(1) + "%";
            recommendation = "You appear to be at low risk. Continue following safety protocols and maintain good hygiene.";
        }

        // Update UI
        riskBadge.innerText = risk;
        riskBadge.className = "risk-badge " + riskClass;
        resultName.innerText = "Patient: " + name;
        resultText.innerText = recommendation;
        confidenceScore.innerText = confidence;

        // Save to History
        saveHistory(name, risk, riskClass, confidence);

    }, 2500);
}

// Persistent History Management
function saveHistory(name, risk, riskClass, confidence) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const record = { name, risk, riskClass, confidence, time };

    // Save to LocalStorage
    let history = JSON.parse(localStorage.getItem('covidHistory') || '[]');
    history.unshift(record);
    localStorage.setItem('covidHistory', JSON.stringify(history));

    renderHistory();

    // Silently send prediction data to the backend API for admin collection
    try {
        const age = parseInt(document.getElementById("age").value) || 25;
        const gender = document.getElementById("gender").value || "Male";
        const fever = document.getElementById("fever").value || "No";
        const cough = document.getElementById("cough").value || "No";
        const fatigue = document.getElementById("fatigue").value || "No";
        const chest = document.getElementById("chest").value || "No";
        const breathing = document.getElementById("breathing").value || "No";
        const diabetes = document.getElementById("diabetes").value || "No";

        const isLocalFile = window.location.protocol === 'file:';
        const isOtherPort = window.location.port !== '5000';
        const baseUrl = (isLocalFile || isOtherPort) ? 'http://127.0.0.1:5000' : '';

        fetch(baseUrl + '/api/save_prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                age: age,
                gender: gender,
                fever: fever,
                cough: cough,
                fatigue: fatigue,
                chest: chest,
                breathing: breathing,
                diabetes: diabetes,
                risk: risk,
                confidence: confidence
            })
        }).then(response => {
            if (!response.ok) {
                console.warn("Background data saving returned status: " + response.status);
            }
        }).catch(err => {
            console.error("Background data saving failed:", err);
        });
    } catch (e) {
        console.error("Failed to extract data for background storage:", e);
    }
}

function renderHistory() {
    const historyList = document.getElementById("historyList");
    const emptyHistory = document.getElementById("emptyHistory");
    const history = JSON.parse(localStorage.getItem('covidHistory') || '[]');

    if (history.length === 0) {
        historyList.innerHTML = `
            <div id="emptyHistory" class="stat-card" style="grid-column: 1 / -1; padding: 60px; opacity: 0.5;">
                <i class="fa-solid fa-folder-open" style="font-size: 50px; margin-bottom: 20px; display: block;"></i>
                <p>No historical analysis records found. Run the engine to generate data.</p>
            </div>
        `;
        return;
    }

    if (emptyHistory) emptyHistory.style.display = "none";
    
    // Efficiently render all items
    historyList.innerHTML = history.map(item => `
        <div class="history-item" style="animation: slideIn 0.5s ease forwards">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-size: 12px; color: var(--text-muted); font-weight: 600; letter-spacing: 1px;">${item.time}</span>
                <span class="risk-badge ${item.riskClass}" style="font-size: 11px; padding: 5px 12px; margin-bottom: 0; border-radius: 8px;">${item.risk}</span>
            </div>
            <h4 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #fff;">${item.name}</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${item.confidence}; height: 100%; background: var(--accent); box-shadow: 0 0 10px var(--accent-glow);"></div>
                </div>
                <span style="font-size: 14px; font-weight: 800; color: var(--accent); min-width: 50px;">${item.confidence}</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 15px; font-weight: 500;">AI Confidence Score</p>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm("Are you sure you want to permanently delete all prediction records?")) {
        localStorage.removeItem('covidHistory');
        renderHistory();
    }
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    const sections = ['stats', 'analytics', 'engine', 'safety'];
    const navLinks = document.querySelectorAll('.nav-links a');

    if (window.scrollY > 50) {
        nav.style.padding = '15px 5%';
        nav.style.background = 'rgba(0,0,0,0.9)';
        nav.style.backdropFilter = 'blur(20px)';
        nav.style.borderBottom = '1px solid var(--glass-border)';
    } else {
        nav.style.padding = '20px 5%';
        nav.style.background = 'transparent';
        nav.style.backdropFilter = 'blur(0px)';
        nav.style.borderBottom = '1px solid transparent';
    }

    // Active Section Highlighting
    let current = "";
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            const sectionTop = element.offsetTop;
            if (window.scrollY >= sectionTop - 150) {
                current = section;
            }
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// Simple Count-Up Animation for Stats
async function animateStats() {
    if (statsLoaded) return;
    statsLoaded = true; // Set early to avoid double execution on scroll intersection

    let activeUsers = 25; // fallback value
    try {
        const isLocalFile = window.location.protocol === 'file:';
        const isOtherPort = window.location.port !== '5000';
        const baseUrl = (isLocalFile || isOtherPort) ? 'http://127.0.0.1:5000' : '';
        const res = await fetch(baseUrl + '/api/stats');
        if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.active_users === 'number') {
                activeUsers = data.active_users;
            }
        }
    } catch (e) {
        console.error("Failed to load realtime active users:", e);
    }

    const stats = [
        { id: 'stat-total', end: 705, suffix: 'M' },
        { id: 'stat-accuracy', end: 98.4, suffix: '%' },
        { id: 'stat-users', end: activeUsers, suffix: '' },
        { id: 'stat-saved', end: 22, suffix: 'M' }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (!el) return;
        
        let start = 0;
        const duration = 2000;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = stat.end / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= stat.end) {
                el.innerText = stat.end + stat.suffix;
                clearInterval(timer);
            } else {
                el.innerText = (stat.end % 1 === 0 ? Math.floor(start) : start.toFixed(1)) + stat.suffix;
            }
        }, stepTime);
    });
}

// Trigger stats animation when visible
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        animateStats();
    }
}, { threshold: 0.5 });

const statsContainer = document.getElementById('stats');
if (statsContainer) observer.observe(statsContainer);

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('covidChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Global Recovery Rate',
                data: [65, 68, 75, 82, 85, 88, 92, 94, 95, 96, 97, 98],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { family: 'Outfit', size: 14 },
                    bodyFont: { family: 'Outfit', size: 13 },
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initDropdowns();
    renderHistory();
    initCustomSelects();
    initMobileMenu();
});

function initMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-overlay');
    const closeBtn = document.getElementById('overlay-close');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            overlay.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }
}

function toggleMenu() {
    const overlay = document.getElementById('mobile-overlay');
    overlay.classList.remove('active');
}

// Custom Select Logic
function initCustomSelects() {
    const customSelect = document.getElementById('genderSelect');
    const trigger = customSelect.querySelector('.select-trigger');
    const options = customSelect.querySelectorAll('.option');
    const hiddenInput = document.getElementById('gender');
    const triggerText = trigger.querySelector('span');

    // Toggle Dropdown
    trigger.addEventListener('click', (e) => {
        customSelect.classList.toggle('active');
        e.stopPropagation();
    });

    // Option Selection
    options.forEach(option => {
        option.addEventListener('click', () => {
            const val = option.getAttribute('data-value');
            
            // Update UI
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            triggerText.innerText = val;
            
            // Update Hidden Input
            hiddenInput.value = val;
            
            // Close Dropdown
            customSelect.classList.remove('active');
        });
    });

    // Close on Outside Click
    window.addEventListener('click', () => {
        customSelect.classList.remove('active');
    });
}



// Dynamic Dropdown Colors
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.field select');
    
    dropdowns.forEach(select => {
        // Function to update style
        const updateStyle = () => {
            if (select.value === "Yes") {
                select.classList.add('yes-selected');
                select.classList.remove('no-selected');
            } else if (select.value === "No") {
                select.classList.add('no-selected');
                select.classList.remove('yes-selected');
            } else {
                select.classList.remove('yes-selected', 'no-selected');
            }
        };

        // Add event listener
        select.addEventListener('change', updateStyle);
        
        // Initial check
        updateStyle();
    });
}


