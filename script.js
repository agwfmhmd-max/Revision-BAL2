const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; // تأكد من اسم الفرع

const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            console.log("Files loaded:", allFiles.length);
        })
        .catch(err => console.error("Error:", err));
}

function loadFiles(subjectName) {
    const listContainer = document.getElementById('file-list-container');
    const pdfList = document.getElementById('pdf-list');
    const subjectTitle = document.getElementById('selected-subject-name');
    const viewerContainer = document.getElementById('pdf-viewer-container');
    const renderArea = document.getElementById('pdf-render-area');
    
    // تصفير الواجهة
    pdfList.innerHTML = "";
    renderArea.innerHTML = ""; // حذف أي ملف مفتوح سابقاً
    viewerContainer.classList.add('hidden'); 
    listContainer.classList.remove('hidden'); 
    subjectTitle.textContent = subjectName;

    if (allFiles.length === 0) {
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }

    const filteredFiles = allFiles.filter(file => {
        const name = file.name.toLowerCase();
        const search = subjectName.toLowerCase();
        return name.startsWith(search) && name.endsWith(".pdf");
    });

    if (filteredFiles.length === 0) {
        const li = document.createElement('li');
        li.textContent = "لا توجد ملفات";
        li.style.color = "red";
        pdfList.appendChild(li);
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name.replace('.pdf', ''); 
            li.onclick = () => renderPdf(file.name); // استدعاء دالة الرسم الجديدة
            pdfList.appendChild(li);
        });
    }

    listContainer.scrollIntoView({ behavior: 'smooth' });
}

// --- دالة قراءة PDF المباشرة (بدون Google) ---
async function renderPdf(fileName) {
    const viewerContainer = document.getElementById('pdf-viewer-container');
    const renderArea = document.getElementById('pdf-render-area');
    const loadingMsg = document.getElementById('rendering-msg');

    // إظهار منطقة العرض
    viewerContainer.classList.remove('hidden');
    loadingMsg.style.display = 'block';
    renderArea.innerHTML = ""; // تنظيف الصفحات القديمة
    
    viewerContainer.scrollIntoView({ behavior: 'smooth' });

    // رابط الملف المباشر (Raw)
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;

    try {
        // 1. تحميل المستند باستخدام PDF.js
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        loadingMsg.style.display = 'none'; // إخفاء رسالة التحميل

        // 2. حلقة تكرارية لعرض جميع الصفحات
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // تحديد دقة العرض (Scale)
            // 1.5 تعني جودة جيدة، يمكن زيادتها لـ 2 إذا كانت النصوص صغيرة
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            // إنشاء عنصر Canvas لكل صفحة
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // رسم الصفحة داخل الـ Canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            renderArea.appendChild(canvas); // إضافة الصفحة للموقع
            
            // انتظار رسم الصفحة الحالية قبل الانتقال للتالية (لترتيب الصفحات)
            await page.render(renderContext).promise;
        }

    } catch (error) {
        console.error('Error rendering PDF:', error);
        loadingMsg.textContent = "حدث خطأ أثناء قراءة الملف. تأكد من الإنترنت.";
        loadingMsg.style.color = "red";
    }
}