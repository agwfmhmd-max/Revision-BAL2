// إعدادات المستودع (تأكد من صحتها)
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

// 1. جلب الملفات
function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            console.log("تم تحميل قاعدة البيانات:", allFiles.length);
        })
        .catch(err => console.error("Error loading files:", err));
}

// 2. إدارة واجهة الفصول (S3 / S4)
function showSubjects(semester) {
    // إخفاء قسم اختيار الفصل
    document.getElementById('semester-selection').classList.add('hidden');
    
    // إظهار قسم المواد
    document.getElementById('subjects-container').classList.remove('hidden');
    document.getElementById('subjects-container').classList.add('fade-in');

    // تحديد أي قائمة مواد ستظهر
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
    // إخفاء كل شيء والعودة للرئيسية
    document.getElementById('subjects-container').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    
    const semSelection = document.getElementById('semester-selection');
    semSelection.classList.remove('hidden');
    semSelection.classList.add('fade-in');
}

// 3. عرض الملفات عند اختيار المادة
function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const noFilesMsg = document.getElementById('no-files-msg');
    const spinner = document.getElementById('loading-spinner');

    // إعداد الواجهة
    pdfList.innerHTML = "";
    listContainer.classList.remove('hidden');
    listContainer.classList.add('fade-in');
    subjectTitle.textContent = subjectName;
    noFilesMsg.classList.add('hidden');

    // التأكد من تحميل الملفات
    if (allFiles.length === 0) {
        spinner.classList.remove('hidden');
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    spinner.classList.add('hidden');

    // الفلترة
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
            // تنظيف الاسم للعرض
            const displayName = file.name.replace('.pdf', '').replace(subjectName, '').replace(/^[\s-–]+/, '') || file.name.replace('.pdf', '');
            
            li.textContent = displayName;
            li.onclick = () => renderPdf(file.name);
            pdfList.appendChild(li);
        });
        
        // التمرير للقائمة
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. قارئ PDF الاحترافي
async function renderPdf(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');

    // فتح واجهة القراءة
    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    renderArea.innerHTML = "";
    msgDiv.style.display = 'block';

    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;

    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        msgDiv.style.display = 'none';

        // عرض كل الصفحات
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // حساب الحجم المناسب للشاشة
            let scale = 1.5;
            if(window.innerWidth < 600) scale = 0.8; // تصغير للموبايل

            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            renderArea.appendChild(canvas);
            await page.render(renderContext).promise;
        }

    } catch (error) {
        console.error('Error:', error);
        msgDiv.innerHTML = `<p style="color:#ff5252">حدث خطأ أثناء تحميل الملف.<br>تأكد من الإنترنت.</p>`;
    }
}

function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
}