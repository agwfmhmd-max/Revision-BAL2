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
    "Méthodes d’aide à la décision", "MS office", "Anglais I", "Anglais II",
    "Aptitudes en TIC", "Développement personnel"
];

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
    checkWelcome();
});

function openAboutModal() { document.getElementById('about-modal').classList.remove('hidden'); }
function closeAboutModal() { document.getElementById('about-modal').classList.add('hidden'); }

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
        try { allFiles = JSON.parse(cachedFiles); } catch(e){}
    }
    
    fetch(apiUrl + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                allFiles = data;
                sessionStorage.setItem('ba_files_cache', JSON.stringify(data));
            }
        })
        .catch(err => console.error("Error:", err));
}

// ---------------- البحث الشامل ----------------
function handleGlobalSearch(query) {
    const fileListContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const selectedTitle = document.getElementById('selected-subject-name');
    const closeBtn = document.getElementById('close-search-btn');
    const noFilesMsg = document.getElementById('no-files-msg');
    
    if (query.trim().length > 0) {
        hideAll();
        fileListContainer.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        selectedTitle.textContent = `نتائج البحث عن: "${query}"`;
        
        pdfList.innerHTML = "";
        
        const searchClean = normalizeText(query);
        const results = allFiles.filter(file => {
            const fileNameClean = normalizeText(file.name);
            // ✅ البحث عن PDF فقط
            return fileNameClean.includes(searchClean) && file.name.toLowerCase().endsWith(".pdf");
        });

        if (results.length === 0) {
            noFilesMsg.classList.remove('hidden');
        } else {
            noFilesMsg.classList.add('hidden');
            results.forEach(file => {
                const li = document.createElement('li');
                // ✅ أيقونة PDF فقط
                li.innerHTML = `<i class="fas fa-file-pdf icon-pdf file-icon"></i> ${file.name.replace('.pdf', '')}`;
                li.onclick = () => openSmartViewer(file.name);
                pdfList.appendChild(li);
            });
            setTimeout(() => { fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
        }
    } else {
        closeSearch();
    }
}

function closeSearch() {
    document.getElementById('global-search').value = ""; 
    document.getElementById('file-list-container').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------- التنقل ----------------
function showSpecializationSelection() { hideAll(); document.getElementById('specialization-selection').classList.remove('hidden'); }
function selectSpecialization(spec) { currentSpecialization = spec; hideAll(); document.getElementById('level-selection').classList.remove('hidden'); }
function showResultsSection() { hideAll(); document.getElementById('results-selection').classList.remove('hidden'); }
function goBackToMainMenu() { hideAll(); document.getElementById('main-menu').classList.remove('hidden'); }
function goBackToSpecialization() { hideAll(); document.getElementById('specialization-selection').classList.remove('hidden'); }
function showSemesters(level) {
    currentLevel = level;
    hideAll();
    document.getElementById('semesters-container').classList.remove('hidden');
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
function goBackToLevels() { hideAll(); document.getElementById('level-selection').classList.remove('hidden'); }
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
        placeholder.innerHTML = '<p style="text-align:center;width:100%;color:#666">قريباً...</p>';
        document.getElementById('subjects-container').appendChild(placeholder);
    }
    document.getElementById('current-semester-title').textContent = `المواد (${currentSpecialization.toUpperCase()} - ${semester.toUpperCase()})`;
}
function goBackToSemesters() { hideAll(); showSemesters(currentLevel); }
function hideAll() { document.querySelectorAll('.section-box').forEach(el => el.classList.add('hidden')); }

// ---------------- الفلترة والمطابقة ----------------
function normalizeText(text) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’_.-]/g, " ").replace(/[^a-z0-9\s]/g, "").trim(); }
function mapRomanNumbers(text) {
    let safeText = " " + text + " ";
    safeText = safeText.replace(/\s(i|1)\s/g, " 1 ");
    safeText = safeText.replace(/\s(ii|2)\s/g, " 2 ");
    return safeText;
}

function isFileMatch(fileName, subjectName) {
    let fileClean = normalizeText(fileName);
    let subjectClean = normalizeText(subjectName);
    let fileMapped = mapRomanNumbers(fileClean);
    let subjectMapped = mapRomanNumbers(subjectClean);

    const isCommon = commonSubjects.some(common => normalizeText(common) === subjectClean);

    if (!isCommon) {
        if (currentSpecialization === 'fc') { if (!fileClean.includes("fc")) return false; } 
        else if (currentSpecialization === 'ba') { if (fileClean.includes("fc")) return false; }
    }

    if (subjectClean.includes("affaires")) { if (!fileClean.includes("affaires")) return false; } 
    else if (subjectClean.includes("anglais") && !subjectClean.includes("affaires")) { if (fileClean.includes("affaires")) return false; }
    
    if (subjectMapped.includes(" 1 ")) { if (!fileMapped.includes(" 1 ")) return false; if (fileMapped.includes(" 2 ")) return false; }
    if (subjectMapped.includes(" 2 ")) { if (!fileMapped.includes(" 2 ")) return false; if (fileMapped.includes(" 1 ")) return false; }

    const stopWords = ["le", "la", "les", "de", "des", "du", "et", "en", "au", "aux", "un", "une", "pour", "a", "l", "d"];
    const subjectKeywords = subjectClean.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

    if (subjectKeywords.length === 0) return fileClean.includes(subjectClean);

    let matchCount = 0;
    subjectKeywords.forEach(keyword => { if (fileClean.includes(keyword)) matchCount++; });

    if (subjectKeywords.length <= 2) return matchCount === subjectKeywords.length;
    return matchCount >= Math.ceil(subjectKeywords.length * 0.7); 
}

function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const noFilesMsg = document.getElementById('no-files-msg');
    const spinner = document.getElementById('loading-spinner');
    const closeBtn = document.getElementById('close-search-btn');

    pdfList.innerHTML = "";
    listContainer.classList.remove('hidden');
    subjectTitle.textContent = subjectName;
    noFilesMsg.classList.add('hidden');
    spinner.classList.remove('hidden');
    closeBtn.classList.add('hidden');

    setTimeout(() => {
        const filteredFiles = allFiles.filter(file => {
            // ✅ تصفية PDF فقط
            return isFileMatch(file.name, subjectName) && file.name.toLowerCase().endsWith(".pdf");
        });
        spinner.classList.add('hidden');
        if (filteredFiles.length === 0) {
            noFilesMsg.classList.remove('hidden');
        } else {
            noFilesMsg.classList.add('hidden');
            filteredFiles.forEach(file => {
                const li = document.createElement('li');
                // ✅ أيقونة PDF ثابتة
                li.innerHTML = `<i class="fas fa-file-pdf icon-pdf file-icon"></i> ${file.name.replace('.pdf', '')}`;
                li.onclick = () => openSmartViewer(file.name);
                pdfList.appendChild(li);
            });
            listContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }, 50);
}

// ✅ العارض: Google Drive Viewer فقط (للـ PDF)
function openSmartViewer(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');
    const actionBtn = document.getElementById('viewer-action-btn');

    renderArea.innerHTML = "";
    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    msgDiv.style.display = 'block';
    
    // رابط الملف المباشر من CDN
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    
    // رابط المشاهدة
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;

    actionBtn.onclick = () => window.open(googleViewerUrl, '_blank');
    actionBtn.style.display = 'block'; 

    const iframe = document.createElement('iframe');
    iframe.setAttribute('loading', 'lazy');
    // ✅ وضع العرض المضمن (Embedded)
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    setTimeout(() => { msgDiv.style.display = 'none'; }, 3000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}

function openInternalBrowser(url, title) {
    const viewer = document.getElementById('web-viewer-overlay');
    document.getElementById('web-frame').src = url;
    document.getElementById('web-viewer-title').textContent = title;
    viewer.classList.remove('hidden');
}
function closeInternalBrowser() {
    document.getElementById('web-viewer-overlay').classList.add('hidden');
    document.getElementById('web-frame').src = "";
}