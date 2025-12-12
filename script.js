const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 
let currentLevel = '';

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    fetch(apiUrl + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => allFiles = data)
        .catch(err => console.error("Error:", err));
}

// ---------------- التنقل ----------------
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

// ---------------- البحث الذكي والدقيق ----------------

// 1. تنظيف النص
function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // إزالة الحركات
        .replace(/['’]/g, " ") // استبدال الفواصل بمسافات
        .replace(/[_.-]/g, " ") // استبدال الرموز بمسافات
        .replace(/[^a-z0-9\s]/g, "") // إبقاء الأحرف والأرقام
        .replace(/\s+/g, " ") // إزالة المسافات الزائدة
        .trim();
}

// 2. معالجة الأرقام الرومانية (I -> 1, II -> 2)
function mapRomanNumbers(text) {
    // نضيف مسافات حول النص لضمان تطابق الكلمة كاملة (مثلاً i لا تستبدل داخل كلمه finance)
    let safeText = " " + text + " ";
    safeText = safeText.replace(/\s(i|1)\s/g, " 1 "); // I أو 1 تصبح 1
    safeText = safeText.replace(/\s(ii|2)\s/g, " 2 "); // II أو 2 تصبح 2
    return safeText;
}

// 3. خوارزمية المطابقة المتقدمة
function isFileMatch(fileName, subjectName) {
    let fileClean = normalizeText(fileName);
    let subjectClean = normalizeText(subjectName);

    // تطبيق معالجة الأرقام (تحويل I إلى 1 و II إلى 2)
    let fileMapped = mapRomanNumbers(fileClean);
    let subjectMapped = mapRomanNumbers(subjectClean);

    // --- (أ) قواعد صارمة للتفريق بين المواد المتشابهة ---

    // 1. قاعدة "Affaires" (للتفريق بين Anglais I و Anglais des affaires)
    if (subjectClean.includes("affaires")) {
        // إذا المادة فيها Affaires، الملف *يجب* أن يكون فيه Affaires
        if (!fileClean.includes("affaires")) return false;
    } 
    else if (subjectClean.includes("anglais") && !subjectClean.includes("affaires")) {
        // إذا المادة هي Anglais فقط (بدون affaires)، والملف فيه Affaires -> ارفضه
        if (fileClean.includes("affaires")) return false;
    }

    // 2. قاعدة الأرقام (للتفريق بين I و II)
    // نستخدم النسخ التي حولنا فيها الأرقام الرومانية
    if (subjectMapped.includes(" 1 ")) {
        if (!fileMapped.includes(" 1 ")) return false; // المادة 1، الملف ليس 1
        if (fileMapped.includes(" 2 ")) return false; // الملف فيه 2 (خطأ)
    }
    if (subjectMapped.includes(" 2 ")) {
        if (!fileMapped.includes(" 2 ")) return false; // المادة 2، الملف ليس 2
        if (fileMapped.includes(" 1 ")) return false; // الملف فيه 1 (خطأ)
    }

    // --- (ب) البحث العام بالكلمات المفتاحية ---
    const stopWords = ["le", "la", "les", "de", "des", "du", "et", "en", "au", "aux", "un", "une", "pour", "a", "l", "d"];

    const subjectKeywords = subjectClean.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

    if (subjectKeywords.length === 0) return fileClean.includes(subjectClean);

    let matchCount = 0;
    subjectKeywords.forEach(keyword => {
        // بحث عن الكلمة داخل اسم الملف
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

    if (allFiles.length === 0) {
        spinner.classList.remove('hidden');
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    spinner.classList.add('hidden');

    const filteredFiles = allFiles.filter(file => {
        return isFileMatch(file.name, subjectName) && file.name.toLowerCase().endsWith(".pdf");
    });

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

// ---------------- العارض (Viewer) ----------------
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