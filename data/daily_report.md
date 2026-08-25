# 🔴 Báo cáo Kiểm tra Nội dung Hàng ngày

**Thời gian:** `2026-08-25 08:30:48 GMT+7`  
**Trạng thái tổng thể:** `CRITICAL`

---

## 🟢 GIS Integrity
> 6/6 PASS

- ✅ **118 Phố Huế (PHẢI an toàn)** — An toan
- ✅ **Nút giao VĐ4 An Khánh (PHẢI trong quy hoạch)** — Khop vd4_sec1
- ✅ **Cầu Long Biên (PHẢI trong sông Hồng)** — Khop sh_r1
- ✅ **Trung tâm Đống Đa (PHẢI an toàn)** — An toan
- ✅ **Khu TĐC Mê Linh (PHẢI trong quy hoạch)** — Khop taidinhcu_ml
- ✅ **Khu TĐC Lĩnh Nam (PHẢI trong quy hoạch)** — Khop taidinhcu_ln

## 🟢 Data Freshness
| File | Tuổi (ngày) | Kích thước | Trạng thái |
|------|------------|------------|------------|
| `database.json` | 0.0 | 5.2 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `extra_data.json` | 0.0 | 12.9 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `map.geojson` | 0.0 | 15.5 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `official_documents.json` | 0.0 | 7.1 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `planning_updates.json` | 0.0 | 3.1 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `market_prices.json` | 0.0 | 3649.3 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `bang_gia_dat_2026.json` | 0.0 | 45.0 KB | 🟢 Moi cap nhat 0.0 ngay truoc |

## 🔴 Link Health
| Tên | URL | HTTP | Độ trễ | Trạng thái |
|-----|-----|------|--------|------------|
| Trang chu DuLieuQuyHoach | `https://dulieuquyhoach.com...` | `200` | 1ms | ✅ |
| Cong thong tin Ha Noi | `https://hanoi.gov.vn...` | `None` | Nonems | ❌ |
| Vien Quy hoach Ha Noi (VQH) | `https://vqh.hanoi.gov.vn...` | `200` | 2015ms | ✅ |
| UBND Ha Noi - Van ban phap luat | `https://vanban.hanoi.gov.vn...` | `None` | Nonems | ❌ |
| QD71/2024 Bang gia dat HN (PDF) | `https://storage-vnportal.vnpt.vn/gov-hni/6249/VanB...` | `200` | 1223ms | ✅ |

## 🟢 Data Quality
> 15 ban ghi, khong co loi nao

## 🟢 Market Prices
> 5200 listing, moi cap nhat 0.0 ngay truoc

## 🟡 Official Documents
> 13 van ban, 2 can ra soat (<=2022)

- ⚠️  **Quyết định 30/2019/QĐ-UBND Hà Nội (Hết hiệu lực)** (12/2019) — Van ban nam 2019 — can ra soat con hieu luc khong?
- ⚠️  **Quyết định 5162/QĐ-UBND huyện Gia Lâm** (12/2021) — Van ban nam 2021 — can ra soat con hieu luc khong?

## 🟢 Q&A Coverage
> 30 cau hoi, 30 co nguon trich dan, 0 chua co

## 🟢 Map Polygons
> 12 polygon, 0 thieu thong tin

| ID | Tên | Category | Đỉnh | Thiếu trường |
|----|-----|----------|------|--------------|
| `sh_r1` | Phân khu Quy hoạch Sông Hồng R1-R2 | songhong | 23 | ✅ — |
| `vd4_sec1` | Dự án Đường Vành đai 4 - Phân đoạn Hoài Đức - Đan Phượng | vandai4 | 11 | ✅ — |
| `taidinhcu_ml` | Khu tái định cư Mê Linh | taidinhcu | 5 | ✅ — |
| `taidinhcu_ln` | Khu tái định cư Lĩnh Nam (Hoàng Mai) | taidinhcu | 5 | ✅ — |
| `giapranh_vd4` | Khu vực giáp ranh ảnh hưởng - Hành lang an toàn Vành đai 4 | giapranh | 11 | ✅ — |
| `cau_tu_lien` | Cầu Tứ Liên & Đường dẫn 2 đầu cầu | giaothong | 10 | ✅ — |
| `metro_line2` | Tuyến Metro số 2 (Nam Thăng Long - Trần Hưng Đạo) | metro | 18 | ✅ — |
| `metro_line5` | Tuyến Metro số 5 (Văn Cao - Hòa Lạc) | metro | 22 | ✅ — |
| `kdt_linh_nam` | Khu đô thị mới phường Lĩnh Nam (Hoàng Mai) | khudothi | 6 | ✅ — |
| `dai_lo_song_hong` | Trục Đại lộ cảnh quan sông Hồng | canhquan | 15 | ✅ — |
| `vd4_cau_hong_ha` | Cầu Hồng Hà (Vành đai 4) | vandai4 | 7 | ✅ — |
| `vd4_cau_me_so` | Cầu Mễ Sở (Vành đai 4) | vandai4 | 7 | ✅ — |

## 🟡 Land Price 2026
> 17 khu vuc, 103 tuyen (53 chua phan loai) | Du lieu dang o trang thai "can doi chieu van ban chinh thuc"; 53 tuyen chua phan loai khu vuc (nhieu)

- ⚠️  **Du lieu dang o trang thai "can doi chieu van ban chinh thuc"** () — 
- ⚠️  **53 tuyen chua phan loai khu vuc (nhieu)** () — 

---
*Được tạo tự động bởi `tools/daily_checker.py` lúc 2026-08-25 08:30:48 GMT+7*