// إعدادات المستودع
const repoOwner = "agwfmhmd-max"; 
const repoName = "Revision-BAL2"; 
const branchName = "main"; // تأكد من أن الفرع اسمه main
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let allFiles = []; 

// 1. عند تحميل الصفحة، اجلب قائمة الملفات
document.addEventListener("DOMContentLoaded", () => {
    fetchFilesFromGitHub();
});

// دالة جلب الملفات من GitHub API
function fetchFilesFromGitHub() {
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allFiles = data;
            console.log("تم تحميل قاعدة البيانات:", allFiles.length);
        })
        .catch(err => {
            console.error("Error loading files:", err);
            // في حالة الخطأ يمكن وضع تنبيه هنا
        });
}

// 2. إدارة التنقل بين القوائم (S3 / S4)
function showSubjects(semester) {
    // إخفاء القائمة الرئيسية
    document.getElementById('semester-selection').classList.add('hidden');
    
    // إظهار حاوية المواد
    const subjectsContainer = document.getElementById('subjects-container');
    subjectsContainer.classList.remove('hidden');
    subjectsContainer.classList.add('fade-in');

    // تحديد القوائم
    const s3List = document.getElementById('s3-list');
    const s4List = document.getElementById('s4-list');
    const title = document.getElementById('current-semester-title');

    // التبديل بين الفصلين
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

// دالة زر الرجوع
function goBackToSemesters() {
    // إخفاء الأقسام الفرعية
    document.getElementById('subjects-container').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    
    // إظهار القائمة الرئيسية
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

    // تهيئة الواجهة
    pdfList.innerHTML = "";
    listContainer.classList.remove('hidden');
    listContainer.classList.add('fade-in');
    subjectTitle.textContent = subjectName;
    noFilesMsg.classList.add('hidden');

    // إذا لم يتم تحميل البيانات بعد، انتظر قليلاً وأعد المحاولة
    if (allFiles.length === 0) {
        spinner.classList.remove('hidden');
        setTimeout(() => loadFiles(subjectName), 1000);
        return;
    }
    spinner.classList.add('hidden');

    // فلترة الملفات (يجب أن تبدأ باسم المادة وتنتهي بـ .pdf)
    const filteredFiles = allFiles.filter(file => {
        const name = file.name.toLowerCase();
        const search = subjectName.toLowerCase();
        return name.startsWith(search) && name.endsWith(".pdf");
    });

    // عرض النتائج
    if (filteredFiles.length === 0) {
        noFilesMsg.classList.remove('hidden');
    } else {
        filteredFiles.forEach(file => {
            const li = document.createElement('li');
            
            // تنظيف اسم الملف للعرض (حذف اسم المادة والامتداد ليكون أقصر)
            // هذا السطر اختياري، يمكنك استخدام file.name مباشرة إذا فضلت
            let displayName = file.name.replace('.pdf', '');
            
            li.textContent = displayName;
            li.onclick = () => renderPdf(file.name); // تشغيل القارئ عند الضغط
            pdfList.appendChild(li);
        });
        
        // التمرير التلقائي لأسفل لرؤية القائمة
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. قارئ PDF الاحترافي (نسخة عالية الدقة HD)
async function renderPdf(fileName) {
    const viewerOverlay = document.getElementById('pdf-viewer-overlay');
    const renderArea = document.getElementById('pdf-render-area');
    const msgDiv = document.getElementById('rendering-msg');
    const filenameLabel = document.getElementById('viewer-filename');

    // إظهار شاشة القراءة الكاملة
    viewerOverlay.classList.remove('hidden');
    filenameLabel.textContent = fileName.replace('.pdf', '');
    renderArea.innerHTML = ""; // تنظيف أي ملف سابق
    msgDiv.style.display = 'block';

    // رابط الملف المباشر (Raw Link)
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${encodeURIComponent(fileName)}`;

    try {
        // تحميل المستند
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        msgDiv.style.display = 'none';

        // حلقة تكرارية لرسم الصفحات
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // ✅ السر في الوضوح: نستخدم مقياس رسم كبير (Scale 3)
            // هذا يجعل الصورة كبيرة جداً وعالية الدقة
            const scale = 3; 
            
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // ✅ ثم نجبر المتصفح على تصغيرها لتناسب عرض الشاشة
            // هذا يضغط البيكسلات (Retina Effect) ويجعل النص حاداً جداً
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.style.marginBottom = "15px"; // مسافة بين الصفحات
            canvas.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)"; // ظل خفيف

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            // إضافة الصفحة للموقع
            renderArea.appendChild(canvas);
            
            // انتظار انتهاء رسم الصفحة الحالية قبل الانتقال للتالية
            await page.render(renderContext).promise;
        }

    } catch (error) {
        console.error('Error rendering PDF:', error);
        msgDiv.innerHTML = `<p style="color:#ff5252; direction:rtl; font-weight:bold;">حدث خطأ أثناء تحميل الملف.<br>تأكد من اتصال الإنترنت.</p>`;
    }
}

// إغلاق القارئ
function closePdfViewer() {
    document.getElementById('pdf-viewer-overlay').classList.add('hidden');
}