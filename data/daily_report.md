# 🟡 Báo cáo Kiểm tra Nội dung Hàng ngày

**Thời gian:** `2026-05-31 11:17:54 GMT+7`  
**Trạng thái tổng thể:** `WARNING`

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
| `database.json` | 0.0 | 3.0 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `extra_data.json` | 0.0 | 9.5 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `map.geojson` | 0.0 | 6.0 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `official_documents.json` | 0.0 | 3.5 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `planning_updates.json` | 0.0 | 3.1 KB | 🟢 Moi cap nhat 0.0 ngay truoc |
| `market_prices.json` | 0.0 | 3621.4 KB | 🟢 Moi cap nhat 0.0 ngay truoc |

## 🟢 Link Health
| Tên | URL | HTTP | Độ trễ | Trạng thái |
|-----|-----|------|--------|------------|
| Trang chu DuLieuQuyHoach | `https://dulieuquyhoach.com...` | `200` | 1ms | ✅ |
| Cong thong tin Ha Noi | `https://hanoi.gov.vn...` | `200` | 1582ms | ✅ |
| Vien Quy hoach Ha Noi (VQH) | `https://vqh.hanoi.gov.vn...` | `200` | 2196ms | ✅ |
| UBND Ha Noi - Van ban phap luat | `https://vanban.hanoi.gov.vn...` | `200` | 1578ms | ✅ |
| QD71/2024 Bang gia dat HN (PDF) | `https://storage-vnportal.vnpt.vn/gov-hni/6249/VanB...` | `200` | 1048ms | ✅ |

## 🟢 Data Quality
> 10 ban ghi, khong co loi nao

## 🟢 Market Prices
> 5200 listing, moi cap nhat 0.0 ngay truoc

## 🟡 Official Documents
> 7 van ban, 2 can ra soat (<=2022)

- ⚠️  **Quyết định 30/2019/QĐ-UBND Hà Nội** (12/2019) — Van ban nam 2019 — can ra soat con hieu luc khong?
- ⚠️  **Quyết định 5162/QĐ-UBND huyện Gia Lâm** (12/2021) — Van ban nam 2021 — can ra soat con hieu luc khong?

## 🟢 Q&A Coverage
> 0 cau hoi, 0 co nguon trich dan, 0 chua co

## 🟢 Map Polygons
> 5 polygon, 0 thieu thong tin

| ID | Tên | Category | Đỉnh | Thiếu trường |
|----|-----|----------|------|--------------|
| `sh_r1` | Phân khu Quy hoạch Sông Hồng R1-R2 | songhong | 23 | ✅ — |
| `vd4_sec1` | Dự án Đường Vành đai 4 - Phân đoạn Hoài Đức - Đan Phượng | vandai4 | 11 | ✅ — |
| `taidinhcu_ml` | Khu tái định cư Mê Linh | taidinhcu | 5 | ✅ — |
| `taidinhcu_ln` | Khu tái định cư Lĩnh Nam (Hoàng Mai) | taidinhcu | 5 | ✅ — |
| `giapranh_vd4` | Khu vực giáp ranh ảnh hưởng - Hành lang an toàn Vành đai 4 | giapranh | 11 | ✅ — |

---
*Được tạo tự động bởi `tools/daily_checker.py` lúc 2026-05-31 11:17:54 GMT+7*