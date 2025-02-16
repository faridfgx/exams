// Data structure for academic years (original structure)
const academicYears = {
    '2024': {
        title: '2024-2025',
        semesters: [1, 2, 3]
    },
    '2023': {
        title: '2023-2024',
        semesters: [1, 2, 3]
    },
    '2022': {
        title: '2022-2023',
        semesters: [1, 2, 3]
    }
};

// Arabic translations
const translations = {
    semester: 'الفصل',
    mainExam: 'الإختبار',
    preExam: 'الفرض',
    academicYear: 'السنة الدراسية',
    loading: 'جاري التحميل',
    downloadComplete: 'تم التحميل بنجاح',
    downloadError: 'حدث خطأ أثناء التحميل',
    downloadStarted: 'جاري تحميل الملف',
    searchPlaceholder: 'ابحث عن الامتحانات...',
    noResults: 'لا توجد نتائج للبحث',
    errorMessage: 'حدث خطأ. يرجى المحاولة مرة أخرى'
};

// Cache management
const examCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Theme management
const themeManager = {
    currentTheme: 'dark',
    
    initialize() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        this.setupThemeToggle();
    },
    
    setTheme(theme) {
        document.body.dataset.theme = theme;
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    },
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const contrastToggle = document.getElementById('contrastToggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        }
        
        if (contrastToggle) {
            contrastToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'high-contrast' ? 'dark' : 'high-contrast';
                this.setTheme(newTheme);
            });
        }
    }
};

// Search functionality
const searchManager = {
    initialize() {
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', this.handleSearch.bind(this));
        }
    },
    
    handleSearch(event) {
        event.preventDefault();
        const searchInput = document.getElementById('examSearch');
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) return;
        
        this.displayResults(searchTerm);
    },
    
    displayResults(term) {
        const activeContent = document.querySelector('.tab-content.active');
        const currentYear = activeContent.id.replace('year', '');
        const yearData = academicYears[currentYear];
        
        if (!yearData) {
            activeContent.innerHTML = `<p class="no-results">${translations.noResults}</p>`;
            return;
        }
        
        const filteredSemesters = yearData.semesters.filter(semester => 
            semester.toString().includes(term) ||
            translations.mainExam.toLowerCase().includes(term) ||
            translations.preExam.toLowerCase().includes(term)
        );
        
        if (filteredSemesters.length === 0) {
            activeContent.innerHTML = `<p class="no-results">${translations.noResults}</p>`;
            return;
        }
        
        activeContent.innerHTML = `
            <h2>${translations.academicYear} ${yearData.title}</h2>
            ${filteredSemesters.map(semester => createSemesterContent(currentYear, semester)).join('')}
        `;
    }
};

// Exam handling
async function handleExamClick(event, year, semester, type) {
    event.preventDefault();
    
    showNotification(translations.downloadStarted);
    showDownloadProgress();
    
    try {
        const examData = await loadExam(year, semester, type);
        await downloadExam(examData, year, semester, type);
        showNotification(translations.downloadComplete, 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification(translations.downloadError, 'error');
    } finally {
        hideDownloadProgress();
    }
}

async function loadExam(year, semester, type) {
    const cacheKey = `${year}-${semester}-${type}`;
    const cachedExam = examCache.get(cacheKey);

    if (cachedExam && (Date.now() - cachedExam.timestamp) < CACHE_DURATION) {
        return cachedExam.data;
    }

    try {
        const response = await fetch(`exams/${year}/sem${semester}/${type}.pdf`);
        
        if (response.status === 404) {
            return "File not uploaded yet";
        }
        
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);

        const blob = await response.blob();
        examCache.set(cacheKey, {
            data: blob,
            timestamp: Date.now()
        });

        return blob;
    } catch (error) {
        console.error("Error loading exam:", error);
        return "Error loading exam";
    }
}


async function downloadExam(blob, year, semester, type) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-${year}-sem${semester}-${type}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track download
    trackDownload(year, semester, type);
}

// UI utilities
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const notificationArea = document.getElementById('notificationArea');
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showDownloadProgress() {
    const progress = document.querySelector('.download-progress');
    if (progress) {
        progress.hidden = false;
    }
}

function hideDownloadProgress() {
    const progress = document.querySelector('.download-progress');
    if (progress) {
        progress.hidden = true;
    }
}

// Analytics
function trackDownload(year, semester, type) {
    console.log(`Download tracked: ${year}-${semester}-${type}`);
}

// Back to top functionality
function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Create semester content (original structure)
function createSemesterContent(year, semester) {
    return `
        <div class="semester">
            <h3 class="semester-title">${translations.semester} ${semester}</h3>
            <div class="exam-links">
                <a href="exams/${year}/sem${semester}/main.pdf"  
                   class="exam-link" 
                   onclick="handleExamClick(event, '${year}', ${semester}, 'main')">
                    ${translations.mainExam}
                </a>
                <a href="exams/${year}/sem${semester}/pre.pdf"
                   class="exam-link pre" 
                   onclick="handleExamClick(event, '${year}', ${semester}, 'pre')">
                    ${translations.preExam}
                </a>
            </div>
        </div>
    `;
}

// Create year content (original structure)
function createYearContent(year) {
    const yearData = academicYears[year];
    if (!yearData) return '';
    
    return `
        <h2>${translations.academicYear} ${yearData.title}</h2>
        ${yearData.semesters.map(semester => createSemesterContent(year, semester)).join('')}
    `;
}

// Tab functionality
function showYear(year) {
    const targetContent = document.getElementById('year' + year);
    if (!targetContent) return;
    
    showLoadingState(targetContent);

    // Remove active states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });
    
    // Set active states
    const activeTab = document.querySelector(`[data-year="${year}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
    
    targetContent.classList.add('active');
    targetContent.hidden = false;
    
    // Load content without checking dataset.loaded
    setTimeout(() => {
        targetContent.innerHTML = createYearContent(year);
    }, 300);
}

function showLoadingState(element) {
    element.innerHTML = `<div class="loading">${translations.loading}</div>`;
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    themeManager.initialize();
    searchManager.initialize();
    setupBackToTop();
    
    // Set up initial content
    showYear('2024');
    
    // Add click handlers to tab buttons
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            showYear(button.getAttribute('data-year'));
        });
    });
});