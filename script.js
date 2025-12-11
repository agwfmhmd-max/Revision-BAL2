// إعدادات المستودع
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

// ✅ (1) روابط الخطوط وإصلاح الأحرف (مهم جداً لحل مشكلة المسافات)
const cMapUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/';
const standardFontDataUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/';

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

// جلب الملفات
function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            console.log("Database loaded:", allFiles.length);
        })
        .catch(err => console.error("Error loading files:", err));
}

// التنقل بين الفصول
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
    const semSelection = document.getElementById('semester-selection');
    semSelection.classList.remove('hidden');
    semSelection.classList.add('fade-in');
}

// عرض القائمة
function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const noFilesMsg = document.getElementById('no-files-msg');
    const spinner = document.getElementById('loading-spinner');

    pdfList.innerHTML = "";
    listContainer.classList.remove('hidden');
    listContainer.classList.add('fade-in');
    subjectTitle.textContent = subjectName;
    noFilesMsg.classList.add('hidden');

    if (allFiles.length === 0) {
        spinner.classList.remove('hidden');
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    spinner.classList.add('hidden');

    const filteredFiles = allFiles.filter(file => {
        const name = file.name.toLowerCase();
        const search = subjectName.toLowerCase();
        return name.startsWith(search) && name.endsWith(".pdf");
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

// 4. قارئ PDF المحسن (إصلاح المسافات والخطوط)
async function renderPdf(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');

    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    renderArea.innerHTML = ""; 
    msgDiv.style.display = 'block';

    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;

    try {
        // ✅ (2) تحميل المستند مع إعدادات الخطوط الصارمة
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            cMapUrl: cMapUrl,
            cMapPacked: true,
            standardFontDataUrl: standardFontDataUrl // هذا السطر هو حل مشكلة المسافات
        });

        const pdf = await loadingTask.promise;
        msgDiv.style.display = 'none';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // حساب الأبعاد بدقة
            const containerWidth = renderArea.clientWidth || window.innerWidth;
            const pixelRatio = window.devicePixelRatio || 1; // كثافة الشاشة
            
            const unscaledViewport = page.getViewport({ scale: 1 });
            
            // معادلة التكبير لتناسب العرض
            const scale = (containerWidth / unscaledViewport.width) * pixelRatio;
            
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: false }); // تحسين الأداء
            
            // ✅ (3) استخدام أرقام صحيحة (Math.floor) لمنع ضبابية الحواف
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            // ضغط الكانفس بتقنية CSS Pixel Matching
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.style.marginBottom = "10px";
            canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            renderArea.appendChild(canvas);
            await page.render(renderContext).promise;
        }

    } catch (error) {
        console.error('Error rendering PDF:', error);
        msgDiv.innerHTML = `<p style="color:#ff5252; text-align:center;">حدث خطأ أثناء تحميل الملف.<br>تأكد من الإنترنت.</p>`;
    }
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
}