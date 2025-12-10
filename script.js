// إعدادات المستودع
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 

// 1. الرابط للبحث في الجذر (Root)
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

// 2. رابط GitHub Pages الأساسي
const pagesBaseUrl = `https://${repoOwner}.github.io/${repoName}/`;

let allFiles = []; 

// تحميل قائمة الملفات عند فتح الموقع
document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("فشل الاتصال بـ GitHub API");
            return response.json();
        })
        .then(data => {
            allFiles = data; 
            console.log("تم تحميل الملفات:", allFiles.length);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const viewerContainer = document.getElementById('pdf-viewer-container');
    const noFilesMsg = document.getElementById('no-files-msg');
    const loadingMsg = document.getElementById('loading-msg');

    // تصفير الواجهة
    pdfList.innerHTML = "";
    viewerContainer.classList.add('hidden'); 
    listContainer.classList.remove('hidden'); 
    subjectTitle.textContent = subjectName;
    noFilesMsg.style.display = 'none';

    // الانتظار إذا لم يتم تحميل البيانات بعد
    if (allFiles.length === 0) {
        loadingMsg.style.display = 'block';
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    loadingMsg.style.display = 'none';

    // فلترة الملفات: تبدأ باسم المادة + تنتهي بـ .pdf
    const filteredFiles = allFiles.filter(file => {
        const fileName = file.name.toLowerCase();
        const searchKey = subjectName.toLowerCase();
        return fileName.startsWith(searchKey) && fileName.endsWith(".pdf");
    });

    if (filteredFiles.length === 0) {
        noFilesMsg.style.display = 'block';
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name.replace('.pdf', ''); 
            li.onclick = () => openPdf(file.name);
            pdfList.appendChild(li);
        });
    }

    listContainer.scrollIntoView({ behavior: 'smooth' });
}

function openPdf(fileName) {
    const viewerContainer = document.getElementById('pdf-viewer-container');
    const iframe = document.getElementById('pdf-frame');

    // ترميز اسم الملف للتعامل مع المسافات
    const fileUrl = pagesBaseUrl + encodeURIComponent(fileName);

    // استخدام Google Docs Viewer لفتح الملف داخل الموقع (يمنع التحميل التلقائي)
    const viewerUrl = `https://docs.google.com/gview?url=${fileUrl}&embedded=true`;

    iframe.src = viewerUrl;
    viewerContainer.classList.remove('hidden');
    viewerContainer.scrollIntoView({ behavior: 'smooth' });
}