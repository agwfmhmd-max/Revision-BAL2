const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    // timestamp لمنع الكاش القديم
    fetch(apiUrl + "?t=" + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            allFiles = data;
        })
        .catch(err => console.error("Error fetching files:", err));
}

function showSubjects(semester) {
    document.getElementById('semester-selection').classList.add('hidden');
    const subjectsContainer = document.getElementById('subjects-container');
    subjectsContainer.classList.remove('hidden');
    subjectsContainer.classList.add('fade-in');

    const s3List = document.getElementById('s3-list');
    const s4List = document.getElementById('s4-list');
    const title = document.getElementById('current-semester-title');

    if (semester === 's3') {
        s3List.classList.remove('hidden');
        s4List.classList.add('hidden');
        title.textContent = "مواد الفصل الثالث (S3)";
    } else {
        s3List.classList.add('hidden');
        s4List.classList.remove('hidden');
        title.textContent = "مواد الفصل الرابع (S4)";
    }
}

function goBackToSemesters() {
    document.getElementById('subjects-container').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    document.getElementById('semester-selection').classList.remove('hidden');
}

// 🧠 1. دالة تنظيف النصوص (لجعل البحث مرناً جداً)
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // حذف الحركات مثل é
        .replace(/[^a-z0-9\s]/g, " ") // حذف الرموز وترك المسافات
        .trim();
}

// 🧠 2. خوارزمية البحث الذكية
function isFileMatch(fileName, subjectName) {
    const fileClean = normalizeText(fileName);
    const subjectClean = normalizeText(subjectName);

    // أ) تطابق مباشر
    if (fileClean.includes(subjectClean)) return true;

    // ب) تطابق الكلمات المفتاحية (للملفات التي أسمائها مقلوبة أو مختصرة)
    // نقسم اسم المادة إلى كلمات، ونحذف الكلمات القصيرة جداً (مثل de, la)
    const subjectKeywords = subjectClean.split(/\s+/).filter(w => w.length > 2);
    
    if (subjectKeywords.length === 0) return false;

    // نحسب عدد الكلمات الموجودة في اسم الملف
    let matchCount = 0;
    subjectKeywords.forEach(keyword => {
        if (fileClean.includes(keyword)) matchCount++;
    });

    // إذا وجدنا أكثر من نصف كلمات المادة في اسم الملف، نعتبره تطابقاً
    // هذا يلتقط: "Decision Methodes.pdf" للمادة "Méthodes de décision"
    return matchCount >= Math.ceil(subjectKeywords.length * 0.6); 
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

    // استخدام الدالة الذكية
    const filteredFiles = allFiles.filter(file => {
        return isFileMatch(file.name, subjectName) && file.name.endsWith(".pdf");
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

// ✅ العارض المحسن (بدون تنزيل)
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
    
    // رابط CDN سريع
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    
    // رابط العارض الخارجي (يفتح صفحة ويب للعرض وليس الملف المباشر)
    // نستخدم Google Drive Viewer لأنه لا يقوم بالتنزيل التلقائي
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;

    // 🔴 عند الضغط على زر خارجي: نفتح صفحة العارض في نافذة جديدة
    // هذا يمنع التنزيل ويجبر المتصفح على العرض
    actionBtn.onclick = () => window.open(googleViewerUrl, '_blank');
    actionBtn.style.display = 'block'; 

    // محاولة العرض الداخلي
    const iframe = document.createElement('iframe');
    // نستخدم embedded=true للعرض الداخلي
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    
    // مهلة 5 ثواني
    setTimeout(() => { msgDiv.style.display = 'none'; }, 5000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}