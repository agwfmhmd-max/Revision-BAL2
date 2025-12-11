const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
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

// 🧠 1. دالة تنظيف النصوص (المطورة)
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // حذف الحركات
        .replace(/[_.-]/g, " ") // ✅ تحويل الرموز _ و - و . إلى مسافات (مهم جداً لطلبك)
        .replace(/[^a-z0-9\s]/g, "") // حذف الرموز الغريبة الأخرى
        .trim();
}

// 🧠 2. خوارزمية البحث الذكية جداً
function isFileMatch(fileName, subjectName) {
    const fileClean = normalizeText(fileName);
    const subjectClean = normalizeText(subjectName);

    // قائمة الكلمات التي لا تؤثر في البحث (Stop Words)
    // سيتم تجاهل كلمة "des" في "Anglais des affaires"
    const stopWords = ["le", "la", "les", "de", "des", "du", "et", "en", "au", "aux", "un", "une", "pour", "a"];

    // استخراج الكلمات المهمة فقط من اسم المادة
    const subjectKeywords = subjectClean.split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.includes(w));

    // فحص تطابق الكلمات المهمة مع اسم الملف
    let matchCount = 0;
    subjectKeywords.forEach(keyword => {
        if (fileClean.includes(keyword)) matchCount++;
    });

    // القواعد:
    // 1. إذا كانت المادة تتكون من كلمة أو كلمتين (مثل Marketing أو Technique Bancaire)
    // يجب أن تكون كل الكلمات موجودة لضمان الدقة.
    if (subjectKeywords.length <= 2) {
        return matchCount === subjectKeywords.length;
    }

    // 2. للمواد الطويلة (مثل Méthodes d’aide à la décision)
    // يكفي تطابق 70% من الكلمات.
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
        // نستخدم الدالة الذكية + نتأكد أنه ملف PDF
        return isFileMatch(file.name, subjectName) && file.name.toLowerCase().endsWith(".pdf");
    });

    if (filteredFiles.length === 0) {
        noFilesMsg.classList.remove('hidden');
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name.replace('.pdf', ''); // إزالة الامتداد فقط
            li.onclick = () => openSmartViewer(file.name);
            pdfList.appendChild(li);
        });
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// العارض (يمنع التنزيل + خيار خارجي)
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
    
    // رابط العارض الخارجي (Google Drive) - لا ينزل الملف بل يعرضه
    const googleViewerUrl = `https://drive.google.com/viewerng/viewer?url=${cdnUrl}`;

    actionBtn.onclick = () => window.open(googleViewerUrl, '_blank');
    actionBtn.style.display = 'block'; 

    const iframe = document.createElement('iframe');
    // استخدام Google Drive Viewer للعرض الداخلي (أكثر استقراراً)
    iframe.src = `https://drive.google.com/viewerng/viewer?embedded=true&url=${cdnUrl}`;
    
    iframe.onload = function() { msgDiv.style.display = 'none'; };
    setTimeout(() => { msgDiv.style.display = 'none'; }, 5000);

    renderArea.appendChild(iframe);
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
    document.getElementById('pdf-render-area').innerHTML = "";
}