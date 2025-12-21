const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 
let currentSpecialization = ''; 
let currentLevel = '';

const commonSubjects = [
    "Statistique descriptive I", "Mathématique", "Méthodologie du travail universitaire",
    "Introduction au droit", "Statistique descriptive II", "Comptabilité des Sociétés",
    "Méthodes d’aide à la décision"
];

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
    checkWelcome();
});

function checkWelcome() {
    if (!localStorage.getItem('welcome_seen_permanent')) {
        document.getElementById('welcome-modal').classList.remove('hidden');
    }
}

function closeWelcomeModal() {
    document.getElementById('welcome-modal').classList.add('hidden');
    localStorage.setItem('welcome_seen_permanent', 'true');
}

function fetchFilesFromGitHub() {
    const cachedFiles = sessionStorage.getItem('ba_files_cache');
    if (cachedFiles) {
        allFiles = JSON.parse(cachedFiles);
    }
    fetch(apiUrl + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            sessionStorage.setItem('ba_files_cache', JSON.stringify(data));
        })
        .catch(err => console.error("Error:", err));
}

function handleGlobalSearch(query) {
    const fileListContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const selectedTitle = document.getElementById('selected-subject-name');
    const closeBtn = document.getElementById('close-search-btn');
    const noFilesMsg = document.getElementById('no-files-msg');
    
    if (query.trim().length > 0) {
        document.querySelectorAll('.section-box').forEach(el => el.classList.add('hidden'));
        fileListContainer.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        selectedTitle.textContent = `بحث: "${query}"`;
        
        pdfList.innerHTML = "";
        
        const searchClean = normalizeText(query);
        const results = allFiles.filter(file => {
            return normalizeText(file.name).includes(searchClean) && file.name.toLowerCase().endsWith(".pdf");
        });

        if (results.length === 0) {
            noFilesMsg.classList.remove('hidden');
        } else {
            noFilesMsg.classList.add('hidden');
            results.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name.replace('.pdf', ''); 
                li.onclick = () => openSmartViewer(file.name);
                pdfList.appendChild(li);
            });
        }
    } else {
        closeSearch();
    }
}

function closeSearch() {
    document.getElementById('global-search').value = ""; 
    document.getElementById('file-list-container').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function showSpecializationSelection() {
    hideAll();
    document.getElementById('specialization-selection').classList.remove('hidden');
}
function selectSpecialization(spec) {
    currentSpecialization = spec;
    hideAll();
    document.getElementById('level-selection').classList.remove('hidden');
}
function showResultsSection() {
    hideAll();
    document.getElementById('results-selection').classList.remove('hidden');
}
function goBackToMainMenu() {
    hideAll();
    document.getElementById('main-menu').classList.remove('hidden');
}
function goBackToSpecialization() {
    hideAll();
    document.getElementById('specialization-selection').classList.remove('hidden');
}
function showSemesters(level) {
    currentLevel = level;
    hideAll();
    const container = document.getElementById('semesters-container');
    container.classList.remove('hidden');
    
    const grid = document.getElementById('semesters-grid-view');
    grid.innerHTML = ''; 
    let semesters = (level === 'l1') ? ['s1', 's2'] : (level === 'l2') ? ['s3', 's4'] : ['s5', 's6'];
    
    semesters.forEach(sem => {
        const div = document.createElement('div');
        div.className = 'semester-card';
        div.onclick = () => showSubjects(sem);
        div.innerHTML = `<div class="icon-box">${sem.toUpperCase()}</div><h3>Semestre ${sem.replace('s','')}</h3>`;
        grid.appendChild(div);
    });
    document.getElementById('semesters-title').textContent = level.toUpperCase();
}
function goBackToLevels() {
    hideAll();
    document.getElementById('level-selection').classList.remove('hidden');
}
function showSubjects(semester) {
    hideAll();
    document.getElementById('subjects-container').classList.remove('hidden');
    document.querySelectorAll('.buttons-grid').forEach(list => list.classList.add('hidden'));
    
    const targetId = `${currentSpecialization}-${semester}-list`;
    const targetList = document.getElementById(targetId);
    if (targetList) targetList.classList.remove('hidden');
    else {
        const placeholder = document.createElement('div');
        placeholder.className = 'buttons-grid';
        placeholder.innerHTML = '<p style="text-align:center;color:#666">قريباً...</p>';
        document.getElementById('subjects-container').appendChild(placeholder);
    }
    document.getElementById('current-semester-title').textContent = semester.toUpperCase();
}
function goBackToSemesters() {
    hideAll();
    showSemesters(currentLevel);
}

function hideAll() {
    document.querySelectorAll('.section-box').forEach(el => el.classList.add('hidden'));
}

// (نفس دوال المطابقة وفتح الملف السابقة - openSmartViewer, normalizeText...)
function normalizeText(text) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’_.-]/g, " ").replace(/[^a-z0-9\s]/g, "").trim(); }
function openSmartViewer(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    renderArea.innerHTML = "";
    viewerOverlay.classList.remove('hidden');
    document.getElementById('viewer-filename').textContent = fileName.replace('.pdf', '');
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;
    
    document.getElementById('viewer-action-btn').onclick = () => window.open(googleViewerUrl, '_blank');
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    renderArea.appendChild(iframe);
}
function closePdfViewer() { document.getElementById('pdf-viewer-overlay').classList.add('hidden'); }