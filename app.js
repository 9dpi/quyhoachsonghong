/**
 * DULIEUQUYHOACH.COM - Core Logic v3.9 (FULL COMPLETE)
 */

const BASE_URL = './data/';
const NEWS_URL = BASE_URL + 'database.json';
const EXTRA_URL = BASE_URL + 'extra_data.json';

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
let newsMarkerLayer = null;
let districtLayerEnabled = false;

const rasterOverlayBounds = [[20.88, 105.71], [21.19, 105.96]];
let rasterOverlay = null;

const CACHE_KEY = 'dqh_cache_v4';
const CACHE_TTL_NEWS = 2 * 60 * 60 * 1000;        // Tin tức: 2 giờ
const CACHE_KEY_LANDPRICE = 'dqh_landprice2026_v1'; // Bảng giá 2026: 24 giờ
const CACHE_TTL_LANDPRICE = 24 * 60 * 60 * 1000;
const CACHE_KEY_GEO = 'dqh_geocode_v1';              // Geocode cache

const contextualDocuments = {
    "sh_r1": [
        { name: "Quy hoạch phân khu sông Hồng (QĐ 1045/QĐ-UBND)", url: "https://vqh.hanoi.gov.vn/index.php?language=vi&nv=laws&op=detail/Phe-duyet-QHPK-do-thi-Song-Hong-ty-le-1-5000-doan-tu-cau-Hong-Ha-den-cau-Me-So-211&download=1&id=0", type: "PDF" },
        { name: "Nghị quyết 52/2025/NQ-HĐND - Bảng giá đất Hà Nội 2026 (17 khu vực)", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-quyet-52-2025-NQ-HDND-bang-gia-dat-lan-dau-Ha-Noi", type: "PDF" }
    ],
    "vd4_sec1": [
        { name: "Quyết định phê duyệt dự án Vành đai 4 - Vùng Thủ đô", url: "https://vanban.hanoi.gov.vn", type: "PDF" },
        { name: "Nghị quyết 52/2025/NQ-HĐND - Bảng giá đất Hà Nội 2026", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-quyet-52-2025-NQ-HDND-bang-gia-dat-lan-dau-Ha-Noi", type: "PDF" },
        { name: "Quyết định 19/2026/QĐ-UBND - Hệ số K điều chỉnh giá đất", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Quyet-dinh-19-2026-QD-UBND-he-so-dieu-chinh-gia-dat-Ha-Noi", type: "PDF" }
    ],
    "taidinhcu_ml": [
        { name: "Quyết định phê duyệt quy hoạch 1/500 Khu TĐC Mê Linh", url: "https://storage-vnportal.vnpt.vn/gov-hni/6249/VanBan/2024/12/20/QDPQ-71-2024.pdf", type: "PDF" },
        { name: "Nghị quyết 52/2025/NQ-HĐND - Bảng giá đất Hà Nội 2026", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-quyet-52-2025-NQ-HDND-bang-gia-dat-lan-dau-Ha-Noi", type: "PDF" }
    ],
    "taidinhcu_ln": [
        { name: "Quyết định bồi thường và TĐC Quận Hoàng Mai", url: "https://vanban.hanoi.gov.vn", type: "PDF" },
        { name: "Nghị quyết 52/2025/NQ-HĐND - Bảng giá đất Hà Nội 2026", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-quyet-52-2025-NQ-HDND-bang-gia-dat-lan-dau-Ha-Noi", type: "PDF" }
    ],
    "giapranh_vd4": [
        { name: "Quy chế quản lý quy hoạch hành lang an toàn Vành đai 4", url: "https://vanban.hanoi.gov.vn", type: "PDF" },
        { name: "Quyết định 19/2026/QĐ-UBND - Hệ số K điều chỉnh giá đất", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Quyet-dinh-19-2026-QD-UBND-he-so-dieu-chinh-gia-dat-Ha-Noi", type: "PDF" }
    ],
    "cau_tu_lien": [
        { name: "Dự án Cầu Tứ Liên & đường dẫn 2 đầu cầu", url: "https://vanban.hanoi.gov.vn", type: "PDF" },
        { name: "Nghị quyết 52/2025/NQ-HĐND - Bảng giá đất Hà Nội 2026", url: "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-quyet-52-2025-NQ-HDND-bang-gia-dat-lan-dau-Ha-Noi", type: "PDF" }
    ],
    "metro_line2": [
        { name: "Dự án tuyến Metro số 2 (Nam Thăng Long - Trần Hưng Đạo)", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ],
    "metro_line5": [
        { name: "Dự án tuyến Metro số 5 (Văn Cao - Hòa Lạc)", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ],
    "kdt_linh_nam": [
        { name: "Quy hoạch chi tiết phường Lĩnh Nam, quận Hoàng Mai", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ],
    "dai_lo_song_hong": [
        { name: "Quy hoạch tổng thể Thủ đô Hà Nội - Tầm nhìn 100 năm (13/05/2026)", url: "https://vanban.hanoi.gov.vn", type: "Web" }
    ],
    "vd4_cau_hong_ha": [
        { name: "Dự án Vành đai 4 - Vùng Thủ đô (Cầu Hồng Hà)", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ],
    "vd4_cau_me_so": [
        { name: "Dự án Vành đai 4 - Vùng Thủ đô (Cầu Mễ Sở)", url: "https://vanban.hanoi.gov.vn", type: "PDF" }
    ]
};

const map = L.map('map', { zoomControl: false }).setView([21.0285, 105.8542], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

// ==================== HÀM INIT CHÍNH ====================
async function init() {
    try {
        let newsData = [];
        let faqData = [];

        const isValidNews = (arr) => Array.isArray(arr) && arr.length > 0 && arr[0].tenKhu;

        const cached = localStorage.getItem(CACHE_KEY);
        let usedCache = false;
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                if (Date.now() - cacheData.time < CACHE_TTL_NEWS && isValidNews(cacheData.data.news)) {
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
                { projectName: "Vành đai 4", investor: "Ban QLDA Thăng Long", scale: "112.8 km", description: "Thi công (GPMB >99%), thông xe 3 cầu trước APEC 2027" },
                { projectName: "Cầu Tứ Liên", investor: "Liên danh CTCP", scale: "4.8 km, ~20.000 tỷ", description: "Thi công từ 05/2025, trụ tháp 185m, hoàn thành 2027" },
                { projectName: "Metro tuyến 2", investor: "Ban QLDA ĐSĐT", scale: "Nam Thăng Long – Trần Hưng Đạo", description: "Khởi công giai đoạn 2025-2026" },
                { projectName: "Metro tuyến 5", investor: "Ban QLDA ĐSĐT", scale: "Văn Cao – Hòa Lạc (~38 km)", description: "Khởi công giai đoạn 2025-2026" },
                { projectName: "QH Phân khu Sông Hồng", investor: "UBND TP Hà Nội", scale: "12.000 ha, 55 km", description: "Đã phê duyệt (QĐ 1045/QĐ-UBND)" },
                { projectName: "KĐT mới Lĩnh Nam", investor: "Chưa công bố", scale: "Phường Lĩnh Nam, Hoàng Mai", description: "Khởi công hạ tầng khung 08/2026" },
                { projectName: "Đại lộ cảnh quan sông Hồng", investor: "UBND TP Hà Nội", scale: "Trục cảnh quan trung tâm", description: "Theo Quy hoạch tổng thể Thủ đô 2026" },
                { projectName: "Trục Thăng Long", investor: "UDIC", scale: "Khu đô thị phía Tây", description: "Phát triển đô thị phía Tây Hà Nội" }
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

// ==================== HÀM CHUYỂN TAB ====================
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

// ==================== HÀM NORMALIZE ====================
function normalizeAddress(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/p\./g, "phuong ").replace(/q\./g, "quan ")
        .replace(/\s+/g, " ").trim();
}

// ==================== HÀM RENDER NEWS ====================
function renderNews(data, append = false) {
    const list = document.getElementById('projectList');
    if (!list) return;

    if (!append) {
        list.innerHTML = '';
    }

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'project-item';

        const moTaText = item.moTa || 'Chưa có mô tả chi tiết.';

        div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:4px;flex-wrap:wrap;">
                <span style="background:#eff6ff;color:#2563eb;padding:3px 10px;border-radius:5px;font-size:0.72rem;font-weight:800;letter-spacing:0.02em;">${item.loai || 'Tin tức'}</span>
            </div>
            <h4 style="font-family:'Inter';font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:6px;line-height:1.45;">${item.tenKhu || ''}</h4>
            <p style="font-size:0.88rem;color:#64748b;line-height:1.55;font-family:'Inter';">${moTaText.substring(0, 90)}...</p>`;

        div.onclick = () => {
            if (item.viDo && item.kinhDo) {
                map.flyTo([item.viDo, item.kinhDo], 15);
            }
        };
        list.appendChild(div);
    });

    // In các tin vừa render lên bản đồ dưới dạng marker (cùng dữ liệu hiển thị ở BẢN TIN)
    renderNewsMarkers(data, append);
}

// ==================== HÀM RENDER MARKER TIN TỨC TRÊN BẢN ĐỒ ====================
function getNewsCategoryColor(loai) {
    const colorMap = {
        'Quy hoạch': '#2563eb',
        'Giao thông': '#f59e0b',
        'Đền bù': '#dc2626',
        'Tái định cư': '#a855f7',
        'Metro': '#06b6d4',
        'Dự án': '#10b981',
        'Tin tức': '#475569'
    };
    return colorMap[loai] || '#475569';
}

function renderNewsMarkers(data, append = false) {
    if (!append || !newsMarkerLayer) {
        if (newsMarkerLayer) {
            map.removeLayer(newsMarkerLayer);
            newsMarkerLayer = null;
        }
        newsMarkerLayer = L.layerGroup();
    }

    (data || []).forEach(item => {
        if (!item.viDo || !item.kinhDo) return;
        const color = getNewsCategoryColor(item.loai);
        const title = item.tenKhu || item.title || 'Tin tức';
        const desc = (item.moTa || '').substring(0, 160);
        const link = item.nguonTin || item.link || '';

        const marker = L.circleMarker([item.viDo, item.kinhDo], {
            radius: 11,
            color: '#ffffff',
            weight: 2.5,
            fillColor: color,
            fillOpacity: 0.9
        }).bindPopup(`
            <div style="font-family:'Inter',sans-serif;max-width:320px;">
                <div style="font-size:0.78rem;font-weight:800;color:${color};letter-spacing:0.04em;margin-bottom:6px;">${escHtml(item.loai || 'Tin tức')}</div>
                <div style="font-size:1.05rem;font-weight:700;color:#0f172a;line-height:1.45;">${escHtml(title)}</div>
                ${desc ? `<div style="font-size:0.9rem;color:#475569;line-height:1.55;margin-top:6px;">${escHtml(desc)}...</div>` : ''}
                ${link ? `<a href="${escHtml(link)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:0.9rem;font-weight:700;color:#2563eb;">Xem nguồn →</a>` : ''}
            </div>
        `);

        newsMarkerLayer.addLayer(marker);
    });

    if (!map.hasLayer(newsMarkerLayer)) {
        newsMarkerLayer.addTo(map);
    }
}

// ==================== HÀM INIT TICKER ====================
function initTicker() {
    const tickerEl = document.getElementById("ticker");
    if (!tickerEl || !allNews || allNews.length === 0) return;

    const latestNews = allNews.slice(0, 8);
    let tickerHtml = "Tin mới nhận: ";
    latestNews.forEach((item, index) => {
        const title = item.tenKhu || item.title;
        const link = item.nguonTin || item.link || "#";

        tickerHtml += `<a href="${link}" target="_blank" style="color: #1e40af; text-decoration: none; font-weight: 700; margin: 0 15px; transition: color 0.2s;" onmouseover="this.style.color='#f59e0b'" onmouseout="this.style.color='#1e40af'">${title}</a>`;

        if (index < latestNews.length - 1) {
            tickerHtml += " <span style='color: #64748b;'>|</span> ";
        }
    });

    tickerEl.innerHTML = tickerHtml;
    tickerEl.style.cursor = "pointer";

    tickerEl.addEventListener("mouseover", () => {
        tickerEl.style.animationPlayState = "paused";
    });
    tickerEl.addEventListener("mouseout", () => {
        tickerEl.style.animationPlayState = "running";
    });
}

// ==================== HÀM RENDER FAQ ====================
function renderFAQ(data) {
    const list = document.getElementById('faqList');
    if (!list) return;

    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem; font-family:\'Inter\'">Dữ liệu Hỏi đáp đang được cập nhật từ hệ thống...</div>';
        return;
    }
    list.innerHTML = data.map(f => {
        return `
            <div class="faq-item" onclick="this.classList.toggle('open')">
                <div class="faq-q" style="font-family:'Inter'">${f.q || "Câu hỏi đang cập nhật"}</div>
                <div class="faq-a">
                    <div>${f.a || "Câu trả lời đang cập nhật"}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== HÀM RENDER PROJECTS IN MAP TAB ====================
function renderProjectsInMapTab(data) {
    const list = document.getElementById('mapList');
    if (!list) return;

    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem; font-family:\'Inter\'">Dữ liệu Bản đồ đang được cập nhật...</div>';
        return;
    }

    list.innerHTML = `
        <div style="padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 0.75rem; color: #64748b; text-align: center;">Danh sách các khu vực quy hoạch. Click để xem trên bản đồ.</p>
        </div>
        ${data.map(p => {
        return `
                <div class="project-item" onclick="zoomToProject('${p.projectName}')">
                    <span class="tag tag-qh">Dự án</span>
                    <h4 style="font-family:'Inter'">${p.projectName}</h4>
                    <p style="font-size:0.75rem; color:#64748b; line-height:1.5; font-family:'Inter'">Chủ đầu tư: ${p.investor || "Đang cập nhật"}</p>
                    <p style="font-size:0.7rem; color:#94a3b8; font-family:'Inter'">Quy mô: ${p.scale || "Đang cập nhật"}</p>
                </div>
            `;
    }).join('')}
    `;
}

// ==================== HÀM SETUP LAZY LOAD ====================
function setupLazyLoad() {
    const list = document.getElementById('projectList');
    if (!list) return;

    list.addEventListener('scroll', () => {
        if (list.scrollTop + list.clientHeight >= list.scrollHeight - 20) {
            const source = allNews;
            if (displayedNewsCount < source.length) {
                const nextBatch = source.slice(displayedNewsCount, displayedNewsCount + 10);
                displayedNewsCount += nextBatch.length;
                renderNews(nextBatch, true);
            }
        }
    });
}

// ==================== HÀM FIT MAP TO PINS ====================
function fitMapToPins() {
    if (!allNews || allNews.length === 0) return;
    const points = [];
    allNews.forEach(item => {
        if (item.viDo && item.kinhDo) {
            points.push([item.viDo, item.kinhDo]);
        }
    });
    if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 13
        });
        console.log(`[Map] Auto-centered and fitted bounds to ${points.length} news/planning pins.`);
    }
}

// ==================== HÀM ZOOM TO PROJECT ====================
function zoomToProject(projectName) {
    const matchedPolygon = planningPolygons.find(p => {
        const name = (p.properties.tenKhu || "").toLowerCase();
        const query = projectName.toLowerCase();
        return name.includes(query) || query.includes(name);
    });

    if (matchedPolygon) {
        const center = getPolygonCenter(matchedPolygon.geometry);
        map.flyTo(center, 15);
        return;
    }

    showModal("Thông báo", "Không tìm thấy vị trí của dự án này trên bản đồ.", "fa-circle-exclamation");
}

// ==================== HÀM GET POLYGON CENTER ====================
function getPolygonCenter(geometry) {
    let sumLat = 0, sumLon = 0, count = 0;

    const addCoords = (coords) => {
        coords.forEach(pt => {
            sumLon += pt[0];
            sumLat += pt[1];
            count++;
        });
    };

    if (geometry.type === "Polygon") {
        if (geometry.coordinates.length > 0) addCoords(geometry.coordinates[0]);
    } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(poly => {
            if (poly.length > 0) addCoords(poly[0]);
        });
    }

    if (count === 0) return [21.0285, 105.8542];
    return [sumLat / count, sumLon / count];
}

// ==================== HÀM LOAD PLANNING GIS ====================
function loadPlanningGIS() {
    if (typeof mapGeojsonData !== 'undefined') {
        console.log("Sử dụng dữ liệu GeoJSON inlined.");
        drawGeojson(mapGeojsonData);
    } else {
        fetch("data/map.geojson")
            .then(res => res.json())
            .then(geojsonData => drawGeojson(geojsonData))
            .catch(err => console.log("Không thể tải ranh giới GIS:", err));
    }
}

function drawGeojson(geojsonData) {
    planningPolygons = geojsonData.features || [];

    if (planningGISLayer) {
        map.removeLayer(planningGISLayer);
        planningGISLayer = null;
    }

    planningGISLayer = L.geoJSON(geojsonData, {
        style: function (feature) {
            const props = feature.properties || {};
            const color = props.color || '#2563eb';
            return {
                color: color,
                weight: 3,
                fillColor: color,
                fillOpacity: 0.35,
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                L.DomEvent.stopPropagation(e);
                const props = feature.properties || {};
                const name = props.tenKhu || props.name || "Khu vực quy hoạch";
                const description = props.description || "Chưa có mô tả chi tiết.";

                const htmlContent = `
                    <div style="font-family: 'Inter', sans-serif;">
                        <h3 style="margin: 0 0 10px 0; color: #0f172a; font-weight: 800; font-size: 1.1rem;">${name}</h3>
                        <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #334155; line-height: 1.6;">${description}</p>
                    </div>
                `;

                openSidePanelWithDetails("Chi tiết phân khu", htmlContent);

                if (layer.getBounds) {
                    map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                }
            });
        }
    });

    // Mặc định KHÔNG hiển thị các đường vẽ ranh giới trên bản đồ.
    // Layer vẫn được giữ trong bộ nhớ để tra cứu Point-in-Polygon (checkMyHome) hoạt động.
    // Người dùng bật/xem qua toggle "Ranh giới Dự án Quy hoạch" trong widget Lớp Bản Đồ.
    console.log("Đã tải ranh giới GIS quy hoạch (mặc định ẩn — bật qua toggle).");
}

// ==================== HÀM INIT DISTRICT SELECTOR ====================
function initDistrictSelector() {
    const selectEl = document.getElementById('district-select');
    if (!selectEl) return;

    const districtsList = [
        'Quận Ba Đình', 'Quận Cầu Giấy', 'Quận Bắc Từ Liêm', 'Quận Nam Từ Liêm',
        'Quận Đống Đa', 'Quận Hà Đông', 'Quận Hai Bà Trưng', 'Quận Hoàn Kiếm',
        'Quận Hoàng Mai', 'Quận Long Biên', 'Quận Tây Hồ', 'Quận Thanh Xuân',
        'Thị xã Sơn Tây', 'Huyện Ba Vì', 'Huyện Chương Mỹ', 'Huyện Đan Phượng',
        'Huyện Đông Anh', 'Huyện Gia Lâm', 'Huyện Hoài Đức', 'Huyện Mê Linh',
        'Huyện Mỹ Đức', 'Huyện Phú Xuyên', 'Huyện Phúc Thọ', 'Huyện Quốc Oai',
        'Huyện Sóc Sơn', 'Huyện Thạch Thất', 'Huyện Thanh Oai', 'Huyện Thanh Trì',
        'Huyện Thường Tín', 'Huyện Ứng Hòa'
    ];

    districtsList.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        selectEl.appendChild(opt);
    });
}

// ==================== HÀM INIT RASTER OVERLAY ====================
function initRasterOverlay() {
    try {
        rasterOverlay = L.imageOverlay('data/hanoi_songhong_planning_map.png', rasterOverlayBounds, {
            opacity: 0.6,
            interactive: true,
            attribution: "Bản đồ Quy hoạch Sông Hồng 2026 (Scan)"
        });
        console.log("Đã khởi tạo lớp phủ Raster Overlay thành công.");
    } catch (e) {
        console.error("Lỗi khi khởi tạo Raster Overlay:", e);
    }
}

// ==================== HÀM INIT SIDE PANEL RESIZER ====================
function initSidePanelResizer() {
    const handle = document.getElementById('panel-resize-handle');
    const panel = document.getElementById('detail-panel');
    if (!handle || !panel) return;

    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        handle.classList.add('active');
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 320 && newWidth <= window.innerWidth * 0.8) {
            document.documentElement.style.setProperty('--detail-width', `${newWidth}px`);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            handle.classList.remove('active');
        }
    });
}

// ==================== HÀM OPEN SIDE PANEL ====================
function openSidePanelWithDetails(title, htmlContent) {
    const panel = document.getElementById('detail-panel');
    if (panel) {
        panel.classList.add('open');
    }
    const body = document.getElementById('detail-body');
    if (body) {
        body.innerHTML = htmlContent;
    }
}

// ==================== HÀM SHOW MODAL ====================
function showModal(title, text, icon) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalText').innerHTML = text;
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    document.getElementById('custom-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('active');
}

function closeDetail() {
    document.getElementById('detail-panel').classList.remove('open');
}

// ==================== HÀM CHUYỂN TAB PANEL PHỤ (Layers / Details / Legend) ====================
function switchSideTab(tab) {
    ['layers', 'details', 'legend'].forEach(t => {
        const btn = document.getElementById('side-tab-' + t);
        const pane = document.getElementById('side-content-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
        if (pane) pane.classList.toggle('active', t === tab);
    });
}

// ==================== HÀM HỖ TRỢ: ESCAPE HTML & ĐỊNH DẠNG TIỀN ====================
function escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function fmtMoney(v) {
    if (v == null || isNaN(v)) return "—";
    if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + " tỷ";
    if (v >= 1e6) return Math.round(v / 1e6).toLocaleString('vi-VN') + " tr";
    return v.toLocaleString('vi-VN');
}

// ==================== POINT-IN-POLYGON (RAY CASTING) ====================
function pointInPolygonRings(point, rings) {
    const ring = rings && rings[0];
    if (!ring || ring.length < 3) return false;
    const [x, y] = point; // [lng, lat]
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function isPointInGeometry(point, geometry) {
    if (!geometry || !geometry.type) return false;
    if (geometry.type === 'Polygon') return pointInPolygonRings(point, geometry.coordinates);
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.some(poly => pointInPolygonRings(point, poly));
    }
    return false;
}

function findPolygonsAtPoint(lat, lng) {
    if (!planningPolygons || planningPolygons.length === 0) return [];
    return planningPolygons.filter(f => f.geometry && isPointInGeometry([lng, lat], f.geometry));
}

// ==================== GEOCACHING (Fuse nội bộ → Nominatim) ====================
let geocodeCache = null;
function getGeocodeCache() {
    if (geocodeCache) return geocodeCache;
    try { geocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY_GEO) || '{}'); } catch (e) { geocodeCache = {}; }
    return geocodeCache;
}
function cacheGeocode(addr, coords) {
    try {
        const c = getGeocodeCache();
        c[addr] = { coords, t: Date.now() };
        localStorage.setItem(CACHE_KEY_GEO, JSON.stringify(c));
    } catch (e) { /* ignore quota */ }
}

async function geocodeAddress(addr) {
    const cached = getGeocodeCache()[addr];
    if (cached && cached.coords && Date.now() - cached.t < 30 * 24 * 60 * 60 * 1000) {
        return cached.coords;
    }

    // 1) Ưu tiên khớp Fuse với dữ liệu quy hoạch nội bộ (chính xác, không cần mạng)
    if (fuse) {
        try {
            const res = fuse.search(addr);
            if (res.length > 0 && res[0].score < 0.35 && res[0].item.viDo && res[0].item.kinhDo) {
                const coords = [res[0].item.viDo, res[0].item.kinhDo];
                cacheGeocode(addr, coords);
                return coords;
            }
        } catch (e) { /* ignore */ }
    }

    // 2) Nominatim API (có timeout 8s, fallback khi offline/CORS)
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&accept-language=vi&q=" +
        encodeURIComponent(addr + ", Hà Nội, Việt Nam");
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl.signal });
        clearTimeout(t);
        if (!resp.ok) throw new Error('bad status ' + resp.status);
        const data = await resp.json();
        if (data && data.length > 0) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            cacheGeocode(addr, coords);
            return coords;
        }
    } catch (e) { /* offline / CORS */ }
    return null;
}

// ==================== BẢNG GIÁ ĐẤT 2026 (lazy-load + cache 24h) ====================
let landPrice2026Data = null;
async function loadLandPrice2026() {
    if (landPrice2026Data) return landPrice2026Data;
    try {
        const cached = localStorage.getItem(CACHE_KEY_LANDPRICE);
        if (cached) {
            const c = JSON.parse(cached);
            if (Date.now() - c.t < CACHE_TTL_LANDPRICE) {
                landPrice2026Data = c.data;
                return landPrice2026Data;
            }
        }
    } catch (e) { /* ignore */ }
    try {
        const resp = await fetch('data/bang_gia_dat_2026.json?t=' + Date.now());
        if (resp.ok) {
            landPrice2026Data = await resp.json();
            try { localStorage.setItem(CACHE_KEY_LANDPRICE, JSON.stringify({ t: Date.now(), data: landPrice2026Data })); } catch (e) { }
            return landPrice2026Data;
        }
    } catch (e) { /* ignore */ }
    return null;
}

function getHeSoKForStreet(entry) {
    if (!landPrice2026Data || !entry) return 1.2;
    if (entry.khuVuc) {
        const kv = (landPrice2026Data.khuVuc || []).find(k => k.maKhuVuc === entry.khuVuc);
        if (kv && kv.heSoK) return kv.heSoK;
    }
    return (landPrice2026Data.heSoK && landPrice2026Data.heSoK.default) || 1.2;
}

function extractStreetName(addr) {
    if (!addr) return "";
    return addr.toLowerCase()
        .replace(/\d+\s*/g, ' ')
        .replace(/(ngõ|ngách|hẻm|tổ|nga|phố)\s*\d*/g, ' ')
        .replace(/phường|quận|huyện|thị xã|thành phố|hà nội|tp\.?|số\s*/g, ' ')
        .replace(/\s+/g, ' ').trim();
}

function lookupLandPrice2026(addr) {
    if (!landPrice2026Data) return null;
    const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    // Làm sạch tên đường: bỏ phần trong ngoặc (vd "(Trong đê)"), bỏ tiền tố Phố/Đường/Đại lộ
    const clean = (s) => norm(s)
        .replace(/\(.*?\)/g, ' ')
        .replace(/^(pho|duong|dai lo|nga tu|nga ba|nga|hem|ngo)\s+/g, ' ')
        .replace(/\s+/g, ' ').trim();
    const addrNorm = norm(addr);
    if (!addrNorm) return null;
    const streetGuess = clean(extractStreetName(addr));
    let best = null, bestScore = 0;
    const scan = (list) => {
        (list || []).forEach(item => {
            const dn = norm(item.tenDuong);
            if (!dn || dn.length < 4) return;
            const dnc = clean(item.tenDuong);
            let score = 0;
            if (addrNorm.includes(dn) || addrNorm.includes(dnc)) {
                score = Math.max(dn.length, dnc.length);
            } else if (streetGuess && (streetGuess.includes(dn) || streetGuess.includes(dnc))) {
                score = Math.max(dn.length, dnc.length) * 0.8;
            }
            if (score > bestScore) { bestScore = score; best = item; }
        });
    };
    (landPrice2026Data.khuVuc || []).forEach(kv => scan(kv.tuyenDuong));
    scan(landPrice2026Data.tuyenDuongChuaPhanLoai);
    return bestScore >= 5 ? best : null;
}

// ==================== GIÁ THỊ TRƯỜNG LÂN CẬN (10 BĐS trong 500m) ====================
function findNearbyMarketPrices(lat, lng, radiusM = 500, limit = 10) {
    const listings = (typeof window.marketPricesInlined !== 'undefined' && window.marketPricesInlined) || [];
    if (!listings.length) return { items: [], avg: null, min: null, max: null, count: 0 };

    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dist = (a, b) => {
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s));
    };

    const nearby = listings
        .map(l => ({ ...l, d: dist({ lat, lng }, l) }))
        .filter(l => l.price_per_sqm > 0 && l.d <= radiusM)
        .sort((a, b) => a.d - b.d)
        .slice(0, limit);

    if (!nearby.length) return { items: [], avg: null, min: null, max: null, count: 0 };

    const vals = nearby.map(l => l.price_per_sqm).sort((a, b) => a - b);
    const cut = Math.max(1, Math.floor(vals.length * 0.1));
    const core = vals.slice(cut, vals.length - cut);
    const avg = core.reduce((s, v) => s + v, 0) / core.length;
    return {
        items: nearby,
        avg: Math.round(avg),
        min: Math.round(core[0]),
        max: Math.round(core[core.length - 1]),
        count: nearby.length
    };
}

// ==================== CHECK MY HOME (CORE) ====================
async function checkMyHome() {
    const addr = document.getElementById('addrInput').value.trim();
    if (!addr) {
        alert('Vui lòng nhập địa chỉ!');
        return;
    }

    // Hiển thị skeleton loading trong panel
    openSidePanelWithDetails("ĐANG TRA CỨU", `
        <div class="area-result">
            <div class="result-header warning" style="background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;">
                🔍 ĐANG ĐỐI SOÁT QUY HOẠCH
            </div>
            <div class="area-info">
                <h3 style="margin:10px 0;font-size:1rem;color:#0f172a;">📍 ${escHtml(addr)}</h3>
                <p style="font-size:0.8rem;color:#64748b;">Đang xác định vị trí và đối soát dữ liệu quy hoạch...</p>
            </div>
            <div style="background:#f1f5f9;padding:20px;border-radius:12px;text-align:center;">
                <div style="height:14px;width:80%;margin:0 auto 10px;background:#e2e8f0;border-radius:6px;animation:qhpulse 1.2s infinite;"></div>
                <div style="height:14px;width:60%;margin:0 auto 10px;background:#e2e8f0;border-radius:6px;animation:qhpulse 1.2s infinite 0.2s;"></div>
                <div style="height:14px;width:70%;margin:0 auto;background:#e2e8f0;border-radius:6px;animation:qhpulse 1.2s infinite 0.4s;"></div>
            </div>
        </div>
    `);

    // Bước 1: Geocode địa chỉ
    let coords = await geocodeAddress(addr);
    if (!coords) {
        coords = [map.getCenter().lat, map.getCenter().lng];
    }

    // Bước 2: Tìm tất cả polygon quy hoạch chứa điểm
    const matchedPolygons = findPolygonsAtPoint(coords[0], coords[1]);

    // Bước 3: Tra bảng giá đất 2026 (lazy load + cache 24h)
    await loadLandPrice2026();
    const streetMatch = lookupLandPrice2026(addr);

    // Bước 4: Giá thị trường lân cận (10 BĐS trong 500m)
    const market = findNearbyMarketPrices(coords[0], coords[1], 500, 10);

    // Bước 5: Hiển thị kết quả "4 câu trả lời"
    renderPlanningResult(matchedPolygons, addr, coords, streetMatch, market);
}

// ==================== RENDER PLANNING RESULT (4 CÂU TRẢ LỜI) ====================
function renderPlanningResult(matchedPolygons, addr, coords, streetMatch, market) {
    // Hỗ trợ cả kiểu gọi cũ (match đơn) & mới (mảng polygon)
    const polygons = Array.isArray(matchedPolygons) ? matchedPolygons : (matchedPolygons ? [matchedPolygons] : []);

    // ── MODULE 1: QUY HOẠCH ──
    let planningStatus = {
        color: '#16a34a', icon: '🟢', text: 'AN TOÀN',
        detail: 'Nhà bạn không nằm trong quy hoạch nào đã công bố.'
    };
    if (polygons.length > 0) {
        // 🔴 Dự án giải tỏa / hành lang dự án (VĐ4, cầu/đường, metro)
        const severe = polygons.find(p => ['vandai4', 'giaothong', 'metro'].includes(p.properties.category));
        // 🟠 Nằm trong khu quy hoạch / tái định cư / khu đô thị / hành lang xanh
        const affected = polygons.find(p => ['songhong', 'khudothi', 'taidinhcu', 'giapranh', 'canhquan'].includes(p.properties.category));
        if (severe) {
            planningStatus = { color: '#dc2626', icon: '🔴', text: 'TRONG DIỆN ẢNH HƯỞNG', detail: 'Thuộc khu vực giải tỏa / hành lang dự án: ' + severe.properties.tenKhu };
        } else if (affected) {
            planningStatus = { color: '#ea580c', icon: '🟠', text: 'TRONG KHU QUY HOẠCH', detail: 'Thuộc khu vực: ' + affected.properties.tenKhu };
        } else {
            planningStatus = { color: '#ca8a04', icon: '🟡', text: 'GIÁP RANH DỰ ÁN', detail: polygons.map(p => p.properties.tenKhu).join('; ') };
        }
    }

    // ── MODULE 2: GIÁ ĐỀN BÙ 2026 ──
    let compensation = null;
    let compDetail = 'Chưa xác định được tuyến đường trong bảng giá 2026 (NQ 52/2025).';
    if (streetMatch) {
        const k = getHeSoKForStreet(streetMatch);
        compensation = Math.round(streetMatch.vt1 * 1000 * k);
        compDetail = `Theo NQ 52/2025: ${streetMatch.tenDuong} (${streetMatch.khuVuc || 'chưa phân loại khu vực'}) — VT1 = ${fmtMoney(streetMatch.vt1 * 1000)}/m² × K=${k}`;
    } else if (landPriceFuse) {
        try {
            const r = landPriceFuse.search(addr);
            if (r.length > 0 && r[0].item && r[0].item.unitPrice) {
                const it = r[0].item;
                compensation = Math.round((it.unitPrice || 0) * 1000 * 1.2);
                compDetail = `Theo bảng giá nội bộ: ${it.region || ''} — VT1 = ${fmtMoney((it.unitPrice || 0) * 1000)}/m² (ước tính K=1.2)`;
            }
        } catch (e) { /* ignore */ }
    }

    // ── MODULE 3: GIÁ THỊ TRƯỜNG ──
    let marketHtml = '<div style="font-size:0.85rem;color:#94a3b8;">Không đủ dữ liệu BĐS lân cận trong bán kính 500m.</div>';
    if (market && market.count > 0 && market.avg) {
        marketHtml = `
            <div style="font-size:1.5rem;font-weight:800;color:#0f172a;">${fmtMoney(market.avg)}<span style="font-size:0.8rem;font-weight:600;color:#64748b;"> /m²</span></div>
            <div style="font-size:0.75rem;color:#64748b;margin-top:4px;">
                Trung bình ${market.count} tin rao bán trong 500m (dao động ${fmtMoney(market.min)} – ${fmtMoney(market.max)})
            </div>`;
    }

    // ── MODULE 4: CHÊNH LỆCH & KHUYẾN NGHỊ ──
    let verdict = null;
    if (compensation && market && market.avg) {
        const diffPct = ((market.avg - compensation) / market.avg) * 100;
        let v;
        if (diffPct < -30) v = { icon: '🟣', label: 'NÊN GIỮ, CHỜ ĐỀN BÙ', color: '#7c3aed', msg: 'Giá đền bù cao hơn giá thị trường nhiều → chờ thu hồi có lợi hơn bán.' };
        else if (diffPct < -5) v = { icon: '🔵', label: 'CÂN NHẮC GIỮ', color: '#2563eb', msg: 'Giá đền bù nhỉnh hơn thị trường → nếu chưa cần tiền gấp nên giữ.' };
        else if (diffPct <= 5) v = { icon: '🟡', label: 'TRUNG LẬP', color: '#ca8a04', msg: 'Giá đền bù tương đương thị trường → quyết định theo nhu cầu.' };
        else if (diffPct <= 30) v = { icon: '🟠', label: 'CÂN NHẮC BÁN', color: '#ea580c', msg: 'Giá thị trường cao hơn đền bù → bán cho nhà đầu tư có lợi hơn chờ đền bù.' };
        else v = { icon: '🔴', label: 'NÊN BÁN NGAY', color: '#dc2626', msg: 'Giá thị trường cao hơn đền bù nhiều → bán ngay để tối đa lợi nhuận.' };
        verdict = { ...v, diffPct: Math.round(diffPct) };
    }

    // ── BUILD HTML ──
    const planningCards = polygons.length > 0
        ? polygons.map(p => `<div style="font-size:0.72rem;color:#475569;margin-top:4px;">• ${escHtml(p.properties.tenKhu)} <span style="color:#94a3b8;">(${escHtml(p.properties.loaiDatTiengViet || p.properties.loai || '')})</span></div>`).join('')
        : '';

    document.getElementById('detail-title').innerText = "KẾT QUẢ TRA CỨU";
    document.getElementById('detail-body').innerHTML = `
        <div class="area-result">
            <div class="result-header" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <h3 style="margin:0;font-size:1rem;color:#0f172a;">📍 ${escHtml(addr)}</h3>
                    <span style="font-size:0.68rem;color:#64748b;background:#f1f5f9;padding:3px 8px;border-radius:20px;">Cập nhật ${new Date().toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="font-size:0.72rem;color:#64748b;margin-top:6px;">Tọa độ: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}</div>
            </div>

            <div style="display:grid;gap:10px;margin-top:12px;">
                <!-- 1. QUY HOẠCH -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-left:5px solid ${planningStatus.color};border-radius:10px;padding:12px;">
                    <div style="font-size:0.68rem;font-weight:800;color:#64748b;letter-spacing:0.05em;">1 · QUY HOẠCH</div>
                    <div style="font-size:1.1rem;font-weight:800;color:${planningStatus.color};margin:4px 0;">${planningStatus.icon} ${planningStatus.text}</div>
                    <div style="font-size:0.78rem;color:#334155;">${escHtml(planningStatus.detail)}</div>
                    ${planningCards}
                </div>

                <!-- 2. GIÁ ĐỀN BÙ -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-left:5px solid #0ea5e9;border-radius:10px;padding:12px;">
                    <div style="font-size:0.68rem;font-weight:800;color:#64748b;letter-spacing:0.05em;">2 · GIÁ ĐỀN BÙ (NQ 52/2025 × HỆ SỐ K)</div>
                    ${compensation
                        ? `<div style="font-size:1.5rem;font-weight:800;color:#0f172a;margin:4px 0;">${fmtMoney(compensation)}<span style="font-size:0.8rem;font-weight:600;color:#64748b;"> /m²</span></div>`
                        : `<div style="font-size:0.9rem;font-weight:700;color:#94a3b8;margin:6px 0;">Chưa có dữ liệu</div>`}
                    <div style="font-size:0.72rem;color:#64748b;">${escHtml(compDetail)}</div>
                </div>

                <!-- 3. GIÁ THỊ TRƯỜNG -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-left:5px solid #22c55e;border-radius:10px;padding:12px;">
                    <div style="font-size:0.68rem;font-weight:800;color:#64748b;letter-spacing:0.05em;">3 · GIÁ THỊ TRƯỜNG LÂN CẬN</div>
                    <div style="margin:6px 0;">${marketHtml}</div>
                </div>

                <!-- 4. PHÂN TÍCH & KHUYẾN NGHỊ -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-left:5px solid ${verdict ? verdict.color : '#94a3b8'};border-radius:10px;padding:12px;">
                    <div style="font-size:0.68rem;font-weight:800;color:#64748b;letter-spacing:0.05em;">4 · PHÂN TÍCH & KHUYẾN NGHỊ</div>
                    ${verdict
                        ? `<div style="font-size:1.1rem;font-weight:800;color:${verdict.color};margin:4px 0;">${verdict.icon} ${verdict.label}</div>
                           <div style="font-size:0.75rem;color:#475569;">Chênh lệch: ${verdict.diffPct > 0 ? '+' : ''}${verdict.diffPct}%</div>
                           <div style="font-size:0.75rem;color:#475569;margin-top:4px;">${escHtml(verdict.msg)}</div>`
                        : `<div style="font-size:0.8rem;color:#94a3b8;margin:6px 0;">Cần dữ liệu giá đền bù & giá thị trường để đưa ra khuyến nghị.</div>`}
                </div>
            </div>

            ${(compensation && market && market.avg) ? `
            <div style="margin-top:12px;background:#f8fafc;border-radius:10px;padding:10px;">
                <div style="font-size:0.72rem;font-weight:800;color:#64748b;margin-bottom:6px;">SO SÁNH GIÁ ĐỀN BÙ VS GIÁ THỊ TRƯỜNG</div>
                <canvas id="priceCompareChart" style="max-height:180px;"></canvas>
            </div>` : ''}

            <div style="margin-top:12px;font-size:0.68rem;color:#94a3b8;line-height:1.5;background:#f8fafc;border-radius:8px;padding:10px;">
                ⚠️ <b>Lưu ý:</b> Kết quả mang tính tham khảo. Giá đền bù chính thức do cơ quan Nhà nước quyết định tại thời điểm thu hồi theo NQ 52/2025/NQ-HĐND & QĐ 19/2026/QĐ-UBND. Vui lòng đối chiếu văn bản gốc.
            </div>
        </div>
    `;

    // Fly-to + marker
    if (homeMarker) map.removeLayer(homeMarker);
    homeMarker = L.marker(coords).addTo(map).bindPopup("📍 " + addr).openPopup();
    map.flyTo(coords, 15);

    const panel = document.getElementById('detail-panel');
    if (panel) panel.classList.add('open');

    // Vẽ biểu đồ so sánh
    if (compensation && market && market.avg && typeof Chart !== 'undefined') {
        setTimeout(() => {
            const ctx = document.getElementById('priceCompareChart');
            if (!ctx) return;
            if (currentChartInstance) currentChartInstance.destroy();
            currentChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Giá đền bù (ước tính)', 'Giá thị trường'],
                    datasets: [{
                        data: [compensation, market.avg],
                        backgroundColor: ['#0ea5e9', '#22c55e'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) + ' đ/m²' } }
                    },
                    scales: { y: { ticks: { callback: (v) => fmtMoney(v) } } }
                }
            });
        }, 150);
    }
}

// ==================== HÀM ĐỒNG BỘ ====================
function syncDistrictToggle(checked) {
    districtLayerEnabled = checked;
    console.log("District layer toggled:", checked);
}

function syncDistrictSelect(value) {
    const selectEl = document.getElementById('district-select');
    if (selectEl) {
        selectEl.value = value;
    }
}

function syncProjectToggle(checked) {
    if (planningGISLayer) {
        if (checked) {
            map.addLayer(planningGISLayer);
        } else {
            map.removeLayer(planningGISLayer);
        }
    }
}

function syncRasterToggle(checked) {
    if (rasterOverlay) {
        if (checked) {
            rasterOverlay.addTo(map);
            const sliderContainer = document.getElementById("side-opacity-slider-container");
            if (sliderContainer) sliderContainer.style.display = "block";
        } else {
            map.removeLayer(rasterOverlay);
            const sliderContainer = document.getElementById("side-opacity-slider-container");
            if (sliderContainer) sliderContainer.style.display = "none";
        }
    }
}

function syncRasterOpacity(value) {
    if (rasterOverlay) {
        const opacity = value / 100;
        rasterOverlay.setOpacity(opacity);
        const sideOpacityVal = document.getElementById("side-opacity-val");
        if (sideOpacityVal) sideOpacityVal.innerText = value + "%";
    }
}

// ==================== TOGGLE MOBILE MENU ====================
function toggleMobileMenu() {
    const dropdown = document.getElementById("mobile-dropdown");
    if (dropdown) {
        dropdown.classList.toggle("open");
    }
}

// ==================== SHOW INFO ====================
function showInfo(type) {
    if (type === 'about') {
        showModal("Giới thiệu", "Dữ Liệu Quy Hoạch – Kênh thông tin chính thống về quy hoạch, đền bù và bất động sản Hà Nội", "fa-circle-info");
    } else if (type === 'terms') {
        showModal("Điều khoản sử dụng", "Mọi thông tin trên website chỉ mang tính chất THAM KHẢO. Vui lòng đối chiếu với nguồn chính thức.", "fa-file-contract");
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
window.showInfo = showInfo;
window.closeModal = closeModal;
window.closeDetail = closeDetail;
window.switchSideTab = switchSideTab;
window.zoomToProject = zoomToProject;
window.renderPlanningResult = renderPlanningResult;

// ==================== KHỞI TẠO ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        init();
    });
} else {
    init();
}

console.log('✅ app.js loaded successfully!');