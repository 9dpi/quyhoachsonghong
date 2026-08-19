#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DULIEUQUYHOACH.COM — Land Price 2026 Extractor
==============================================
Trích xuất & chuẩn hóa Bảng giá đất Hà Nội 2026 theo
Nghị quyết 52/2025/NQ-HĐND (hiệu lực 01/01/2026) & Quyết định 19/2026/QĐ-UBND
(hệ số K, hiệu lực 02/02/2026).

Nguồn dữ liệu đầu vào (ưu tiên):
  1. data/phu_luc_5_1_p1..p5.json   — dữ liệu đã trích từ Phụ lục 5.1 (103 tuyến)
  2. data/bang_gia_dat.csv           — bảng giá CSV (dự phòng)
  3. PDF Nghị quyết 52/2025          — (cần pdfplumber, tự động bỏ qua nếu thiếu)

Đầu ra:
  data/bang_gia_dat_2026.json        — cấu trúc 17 khu vực, VT1-VT4, hệ số K

Cách chạy:
  python tools/land_price_2026_extractor.py
  python tools/land_price_2026_extractor.py --pdf path/to/NQ52-2025.pdf
"""

import os
import sys
import json
import glob
import csv
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
PHU_LUC_GLOB = os.path.join(DATA_DIR, 'phu_luc_5_1_p*.json')
CSV_FILE = os.path.join(DATA_DIR, 'bang_gia_dat.csv')
OUT_FILE = os.path.join(DATA_DIR, 'bang_gia_dat_2026.json')

# ─── Văn bản pháp lý (metadata) ──────────────────────────────────────────────
META = {
    "title": "Bảng giá đất Hà Nội 2026 (NQ 52/2025/NQ-HĐND)",
    "document": "Nghị quyết 52/2025/NQ-HĐND",
    "effective_from": "01/01/2026",
    "replaces": "Quyết định 71/2024/QĐ-UBND (hết hiệu lực 31/12/2025)",
    "k_document": "Quyết định 19/2026/QĐ-UBND",
    "k_effective_from": "02/02/2026",
    "structure": "Bảng giá chia theo 17 khu vực (KV1-KV17), mỗi khu vực có các tuyến đường/ngõ/hẻm; mỗi tuyến có 4 vị trí VT1-VT4.",
    "unit": "nghìn đồng/m² (giá trị trong JSON cần nhân 1000 để ra đồng/m²)",
    "note": ("Dữ liệu ban đầu được tổng hợp từ Phụ lục 5.1 (bảng giá cũ) để hệ thống tra cứu được ngay. "
             "TRƯỚC KHI CÔNG BỐ CHÍNH THỨC, cần đối chiếu từng tuyến đường với văn bản gốc NQ 52/2025 "
             "và cập nhật trường khuVuc + heSoK theo QĐ 19/2026.")
}

# ─── 17 khu vực (khung danh mục theo NQ 52/2025) ─────────────────────────────
# Ở đây chỉ khai báo danh mục. Việc gán tuyến đường → khu vực thực hiện trong
# map_street_to_khu_vuc() — cần nguồn dữ liệu chính thức để điền chính xác.
KHU_VUC_LIST = [
    {"maKhuVuc": "KV1",  "tenKhuVuc": "Khu vực 1 - Trung tâm quận nội thành cũ (Hoàn Kiếm & phụ cận)", "heSoK": 1.10},
    {"maKhuVuc": "KV2",  "tenKhuVuc": "Khu vực 2 - Các quận nội thành (Ba Đình, Hai Bà Trưng, Đống Đa)", "heSoK": 1.10},
    {"maKhuVuc": "KV3",  "tenKhuVuc": "Khu vực 3 - Quận Tây Hồ, Long Biên, Cầu Giấy, Thanh Xuân", "heSoK": 1.12},
    {"maKhuVuc": "KV4",  "tenKhuVuc": "Khu vực 4 - Quận Hoàng Mai, Hà Đông, Bắc/Nam Từ Liêm", "heSoK": 1.12},
    {"maKhuVuc": "KV5",  "tenKhuVuc": "Khu vực 5 - Thị xã Sơn Tây & vùng ven", "heSoK": 1.15},
    {"maKhuVuc": "KV6",  "tenKhuVuc": "Khu vực 6 - Huyện Gia Lâm, Đông Anh, Thanh Trì", "heSoK": 1.15},
    {"maKhuVuc": "KV7",  "tenKhuVuc": "Khu vực 7 - Huyện Mê Linh, Sóc Sơn", "heSoK": 1.18},
    {"maKhuVuc": "KV8",  "tenKhuVuc": "Khu vực 8 - Huyện Hoài Đức, Đan Phượng, Phúc Thọ", "heSoK": 1.18},
    {"maKhuVuc": "KV9",  "tenKhuVuc": "Khu vực 9 - Huyện Quốc Oai, Thạch Thất", "heSoK": 1.20},
    {"maKhuVuc": "KV10", "tenKhuVuc": "Khu vực 10 - Huyện Chương Mỹ, Thanh Oai", "heSoK": 1.20},
    {"maKhuVuc": "KV11", "tenKhuVuc": "Khu vực 11 - Huyện Thường Tín, Phú Xuyên, Ứng Hòa", "heSoK": 1.22},
    {"maKhuVuc": "KV12", "tenKhuVuc": "Khu vực 12 - Huyện Mỹ Đức, Ba Vì", "heSoK": 1.25},
    {"maKhuVuc": "KV13", "tenKhuVuc": "Khu vực 13 - Trục giao thông lớn liên khu vực (các tuyến quốc lộ, tỉnh lộ)", "heSoK": 1.15},
    {"maKhuVuc": "KV14", "tenKhuVuc": "Khu vực 14 - Hành lang sông Hồng & khu vực ven đê", "heSoK": 1.20},
    {"maKhuVuc": "KV15", "tenKhuVuc": "Khu vực 15 - Các khu đô thị mới, khu công nghiệp, cụm công nghiệp", "heSoK": 1.15},
    {"maKhuVuc": "KV16", "tenKhuVuc": "Khu vực 16 - Vùng nông thôn còn lại của các huyện", "heSoK": 1.25},
    {"maKhuVuc": "KV17", "tenKhuVuc": "Khu vực 17 - Các tuyến đường, ngõ, hẻm còn lại chưa phân loại", "heSoK": 1.20},
]

# ─── Nhận diện quận/huyện từ tên đường (dùng chung logic với Code.gs) ────────
DISTRICT_RULES = [
    (["hàng ", "bà triệu", "bảo khánh", "bát đàn", "bát sứ", "cửa đông", "cửa nam",
      "dã tượng", "mã mây", "ấu triệu", "trần hưng đạo", "ngô quyền", "lý thường kiệt"], "Hoàn Kiếm"),
    (["âu cơ", "an dương", "quảng an", "tô ngọc vân", "xuân diệu", "thụy khuê", "yên phụ"], "Tây Hồ"),
    (["ba đình", "bắc sơn", "chu văn an", "chùa một cột", "độc lập", "hoàng diệu",
      "ngọc hà", "ông ích khiêm", "phạm hồng thái", "phan đình phùng", "hoàng hoa thám"], "Ba Đình"),
    (["đống đa", "an trạch", "bích câu", "cát linh", "đại cồ việt", "đặng tiến đông",
      "đoàn thị điểm", "giảng võ", "kim mã", "nguyễn khuyến", "tôn đức thắng", "chùa bộc"], "Đống Đa"),
    (["hai bà trưng", "cảm hội", "cao đạt", "chùa vua", "đoàn trần nghiệp", "nguyễn du",
      "phố huế", "thái phiên", "bùi thị xuân"], "Hai Bà Trưng"),
    (["cầu giấy", "xuân thủy", "hoàng quốc việt", "trần duy hưng"], "Cầu Giấy"),
    (["lĩnh nam", "hoàng mai", "linh đàm", "đền lừ"], "Hoàng Mai"),
    (["long biên", "ngọc thụy", "cổ linh", "sài đồng", "thạch bàn"], "Long Biên"),
    (["hà đông", "vạn phúc", "yết kiêu"], "Hà Đông"),
]

# Gán khu vực sơ bộ theo quận/huyện (ƯỚC TÍNH — cần đối chiếu chính thức)
DISTRICT_TO_KV = {
    "Hoàn Kiếm": "KV1", "Ba Đình": "KV2", "Hai Bà Trưng": "KV2", "Đống Đa": "KV2",
    "Tây Hồ": "KV3", "Long Biên": "KV3", "Cầu Giấy": "KV3", "Thanh Xuân": "KV3",
    "Hoàng Mai": "KV4", "Hà Đông": "KV4", "Bắc Từ Liêm": "KV4", "Nam Từ Liêm": "KV4",
    "Gia Lâm": "KV6", "Đông Anh": "KV6", "Thanh Trì": "KV6",
    "Mê Linh": "KV7", "Sóc Sơn": "KV7",
    "Hoài Đức": "KV8", "Đan Phượng": "KV8", "Phúc Thọ": "KV8",
    "Quốc Oai": "KV9", "Thạch Thất": "KV9",
    "Chương Mỹ": "KV10", "Thanh Oai": "KV10",
    "Thường Tín": "KV11", "Phú Xuyên": "KV11", "Ứng Hòa": "KV11",
    "Mỹ Đức": "KV12", "Ba Vì": "KV12", "Sơn Tây": "KV5",
}


def detect_district(street_name):
    """Nhận diện quận/huyện từ tên đường (chuỗi không dấu, viết thường)."""
    s = street_name.lower()
    for keywords, district in DISTRICT_RULES:
        if any(k in s for k in keywords):
            return district
    return None


def map_street_to_khu_vuc(street_name):
    """
    Gán tuyến đường → khu vực (KV1..KV17).
    LƯU Ý: Đây là ánh xạ SƠ BỘ theo quận/huyện. Bảng giá chính thức NQ 52/2025
    phân chia theo 17 khu vực KHÔNG trùng ranh giới hành chính — cần nguồn dữ
    liệu chính thức để thay thế hàm này bằng bảng tra cứu thực tế.
    """
    district = detect_district(street_name)
    if not district:
        return None, district
    return DISTRICT_TO_KV.get(district), district


def load_phu_luc():
    """Nạp toàn bộ dữ liệu từ phu_luc_5_1_p*.json."""
    rows = []
    for path in sorted(glob.glob(PHU_LUC_GLOB)):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                rows.extend(json.load(f))
        except Exception as e:
            print(f"[WARN] Không đọc được {path}: {e}")
    return rows


def load_csv():
    """Dự phòng: nạp từ bang_gia_dat.csv nếu không có phu_luc."""
    rows = []
    if not os.path.exists(CSV_FILE):
        return rows
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                "ten_duong": r.get("tuyen_duong", "").strip(),
                "doan_tu": "Đầu đường",
                "doan_den": "Cuối đường",
                "gia_dat_o_vt1": int(float(r["vi_tri_1"] or 0)),
                "gia_dat_o_vt2": int(float(r["vi_tri_2"] or 0)),
                "gia_dat_o_vt3": int(float(r["vi_tri_3"] or 0)),
                "gia_dat_o_vt4": int(float(r["vi_tri_4"] or 0)),
            })
    return rows


def try_extract_pdf(pdf_path):
    """Trích xuất PDF NQ 52/2025 nếu có pdfplumber (tùy chọn)."""
    try:
        import pdfplumber
    except ImportError:
        print("[INFO] pdfplumber chưa cài — bỏ qua bước trích xuất PDF. Cài bằng: pip install pdfplumber")
        return []
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue
            for row in table[1:]:
                if len(row) < 5:
                    continue
                try:
                    rows.append({
                        "ten_duong": (row[0] or "").strip(),
                        "doan_tu": (row[1] or "").strip(),
                        "doan_den": (row[2] or "").strip(),
                        "gia_dat_o_vt1": int(float(str(row[3]).replace('.', '').replace(',', '.') or 0)),
                        "gia_dat_o_vt2": int(float(str(row[4]).replace('.', '').replace(',', '.') or 0)),
                        "gia_dat_o_vt3": int(float(str(row[5]).replace('.', '').replace(',', '.') or 0)) if len(row) > 5 else 0,
                        "gia_dat_o_vt4": int(float(str(row[6]).replace('.', '').replace(',', '.') or 0)) if len(row) > 6 else 0,
                    })
                except (ValueError, TypeError):
                    continue
    return rows


def build_output(rows):
    """Xây dựng cấu trúc bang_gia_dat_2026.json."""
    khu_vuc = []
    for kv in KHU_VUC_LIST:
        khu_vuc.append({
            **kv,
            "tuyenDuong": []
        })
    unclassified = []

    seen = set()
    for r in rows:
        ten = r.get("ten_duong", "").strip()
        if not ten:
            continue
        key = (ten, r.get("doan_tu", ""), r.get("doan_den", ""))
        if key in seen:
            continue
        seen.add(key)

        kv, district = map_street_to_khu_vuc(ten)
        entry = {
            "tenDuong": ten,
            "doanTu": r.get("doan_tu", ""),
            "doanDen": r.get("doan_den", ""),
            "loaiDat": "dat_o",
            "quanHuyen": district or "Chưa xác định",
            "vt1": r.get("gia_dat_o_vt1", 0),
            "vt2": r.get("gia_dat_o_vt2", 0),
            "vt3": r.get("gia_dat_o_vt3", 0),
            "vt4": r.get("gia_dat_o_vt4", 0),
            "khuVuc": kv,  # None nếu chưa phân loại
            "ghiChu": "Trích xuất từ Phụ lục 5.1 — cần đối chiếu NQ 52/2025"
        }
        if kv:
            for item in khu_vuc:
                if item["maKhuVuc"] == kv:
                    item["tuyenDuong"].append(entry)
                    break
        else:
            unclassified.append(entry)

    return {
        "meta": META,
        "heSoK": {
            "document": META["k_document"],
            "default": 1.20,
            "note": "Hệ số K mặc định dùng khi chưa có giá trị chính thức cho khu vực. "
                    "Giá đền bù ước tính = giá bảng (x1000) × hệ số K."
        },
        "khuVuc": khu_vuc,
        "tuyenDuongChuaPhanLoai": unclassified,
        "thongKe": {
            "tongTuyenDuong": len(seen),
            "daPhanLoaiKhuVuc": len(seen) - len(unclassified),
            "chuaPhanLoai": len(unclassified),
            "ngayTao": datetime.date.today().isoformat()
        }
    }


def main():
    pdf_path = None
    if '--pdf' in sys.argv:
        idx = sys.argv.index('--pdf')
        if idx + 1 < len(sys.argv):
            pdf_path = sys.argv[idx + 1]

    rows = load_phu_luc()
    if not rows:
        print("[INFO] Không có phu_luc_5_1, thử CSV...")
        rows = load_csv()
    if pdf_path and os.path.exists(pdf_path):
        pdf_rows = try_extract_pdf(pdf_path)
        print(f"[INFO] Trích xuất PDF: {len(pdf_rows)} dòng.")
        rows = rows + pdf_rows

    if not rows:
        print("[ERROR] Không có dữ liệu đầu vào nào.")
        sys.exit(1)

    out = build_output(rows)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    st = out["thongKe"]
    print(f"[OK] Đã tạo {OUT_FILE}")
    print(f"     Tổng tuyến đường: {st['tongTuyenDuong']}")
    print(f"     Đã phân loại khu vực: {st['daPhanLoaiKhuVuc']}")
    print(f"     Chưa phân loại: {st['chuaPhanLoai']}")
    print("     ⚠️ Nhắc nhở: dữ liệu cần đối chiếu văn bản chính thức NQ 52/2025 trước khi công bố.")


if __name__ == '__main__':
    main()
