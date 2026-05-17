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

        // 2. FETCH DỮ LIỆU MỚI TỪ MẠNG TRONG NỀN
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
                    const gasRes = await fetch(GAS_API_URL);
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

        // Tạo marker và gán tooltip (direction: top để không đè lên icon)
        homeMarker = L.marker(coords, { icon: houseIcon }).addTo(map);
        homeMarker.bindTooltip(rawAddr, { permanent: true, direction: 'top', className: 'house-tooltip' }).openTooltip();

        // Bấm vào marker thì mới ra bảng tra cứu
        homeMarker.on('click', () => {
            if (match) {
                renderPlanningResult(match, rawAddr, coords);
            } else {
                const warningAreas = ["mê linh", "lĩnh nam", "hồng hà", "phú thượng", "bát tràng", "bồ đề", "ngọc thụy", "phố huế"];
                const isWarning = warningAreas.some(area => normAddr.includes(area));
                if (isWarning) {
                    renderPlanningWarning(rawAddr, coords);
                } else {
                    const formHtml = `
                        <p style="margin-bottom: 15px; font-size: 0.85rem; color: #64748b;">Hiện chưa có dữ liệu quy hoạch cụ thể cho địa chỉ này. Bạn có thể gửi yêu cầu tra cứu, chúng tôi sẽ cập nhật sớm!</p>
                        <div style="text-align: left;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: #1e293b;">Địa chỉ:</label>
                            <input type="text" id="ask_address" value="${rawAddr}" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px; margin-bottom: 10px; background: #f8fafc;" readonly>
                            
                            <label style="font-size: 0.75rem; font-weight: 700; color: #1e293b;">Câu hỏi / Ghi chú:</label>
                            <textarea id="ask_question" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px; margin-bottom: 10px; font-family: inherit;" rows="3" placeholder="Ví dụ: Đất nhà tôi có nằm trong ranh giới dự án X không?"></textarea>
                            
                            <label style="font-size: 0.75rem; font-weight: 700; color: #1e293b;">Email hoặc SĐT để nhận phản hồi:</label>
                            <input type="text" id="ask_contact" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px; margin-bottom: 15px;" placeholder="Ví dụ: 0912345678">
                            
                            <button onclick="submitQuestion()" style="width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer;">GỬI YÊU CẦU</button>
                            <a href="tai-ban-do-quy-hoach.html" style="display: block; text-align: center; width: 100%; background: #10b981; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 10px;"><i class="fa-solid fa-file-invoice-dollar"></i> TRA CỨU BẢNG GIÁ ĐẤT</a>
                        </div>
                    `;
                    showModal("Gửi yêu cầu tra cứu", formHtml, "fa-file-signature");
                }
            }
        });

        // Bay tới khu vực đó
        map.flyTo(coords, 17);
        closeModal(); // Đóng modal "Đang phân tích"
    } catch (e) { console.error(e); }
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

function renderPlanningResult(match, addr, coords) {
    const project = projectsData.find(p => p.projectName === match.project) || {};
    const timeline = progressData.filter(p => p.project === match.project).slice(0, 2);
    const k = match.kFactor || 1.0;
    
    // Lấy giá cho 4 vị trí (nếu có, nếu không tự tính theo tỷ lệ)
    const priceVt1 = match.gia_dat_o_vt1 || match.landPrice || 0;
    const priceVt2 = match.gia_dat_o_vt2 || Math.round(priceVt1 * 0.8);
    const priceVt3 = match.gia_dat_o_vt3 || Math.round(priceVt1 * 0.6);
    const priceVt4 = match.gia_dat_o_vt4 || Math.round(priceVt1 * 0.4);

    document.getElementById('detail-title').innerText = "KẾT QUẢ TRA CỨU";
    document.getElementById('detail-body').innerHTML = `
        <div style="background:#fff1f2; border:1px solid #fecaca; padding:15px; border-radius:12px; margin-bottom:15px;">
            <p style="font-size:0.7rem; color:#be123c; font-weight:800; text-transform:uppercase; margin-bottom:5px;">📍 Địa chỉ tra cứu</p>
            <p style="font-size:0.85rem; font-weight:700;">${addr}</p>
            <div style="margin-top:10px; display:inline-block; padding:4px 10px; background:#be123c; color:white; border-radius:4px; font-size:0.65rem; font-weight:800;">⚠️ NẰM TRONG DIỆN GIẢI TỎA</div>
        </div>

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

        <p style="font-size:0.6rem; color:#94a3b8; margin-top:15px; text-align:center;">* Thông tin mang tính chất tham khảo dựa trên QĐ 30/2024/QĐ-UBND</p>
    `;
    
    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');
    map.flyTo(coords, 17);
    closeModal();
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
    // URL dẫn tới file GeoJSON chứa ranh giới các dự án (Vành đai 4, cầu Tứ Liên...)
    const GIS_URL = "data/map.geojson"; 
    
    fetch(GIS_URL)
        .then(res => res.json())
        .then(geojsonData => {
            L.geoJSON(geojsonData, {
                style: function(feature) {
                    return {
                        color: "#ef4444",
                        weight: 2,
                        fillColor: "#ef4444",
                        fillOpacity: 0.1
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(`<b>VÙNG QUY HOẠCH:</b><br>${feature.properties.name}`);
                    }
                }
            }).addTo(map);
            console.log("Đã tải ranh giới GIS quy hoạch.");
        })
        .catch(err => console.log("Chưa có file map.geojson để hiển thị ranh giới."));
}

document.addEventListener('DOMContentLoaded', init);
