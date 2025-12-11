const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    // إضافة timestamp لتجنب الكاش القديم
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

// 🧠 دالة تنظيف النصوص للمقارنة الذكية
function normalizeText(text) {
    return text
        .toLowerCase() // تحويل لصغير
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // إزالة الحركات (accents)
        .replace(/[^a-z0-9]/g, " ") // إزالة الرموز الخاصة
        .trim();
}

// 🔍 خوارزمية البحث المرن
function isFileMatch(fileName, subjectName) {
    const fileClean = normalizeText(fileName);
    const subjectClean = normalizeText(subjectName);

    // 1. إذا كان اسم الملف يحتوي على اسم المادة كاملاً
    if (fileClean.includes(subjectClean)) return true;

    // 2. البحث بالكلمات المفتاحية (للمواد الطويلة مثل Méthodes d’aide à la décision)
    // نقسم اسم المادة إلى كلمات
    const subjectKeywords = subjectClean.split(" ").filter(w => w.length > 2); // نأخذ الكلمات الأطول من حرفين
    
    // يجب أن يحتوي الملف على جميع الكلمات المهمة في اسم المادة
    // أو على الأقل 70% من الكلمات لتكون النتيجة دقيقة
    const matches = subjectKeywords.filter(keyword => fileClean.includes(keyword));
    
    // إذا تطابقت أغلب الكلمات المهمة
    return matches.length === subjectKeywords.length; 
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

    // استخدام الدالة الذكية للفلترة
    const filteredFiles = allFiles.filter(file => {
        return isFileMatch(file.name, subjectName) && file.name.endsWith(".pdf");
    });

    if (filteredFiles.length === 0) {
        noFilesMsg.classList.remove('hidden');
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            // عرض اسم الملف بشكل نظيف
            li.textContent = file.name.replace('.pdf', '');
            li.onclick = () => openSmartViewer(file.name);
            pdfList.appendChild(li);
        });
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// عارض الملفات (Google + Fallback)
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
    
    // الروابط
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;
    const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;

    // زر الفتح الخارجي
    actionBtn.onclick = () => window.open(rawUrl, '_blank');
    actionBtn.style.display = 'block'; 

    // محاولة فتح Google Viewer
    const iframe = document.createElement('iframe');
    iframe.src = `https://docs.google.com/viewer?url=${cdnUrl}&embedded=true`;
    
    // إخفاء رسالة التحميل عند النجاح
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    
    // تنظيف بعد 4 ثواني إذا تأخر
    setTimeout(() => { msgDiv.style.display = 'none'; }, 4000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}