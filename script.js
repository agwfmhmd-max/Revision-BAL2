const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 
let currentLevel = ''; // لتخزين المستوى الحالي (l1, l2, l3) عند الرجوع

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    fetch(apiUrl + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => allFiles = data)
        .catch(err => console.error("Error fetching files:", err));
}

// 1. عرض الفصول بناءً على المستوى (L1, L2, L3)
function showSemesters(level) {
    currentLevel = level; // حفظ المستوى الحالي للرجوع
    document.getElementById('level-selection').classList.add('hidden');
    
    // إخفاء جميع الفصول أولاً
    document.getElementById('semesters-l1').classList.add('hidden');
    document.getElementById('semesters-l2').classList.add('hidden');
    document.getElementById('semesters-l3').classList.add('hidden');

    // إظهار الفصل المطلوب
    const targetDiv = document.getElementById(`semesters-${level}`);
    if (targetDiv) {
        targetDiv.classList.remove('hidden');
        targetDiv.classList.add('fade-in');
    }
}

// 2. الرجوع من الفصول إلى المستويات
function goBackToLevels() {
    document.getElementById('semesters-l1').classList.add('hidden');
    document.getElementById('semesters-l2').classList.add('hidden');
    document.getElementById('semesters-l3').classList.add('hidden');
    
    const levelSelection = document.getElementById('level-selection');
    levelSelection.classList.remove('hidden');
    levelSelection.classList.add('fade-in');
}

// 3. عرض المواد بناءً على الفصل (S1, S2, ...)
function showSubjects(semester) {
    // إخفاء حاويات الفصول
    document.getElementById('semesters-l1').classList.add('hidden');
    document.getElementById('semesters-l2').classList.add('hidden');
    document.getElementById('semesters-l3').classList.add('hidden');

    const subjectsContainer = document.getElementById('subjects-container');
    subjectsContainer.classList.remove('hidden');
    subjectsContainer.classList.add('fade-in');

    // إخفاء كل قوائم المواد
    ['s1','s2','s3','s4','s5','s6'].forEach(s => {
        const div = document.getElementById(`${s}-list`);
        if(div) div.classList.add('hidden');
    });

    // إظهار القائمة المطلوبة
    const targetList = document.getElementById(`${semester}-list`);
    const title = document.getElementById('current-semester-title');
    
    if (targetList) targetList.classList.remove('hidden');
    title.textContent = `مواد الفصل (${semester.toUpperCase()})`;
}

// 4. الرجوع من المواد إلى الفصول
function goBackToSemesters() {
    document.getElementById('subjects-container').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    
    // العودة لقائمة الفصول بناءً على المستوى المحفوظ
    if (currentLevel) {
        showSemesters(currentLevel);
    } else {
        goBackToLevels(); // احتياط
    }
}

// --- بقية دوال البحث والعرض (لم تتغير) ---

function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[_.-]/g, " ")
        .replace(/[^a-z0-9\s]/g, "").trim();
}

function isFileMatch(fileName, subjectName) {
    const fileClean = normalizeText(fileName);
    const subjectClean = normalizeText(subjectName);
    const stopWords = ["le", "la", "les", "de", "des", "du", "et", "en", "au", "aux", "un", "une", "pour", "a", "l"];

    const subjectKeywords = subjectClean.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));
    let matchCount = 0;
    subjectKeywords.forEach(keyword => {
        if (fileClean.includes(keyword)) matchCount++;
    });

    if (subjectKeywords.length <= 2) return matchCount === subjectKeywords.length;
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

    if (allFiles.length === 0) {
        spinner.classList.remove('hidden');
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    spinner.classList.add('hidden');

    const filteredFiles = allFiles.filter(file => isFileMatch(file.name, subjectName) && file.name.toLowerCase().endsWith(".pdf"));

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
}

function openSmartViewer(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');
    const actionBtn = document.getElementById('viewer-action-btn');

    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    renderArea.innerHTML = ""; 
    msgDiv.style.display = 'block';
    
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;

    actionBtn.onclick = () => window.open(googleViewerUrl, '_blank');
    actionBtn.style.display = 'block'; 

    const iframe = document.createElement('iframe');
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    setTimeout(() => { msgDiv.style.display = 'none'; }, 5000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}