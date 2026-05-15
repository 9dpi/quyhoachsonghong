/**
 * DULIEUQUYHOACH.COM - Core Logic v3.9
 */

const BASE_URL = './data/';
const NEWS_URL = BASE_URL + 'database.json'; 
const EXTRA_URL = BASE_URL + 'extra_data.json'; 

// Dán URL Web App sau khi Deploy Code.gs vào đây
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxx6eSTIaCJwrtwQYh7rBruih2QWUiA34LDsi1hfjqeIVvIcPRFl-dtHMdAwwwwrCLe9A/exec"; 

let allNews = [];
let homeMarker = null;

const map = L.map('map', { zoomControl: false }).setView([21.05, 105.85], 11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

async function init() {
    try {
        let newsData = [];
        let progressData = [];
        let faqData = [];

        // Ưu tiên lấy từ Google Sheets (GAS API) nếu có URL
        if (GAS_API_URL && !GAS_API_URL.includes("YOUR_GAS")) {
            const gasRes = await fetch(GAS_API_URL);
            const fullData = await gasRes.json();
            newsData = fullData.news || [];
            progressData = fullData.progress || [];
            faqData = fullData.faq || [];
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
        
        allNews = newsData;
        renderNews(allNews);
        renderProgress(progressData);
        renderFAQ(faqData);
    } catch (e) {
        console.error("Data Load Error:", e);
    }
}

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['projectList', 'progressList', 'faqList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    const target = document.getElementById(tab + 'List');
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
    }
}

async function checkMyHome() {
    const addr = document.getElementById('addrInput').value;
    if(!addr) return;
    
    showModal("Đang phân tích", "Đang định vị địa chỉ: <b>" + addr + "</b>", "fa-satellite-dish");
    
    try {
        if (homeMarker) map.removeLayer(homeMarker);

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr + ", Hanoi")}`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 17);
            
            homeMarker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'home-icon',
                    html: '<i class="fa-solid fa-house-circle-check" style="color:#ef4444; font-size:2.5rem; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.3))"></i>',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                })
            }).addTo(map);

            const popupHTML = `
                <div style="text-align:center; padding:5px; font-family:'Inter'">
                    <h4 style="color:#ef4444; margin-bottom:8px;">VỊ TRÍ CỦA BẠN</h4>
                    <p style="font-size:0.75rem; margin-bottom:10px;">${addr}</p>
                    <button onclick="window.openHomeAnalysis('${addr.replace(/'/g, "\\'")}')" class="analysis-btn">XEM PHÂN TÍCH QUY HOẠCH</button>
                </div>
            `;
            homeMarker.bindPopup(popupHTML).openPopup();
            showModal("Thành công", "Đã định vị thành công nhà bạn.", "fa-circle-check");
        } else {
            showModal("Không thấy", "Vui lòng nhập địa chỉ chi tiết hơn.", "fa-circle-exclamation");
        }
    } catch (e) { showModal("Lỗi", "Vui lòng thử lại sau.", "fa-triangle-exclamation"); }
}

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

window.runGlobalCalc = () => {
    // Chức năng đã bị loại bỏ theo yêu cầu
};

function renderNews(data) {
    const list = document.getElementById('projectList');
    list.innerHTML = '';
    data.forEach((item, index) => {
        const marker = L.marker([item.viDo, item.kinhDo]).addTo(map);
        marker.bindPopup(`<h4>${item.tenKhu}</h4><a href="javascript:void(0)" onclick="openNewsDetail(${index})">Xem chi tiết</a>`);
        const div = document.createElement('div');
        div.className = 'project-item';
        const tagClass = item.loai === "Tái định cư" ? "tag-tdc" : "tag-qh";
        div.innerHTML = `<span class="tag ${tagClass}">${item.loai}</span><h4 style="font-family:'Inter'">${item.tenKhu}</h4><p style="font-size:0.75rem; color:#64748b; line-height:1.5; font-family:'Inter'">${item.moTa.substring(0, 50)}...</p>`;
        div.onclick = () => { map.flyTo([item.viDo, item.kinhDo], 15); marker.openPopup(); };
        list.appendChild(div);
    });
}

function renderProgress(data) {
    const list = document.getElementById('progressList');
    if (!data) return;
    list.innerHTML = data.map(i => `
        <div class="progress-item">
            <div class="progress-header" style="font-family:'Inter'">${i.date} - ${i.region}</div>
            <div class="progress-card"><p style="font-size:0.75rem; line-height:1.6; font-family:'Inter'">${i.content}</p></div>
        </div>
    `).join('');
}

function renderFAQ(data) {
    const list = document.getElementById('faqList');
    if (!data) return;
    list.innerHTML = data.map(f => `
        <div class="faq-item" onclick="this.classList.toggle('open')">
            <div class="faq-q" style="font-family:'Inter'">${f.q}</div>
            <div class="faq-a" style="font-size:0.75rem; line-height:1.6; font-family:'Inter'">${f.a}</div>
        </div>
    `).join('');
}

window.openNewsDetail = (idx) => {
    const item = allNews[idx];
    document.getElementById('detail-title').innerText = item.tenKhu;
    document.getElementById('detail-body').innerHTML = `<div style="white-space: pre-wrap; line-height:1.8; font-family:'Inter'">${item.moTa}</div><br><small>Nguồn: <a href="${item.nguonTin}" target="_blank">${item.nguonTin}</a></small>`;
    document.getElementById('detail-panel').style.display = 'flex';
    setTimeout(() => document.getElementById('detail-panel').classList.add('open'), 10);
};

function showModal(title, text, icon) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalText').innerHTML = text;
    document.getElementById('modalIcon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    document.getElementById('custom-modal').classList.add('active');
}

function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }
function closeDetail() { document.getElementById('detail-panel').classList.remove('open'); setTimeout(() => document.getElementById('detail-panel').style.display = 'none', 400); }

document.addEventListener('DOMContentLoaded', init);
