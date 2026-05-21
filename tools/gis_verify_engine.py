#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DULIEUQUYHOACH.COM - GIS Verify Engine
--------------------------------------
Engine kiểm chứng tọa độ tự động. Chạy đối soát tập hợp các điểm tọa độ chuẩn
bất biến với đa giác ranh giới trong map.geojson.

Quy tắc đối soát:
1. "SAFE" (An toàn): Điểm KHÔNG được nằm trong bất kỳ đa giác quy hoạch nào.
2. "INSIDE" (Nằm trong): Điểm BẮT BUỘC phải nằm trong đa giác được chỉ định (hoặc bất kỳ đa giác nào).

Trả về Exit Code:
- 0: Tất cả test cases đều PASS (Thành công 100%).
- 1: Ít nhất một test case bị FAIL (Thất bại).
"""

import os
import json
import sys

# Cấu hình UTF-8 cho stdout/stderr trên Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Đường dẫn mặc định
MAP_GEOJSON_PATH = os.path.join("data", "map.geojson")
TEST_CASES_PATH = os.path.join("data", "gis_test_cases.json")
REPORT_OUTPUT_PATH = os.path.join("data", "gis_verify_report.json")

# ==================== THUẬT TOÁN GIS ====================
def point_in_polygon(lng, lat, polygon):
    """
    Thuật toán Ray-Casting để kiểm tra xem một điểm (lng, lat) có nằm trong polygon hay không.
    polygon: danh sách các điểm [[lng, lat], [lng, lat], ...]
    """
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lng <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lng <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

# ==================== ENGINE CHẠY KIỂM THỬ ====================
def run_verify(map_path=MAP_GEOJSON_PATH, test_path=TEST_CASES_PATH):
    print("🛰️  BẮT ĐẦU CHẠY GIS VERIFY ENGINE...")
    print(f"📂 Bản đồ đối chiếu: {map_path}")
    print(f"📂 Bộ test cases: {test_path}")

    # 1. Tải bản đồ quy hoạch
    if not os.path.exists(map_path):
        print(f"❌ LỖI: Không tìm thấy file bản đồ tại {map_path}")
        return False, {"error": "Missing map.geojson"}

    try:
        with open(map_path, "r", encoding="utf-8") as f:
            geojson = json.load(f)
    except Exception as e:
        print(f"❌ LỖI: Không thể đọc file bản đồ. Chi tiết: {e}")
        return False, {"error": f"Invalid map.geojson: {e}"}

    features = geojson.get("features", [])
    polygons = {}
    for feature in features:
        geom = feature.get("geometry", {})
        props = feature.get("properties", {})
        poly_id = props.get("id")
        
        if geom.get("type") == "Polygon" and poly_id:
            # Lấy mảng tọa độ đầu tiên (outer ring)
            coords = geom.get("coordinates", [])[0]
            polygons[poly_id] = {
                "id": poly_id,
                "tenKhu": props.get("tenKhu"),
                "coords": coords
            }
    
    print(f"ℹ️  Đã nạp {len(polygons)} đa giác quy hoạch từ bản đồ.")

    # 2. Tải test cases
    if not os.path.exists(test_path):
        print(f"❌ LỖI: Không tìm thấy file test cases tại {test_path}")
        return False, {"error": "Missing test cases file"}

    try:
        with open(test_path, "r", encoding="utf-8") as f:
            test_data = json.load(f)
    except Exception as e:
        print(f"❌ LỖI: Không thể đọc file test cases. Chi tiết: {e}")
        return False, {"error": f"Invalid test cases JSON: {e}"}

    test_cases = test_data.get("test_cases", [])
    print(f"ℹ️  Đã nạp {len(test_cases)} test cases kiểm chứng.")
    print("-" * 70)

    # 3. Tiến hành đối soát từng điểm
    results = []
    total_passed = 0

    for i, tc in enumerate(test_cases):
        label = tc.get("label", f"Test Case #{i+1}")
        lat = tc.get("lat")
        lng = tc.get("lng")
        expected = tc.get("expected")
        target_poly_id = tc.get("polygon_id")

        # Tìm xem điểm này nằm trong những đa giác nào
        matched_polygons = []
        for pid, poly in polygons.items():
            if point_in_polygon(lng, lat, poly["coords"]):
                matched_polygons.append(pid)

        # Đánh giá kết quả
        status = "FAIL"
        details = ""

        if expected == "SAFE":
            if len(matched_polygons) == 0:
                status = "PASS"
                details = "Điểm an toàn hoàn toàn (Nằm ngoài tất cả quy hoạch)."
            else:
                status = "FAIL"
                details = f"LỖI: Điểm lẽ ra phải an toàn nhưng lại nằm trong các quy hoạch: {', '.join(matched_polygons)}."
        elif expected == "INSIDE":
            if target_poly_id:
                if target_poly_id in matched_polygons:
                    status = "PASS"
                    details = f"Khớp chính xác: Nằm trong quy hoạch {target_poly_id}."
                else:
                    status = "FAIL"
                    if len(matched_polygons) > 0:
                        details = f"LỖI: Nằm sai quy hoạch. Mong muốn: {target_poly_id}, Thực tế: {', '.join(matched_polygons)}."
                    else:
                        details = f"LỖI: Điểm nằm ngoài quy hoạch mong muốn ({target_poly_id})."
            else:
                if len(matched_polygons) > 0:
                    status = "PASS"
                    details = f"Nằm trong ít nhất một quy hoạch: {', '.join(matched_polygons)}."
                else:
                    status = "FAIL"
                    details = "LỖI: Điểm nằm ngoài toàn bộ khu vực quy hoạch."

        if status == "PASS":
            total_passed += 1
            icon = "✅"
        else:
            icon = "❌"

        print(f"{icon} {label}")
        print(f"   📍 Tọa độ: ({lat}, {lng}) | Mong muốn: {expected} | Kết quả: {status}")
        print(f"   📝 Chi tiết: {details}")
        print("-" * 70)

        results.append({
            "label": label,
            "lat": lat,
            "lng": lng,
            "expected": expected,
            "polygon_id": target_poly_id,
            "status": status,
            "matched_polygons": matched_polygons,
            "details": details
        })

    # 4. Tổng hợp báo cáo
    all_passed = (total_passed == len(test_cases))
    summary = {
        "timestamp": json.dumps(str(sys.argv)), # Sẽ thay thế bằng time thực tế
        "total_tests": len(test_cases),
        "passed": total_passed,
        "failed": len(test_cases) - total_passed,
        "success_rate_pct": round((total_passed / len(test_cases)) * 100, 2) if test_cases else 0,
        "status": "SUCCESS" if all_passed else "FAILED",
        "results": results
    }

    # Xuất file báo cáo JSON
    try:
        os.makedirs(os.path.dirname(REPORT_OUTPUT_PATH), exist_ok=True)
        with open(REPORT_OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print(f"💾 Báo cáo kiểm thử đã ghi vào: {REPORT_OUTPUT_PATH}")
    except Exception as e:
        print(f"⚠️ Không thể ghi file báo cáo: {e}")

    print("\n📊 TỔNG KẾT KIỂM THỬ:")
    print(f"   👉 Trạng thái chung: {'🟢 ĐẠT (PASS 100%)' if all_passed else '🔴 THẤT BẠI (FAILED)'}")
    print(f"   👉 Tỷ lệ thành công: {summary['success_rate_pct']}% ({total_passed}/{len(test_cases)})")
    
    return all_passed, summary

if __name__ == "__main__":
    passed, summary = run_verify()
    if passed:
        sys.exit(0)
    else:
        sys.exit(1)
