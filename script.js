const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 
let currentLevel = '';

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
    checkWelcome(); // ✅ فحص الترحيب
});

// ---------------- منطق الترحيب ----------------
function checkWelcome() {
    // نستخدم sessionStorage لكي تظهر الرسالة مرة واحدة في الجلسة (عند إغلاق المتصفح وفتحه تظهر مجدداً)
    // إذا أردتها مرة واحدة للأبد، استخدم localStorage بدلاً من sessionStorage
    if (!sessionStorage.getItem('welcome_seen')) {
        document.getElementById('welcome-modal').classList.remove('hidden');
    }
}

function closeWelcomeModal() {
    document.getElementById('welcome-modal').classList.add('hidden');
    sessionStorage.setItem('welcome_seen', 'true');
}

// ---------------------------------------------

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

// ---------------- التنقل الرئيسي ----------------

function showLevelSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    const levelSection = document.getElementById('level-selection');
    levelSection.classList.remove('hidden');
    levelSection.classList.add('fade-in');
}

function showResultsSection() {
    document.getElementById('main-menu').classList.add('hidden');
    const resultsSection = document.getElementById('results-selection');
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
}

function goBackToMainMenu() {
    document.getElementById('level-selection').classList.add('hidden');
    document.getElementById('results-selection').classList.add('hidden');
    
    const mainMenu = document.getElementById('main-menu');
    mainMenu.classList.remove('hidden');
    mainMenu.classList.add('fade-in');
}

function showSemesters(level) {
    currentLevel = level;
    document.getElementById('level-selection').classList.add('hidden');
    ['l1','l2','l3'].forEach(l => {
        const div = document.getElementById(`semesters-${l}`);
        if(div) div.classList.add('hidden');
    });
    const targetDiv = document.getElementById(`semesters-${level}`);
    if(targetDiv) {
        targetDiv.classList.remove('hidden');
        targetDiv.classList.add('fade-in');
    }
}

function goBackToLevels() {
    ['l1','l2','l3'].forEach(l => document.getElementById(`semesters-${l}`).classList.add('hidden'));
    const levelSelection = document.getElementById('level-selection');
    levelSelection.classList.remove('hidden');
    levelSelection.classList.add('fade-in');
}

function showSubjects(semester) {
    ['l1','l2','l3'].forEach(l => document.getElementById(`semesters-${l}`).classList.add('hidden'));
    
    const subjectsContainer = document.getElementById('subjects-container');
    subjectsContainer.classList.remove('hidden');
    subjectsContainer.classList.add('fade-in');

    ['s1','s2','s3','s4','s5','s6'].forEach(s => {
        const div = document.getElementById(`${s}-list`);
        if(div) div.classList.add('hidden');
    });

    const targetList = document.getElementById(`${semester}-list`);
    const title = document.getElementById('current-semester-title');
    if(targetList) targetList.classList.remove('hidden');
    title.textContent = `المواد (${semester.toUpperCase()})`;
}

function goBackToSemesters() {
    document.getElementById('subjects-container').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    if (currentLevel) showSemesters(currentLevel);
    else goBackToLevels();
}

// ---------------- البحث والعرض ----------------

function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, " ")
        .replace(/[_.-]/g, " ")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

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

    if (subjectClean.includes("affaires")) {
        if (!fileClean.includes("affaires")) return false;
    } 
    else if (subjectClean.includes("anglais") && !subjectClean.includes("affaires")) {
        if (fileClean.includes("affaires")) return false;
    }

    if (subjectMapped.includes(" 1 ")) {
        if (!fileMapped.includes(" 1 ")) return false; 
        if (fileMapped.includes(" 2 ")) return false; 
    }
    if (subjectMapped.includes(" 2 ")) {
        if (!fileMapped.includes(" 2 ")) return false; 
        if (fileMapped.includes(" 1 ")) return false; 
    }

    const stopWords = ["le", "la", "les", "de", "des", "du", "et", "en", "au", "aux", "un", "une", "pour", "a", "l", "d"];
    const subjectKeywords = subjectClean.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

    if (subjectKeywords.length === 0) return fileClean.includes(subjectClean);

    let matchCount = 0;
    subjectKeywords.forEach(keyword => {
        if (fileClean.includes(keyword)) matchCount++;
    });

    if (subjectKeywords.length <= 2) {
        return matchCount === subjectKeywords.length;
    }
    return matchCount >= Math.ceil(subjectKeywords.length * 0.7); 
}

function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const noFilesMsg = document.getElementById('no-files-msg');
    const spinner = document.getElementById('loading-spinner');

    pdfList.innerHTML = "";
    listContainer.classList.remove('hidden');
    subjectTitle.textContent = subjectName;
    noFilesMsg.classList.add('hidden');
    spinner.classList.remove('hidden');

    setTimeout(() => {
        const filteredFiles = allFiles.filter(file => {
            return isFileMatch(file.name, subjectName) && file.name.toLowerCase().endsWith(".pdf");
        });

        spinner.classList.add('hidden');

        if (filteredFiles.length === 0) {
            noFilesMsg.classList.remove('hidden');
        } else {
            filteredFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name.replace('.pdf', ''); 
                li.onclick = () => openSmartViewer(file.name);
                pdfList.appendChild(li);
            });
            listContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }, 50);
}

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
    
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;

    actionBtn.onclick = () => window.open(googleViewerUrl, '_blank');
    actionBtn.style.display = 'block'; 

    const iframe = document.createElement('iframe');
    iframe.setAttribute('loading', 'lazy');
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    setTimeout(() => { msgDiv.style.display = 'none'; }, 3000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}