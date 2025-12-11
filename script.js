// إعدادات المستودع
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

// مكتبات الخطوط (مهمة جداً)
const cmapsUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/';

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
        })
        .catch(err => console.error(err));
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
        return file.name.toLowerCase().startsWith(subjectName.toLowerCase()) && file.name.endsWith(".pdf");
    });

    if (filteredFiles.length === 0) {
        noFilesMsg.classList.remove('hidden');
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name.replace('.pdf', '');
            li.onclick = () => renderPdf(file.name);
            pdfList.appendChild(li);
        });
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. قارئ PDF باستخدام رابط JSDelivr (الحل لمشكلة الخطوط)
async function renderPdf(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');

    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    renderArea.innerHTML = ""; 
    msgDiv.style.display = 'block';

    // ✅ التغيير الجوهري هنا:
    // نستخدم cdn.jsdelivr.net بدلاً من raw.githubusercontent
    // هذا يسمح بتحميل الخطوط بشكل صحيح ويمنع تباعد الأحرف
    const url = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${branchName}/${encodeURIComponent(fileName)}`;

    try {
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            cMapUrl: cmapsUrl,
            cMapPacked: true
        });

        const pdf = await loadingTask.promise;
        msgDiv.style.display = 'none';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // دقة عالية جداً (HD)
            const scale = 2.0; 
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // تنسيق CSS ليناسب الشاشة
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.style.marginBottom = "10px";
            canvas.style.borderRadius = "5px";
            canvas.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            renderArea.appendChild(canvas);
            await page.render(renderContext).promise;
        }

    } catch (error) {
        console.error('Error:', error);
        msgDiv.innerHTML = `<p style="color:red; text-align:center; padding:20px;">
            تعذر فتح الملف.<br>
            جاري المحاولة بالسيرفر الاحتياطي...
        </p>`;
        
        // محاولة احتياطية (Fallback)
        setTimeout(() => {
             // في حال فشل السيرفر الأول، نستخدم رابط GitHub المباشر
             const fallbackUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;
             window.open(fallbackUrl, '_blank'); // فتحه في نافذة جديدة كحل أخير
        }, 2000);
    }
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
}