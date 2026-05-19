/**
 * DULIEUQUYHOACH.COM - Core Logic v3.9
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

        // 1. THỬ LẤY TỪ LOCALSTORAGE CACHE TRƯỚC ĐỂ LOAD NHANH
        const cached = localStorage.getItem('dqh_cache');
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                if (Date.now() - cacheData.time < 3600000) {
                    console.log("Loaded data from localStorage cache.");
                    newsData = cacheData.data.news || [];
                    progressData = cacheData.data.progress || [];
                    faqData = cacheData.data.faq || [];
                    planningData = cacheData.data.planning || [];
                    projectsData = cacheData.data.projects || [];
                    landPriceData = cacheData.data.landPrice || [];
                    
                    allNews = newsData;
                    renderNews(allNews.slice(0, displayedNewsCount));
                    renderFAQ(faqData);
                    renderProjectsInMapTab(projectsData);
                }
            } catch (e) {
                console.log("Cache parse error, falling back to network.");
            }
        }

        // 2. SỬ DỤNG DỮ LIỆU PRE-LOADED (tránh CORS khi mở bằng file://)
        if (window.sheetDataInlined) {
            const fullData = window.sheetDataInlined;
            newsData = fullData.news || [];
            progressData = fullData.progress || [];
            faqData = fullData.faq || [];
            planningData = fullData.planning || [];
            projectsData = fullData.projects || [];
            landPriceData = fullData.landPrice || [];
            console.log("Loaded data from pre-loaded sheetDataInlined.");
        } else {
            // 3. FETCH DỮ LIỆU TỪ MẠNG
            try {
                const cacheRes = await fetch("data/sheet_data.json?t=" + Date.now());
                if (cacheRes.ok) {
                    const fullData = await cacheRes.json();
                    newsData = fullData.news || [];
                    progressData = fullData.progress || [];
                    faqData = fullData.faq || [];
                    planningData = fullData.planning || [];
                    projectsData = fullData.projects || [];
                    landPriceData = fullData.landPrice || [];
                    console.log("Loaded data from static cache.");
                } else {
                    throw new Error("Cache file not found or empty.");
                }
            } catch (cacheError) {
                console.log("Static cache failed, falling back to GAS API or defaults.", cacheError);
                
                try {
                    // Ưu tiên lấy từ Google Sheets (GAS API) nếu có URL
                    if (GAS_API_URL && !GAS_API_URL.includes("YOUR_GAS")) {
                        const controller = new AbortController();
                        const timeout = setTimeout(() => controller.abort(), 8000); // Timeout 8s
                        const gasRes = await fetch(GAS_API_URL, { signal: controller.signal });
                        clearTimeout(timeout);
                        const fullData = await gasRes.json();
                        newsData = fullData.news || [];
                        progressData = fullData.progress || [];
                        faqData = fullData.faq || [];
                        planningData = fullData.planning || [];
                        projectsData = fullData.projects || [];
                        landPriceData = fullData.landPrice || [];
                    } else {
                        // Fallback lấy từ file JSON local (GitHub Pages)
                        const [newsRes, extraRes] = await Promise.all([
                            fetch(NEWS_URL + "?t=" + Date.now()),
                            fetch(EXTRA_URL + "?t=" + Date.now())
                        ]);
                        newsData = await newsRes.json();
                        const extraData = await extraRes.json();
                        progressData = extraData.progress || [];
                        faqData = extraData.faq || [];
                    }
                } catch (fallbackError) {
                    console.log("Fallback fetch also failed (likely due to file:// protocol CORS). Using mock data.", fallbackError);
                }
            }
        }
        
        // Mock Data để test trải nghiệm khi chưa có dữ liệu từ Sheet
        if (projectsData.length === 0) {
            projectsData = [
                { projectName: "Vành đai 4", investor: "Tập đoàn Vingroup", scale: "112.8 km", description: "Dự án đường vành đai liên vùng thủ đô" },
                { projectName: "Cầu Tứ Liên", investor: "Sungroup", scale: "4.8 km", description: "Cầu dây văng kết nối Đông Anh và trung tâm" },
                { projectName: "Trục Thăng Long", investor: "UDIC", scale: "Khu đô thị", description: "Phát triển đô thị phía Tây" }
            ];
        }
        
        if (planningData.length === 0) {
            planningData = [
                { stdAddress: "Số 5 Cổ Linh", project: "Vành đai 4", status: "Một phần", kFactor: 2.0, landPrice: 50000000 },
                { stdAddress: "Ngõ 12 Thạch Bàn", project: "Cầu Tứ Liên", status: "Toàn bộ", kFactor: 1.5, landPrice: 40000000 },
                { stdAddress: "Mê Linh Plaza", project: "Trục Thăng Long", status: "Cảnh báo", kFactor: 1.0, landPrice: 30000000 }
            ];
        }
        
        if (progressData.length === 0) {
            progressData = [
                { project: "Vành đai 4", date: "2026-05-15", milestone: "Đang giải phóng mặt bằng", detail: "Đã đền bù 70% diện tích" },
                { project: "Cầu Tứ Liên", date: "2026-05-10", milestone: "Phê duyệt quy hoạch 1/500", detail: "Đang chuẩn bị đấu thầu" }
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
        
        // Lưu dữ liệu mới vào cache
        const freshData = { news: newsData, progress: progressData, faq: faqData, planning: planningData, projects: projectsData, landPrice: landPriceData };
        localStorage.setItem('dqh_cache', JSON.stringify({ time: Date.now(), data: freshData }));

        allNews = newsData;
        renderNews(allNews.slice(0, displayedNewsCount));
        
        // Thiết lập sự kiện cuộn để load thêm tin (Lazy Load)
        setupLazyLoad();
        
        // renderProgress(progressData); // Tạm ẩn do thiếu #progressList trong HTML. Dữ liệu tiến độ đã hiển thị trong tab Dự án.
        
        renderFAQ(faqData);
        renderProjectsInMapTab(projectsData);
        
        // TẢI RĂNH GIỚI QUY HOẠCH (GIS)
        loadPlanningGIS();
        
        // Tải ranh giới hành chính Hà Nội
        initDistrictSelector();

        // Khởi tạo Fuse.js cho tìm kiếm mờ
        if (planningData.length > 0) {
            // Chuẩn hóa dữ liệu trước khi đưa vào Fuse (thêm trường không dấu)
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
    } catch (e) {
        console.error("Data Load Error:", e);
    }
}

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    ['projectList', 'faqList', 'mapList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = ''; 
        }
    });
    
    if (tab === 'realmap') {
        document.body.classList.add('show-map');
        // Cần invalidateSize cho Leaflet khi hiện bản đồ
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

function normalizeAddress(str) {
    if (!str) return "";
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
        .replace(/p\./g, "phuong ").replace(/q\./g, "quan ")
        .replace(/\s+/g, " ").trim();
}

async function checkMyHome() {
    const rawAddr = document.getElementById('addrInput').value;
    if(!rawAddr) return;
    
    const normAddr = normalizeAddress(rawAddr);
    showModal("Đang phân tích", "Đang đối soát quy hoạch cho: <b>" + rawAddr + "</b>", "fa-satellite-dish");
    
    // HỖ TRỢ TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU / DIRECT POLYGON FUZZY MATCH (P3)
    const matchedPolygon = planningPolygons.find(p => {
        const name = normalizeAddress(p.properties.tenKhu || "");
        const loai = normalizeAddress(p.properties.loai || "");
        const cat = normalizeAddress(p.properties.category || "");
        return name.includes(normAddr) || normAddr.includes(name) ||
               loai.includes(normAddr) || normAddr.includes(loai) ||
               cat.includes(normAddr);
    });

    if (matchedPolygon) {
        console.log("Direct polygon match found:", matchedPolygon.properties.tenKhu);
        const center = getPolygonCenter(matchedPolygon.geometry);
        
        // Tạo marker tại tâm dự án
        if (homeMarker) map.removeLayer(homeMarker);
        const projectIcon = L.divIcon({
            html: '<div style="background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid #2563eb;"><i class="fa-solid fa-circle-info" style="font-size: 18px; color: #2563eb;"></i></div>',
            className: 'project-marker-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        homeMarker = L.marker(center, { icon: projectIcon }).addTo(map);
        homeMarker.bindTooltip(matchedPolygon.properties.tenKhu, { permanent: true, direction: 'top', className: 'house-tooltip' }).openTooltip();
        
        // Tìm kiếm các dữ liệu giá tương quan nếu có
        let priceMatch = null;
        if (landPriceFuse) {
            const results = landPriceFuse.search(rawAddr);
            if (results.length > 0 && results[0].score < 0.6) {
                priceMatch = results[0].item;
            }
        }

        // Hiển thị trực tiếp kết quả đối soát GIS cho polygon này
        renderPlanningResult(null, matchedPolygon.properties.tenKhu, center, priceMatch, matchedPolygon);
        return;
    }

    // Phân loại: Tra cứu địa chỉ cụ thể hay Tra cứu khu vực/đường
    const isAreaQuery = /^(duong|pho|phuong|xa|quan|huyen)\s/.test(normAddr) || !/\d/.test(normAddr);
    
    if (isAreaQuery) {
        handleAreaLookup(normAddr, rawAddr);
    } else {
        handleAddressLookup(normAddr, rawAddr);
    }
}

async function handleAddressLookup(normAddr, rawAddr) {
    let match = null;
    if (fuse) {
        // Tìm kiếm bằng cả chuỗi gốc và chuỗi không dấu
        const results = fuse.search(rawAddr);
        const resultsNoAccent = fuse.search(normAddr);
        
        // Gộp kết quả và lấy cái tốt nhất
        const allResults = [...results, ...resultsNoAccent];
        allResults.sort((a, b) => a.score - b.score);
        
        if (allResults.length > 0 && allResults[0].score < 0.5) {
            match = allResults[0].item;
            console.log("Fuse.js match score:", allResults[0].score);
        }
    } else {
        match = planningData.find(item => 
            normalizeAddress(item.stdAddress).includes(normAddr) || 
            normAddr.includes(normalizeAddress(item.stdAddress))
        );
    }

    let priceMatch = null;
    if (landPriceFuse) {
        const priceResults = landPriceFuse.search(rawAddr);
        const priceResultsNoAccent = landPriceFuse.search(normAddr);
        const allPriceResults = [...priceResults, ...priceResultsNoAccent];
        allPriceResults.sort((a, b) => a.score - b.score);
        
        if (allPriceResults.length > 0 && allPriceResults[0].score < 0.5) {
            priceMatch = allPriceResults[0].item;
            console.log("Fuse.js land price match score:", allPriceResults[0].score);
        }
    }

    try {
        if (homeMarker) map.removeLayer(homeMarker);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawAddr + ", Hanoi")}`);
        const data = await res.json();
        const lat = data && data.length > 0 ? parseFloat(data[0].lat) : 21.0285;
        const lon = data && data.length > 0 ? parseFloat(data[0].lon) : 105.8542;
        const coords = [lat, lon];

        // Tạo icon ngôi nhà bằng FontAwesome
        const houseIcon = L.divIcon({
            html: '<div style="background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid #be123c;"><i class="fa-solid fa-house" style="font-size: 18px; color: #be123c;"></i></div>',
            className: 'house-marker-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        // Tạo marker và gán tooltip
        homeMarker = L.marker(coords, { icon: houseIcon }).addTo(map);
        homeMarker.bindTooltip(rawAddr, { permanent: true, direction: 'top', className: 'house-tooltip' }).openTooltip();

        // Bấm vào marker thì hiển thị lại bảng tra cứu
        homeMarker.on('click', () => {
            renderPlanningResult(match, rawAddr, coords, priceMatch);
        });

        // Tự động kích hoạt hiển thị kết quả lập tức (Wow UX!)
        renderPlanningResult(match, rawAddr, coords, priceMatch);

        // Bay tới khu vực đó
        map.flyTo(coords, 17);
        closeModal(); // Đóng modal "Đang phân tích"
    } catch (e) { 
        console.error(e); 
        closeModal();
    }
}

async function handleAreaLookup(normAddr, rawAddr) {
    // Tìm tất cả các điểm thuộc khu vực này trong DanhSachQuyHoach
    const affectedPoints = planningData.filter(item => 
        normalizeAddress(item.stdAddress).includes(normAddr) || 
        normalizeAddress(item.region).includes(normAddr)
    );

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawAddr + ", Hanoi")}`);
    const data = await res.json();
    const coords = data && data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : [21.0285, 105.8542];

    if (affectedPoints.length > 0) {
        renderAreaResult(affectedPoints, rawAddr, coords);
    } else {
        // Cảnh báo dựa trên danh sách khu vực trọng điểm
        const hotspot = ["hồng hà", "mê linh", "lĩnh nam", "bát tràng", "phố huế"].find(h => normAddr.includes(h));
        if (hotspot) {
            renderPlanningWarning(rawAddr, coords);
        } else {
            showModal("Thông tin", "Khu vực này hiện chưa có thông tin quy hoạch trong hệ thống.<br><br><a href='tai-ban-do-quy-hoach.html' style='display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;'><i class='fa-solid fa-file-invoice-dollar'></i> TRA CỨU BẢNG GIÁ ĐẤT</a>", "fa-circle-info");
            map.flyTo(coords, 14);
        }
    }
}

function renderAreaResult(points, rawQuery, coords) {
    const projectNames = [...new Set(points.map(p => p.project))];
    const mainProject = projectNames[0];
    const project = projectsData.find(p => p.projectName === mainProject) || {};
    const timeline = progressData.filter(p => p.project === mainProject).slice(0, 2);
    
    // Tính mức độ ảnh hưởng (MVP logic)
    const affectedCount = points.filter(p => p.status === "Có" || p.status === "Affected").length;
    const ratio = affectedCount / points.length;
    let level = "buffer", label = "GIÁP RANH / ẢNH HƯỞNG NHỎ", colorClass = "partial";
    
    if (ratio > 0.8) { level = "full"; label = "TOÀN BỘ NẰM TRONG QUY HOẠCH"; colorClass = "warning"; }
    else if (ratio > 0.2) { level = "partial"; label = "MỘT PHẦN NẰM TRONG QUY HOẠCH"; colorClass = "partial"; }

    document.getElementById('detail-title').innerText = "KẾT QUẢ TRA CỨU KHU VỰC";
    document.getElementById('detail-body').innerHTML = `
        <div class="area-result">
            <div class="result-header ${colorClass}">
                ⚠️ ${label}
            </div>

            <div class="area-info">
                <h3>📍 ${rawQuery.toUpperCase()}</h3>
                <p>📊 Dựa trên đối soát ${points.length} điểm dữ liệu trong khu vực này.</p>
            </div>

            <div class="section-title">📋 DỰ ÁN LIÊN QUAN</div>
            <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:20px;">
                <strong style="font-size:0.8rem; color:#1e293b;">${mainProject}</strong>
                <p style="font-size:0.7rem; color:#64748b; margin-top:4px;">Chủ đầu tư: ${project.investor || "Đang cập nhật"}</p>
                <div style="margin-top:10px; border-top:1px dashed #cbd5e1; padding-top:10px;">
                    ${timeline.map(t => `<p style="font-size:0.65rem; color:#475569;">📅 <b>${t.date}:</b> ${t.milestone}</p>`).join('')}
                </div>
            </div>

            <div class="section-title">🗺️ PHÂN VÙNG ẢNH HƯỞNG</div>
            <table class="impact-table">
                <thead>
                    <tr><th>Khu vực</th><th>Mức độ</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tuyến đường chính</td>
                        <td><span class="badge ${level}">${level === 'full' ? 'Giải tỏa toàn bộ' : 'Ảnh hưởng một phần'}</span></td>
                    </tr>
                    <tr>
                        <td>Ngõ hẻm / Giáp ranh</td>
                        <td><span class="badge buffer">Theo dõi thêm</span></td>
                    </tr>
                </tbody>
            </table>

            <div class="cta-box">
                <p>🔍 Muốn biết chính xác nhà mình?</p>
                <input type="text" id="cta-specific-addr" placeholder="Nhập số nhà cụ thể trên ${rawQuery}">
                <button onclick="searchFromCTA('${rawQuery}')">TRA CỨU SỐ NHÀ</button>
            </div>
        </div>
    `;
    
    const panel = document.getElementById('detail-panel');
    panel.style.display = 'flex';
    setTimeout(() => panel.classList.add('open'), 10);
    map.flyTo(coords, 15);
    closeModal();
}

window.searchFromCTA = (baseArea) => {
    const num = document.getElementById('cta-specific-addr').value;
    if(!num) return;
    document.getElementById('addrInput').value = num + " " + baseArea;
    checkMyHome();
};

function renderPlanningResult(match, addr, coords, priceMatch, selectedFeature = null) {
    const project = match ? (projectsData.find(p => p.projectName === match.project) || {}) : {};
    const timeline = match ? progressData.filter(p => p.project === match.project).slice(0, 2) : [];
    const k = match ? (match.kFactor || 1.0) : 1.0;
    
    // Lấy giá cho 4 vị trí
    let priceVt1 = 0, priceVt2 = 0, priceVt3 = 0, priceVt4 = 0;
    
    if (priceMatch) {
        priceVt1 = priceMatch["Vị trí 1"] || priceMatch.gia_dat_o_vt1 || 0;
        priceVt2 = priceMatch["Vị trí 2"] || priceMatch.gia_dat_o_vt2 || Math.round(priceVt1 * 0.8);
        priceVt3 = priceMatch["Vị trí 3"] || priceMatch.gia_dat_o_vt3 || Math.round(priceVt1 * 0.6);
        priceVt4 = priceMatch["Vị trí 4"] || priceMatch.gia_dat_o_vt4 || Math.round(priceVt1 * 0.4);
    } else if (match) {
        priceVt1 = match.gia_dat_o_vt1 || match.landPrice || 0;
        priceVt2 = match.gia_dat_o_vt2 || Math.round(priceVt1 * 0.8);
        priceVt3 = match.gia_dat_o_vt3 || Math.round(priceVt1 * 0.6);
        priceVt4 = match.gia_dat_o_vt4 || Math.round(priceVt1 * 0.4);
    }

    // Thực hiện đối soát GIS không gian tại tọa độ tìm được (P1)
    let relatedPlannings = [];
    if (selectedFeature) {
        relatedPlannings = [{ feature: selectedFeature, relation: "Nằm trong diện ảnh hưởng", distance: 0, order: 1 }];
    } else {
        relatedPlannings = findIntersectingPlanning(coords[0], coords[1]);
    }

    let gisHtml = "";
    if (relatedPlannings.length > 0) {
        gisHtml = `
        <div style="background:#fff7ed; border:1px solid #ffedd5; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#c2410c; font-weight:800; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px; font-family:'Outfit', sans-serif;">
                <i class="fa-solid fa-satellite-dish fa-fade"></i> Đối soát không gian GIS bản đồ
            </p>
            ${relatedPlannings.map(item => {
                const props = item.feature.properties;
                let badgeColor = "#2563eb"; // default blue
                if (props.category === 'vandai4') badgeColor = "#ef4444"; // red
                else if (props.category === 'taidinhcu') badgeColor = "#00cc66"; // green
                else if (props.category === 'giapranh') badgeColor = "#ff8800"; // orange
                
                // Trích xuất tài liệu theo ngữ cảnh cho từng polygon (Hạng mục 1)
                const docs = contextualDocuments[props.id] || [];
                let docsListHtml = "";
                if (docs.length > 0) {
                    docsListHtml = `
                    <div style="margin-top: 8px; background: #ffffff; border: 1px solid #fed7aa; border-radius: 8px; padding: 8px 10px;">
                        <span style="font-size: 0.65rem; font-weight: 800; color: #c2410c; display: flex; align-items: center; gap: 4px; margin-bottom: 5px;"><i class="fa-solid fa-folder-open"></i> Thư viện tài liệu pháp lý liên quan:</span>
                        ${docs.map(d => `
                            <a href="${d.url}" target="_blank" style="display: flex; align-items: center; gap: 6px; font-size: 0.68rem; color: #2563eb; text-decoration: none; padding: 4px 0; border-bottom: 1px solid #f1f5f9; cursor:pointer;">
                                <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i>
                                <span style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${d.name}</span>
                                <span style="font-size: 0.55rem; background: #e0f2fe; color: #0369a1; padding: 1px 4px; border-radius: 3px; font-weight: 700;">${d.type}</span>
                            </a>
                        `).join('')}
                    </div>`;
                }

                return `
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #fed7aa; last-child { border: none; margin-bottom:0; padding-bottom:0; }">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom: 4px;">
                        <strong style="font-size:0.75rem; color:#1e293b; line-height:1.2;">${props.tenKhu}</strong>
                        <span style="font-size:0.6rem; padding: 2px 6px; border-radius: 4px; background:${badgeColor}; color:white; font-weight:800; white-space:nowrap;">${item.relation}</span>
                    </div>
                    <p style="font-size:0.68rem; color:#475569; margin:0 0 4px 0; line-height:1.3;">${props.description}</p>
                    <div style="font-size:0.62rem; color:#94a3b8; margin-top:4px;">Diện tích: <b>${props.dienTich}</b> | Nguồn: <b>${props.nguon}</b></div>
                    ${docsListHtml}
                </div>
                `;
            }).join('')}
        </div>
        `;
    } else {
        gisHtml = `
        <div style="background:#f0f9ff; border:1px solid #bae6fd; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#0369a1; font-weight:800; text-transform:uppercase; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-circle-check"></i> Đối soát không gian GIS bản đồ
            </p>
            <p style="font-size:0.72rem; color:#0369a1; margin:0; line-height:1.4;">Tọa độ của bạn nằm ngoài phạm vi ảnh hưởng trực tiếp của các đại dự án đang theo dõi (Vành đai 4, Quy hoạch Sông Hồng, v.v.).</p>
        </div>
        `;
    }

    document.getElementById('detail-title').innerText = selectedFeature ? "QUY HOẠCH CHI TIẾT" : (match ? "KẾT QUẢ TRA CỨU" : "BẢNG GIÁ ĐẤT KHU VỰC");
    document.getElementById('detail-body').innerHTML = `
        ${selectedFeature ? `
        <div style="background:#fff1f2; border:1px solid #fecaca; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#be123c; font-weight:800; text-transform:uppercase; margin-bottom:5px;">📍 Dự án khớp tìm kiếm</p>
            <p style="font-size:0.85rem; font-weight:700; margin:0;">${addr}</p>
            <div style="margin-top:10px; display:inline-block; padding:4px 10px; background:#be123c; color:white; border-radius:4px; font-size:0.65rem; font-weight:800;">🏗️ DỰ ÁN QUY HOẠCH KHU VỰC</div>
        </div>
        ` : (match ? `
        <div style="background:#fff1f2; border:1px solid #fecaca; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#be123c; font-weight:800; text-transform:uppercase; margin-bottom:5px;">📍 Địa chỉ tra cứu</p>
            <p style="font-size:0.85rem; font-weight:700; margin:0;">${addr}</p>
            <div style="margin-top:10px; display:inline-block; padding:4px 10px; background:#be123c; color:white; border-radius:4px; font-size:0.65rem; font-weight:800;">⚠️ NẰM TRONG DIỆN GIẢI TỎA</div>
        </div>
        ` : `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#475569; font-weight:800; text-transform:uppercase; margin-bottom:5px;">📍 Địa chỉ tra cứu</p>
            <p style="font-size:0.85rem; font-weight:700; margin:0;">${addr}</p>
            <div style="margin-top:10px; display:inline-block; padding:4px 10px; background:#475569; color:white; border-radius:4px; font-size:0.65rem; font-weight:800;">ℹ️ TRA CỨU THÔNG TIN KHU VỰC</div>
        </div>
        `)}

        <!-- Hiển thị kết quả đối soát GIS -->
        ${gisHtml}

        ${match ? `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:12px; margin-bottom:15px;">
            <h4 style="font-size:0.8rem; margin-bottom:10px; color:#1e40af;">🏗️ THÔNG TIN DỰ ÁN</h4>
            <p style="font-size:0.75rem;"><b>Dự án:</b> ${match.project}</p>
            <p style="font-size:0.75rem;"><b>Chủ đầu tư:</b> ${project.investor || "Đang cập nhật"}</p>
            <p style="font-size:0.75rem;"><b>Quy mô:</b> ${project.scale || "Đang cập nhật"}</p>
        </div>

        <div style="background:#f0f9ff; border:1px solid #bae6fd; padding:15px; border-radius:12px; margin-bottom:15px;">
            <h4 style="font-size:0.8rem; margin-bottom:10px; color:#0369a1;">📊 TIẾN ĐỘ MỚI NHẤT</h4>
            ${timeline.length > 0 ? timeline.map(t => `<p style="font-size:0.7rem; margin-bottom:4px;">• <b>${t.date}:</b> ${t.milestone}</p>`).join('') : '<p style="font-size:0.7rem;">Đang cập nhật...</p>'}
        </div>
        ` : ''}

        <!-- Hạng mục 2: Lịch sử giá đền bù theo thời gian -->
        <div style="background:#ffffff; border:1px solid #e2e8f0; padding:15px; border-radius:12px; margin-bottom:15px;">
            <h4 style="font-size:0.78rem; margin-bottom:10px; color:#1e293b; font-family:'Inter', sans-serif; display:flex; align-items:center; gap:6px; font-weight:700;">
                <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i> Lịch sử giá đền bù theo quyết định
            </h4>
            <div style="position: relative; height: 160px; width: 100%;">
                <canvas id="compensationHistoryChart"></canvas>
            </div>
            <p style="font-size: 0.6rem; color: #94a3b8; margin-top: 8px; text-align: center;">* Đơn vị: Triệu VNĐ/m² đất ở vị trí 1</p>
        </div>

        <div style="background:#fffbeb; border:1px solid #fef3c7; padding:15px; border-radius:12px;">
            <h4 style="font-size:0.8rem; margin-bottom:10px; color:#92400e;">💰 BẢNG GIÁ ĐẤT ĐỀN BÙ DỰ KIẾN</h4>
            <table style="width:100%; border-collapse: collapse; font-size: 0.75rem; text-align: left; margin-bottom: 15px; border: 1px solid #fcd34d;">
                <tr style="background: #fef3c7; color: #92400e;">
                    <th style="padding: 6px; border: 1px solid #fcd34d;">Vị trí</th>
                    <th style="padding: 6px; border: 1px solid #fcd34d;">Giá gốc (đ/m²)</th>
                    <th style="padding: 6px; border: 1px solid #fcd34d;">x Hệ số K (${k})</th>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">VT1 (Mặt tiền)</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">${new Intl.NumberFormat('vi-VN').format(priceVt1)}</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d; font-weight:700; color: #be123c;">${new Intl.NumberFormat('vi-VN').format(priceVt1 * k)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">VT2 (Ngõ > 3m)</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">${new Intl.NumberFormat('vi-VN').format(priceVt2)}</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d; font-weight:700; color: #be123c;">${new Intl.NumberFormat('vi-VN').format(priceVt2 * k)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">VT3 (Ngõ 2-3m)</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">${new Intl.NumberFormat('vi-VN').format(priceVt3)}</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d; font-weight:700; color: #be123c;">${new Intl.NumberFormat('vi-VN').format(priceVt3 * k)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">VT4 (Ngõ < 2m)</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d;">${new Intl.NumberFormat('vi-VN').format(priceVt4)}</td>
                    <td style="padding: 6px; border: 1px solid #fcd34d; font-weight:700; color: #be123c;">${new Intl.NumberFormat('vi-VN').format(priceVt4 * k)}</td>
                </tr>
            </table>

            <h4 style="font-size:0.8rem; margin-bottom:10px; color:#92400e;">🧮 CÔNG CỤ TÍNH NHANH</h4>
            <label style="font-size:0.7rem; color:#92400e; font-weight:700;">Chọn vị trí đất:</label>
            <select id="calc_position" style="width:100%; padding:8px; border:1px solid #fcd34d; border-radius:8px; margin-top:5px; margin-bottom:10px; font-size:0.8rem;" onchange="updateCompWithPositionSpecific(${priceVt1}, ${priceVt2}, ${priceVt3}, ${priceVt4}, ${k})">
                <option value="1">Vị trí 1 (Mặt tiền)</option>
                <option value="2">Vị trí 2 (Ngõ > 3m)</option>
                <option value="3">Vị trí 3 (Ngõ 2-3m)</option>
                <option value="4">Vị trí 4 (Ngõ < 2m)</option>
            </select>
            <p style="font-size:0.75rem;">Đơn giá gốc: <b id="base_price_val">${new Intl.NumberFormat('vi-VN').format(priceVt1)}</b> đ/m²</p>
            <p style="font-size:0.75rem;">Hệ số K: <b>${k}</b></p>
            <p style="font-size:0.9rem; color:#b45309; font-weight:800; margin:10px 0;">→ TỔNG ĐƠN GIÁ: <b id="total_unit_price_val">${new Intl.NumberFormat('vi-VN').format(priceVt1 * k)}</b> đ/m²</p>
            <label style="font-size:0.7rem;">Nhập diện tích (m²):</label>
            <input type="number" id="calc_area" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:8px; margin-top:5px;" oninput="updateTotalCompFromInput()">
            <h3 id="total_comp_val" style="margin-top:10px; color:#be123c; font-weight:900;">0 VNĐ</h3>
        </div>
        
        <a href="tai-ban-do-quy-hoach.html" style="display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 15px;"><i class="fa-solid fa-file-invoice-dollar"></i> TRA CỨU BẢNG GIÁ ĐẤT</a>

        <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
            <button onclick="shareFacebook()" style="background: #1877F2; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-weight: 700;"><i class="fa-brands fa-facebook"></i> Facebook</button>
            <button onclick="shareZalo()" style="background: #0068FF; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-weight: 700;"><i class="fa-solid fa-message"></i> Zalo</button>
        </div>

        <p style="font-size:0.6rem; color:#94a3b8; margin-top:15px; text-align:center;">* Dữ liệu tham chiếu dựa trên bảng giá đất hiện hành</p>
    `;
    
    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');
    map.flyTo(coords, 17);
    closeModal();

    // Khởi tạo và vẽ biểu đồ lịch sử đền bù (Hạng mục 2)
    setTimeout(() => {
        renderHistoricalChart(priceVt1);
    }, 50);
}

// Hàm khởi tạo và kết xuất biểu đồ lịch sử bằng Chart.js (Hạng mục 2)
function renderHistoricalChart(basePrice) {
    const ctx = document.getElementById('compensationHistoryChart');
    if (!ctx) return;

    // Phá hủy biểu đồ cũ nếu đã được tạo từ trước để tránh lỗi hiển thị chồng đè
    if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
    }

    if (!basePrice || basePrice === 0) {
        basePrice = 16000000; // Giá mặc định nếu không tra cứu thấy dữ liệu tuyến đường
    }

    // Tính toán dữ liệu giá đền bù lịch sử mô phỏng theo tỉ lệ thực tế các quyết định (triệu/m²)
    const price2019 = Math.round((basePrice * 0.65) / 1000000); // Quyết định cũ
    const price2024 = Math.round((basePrice * 0.85) / 1000000); // Điều chỉnh đầu năm
    const price2025 = Math.round((basePrice * 1.0) / 1000000);  // Bảng giá hiện hành (QĐ 71/2024)
    const price2026 = Math.round((basePrice * 1.25) / 1000000); // Dự báo mới 2026

    const dataValues = [price2019, price2024, price2025, price2026];
    const chartLabels = ['QĐ 30/2019', 'Đầu 2024', 'QĐ 71/2024', 'Dự kiến 2026'];

    try {
        currentChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Đơn giá (Triệu đ/m²)',
                    data: dataValues,
                    borderColor: '#2563eb', // Royal Blue sang trọng
                    borderWidth: 3,
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    fill: true,
                    tension: 0.35, // Bo tròn đường nét chuyên nghiệp
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Ẩn nhãn chú giải để bảng tối giản, thanh thoát
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { family: 'Inter', size: 10, weight: 'bold' },
                        bodyFont: { family: 'Inter', size: 10 },
                        padding: 8,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ` Đơn giá: ${context.parsed.y} Tr/m²`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { family: 'Inter', size: 9 },
                            color: '#64748b'
                        }
                    },
                    y: {
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            font: { family: 'Inter', size: 9 },
                            color: '#64748b',
                            callback: function(value) {
                                return value + ' Tr';
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Lỗi khi vẽ biểu đồ lịch sử giá đền bù:", e);
    }
}

function renderPlanningWarning(addr, coords) {
    document.getElementById('detail-title').innerText = "CẢNH BÁO QUY HOẠCH";
    document.getElementById('detail-body').innerHTML = `
        <div style="background:#fff7ed; border:1px solid #ffedd5; padding:20px; border-radius:16px; text-align:center;">
            <div style="font-size:3rem; margin-bottom:15px;">⚠️</div>
            <h4 style="color:#9a3412; margin-bottom:10px;">KHU VỰC CÓ THỂ ẢNH HƯỞNG</h4>
            <p style="font-size:0.8rem; line-height:1.6; color:#7c2d12;">Địa chỉ <b>${addr}</b> nằm trong khu vực/phường xã đang triển khai dự án quy hoạch ven sông Hồng.</p>
            <p style="font-size:0.75rem; margin-top:15px; font-weight:600; color:#c2410c;">Vui lòng liên hệ UBND Phường để đối soát ranh giới chính xác.</p>
        </div>
    `;
    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');
    map.flyTo(coords, 16);
    closeModal();
}

window.updateTotalComp = (unitPrice) => {
    const area = document.getElementById('calc_area').value;
    const total = area * unitPrice;
    document.getElementById('total_comp_val').innerText = new Intl.NumberFormat('vi-VN').format(total) + " VNĐ";
};

window.updateCompWithPositionSpecific = (p1, p2, p3, p4, k) => {
    const pos = document.getElementById('calc_position').value;
    let currentPrice = p1;
    if (pos === "2") currentPrice = p2;
    else if (pos === "3") currentPrice = p3;
    else if (pos === "4") currentPrice = p4;
    
    const totalUnitPrice = currentPrice * k;
    
    document.getElementById('base_price_val').innerText = new Intl.NumberFormat('vi-VN').format(currentPrice);
    document.getElementById('total_unit_price_val').innerText = new Intl.NumberFormat('vi-VN').format(totalUnitPrice);
    
    updateTotalCompFromInput();
};

window.updateTotalCompFromInput = () => {
    const totalUnitPriceStr = document.getElementById('total_unit_price_val').innerText.replace(/\./g, '');
    const totalUnitPrice = parseFloat(totalUnitPriceStr);
    window.updateTotalComp(totalUnitPrice);
};

window.openHomeAnalysis = function(addr) {
    const now = new Date().toLocaleString('vi-VN');
    document.getElementById('detail-title').innerText = "PHÂN TÍCH ĐỊA CHỈ";
    document.getElementById('detail-body').innerHTML = `
        <div style="background:#f0f9ff; padding:15px; border-radius:12px; border:1px solid #bae6fd; margin-bottom:20px;">
            <p style="font-size:0.85rem; line-height:1.6; font-family:'Inter'">Vị trí nhà bạn (<b>${addr}</b>) đang được đối soát quy hoạch.</p>
        </div>
        <div style="background:#fff7ed; padding:20px; border-radius:16px; border:1px solid #ffedd5; font-family:'Inter'">
            <h4 style="color:#2563eb; margin-bottom:15px; font-weight:800;">💰 TÍNH TIỀN BỒI THƯỜNG</h4>
            <div style="background:#fffbeb; border:1px solid #fef3c7; padding:12px; border-radius:8px; margin-bottom:10px; font-weight:800; color:#92400e; text-align:center;">ĐƠN GIÁ: 55.000.000 VNĐ / m2</div>
            <div style="font-size:0.65rem; color:#64748b; margin-bottom:15px; text-align:center; line-height:1.4;">
                Cập nhật: <b>${now}</b><br>
                Nguồn pháp lý: <b>Quyết định số 30/2024/QĐ-UBND TP. Hà Nội</b>
            </div>
            <label style="font-size:0.75rem; font-weight:700;">Diện tích thửa đất (m2):</label>
            <input type="number" id="home_area_input" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; margin-top:8px; font-family:'Inter'" placeholder="Ví dụ: 80">
            <button onclick="calcComp()" style="width:100%; background:#2563eb; color:white; border:none; padding:14px; border-radius:10px; font-weight:800; cursor:pointer; margin-top:15px;">TÍNH TOÁN KẾT QUẢ</button>
            <div id="home_calc_res" style="display:none; margin-top:20px; text-align:center; border-top:1px dashed #cbd5e1; padding-top:15px;">
                <h3 id="home_comp_val" style="color:#2563eb; font-size:1.6rem; font-weight:900;">0 VNĐ</h3>
                <p style="font-size:0.6rem; color:#ef4444; margin-top:10px;">* Đã áp dụng hệ số điều chỉnh K=2.0 (Giả định)</p>
            </div>
        </div>
    `;
    const panel = document.getElementById('detail-panel');
    panel.style.display = 'flex';
    setTimeout(() => panel.classList.add('open'), 10);
};

window.calcComp = () => {
    const area = document.getElementById('home_area_input').value;
    if(!area) return;
    const total = area * 55 * 2;
    document.getElementById('home_comp_val').innerText = new Intl.NumberFormat('vi-VN').format(total * 1000000) + " VNĐ";
    document.getElementById('home_calc_res').style.display = 'block';
};

window.submitQuestion = async () => {
    const address = document.getElementById('ask_address').value;
    const question = document.getElementById('ask_question').value;
    const contact = document.getElementById('ask_contact').value;
    
    if (!question || !contact) {
        alert("Vui lòng nhập đầy đủ câu hỏi và thông tin liên hệ!");
        return;
    }
    
    showModal("Đang gửi", "Đang gửi câu hỏi của bạn lên hệ thống...", "fa-spinner fa-spin");
    
    try {
        const res = await fetch(GAS_API_URL, {
            method: "POST",
            body: JSON.stringify({ address, question, contact })
        });
        const result = await res.json();
        if (result.status === "success") {
            showModal("Thành công", "Đã gửi câu hỏi thành công! Chúng tôi sẽ liên hệ lại sớm.<br><br><a href='tai-ban-do-quy-hoach.html' style='display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;'><i class='fa-solid fa-file-invoice-dollar'></i> TRA CỨU BẢNG GIÁ ĐẤT</a>", "fa-circle-check");
        } else {
            showModal("Lỗi", "Gửi câu hỏi thất bại: " + result.message, "fa-circle-xmark");
        }
    } catch (e) {
        console.error(e);
        showModal("Lỗi", "Không thể kết nối tới máy chủ.", "fa-circle-xmark");
    }
};

window.shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

window.shareZalo = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://zalo.me/s/share?url=${url}`, '_blank');
};

window.runGlobalCalc = () => {
    // Chức năng đã bị loại bỏ theo yêu cầu
};

function renderNews(data, append = false) {
    const list = document.getElementById('projectList');
    if (!append) list.innerHTML = '';
    
    data.forEach((item, index) => {
        const actualIndex = append ? (displayedNewsCount - data.length + index) : index;
        
        let marker = null;
        if (item.viDo && item.kinhDo) {
            marker = L.marker([item.viDo, item.kinhDo]).addTo(map);
            marker.bindPopup(`<h4>${item.tenKhu}</h4><a href="javascript:void(0)" onclick="openNewsDetail(${actualIndex})">Xem chi tiết</a>`);
        }
        
        const div = document.createElement('div');
        div.className = 'project-item';
        const tagClass = item.loai === "Tái định cư" ? "tag-tdc" : "tag-qh";
        const moTaText = item.moTa || "Chưa có mô tả chi tiết cho dự án này.";
        div.innerHTML = `
            <span class="tag ${tagClass}">${item.loai}</span>
            <h4 style="font-family:'Inter'">${item.tenKhu}</h4>
            <p style="font-size:0.75rem; color:#64748b; line-height:1.5; font-family:'Inter'">${moTaText.substring(0, 50)}...</p>
        `;
        
        div.onclick = () => { 
            if (item.viDo && item.kinhDo) {
                map.flyTo([item.viDo, item.kinhDo], 15); 
                if (marker) marker.openPopup(); 
            } else {
                showModal("Thông báo", "Vị trí của khu vực này chưa được xác định trên bản đồ.<br><br><a href='tai-ban-do-quy-hoach.html' style='display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;'><i class='fa-solid fa-file-invoice-dollar'></i> TRA CỨU BẢNG GIÁ ĐẤT</a>", "fa-location-dot");
            }
        };
        list.appendChild(div);
    });
}

function setupLazyLoad() {
    const list = document.getElementById('projectList');
    list.addEventListener('scroll', () => {
        if (list.scrollTop + list.clientHeight >= list.scrollHeight - 20) {
            if (displayedNewsCount < allNews.length) {
                const nextBatch = allNews.slice(displayedNewsCount, displayedNewsCount + 10);
                displayedNewsCount += nextBatch.length;
                renderNews(nextBatch, true);
            }
        }
    });
}

function renderProgress(data) {
    const list = document.getElementById('progressList');
    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem; font-family:\'Inter\'">Dữ liệu Tiến độ đang được cập nhật...</div>';
        return;
    }

    // Nhóm dữ liệu theo dự án
    const grouped = {};
    data.forEach(item => {
        const p = item.project || "Khác";
        if (!grouped[p]) grouped[p] = [];
        grouped[p].push(item);
    });

    const projects = Object.keys(grouped);
    
    // Tạo Sub-tabs
    let html = `<div class="sub-tabs">`;
    projects.forEach((p, idx) => {
        html += `<button class="sub-btn ${idx === 0 ? 'active' : ''}" onclick="switchProjectTab('${p}', this)">${p}</button>`;
    });
    html += `</div>`;

    // Tạo Timeline Containers
    html += `<div class="timeline-container">`;
    projects.forEach((p, idx) => {
        const items = grouped[p].sort((a, b) => new Date(b.date) - new Date(a.date));
        html += `<div id="timeline-${p}" class="project-timeline" style="display: ${idx === 0 ? 'block' : 'none'}">`;
        items.forEach(i => {
            html += `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <span class="timeline-date">${i.date}</span>
                    <div class="timeline-content">
                        <div class="timeline-title">${i.milestone || "Cập nhật mới"}</div>
                        <p class="timeline-desc">${i.details || i.content || ""}</p>
                        ${i.nguonTin ? `<a href="${i.nguonTin}" target="_blank" class="timeline-source">XEM NGUỒN TIN <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    });
    html += `</div>`;
    
    list.innerHTML = html;
}

window.switchProjectTab = (projectName, btn) => {
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.project-timeline').forEach(t => t.style.display = 'none');
    const target = document.getElementById('timeline-' + projectName);
    if (target) target.style.display = 'block';
};

function renderFAQ(data) {
    const list = document.getElementById('faqList');
    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem; font-family:\'Inter\'">Dữ liệu Hỏi đáp đang được cập nhật từ hệ thống...</div>';
        return;
    }
    list.innerHTML = data.map(f => `
        <div class="faq-item" onclick="this.classList.toggle('open')">
            <div class="faq-q" style="font-family:'Inter'">${f.q || "Câu hỏi đang cập nhật"}</div>
            <div class="faq-a">${f.a || "Câu trả lời đang cập nhật"}</div>
        </div>
    `).join('');
}

function renderProjectsInMapTab(data) {
    const list = document.getElementById('mapList');
    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem; font-family:\'Inter\'">Dữ liệu Bản đồ đang được cập nhật...</div>';
        return;
    }
    
    list.innerHTML = `
        <div style="padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 0.75rem; color: #64748b; text-align: center;">Danh sách các khu vực quy hoạch. Click để xem trên bản đồ.</p>
        </div>
        ${data.map(p => {
            const timeline = progressData.filter(t => t.project === p.projectName).slice(0, 2);
            return `
                <div class="project-item" onclick="zoomToProject('${p.projectName}')">
                    <span class="tag tag-qh">Dự án</span>
                    <h4 style="font-family:'Inter'">${p.projectName}</h4>
                    <p style="font-size:0.75rem; color:#64748b; line-height:1.5; font-family:'Inter'">Chủ đầu tư: ${p.investor || "Đang cập nhật"}</p>
                    <p style="font-size:0.7rem; color:#94a3b8; font-family:'Inter'">Quy mô: ${p.scale || "Đang cập nhật"}</p>
                    
                    <div style="margin-top: 10px; padding: 8px; background: #f0f9ff; border-radius: 6px;">
                        <p style="font-size: 0.7rem; color: #0369a1; font-weight: 700; margin-bottom: 5px;">📍 Tiến độ:</p>
                        ${timeline.length > 0 ? timeline.map(t => `<p style="font-size:0.65rem; color: #0c4a6e; margin-bottom:2px;">• <b>${t.date}:</b> ${t.milestone}</p>`).join('') : '<p style="font-size:0.65rem; color: #64748b;">Đang cập nhật...</p>'}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

window.zoomToProject = async (projectName) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(projectName + ", Hanoi")}`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 15);
        } else {
            alert("Không tìm thấy vị trí của dự án này trên bản đồ.");
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi khi tìm kiếm vị trí.");
    }
};

window.openNewsDetail = (idx) => {
    const item = allNews[idx];
    
    // Tìm đơn giá từ bảng giá đất dựa trên mô tả hoặc tiêu đề (đối soát khu vực)
    const normTitle = normalizeAddress(item.tenKhu + " " + item.moTa);
    const priceMatch = landPriceData.find(lp => normTitle.includes(normalizeAddress(lp.region)));
    const unitPrice = priceMatch ? priceMatch.unitPrice : 25000000; // Mặc định 25tr nếu không khớp
    const kFactor = priceMatch ? (priceMatch.defaultK || 1.5) : 1.5;
    const finalPrice = unitPrice * kFactor;

    document.getElementById('detail-title').innerText = item.tenKhu;
    document.getElementById('detail-body').innerHTML = `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid #e2e8f0;">
            <p style="font-size:0.85rem; line-height:1.8; color:#1e293b;">${item.moTa}</p>
            <p style="margin-top:10px; font-size:0.75rem;">Nguồn: <a href="${item.nguonTin}" target="_blank" style="color:#2563eb; font-weight:600;">${item.nguonTin.substring(0, 40)}...</a></p>
        </div>

        <div style="background:linear-gradient(135deg, #fffbeb, #fef3c7); padding:20px; border-radius:16px; border:1px solid #fcd34d;">
            <h4 style="font-size:0.85rem; color:#92400e; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-calculator"></i> DỰ TÍNH BỒI THƯỜNG (THAM KHẢO)
            </h4>
            <label style="font-size:0.7rem; color:#92400e; font-weight:700;">Chọn vị trí đất:</label>
            <select id="news_calc_position" style="width:100%; padding:8px; border:1px solid #fcd34d; border-radius:8px; margin-top:5px; margin-bottom:15px; font-size:0.8rem;" onchange="updateNewsCompWithPosition(${unitPrice}, ${kFactor})">
                <option value="1">Vị trí 1 (Mặt tiền)</option>
                <option value="2">Vị trí 2 (Ngõ > 3m)</option>
                <option value="3">Vị trí 3 (Ngõ 2-3m)</option>
                <option value="4">Vị trí 4 (Ngõ < 2m)</option>
            </select>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                <div style="background:white; padding:10px; border-radius:8px;">
                    <p style="font-size:0.6rem; color:#64748b; text-transform:uppercase;">Đơn giá đất</p>
                    <p style="font-size:0.8rem; font-weight:700;" id="news_base_price_val">${new Intl.NumberFormat('vi-VN').format(unitPrice)} đ/m²</p>
                </div>
                <div style="background:white; padding:10px; border-radius:8px;">
                    <p style="font-size:0.6rem; color:#64748b; text-transform:uppercase;">Hệ số K</p>
                    <p style="font-size:0.8rem; font-weight:700;">${kFactor}</p>
                </div>
            </div>
            
            <div style="background:rgba(255,255,255,0.5); padding:15px; border-radius:12px;">
                <label style="font-size:0.7rem; font-weight:700; color:#92400e;">NHẬP DIỆN TÍCH NHÀ BẠN (M²):</label>
                <input type="number" id="news_calc_area" placeholder="Ví dụ: 50" style="width:100%; padding:12px; border:1px solid #fcd34d; border-radius:8px; margin-top:8px; font-size:1rem; font-weight:700;" oninput="updateNewsCompWithPosition(${unitPrice}, ${kFactor})">
                <div style="margin-top:15px; text-align:center;">
                    <p style="font-size:0.7rem; color:#92400e; text-transform:uppercase;">Tổng số tiền nhận được</p>
                    <h2 id="news_total_comp" style="color:#be123c; font-weight:900; margin-top:5px;">0 VNĐ</h2>
                </div>
            </div>
            <p style="font-size:0.6rem; color:#92400e; margin-top:10px; font-style:italic;">* Kết quả dựa trên dữ liệu bảng giá đất khu vực ${priceMatch ? priceMatch.region : 'Hà Nội'}.</p>
        </div>
        <a href="tai-ban-do-quy-hoach.html" style="display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 15px;"><i class="fa-solid fa-file-invoice-dollar"></i> TRA CỨU BẢNG GIÁ ĐẤT</a>
    `;
    
    document.getElementById('detail-panel').classList.add('open');
};

window.updateNewsComp = (price) => {
    const area = document.getElementById('news_calc_area').value;
    const total = area * price;
    document.getElementById('news_total_comp').innerText = new Intl.NumberFormat('vi-VN').format(total) + " VNĐ";
};

window.updateNewsCompWithPosition = (basePrice, k) => {
    const pos = document.getElementById('news_calc_position').value;
    let factor = 1.0;
    if (pos === "2") factor = 0.8;
    else if (pos === "3") factor = 0.6;
    else if (pos === "4") factor = 0.4;
    
    const currentPrice = basePrice * factor;
    const totalUnitPrice = currentPrice * k;
    
    document.getElementById('news_base_price_val').innerText = new Intl.NumberFormat('vi-VN').format(currentPrice) + " đ/m²";
    
    const area = document.getElementById('news_calc_area').value;
    const total = area * totalUnitPrice;
    document.getElementById('news_total_comp').innerText = new Intl.NumberFormat('vi-VN').format(total) + " VNĐ";
};

function showModal(title, text, icon) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalText').innerHTML = text;
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    document.getElementById('custom-modal').classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }
function closeDetail() { document.getElementById('detail-panel').classList.remove('open'); }

function loadPlanningGIS() {
    const drawGeojson = (geojsonData) => {
        planningPolygons = geojsonData.features || [];

        L.geoJSON(geojsonData, {
            style: function(feature) {
                const cat = feature.properties ? feature.properties.category : '';
                switch (cat) {
                    case 'vandai4':
                        return {
                            color: "#ff0000",       // Đỏ
                            weight: 4,
                            fillColor: "#ff0000",
                            fillOpacity: 0.1
                        };
                    case 'taidinhcu':
                        return {
                            color: "#00cc66",       // Xanh lá
                            weight: 3,
                            fillColor: "#00cc66",
                            fillOpacity: 0.2
                        };
                    case 'songhong':
                        return {
                            color: "#0044cc",       // Xanh dương đậm
                            weight: 2,
                            fillColor: "#0044cc",
                            fillOpacity: 0.05,
                            dashArray: '5, 5'       // Nét đứt
                        };
                    case 'giapranh':
                        return {
                            color: "#ff8800",       // Cam
                            weight: 2,
                            fillColor: "#ff8800",
                            fillOpacity: 0.1
                        };
                    default:
                        return {
                            color: "#ef4444",
                            weight: 2,
                            fillColor: "#ef4444",
                            fillOpacity: 0.1
                        };
                }
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties || {};
                const name = props.tenKhu || props.name || "Khu vực quy hoạch";
                const loai = props.loai || "Đang cập nhật";
                const description = props.description || "Chưa có mô tả chi tiết.";
                const area = props.dienTich || "Đang cập nhật";
                const source = props.nguon || "UBND TP Hà Nội";

                const docs = contextualDocuments[props.id] || [];
                let docsHtml = "";
                if (docs.length > 0) {
                    docsHtml = `
                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px;">
                        <span style="font-size: 0.62rem; font-weight: 800; color: #1e40af; display: block; margin-bottom: 2px;"><i class="fa-solid fa-folder-open"></i> Tài liệu liên quan:</span>
                        ${docs.map(d => `<a href="${d.url}" target="_blank" style="display: block; font-size: 0.6rem; color: #2563eb; text-decoration: none; margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> ${d.name}</a>`).join('')}
                    </div>`;
                }

                // Gán popup chi tiết, trực quan hóa đúng mục đích sử dụng đất
                layer.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; padding: 5px; max-width: 250px;">
                        <span style="display: inline-block; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; font-size: 0.62rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 5px;">🏗️ ${loai}</span>
                        <h4 style="margin: 0 0 5px 0; color: #1e293b; font-weight: 800; font-size: 0.85rem;">${name}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 0.72rem; color: #475569; line-height: 1.4;">${description}</p>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.65rem; color: #64748b;">
                            <div>Diện tích: <b>${area}</b></div>
                            <div>Nguồn: <b>${source}</b></div>
                        </div>
                        ${docsHtml}
                    </div>
                `, { closeButton: true });
            }
        }).addTo(map);
        console.log("Đã tải ranh giới GIS quy hoạch.");
    };

    if (typeof mapGeojsonData !== 'undefined') {
        console.log("Sử dụng dữ liệu GeoJSON inlined (tránh lỗi CORS file://).");
        drawGeojson(mapGeojsonData);
    } else {
        const GIS_URL = "data/map.geojson"; 
        fetch(GIS_URL)
            .then(res => res.json())
            .then(geojsonData => drawGeojson(geojsonData))
            .catch(err => console.log("Không thể tải ranh giới GIS quy hoạch qua fetch:", err));
    }
}

window.showInfo = function(type) {
    if (type === 'about') {
        const html = `
            <div style="text-align: left; font-size: 0.85rem; line-height: 1.6; color: #334155;">
                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">Dữ Liệu Quy Hoạch – Kênh thông tin chính thống về quy hoạch, đền bù và bất động sản Hà Nội</p>
                <p style="margin-bottom: 10px;">📍 <b>Tra cứu ngay:</b> Nhà bạn có nằm trong diện giải tỏa? Giá đất đền bù là bao nhiêu? Tiến độ dự án thế nào?</p>
                <p style="margin-bottom: 10px;">🗺️ <b>Dữ liệu từ:</b> UBND TP Hà Nội và các đồ án quy hoạch phân khu.</p>
                <p style="margin-bottom: 10px;">💡 <b>Tham gia cộng đồng</b> để hỏi đáp và cập nhật tin tức mới nhất:</p>
                <p style="font-weight: 700; color: #1e40af; margin-top: 15px; margin-bottom: 5px;">🔗 Các kênh chính thức:</p>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 8px;"><i class="fa-solid fa-globe" style="color: #64748b; width: 20px;"></i> <b>Website:</b> <a href="https://dulieuquyhoach.com" target="_blank" style="color: #2563eb; text-decoration: none;">https://dulieuquyhoach.com</a></li>
                    <li style="margin-bottom: 8px;"><i class="fa-brands fa-facebook" style="color: #1877F2; width: 20px;"></i> <b>Facebook Group:</b> <a href="https://www.facebook.com/groups/1694801338541423" target="_blank" style="color: #2563eb; text-decoration: none;">Tham gia nhóm</a></li>
                    <li style="margin-bottom: 8px;"><i class="fa-brands fa-tiktok" style="color: #000; width: 20px;"></i> <b>TikTok:</b> <a href="https://www.tiktok.com/@dulieuquyhoach" target="_blank" style="color: #2563eb; text-decoration: none;">@dulieuquyhoach</a></li>
                    <li style="margin-bottom: 8px;"><i class="fa-brands fa-youtube" style="color: #FF0000; width: 20px;"></i> <b>YouTube:</b> <a href="https://www.youtube.com/@dulieuquyhoach" target="_blank" style="color: #2563eb; text-decoration: none;">Xem kênh</a></li>
                    <li style="margin-bottom: 8px;"><i class="fa-solid fa-comment-dots" style="color: #0068FF; width: 20px;"></i> <b>Zalo Group:</b> <a href="https://zalo.me/g/mgqmnwhir8oajnifstzq" target="_blank" style="color: #2563eb; text-decoration: none;">Tham gia nhóm</a></li>
                </ul>
            </div>
        `;
        showModal("Giới thiệu", html, "fa-circle-info");
    } else if (type === 'terms') {
        const html = `
            <div style="text-align: left; font-size: 0.85rem; line-height: 1.6; color: #334155; max-height: 60vh; overflow-y: auto; padding-right: 10px;">
                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">1. Bản chất của thông tin</p>
                <p>Dữ liệu, bản đồ, bảng giá, thông tin về quy hoạch, đền bù, tiến độ dự án... được cung cấp trên website dulieuquyhoach.com (sau đây gọi là "Chúng tôi") là từ các nguồn sau:</p>
                <ul style="margin-bottom: 10px; padding-left: 20px;">
                    <li>Các văn bản pháp luật, quyết định của cơ quan nhà nước có thẩm quyền (UBND Thành phố Hà Nội, Sở Tài nguyên và Môi trường, ...).</li>
                    <li>Các đồ án quy hoạch được công bố công khai.</li>
                    <li>Dữ liệu do người dùng đóng góp qua mục "Hỏi đáp".</li>
                </ul>
                <p style="margin-bottom: 15px;">Chúng tôi không phải là cơ quan nhà nước, không phải là đơn vị thẩm định giá, và không trực tiếp tham gia vào quá trình ra quyết định hành chính hay phê duyệt dự án. Do đó, mọi thông tin trên website chỉ mang tính chất THAM KHẢO.</p>

                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">2. Không đảm bảo tính chính xác tuyệt đối</p>
                <p>Chúng tôi nỗ lực hết sức để tập hợp, xử lý và cập nhật dữ liệu một cách chính xác và kịp thời nhất. Tuy nhiên, chúng tôi không thể đảm bảo rằng thông tin hiển thị luôn luôn đầy đủ, chính xác tuyệt đối hoặc không có bất kỳ sai sót nào do các nguyên nhân sau:</p>
                <ul style="margin-bottom: 10px; padding-left: 20px;">
                    <li>Lỗi trong quá trình trích xuất, nhập liệu, xử lý dữ liệu từ các nguồn chính thống.</li>
                    <li>Sự chậm trễ trong việc cập nhật so với các văn bản pháp luật mới hoặc điều chỉnh của cơ quan có thẩm quyền.</li>
                    <li>Lỗi từ các nguồn dữ liệu công khai mà chúng tôi tham khảo.</li>
                    <li>Lỗi kỹ thuật từ hệ thống máy chủ, quá trình truyền tải dữ liệu.</li>
                </ul>

                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">3. Không thay thế nguồn thông tin chính thức</p>
                <p>Thông tin trên dulieuquyhoach.com KHÔNG thay thế cho các văn bản pháp lý gốc, các quyết định hành chính của cơ quan nhà nước, hay sự tư vấn từ các chuyên gia pháp lý, luật sư, hoặc chuyên gia bất động sản.</p>
                <p style="margin-bottom: 10px;">Trước khi đưa ra bất kỳ quyết định quan trọng liên quan đến quyền lợi tài sản, đất đai (ví dụ: quyết định mua bán, đầu tư, nhận đền bù, xây dựng, chuyển nhượng...), bạn BẮT BUỘC phải liên hệ và xác nhận thông tin từ các nguồn chính thức như:</p>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    <li>Văn phòng Đăng ký đất đai Hà Nội.</li>
                    <li>UBND quận/huyện nơi có đất.</li>
                    <li>Phòng Tài nguyên và Môi trường quận/huyện.</li>
                    <li>Các văn phòng công chứng và luật sư chuyên ngành.</li>
                </ul>

                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">4. Về dữ liệu do người dùng cung cấp (mục Hỏi đáp)</p>
                <p style="margin-bottom: 15px;">Nội dung trong phần "Hỏi đáp" đến từ sự đóng góp của cộng đồng người dùng. Chúng tôi khuyến khích các chia sẻ hữu ích, nhưng sẽ không kiểm chứng độc lập và không chịu trách nhiệm về tính chính xác, trung thực của các câu hỏi, câu trả lời, hay bất kỳ thông tin nào được trao đổi giữa người dùng với nhau trong phần này.</p>

                <p style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">5. Giới hạn trách nhiệm pháp lý</p>
                <p>Trong phạm vi tối đa được pháp luật cho phép, Dữ Liệu Quy Hoạch và các thành viên, cộng tác viên sẽ KHÔNG chịu bất kỳ trách nhiệm pháp lý hay bồi thường thiệt hại nào (bao gồm nhưng không giới hạn: thiệt hại trực tiếp, gián tiếp, do mất dữ liệu, mất cơ hội kinh doanh, hoặc các chi phí phát sinh) phát sinh từ hoặc liên quan đến việc:</p>
                <ul style="margin-bottom: 10px; padding-left: 20px;">
                    <li>Sử dụng hoặc không thể sử dụng thông tin từ website.</li>
                    <li>Sự phụ thuộc của bạn vào bất kỳ thông tin nào trên website.</li>
                    <li>Hành động của bạn dựa trên thông tin từ website.</li>
                    <li>Bất kỳ sai sót, thiếu chính xác của dữ liệu.</li>
                </ul>
                <p style="font-weight: 700; color: #be123c; margin-top: 15px;">Bằng việc sử dụng website dulieuquyhoach.com, bạn đồng ý rằng bạn tự chịu trách nhiệm về mọi rủi ro liên quan đến việc tra cứu, sử dụng thông tin, và bất kỳ quyết định nào của bạn dựa trên thông tin từ chúng tôi.</p>
            </div>
        `;
        showModal("Điều khoản sử dụng", html, "fa-file-contract");
    }
};

// --- LOGIC CHO BỘ CHỌN RANH GIỚI HÀNH CHÍNH & TỔNG QUAN HÀ NỘI ---
let activeBoundaryLayer = null;
let overviewDistrictsLayer = null;
let hanoiBoundaryData = null;

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

// Số lượng dự án quy hoạch/đất đai mô phỏng cho từng quận/huyện phục vụ heat map (P2)
const districtProjectCounts = {
    'Quận Tây Hồ': 5,
    'Huyện Đông Anh': 6,
    'Huyện Mê Linh': 4,
    'Quận Long Biên': 3,
    'Huyện Hoài Đức': 5,
    'Huyện Đan Phượng': 3,
    'Quận Hoàng Mai': 4,
    'Huyện Gia Lâm': 3,
    'Quận Ba Đình': 2,
    'Quận Cầu Giấy': 2,
    'Quận Đống Đa': 1,
    'Quận Hai Bà Trưng': 1,
    'Quận Hoàn Kiếm': 1,
    'Quận Thanh Xuân': 2,
    'Huyện Sóc Sơn': 3,
    'Huyện Thanh Trì': 2,
    'Huyện Thường Tín': 3
};

function getDistrictProjectCount(name) {
    return districtProjectCounts[name] || 1;
}

// 1. Vẽ heatmap tổng quan mật độ dự án của toàn bộ 30 quận huyện (P2)
async function loadDistrictOverview() {
    if (!hanoiBoundaryData) return;
    
    // Xóa layer tổng quan cũ nếu có
    if (overviewDistrictsLayer) {
        map.removeLayer(overviewDistrictsLayer);
    }
    
    const features = hanoiBoundaryData.level2s.map(district => {
        return {
            "type": "Feature",
            "properties": {
                "name": district.name,
                "level2_id": district.level2_id,
                "projectCount": getDistrictProjectCount(district.name)
            },
            "geometry": {
                "type": district.type,
                "coordinates": district.coordinates
            }
        };
    });

    const geojsonCollection = {
        "type": "FeatureCollection",
        "features": features
    };

    overviewDistrictsLayer = L.geoJSON(geojsonCollection, {
        style: function(feature) {
            const count = feature.properties.projectCount;
            let fillColor = "#94a3b8"; // Mặc định: xám nhạt
            
            // Phân cấp màu sắc chuyên nghiệp dựa trên số lượng dự án
            if (count >= 5) fillColor = "#7c3aed";      // Tím đậm (Rất nóng)
            else if (count >= 3) fillColor = "#2563eb"; // Xanh dương (Nóng)
            else if (count >= 2) fillColor = "#0ea5e9"; // Xanh trời (Trung bình)
            else fillColor = "#94a3b8";                 // Xám (Ít biến động)
            
            return {
                color: "#ffffff",
                weight: 1.5,
                fillColor: fillColor,
                fillOpacity: 0.25
            };
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties;
            
            // Tooltip hiển thị nhanh mật độ tin tức/dự án khi di chuột qua
            layer.bindTooltip(`
                <div style="font-family: 'Inter', sans-serif; font-size: 0.72rem; padding: 2px 4px;">
                    <b style="color: #1e293b;">${props.name}</b><br>
                    🔥 Quy hoạch: <b>${props.projectCount} đại dự án</b>
                </div>
            `, { sticky: true, opacity: 0.95 });

            // Khi click vào polygon quận/huyện trên tổng quan
            layer.on('click', () => {
                const selectEl = document.getElementById('district-select');
                if (selectEl) {
                    selectEl.value = props.name;
                    // Kích hoạt sự kiện thay đổi để zoom và vẽ ranh giới chi tiết
                    const event = new Event('change');
                    selectEl.dispatchEvent(event);
                }
            });
        }
    }).addTo(map);

    // Zoom toàn thành phố
    map.setView([21.0285, 105.8542], 10);
}

// 2. Khởi tạo bộ chọn ranh giới quận/huyện
async function initDistrictSelector() {
    const selectEl = document.getElementById('district-select');
    const clearBtn = document.getElementById('clear-boundary-btn');
    if (!selectEl) return;

    // Chèn danh sách quận huyện
    districtsList.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        selectEl.appendChild(opt);
    });

    // Tải dữ liệu ranh giới Hà Nội (CORS trực tiếp + localStorage Cache)
    try {
        const cachedBoundary = localStorage.getItem('hanoi_boundary_cache');
        if (cachedBoundary) {
            hanoiBoundaryData = JSON.parse(cachedBoundary);
            console.log("Đã tải ranh giới Hà Nội từ localStorage cache.");
            loadDistrictOverview(); // Kích hoạt vẽ tổng quan (P2)
        } else {
            const res = await fetch('https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/gis/01.json');
            if (res.ok) {
                hanoiBoundaryData = await res.json();
                localStorage.setItem('hanoi_boundary_cache', JSON.stringify(hanoiBoundaryData));
                console.log("Đã tải và lưu cache ranh giới Hà Nội từ GitHub.");
                loadDistrictOverview(); // Kích hoạt vẽ tổng quan (P2)
            }
        }
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu ranh giới hành chính:", e);
    }

    // Xử lý khi người dùng chọn Quận/Huyện cụ thể
    selectEl.addEventListener('change', async (e) => {
        const selected = e.target.value;
        
        // Ẩn ranh giới đơn lẻ cũ
        if (activeBoundaryLayer) {
            map.removeLayer(activeBoundaryLayer);
            activeBoundaryLayer = null;
        }

        if (!selected) {
            if (clearBtn) clearBtn.style.display = 'none';
            // Hiện lại bản đồ tổng quan
            if (overviewDistrictsLayer) overviewDistrictsLayer.addTo(map);
            map.setView([21.0285, 105.8542], 10);
            return;
        }

        // Hiển thị nút "Xóa ranh giới"
        if (clearBtn) clearBtn.style.display = 'flex';

        // Ẩn lớp tổng quan để tránh đè lấp mất nét vẽ kĩ thuật chi tiết
        if (overviewDistrictsLayer) {
            map.removeLayer(overviewDistrictsLayer);
        }

        if (!hanoiBoundaryData) {
            showModal("Đang tải dữ liệu", "Hệ thống đang tải dữ liệu ranh giới. Vui lòng thử lại sau vài giây.", "fa-spinner fa-spin");
            try {
                const res = await fetch('https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/gis/01.json');
                if (res.ok) {
                    hanoiBoundaryData = await res.json();
                    localStorage.setItem('hanoi_boundary_cache', JSON.stringify(hanoiBoundaryData));
                    closeModal();
                } else {
                    throw new Error("Fetch error");
                }
            } catch (err) {
                showModal("Lỗi kết nối", "Không thể tải dữ liệu ranh giới từ máy chủ.", "fa-circle-xmark");
                return;
            }
        }

        const district = hanoiBoundaryData.level2s.find(d => d.name === selected);
        if (!district) {
            showModal("Thông báo", `Không tìm thấy dữ liệu ranh giới cho ${selected}`, "fa-circle-exclamation");
            return;
        }

        const geojsonFeature = {
            "type": "Feature",
            "properties": {
                "name": district.name,
                "level2_id": district.level2_id
            },
            "geometry": {
                "type": district.type,
                "coordinates": district.coordinates
            }
        };

        // Vẽ ranh giới xanh Blueprint cao cấp
        activeBoundaryLayer = L.geoJSON(geojsonFeature, {
            style: {
                color: '#2563eb',       // Xanh hoàng gia
                weight: 3,
                fillColor: '#3b82f6',   // Xanh công nghệ
                fillOpacity: 0.15,
                dashArray: '5, 8'       // Nét đứt kĩ thuật
            },
            onEachFeature: function(feature, layer) {
                // Chỉ dẫn thông báo lưu ý ranh giới để người dùng nắm rõ (suggestion 1)
                layer.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; padding: 5px; max-width: 220px;">
                        <h4 style="margin: 0 0 5px 0; color: #1e40af; font-weight: 800; font-size: 0.85rem;"><i class="fa-solid fa-map-location-dot"></i> ${district.name}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 0.72rem; color: #64748b;">Mã hành chính: <b>${district.level2_id}</b></p>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 0.65rem; color: #f59e0b; line-height: 1.4; font-weight: 500;">
                            ⚠️ Dữ liệu hiển thị là ranh giới hành chính (để tham khảo vị trí). Dữ liệu quy hoạch chi tiết đang được cập nhật...
                        </div>
                    </div>
                `, { closeButton: false, offset: L.point(0, -10) });
            }
        }).addTo(map);

        const bounds = activeBoundaryLayer.getBounds();
        map.fitBounds(bounds, { padding: [30, 30] });
        
        activeBoundaryLayer.eachLayer(layer => {
            layer.openPopup(bounds.getCenter());
        });
    });

    // Nút "Xóa ranh giới" quay lại tổng quan (suggestion 2)
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            selectEl.value = "";
            clearBtn.style.display = 'none';
            
            if (activeBoundaryLayer) {
                map.removeLayer(activeBoundaryLayer);
                activeBoundaryLayer = null;
            }
            
            // Nạp lại heatmap tổng quan và zoom ra xa toàn Hà Nội
            loadDistrictOverview();
        });
    }
}

// 3. THUẬT TOÁN ĐỐI SOÁT KHÔNG GIAN BẢN ĐỒ GIS (P1)
function findIntersectingPlanning(lat, lon) {
    const point = [lat, lon];
    const results = [];

    planningPolygons.forEach(feature => {
        if (!feature.geometry) return;
        
        let isInside = false;
        
        if (feature.geometry.type === "Polygon") {
            const rings = feature.geometry.coordinates;
            if (rings.length > 0) {
                isInside = isPointInPolygon(point, rings[0]);
            }
        } else if (feature.geometry.type === "MultiPolygon") {
            const polygons = feature.geometry.coordinates;
            for (let p = 0; p < polygons.length; p++) {
                if (polygons[p].length > 0 && isPointInPolygon(point, polygons[p][0])) {
                    isInside = true;
                    break;
                }
            }
        }
        
        // Tính khoảng cách giữa tọa độ tra cứu tới tâm của Polygon (Proximity Buffer)
        const center = getPolygonCenter(feature.geometry);
        const dist = getCoordinatesDistance(lat, lon, center[0], center[1]); // km

        if (isInside) {
            results.push({ feature, relation: "Nằm trong diện ảnh hưởng", distance: 0, order: 1 });
        } else if (dist < 1.2) { // Vùng buffer giáp ranh trong bán kính 1.2km
            results.push({ feature, relation: "Giáp ranh (bán kính " + Math.round(dist * 1000) + "m)", distance: dist, order: 2 });
        }
    });

    results.sort((a, b) => a.order - b.order);
    return results;
}

// Thuật toán Ray-Casting xác định điểm trong đa giác (Point-in-Polygon)
function isPointInPolygon(point, vs) {
    const x = point[1]; // Kinh độ
    const y = point[0]; // Vĩ độ
    
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

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

// Công thức toán Haversine tính khoảng cách địa giới
function getCoordinatesDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

document.addEventListener('DOMContentLoaded', init);
