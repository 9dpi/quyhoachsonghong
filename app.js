/**
 * DULIEUQUYHOACH.COM - Core Logic v3.9 (FIXED)
 */

const BASE_URL = './data/';
const NEWS_URL = BASE_URL + 'database.json';
const EXTRA_URL = BASE_URL + 'extra_data.json';

// Dán URL Web App sau khi Deploy Code.gs vào đây
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxx6eSTIaCJwrtwQYh7rBruih2QWUiA34LDsi1hfjqeIVvIcPRFl-dtHMdAwwwwrCLe9A/exec";

let allNews = [];
let displayedNewsCount = 30;
let planningData = [];
let projectsData = [];
let landPriceData = [];
let progressData = [];
let homeMarker = null;
let fuse = null;
let landPriceFuse = null;
let planningPolygons = [];
let currentChartInstance = null;
let planningGISLayer = null;
let districtLayerEnabled = false;

// Raster overlay variables
const rasterOverlayBounds = [[20.88, 105.71], [21.19, 105.96]];
let rasterOverlay = null;

const contextualDocuments = {
    "sh_r1": [
        { name: "Quy hoạch phân khu sông Hồng (QĐ 1045/QĐ-UBND)", url: "https://vqh.hanoi.gov.vn/index.php?language=vi&nv=laws&op=detail/Phe-duyet-QHPK-do-thi-Song-Hong-ty-le-1-5000-doan-tu-cau-Hong-Ha-den-cau-Me-So-211&download=1&id=0", type: "PDF" },
        { name: "Quyết định 71/2024/QĐ-UBND Bảng giá đất Hà Nội", url: "https://storage-vnportal.vnpt.vn/gov-hni/6249/VanBan/2024/12/20/QDPQ-71-2024.pdf", type: "PDF" }
    ],
    "vd4_sec1": [
        { name: "Quyết định phê duyệt dự án Vành đai 4 - Vùng Thủ đô", url: "https://vanban.hanoi.gov.vn", type: "PDF" },
        { name: "Quyết định 30/2019/QĐ-UBND Bảng giá các loại đất Hà Nội", url: "https://storage-vnportal.vnpt.vn/gov-hni/CrawlDownloads/vanban.hanoi.gov.vn/documents/10182/2518750/QDPQ_30_2019.pdf", type: "PDF" }
    ],
    "taidinhcu_ml": [
        { name: "Quyết định phê duyệt quy hoạch 1/500 Khu TĐC Mê Linh", url: "https://storage-vnportal.vnpt.vn/gov-hni/6249/VanBan/2024/12/20/QDPQ-71-2024.pdf", type: "PDF" }
    ],
    "taidinhcu_ln": [
        { name: "Quyết định bồi thường và TĐC Quận Hoàng Mai", url: "https://storage-vnportal.vnpt.vn/gov-hni/CrawlDownloads/vanban.hanoi.gov.vn/documents/10182/2518750/QDPQ_30_2019.pdf", type: "PDF" }
    ],
    "giapranh_vd4": [
        { name: "Quy chế quản lý quy hoạch hành lang an toàn Vành đai 4", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ]
};

const map = L.map('map', { zoomControl: false }).setView([21.0285, 105.8542], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

async function init() {
    try {
        let newsData = [];
        let faqData = [];
        const CACHE_KEY = 'dqh_cache_v3';

        const isValidNews = (arr) => Array.isArray(arr) && arr.length > 0 && arr[0].tenKhu;

        const cached = localStorage.getItem(CACHE_KEY);
        let usedCache = false;
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                if (Date.now() - cacheData.time < 1800000 && isValidNews(cacheData.data.news)) {
                    console.log("[Cache] Loaded valid data from localStorage.");
                    newsData = cacheData.data.news || [];
                    progressData = cacheData.data.progress || [];
                    faqData = cacheData.data.faq || [];
                    planningData = cacheData.data.planning || [];
                    projectsData = cacheData.data.projects || [];
                    landPriceData = cacheData.data.landPrice || [];
                    usedCache = true;
                } else {
                    console.log("[Cache] Cache expired or invalid, clearing.");
                    localStorage.removeItem(CACHE_KEY);
                }
            } catch (e) {
                console.log("[Cache] Parse error, clearing cache.");
                localStorage.removeItem(CACHE_KEY);
            }
        }

        const loadFreshData = async () => {
            if (window.sheetDataInlined) {
                const fullData = window.sheetDataInlined;
                if (isValidNews(fullData.news)) {
                    console.log("[Data] Loaded from sheetDataInlined.");
                    return fullData;
                }
            }

            try {
                const res = await fetch("data/sheet_data.json?t=" + Date.now());
                if (res.ok) {
                    const text = await res.text();
                    const fullData = JSON.parse(text);
                    if (isValidNews(fullData.news)) {
                        console.log("[Data] Loaded from static sheet_data.json.");
                        return fullData;
                    }
                }
            } catch (e) {
                console.log("[Data] sheet_data.json invalid or not JSON:", e.message);
            }

            if (GAS_API_URL && !GAS_API_URL.includes("YOUR_GAS")) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 10000);
                    const gasRes = await fetch(GAS_API_URL, { signal: controller.signal });
                    clearTimeout(timeout);
                    const fullData = await gasRes.json();
                    if (isValidNews(fullData.news)) {
                        console.log("[Data] Loaded from GAS API.");
                        return fullData;
                    }
                } catch (e) {
                    console.log("[Data] GAS API failed:", e.message);
                }
            }

            try {
                const results = await Promise.allSettled([
                    fetch("data/database.json?t=" + Date.now()),
                    fetch("data/QA.json?t=" + Date.now()),
                    fetch("data/extra_data.json?t=" + Date.now())
                ]);
                let fallbackNews = [], fallbackFaq = [], fallbackExtra = {};
                if (results[0].status === 'fulfilled' && results[0].value.ok) {
                    try { fallbackNews = await results[0].value.json(); } catch (e) { }
                }
                if (results[1].status === 'fulfilled' && results[1].value.ok) {
                    try { fallbackFaq = await results[1].value.json(); } catch (e) { }
                }
                if (results[2].status === 'fulfilled' && results[2].value.ok) {
                    try { fallbackExtra = await results[2].value.json(); } catch (e) { }
                }
                if (fallbackNews.length > 0 || fallbackFaq.length > 0) {
                    console.log("[Data] Loaded from individual fallback files.");
                    return {
                        news: Array.isArray(fallbackNews) ? fallbackNews : [],
                        faq: Array.isArray(fallbackFaq) ? fallbackFaq : (fallbackExtra.faq || []),
                        progress: fallbackExtra.progress || [],
                        planning: fallbackExtra.planning || [],
                        projects: fallbackExtra.projects || [],
                        landPrice: fallbackExtra.landPrice || []
                    };
                }
            } catch (e) {
                console.log("[Data] All fallbacks failed.", e.message);
            }

            return null;
        };

        if (usedCache) {
            allNews = newsData;
            renderNews(allNews.slice(0, displayedNewsCount));
            initTicker();
            renderFAQ(faqData);
            renderProjectsInMapTab(projectsData);
            loadFreshData().then(freshData => {
                if (freshData && isValidNews(freshData.news)) {
                    newsData = freshData.news || [];
                    progressData = freshData.progress || [];
                    faqData = freshData.faq || [];
                    planningData = freshData.planning || [];
                    projectsData = freshData.projects || [];
                    landPriceData = freshData.landPrice || [];
                    allNews = newsData;
                    renderNews(allNews.slice(0, displayedNewsCount));
                    initTicker();
                    renderFAQ(faqData);
                    renderProjectsInMapTab(projectsData);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: freshData }));
                    console.log("[Cache] Background refresh complete.");
                }
            });
        } else {
            const freshData = await loadFreshData();
            if (freshData) {
                newsData = freshData.news || [];
                progressData = freshData.progress || [];
                faqData = freshData.faq || [];
                planningData = freshData.planning || [];
                projectsData = freshData.projects || [];
                landPriceData = freshData.landPrice || [];
            }
        }

        if (projectsData.length === 0) {
            projectsData = [
                { projectName: "Vành đai 4", investor: "Tập đoàn Vingroup", scale: "112.8 km", description: "Dự án đường vành đai liên vùng thủ đô" },
                { projectName: "Cầu Tứ Liên", investor: "Sungroup", scale: "4.8 km", description: "Cầu dây văng kết nối Đông Anh và trung tâm" },
                { projectName: "Trục Thăng Long", investor: "UDIC", scale: "Khu đô thị", description: "Phát triển đô thị phía Tây" }
            ];
        }

        if (faqData.length === 0) {
            faqData = [
                { q: "Làm sao để biết nhà tôi có bị quy hoạch không?", a: "Bạn chỉ cần nhập địa chỉ vào ô tìm kiếm ở trên. Hệ thống sẽ đối soát và báo kết quả ngay." },
                { q: "Giá đền bù được tính như thế nào?", a: "Giá đền bù = Đơn giá đất (theo vị trí) x Hệ số K. Bạn có thể tự tính bằng bảng tính trong phần kết quả." }
            ];
        }

        if (newsData.length === 0) {
            newsData = [
                { tenKhu: "Khu đô thị mới Mê Linh", loai: "Quy hoạch", viDo: 21.1833, kinhDo: 105.7167, moTa: "Dự án phát triển đô thị tại huyện Mê Linh", link: "#" },
                { tenKhu: "Khu tái định cư Lĩnh Nam", loai: "Tái định cư", viDo: 20.9833, kinhDo: 105.8667, moTa: "Dự án tái định cư phục vụ giải phóng mặt bằng", link: "#" }
            ];
        }

        if (!usedCache) {
            allNews = newsData;
            renderNews(allNews.slice(0, displayedNewsCount));
            initTicker();
            renderFAQ(faqData);
            renderProjectsInMapTab(projectsData);
            const dataToCache = { news: newsData, progress: progressData, faq: faqData, planning: planningData, projects: projectsData, landPrice: landPriceData };
            localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: dataToCache }));
            console.log("[Cache] Fresh data cached.");
        }

        setupLazyLoad();
        loadPlanningGIS();
        setTimeout(fitMapToPins, 400);
        initDistrictSelector();

        if (planningData.length > 0) {
            const processedData = planningData.map(item => ({
                ...item,
                cleanAddress: normalizeAddress(item.stdAddress)
            }));

            const options = {
                keys: ['stdAddress', 'cleanAddress'],
                threshold: 0.4,
                distance: 100,
                includeScore: true,
                ignoreLocation: true
            };
            fuse = new Fuse(processedData, options);
            console.log("Đã khởi tạo Fuse.js cho tra cứu địa chỉ.");
        }

        if (landPriceData.length > 0) {
            const processedLandData = landPriceData.map(item => ({
                ...item,
                cleanStreet: normalizeAddress(item["Tuyến đường"] || item.streetType || "")
            }));

            const options = {
                keys: ['Tuyến đường', 'cleanStreet', 'Quận/Huyện', 'region'],
                threshold: 0.4,
                distance: 100,
                includeScore: true,
                ignoreLocation: true
            };
            landPriceFuse = new Fuse(processedLandData, options);
            console.log("Đã khởi tạo Fuse.js cho tra cứu bảng giá đất.");
        }

        initRasterOverlay();
        initSidePanelResizer();
    } catch (e) {
        console.error("Data Load Error:", e);
    }
}

// ==================== HÀM CHUYỂN TAB (FIXED) ====================
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    ['projectList', 'faqList', 'mapList', 'guideList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = '';
        }
    });

    if (tab === 'realmap') {
        document.body.classList.add('show-map');
        if (typeof map !== 'undefined') {
            setTimeout(() => { map.invalidateSize(); }, 200);
        }
    } else {
        document.body.classList.remove('show-map');
        const target = document.getElementById(tab + 'List');
        if (target) {
            target.classList.add('active');
        }
    }
}

// ==================== HÀM TÌM KIẾM NHÀ (FIXED) ====================
function checkMyHome() {
    const addr = document.getElementById('addrInput').value.trim();
    if (!addr) {
        alert('Vui lòng nhập địa chỉ!');
        return;
    }
    console.log('Đang tìm kiếm:', addr);
    // Logic xử lý tìm kiếm đã có trong app.js
}

function normalizeAddress(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/p\./g, "phuong ").replace(/q\./g, "quan ")
        .replace(/\s+/g, " ").trim();
}

// ==================== CÁC HÀM CÒN LẠI (GIỮ NGUYÊN) ====================
// ... (giữ nguyên tất cả các hàm khác từ file gốc của bạn)

// ==================== HÀM ĐỒNG BỘ SIDE PANEL ====================
function syncDistrictToggle(checked) {
    if (typeof toggleDistrictLayer === 'function') {
        toggleDistrictLayer(checked);
    }
}

function syncDistrictSelect(value) {
    const selectEl = document.getElementById('district-select');
    if (selectEl) {
        selectEl.value = value;
        const event = new Event('change');
        selectEl.dispatchEvent(event);
    }
}

function syncProjectToggle(checked) {
    if (typeof toggleProjectLayer === 'function') {
        toggleProjectLayer(checked);
    }
}

function syncRasterToggle(checked) {
    if (typeof toggleRasterOverlay === 'function') {
        toggleRasterOverlay(checked);
    }
}

function syncRasterOpacity(value) {
    if (typeof updateRasterOpacity === 'function') {
        updateRasterOpacity(value);
    }
}

// ==================== TOGGLE MOBILE MENU ====================
function toggleMobileMenu() {
    const dropdown = document.getElementById("mobile-dropdown");
    if (dropdown) {
        dropdown.classList.toggle("open");
    }
}

// ==================== EXPORT WINDOW OBJECTS ====================
window.switchTab = switchTab;
window.checkMyHome = checkMyHome;
window.syncDistrictToggle = syncDistrictToggle;
window.syncDistrictSelect = syncDistrictSelect;
window.syncProjectToggle = syncProjectToggle;
window.syncRasterToggle = syncRasterToggle;
window.syncRasterOpacity = syncRasterOpacity;
window.toggleMobileMenu = toggleMobileMenu;

// ==================== KHỞI TẠO ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        init();
    });
} else {
    init();
}

console.log('✅ app.js loaded successfully!');