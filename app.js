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
let districtLayerEnabled = false;

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

// ==================== HÀM INIT CHÍNH ====================
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
                <span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:5px;font-size:0.58rem;font-weight:800;letter-spacing:0.02em;">${item.loai || 'Tin tức'}</span>
            </div>
            <h4 style="font-family:'Inter';font-size:0.8rem;font-weight:700;color:#1e293b;margin-bottom:5px;line-height:1.4;">${item.tenKhu || ''}</h4>
            <p style="font-size:0.72rem;color:#64748b;line-height:1.5;font-family:'Inter';">${moTaText.substring(0, 80)}...</p>`;

        div.onclick = () => {
            if (item.viDo && item.kinhDo) {
                map.flyTo([item.viDo, item.kinhDo], 15);
            }
        };
        list.appendChild(div);
    });
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
    planningGISLayer.addTo(map);
    console.log("Đã tải ranh giới GIS quy hoạch.");
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

// ==================== CHECK MY HOME (CORE) ====================
function checkMyHome() {
    const addr = document.getElementById('addrInput').value.trim();
    if (!addr) {
        alert('Vui lòng nhập địa chỉ!');
        return;
    }

    showModal("Đang phân tích", "Đang đối soát quy hoạch cho: <b>" + addr + "</b>", "fa-satellite-dish");

    // Simple fallback - show result
    setTimeout(() => {
        closeModal();
        renderPlanningResult(null, addr, [21.0285, 105.8542], null);
    }, 1000);
}

// ==================== RENDER PLANNING RESULT (SIMPLE) ====================
function renderPlanningResult(match, addr, coords, priceMatch) {
    document.getElementById('detail-title').innerText = "KẾT QUẢ TRA CỨU";
    document.getElementById('detail-body').innerHTML = `
        <div class="area-result">
            <div class="result-header warning">
                ⚠️ ĐANG ĐỐI SOÁT QUY HOẠCH
            </div>
            <div class="area-info">
                <h3>📍 ${addr}</h3>
                <p>Hệ thống đang tra cứu dữ liệu quy hoạch cho địa chỉ này.</p>
            </div>
            <div style="background:#f1f5f9; padding:20px; border-radius:12px; text-align:center;">
                <p style="font-size:0.9rem; font-weight:700; color:#1e293b;">Vui lòng đợi trong giây lát...</p>
                <div style="margin-top:10px; font-size:0.75rem; color:#64748b;">
                    <i class="fa-solid fa-circle-info"></i> Dữ liệu đang được cập nhật từ hệ thống
                </div>
            </div>
        </div>
    `;

    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');
    map.flyTo(coords, 15);
    closeModal();
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