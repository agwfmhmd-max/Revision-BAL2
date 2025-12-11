// إعدادات المستودع
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; 
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

// ✅ إضافة رابط ملفات الخطوط (CMaps) لإصلاح المسافات والأحرف الغريبة
const cmapsUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/';

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

// 1. جلب الملفات
function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            console.log("Database loaded:", allFiles.length);
        })
        .catch(err => console.error("Error loading files:", err));
}

// 2. التنقل بين الفصول
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

// 3. عرض الملفات
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
            let displayName = file.name.replace('.pdf', '');
            li.textContent = displayName;
            li.onclick = () => renderPdf(file.name);
            pdfList.appendChild(li);
        });
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. قارئ PDF عالي الدقة (Smart Sharpness Fix)
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
        // ✅ تحميل المستند مع تفعيل CMaps (لإصلاح الخطوط)
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            cMapUrl: cmapsUrl,
            cMapPacked: true
        });

        const pdf = await loadingTask.promise;
        msgDiv.style.display = 'none';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // ✅ الخوارزمية الجديدة للوضوح الفائق:
            // 1. نحسب عرض شاشة المستخدم الحقيقي
            const containerWidth = renderArea.clientWidth || window.innerWidth;
            
            // 2. نحسب كثافة بيكسلات الشاشة (للهواتف تكون 2 أو 3)
            // هذا هو السر في جعل النص "شفرة" وبدون ضبابية
            const pixelRatio = window.devicePixelRatio || 1;

            // 3. نحصل على الأبعاد الأصلية للصفحة
            const unscaledViewport = page.getViewport({ scale: 1 });
            
            // 4. نحسب معامل التكبير ليملأ العرض + نضربه في كثافة الشاشة
            const scale = (containerWidth / unscaledViewport.width) * pixelRatio;

            const viewport = page.getViewport({ scale: scale });

            // إعداد اللوحة (Canvas)
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // ✅ نضغط اللوحة الكبيرة لتناسب الشاشة باستخدام CSS
            // هذا يجعل البيكسلات مضغوطة وحادة جداً
            canvas.style.width = "100%"; 
            canvas.style.height = "auto";
            canvas.style.marginBottom = "15px";
            canvas.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                // تفعيل تسريع الهاردوير
                enableHWA: true
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