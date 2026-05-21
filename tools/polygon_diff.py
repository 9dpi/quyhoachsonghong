#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DULIEUQUYHOACH.COM - Polygon Diff Engine
----------------------------------------
Module đo lường sự thay đổi của ranh giới polygon giữa 2 phiên bản bản đồ (Cũ vs. Mới).
Tính toán:
1. Diện tích đa giác (Hectares) sử dụng công thức Shoelace (có hiệu chỉnh vĩ độ).
2. Tỷ lệ tương đồng Jaccard Index (IoU - Intersection over Union) bằng phương pháp Grid-sampling 100x100.
3. Khoảng cách dịch chuyển biên lớn nhất (Max Boundary Shift) bằng mét (Hausdorff Distance approximation).
"""

import os
import json
import sys
import math

# Cấu hình UTF-8 cho Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Hệ số chuyển đổi địa lý tại Hà Nội (Vĩ độ ~ 21 độ Bắc)
LAT_TO_M = 111132.954  # 1 độ vĩ độ = ~111.13km
LNG_TO_M = 103767.143  # 1 độ kinh độ = ~103.77km (111.32 * cos(21 độ))

def point_in_polygon(lng, lat, polygon):
    """Ray-casting algorithm để kiểm tra điểm nằm trong đa giác."""
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

def calculate_shoelace_area_ha(coords):
    """
    Tính diện tích đa giác (Hectare - ha) bằng công thức Shoelace.
    Đã chuyển đổi tọa độ địa lý sang hệ mét phẳng tại Hà Nội.
    """
    n = len(coords)
    if n < 3:
        return 0.0
    
    # Chuyển đổi sang mét cục bộ so với điểm gốc (coords[0]) để tránh mất độ chính xác dấu phẩy động
    origin_lng, origin_lat = coords[0]
    x = []
    y = []
    for lng, lat in coords:
        x.append((lng - origin_lng) * LNG_TO_M)
        y.append((lat - origin_lat) * LAT_TO_M)
        
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += x[i] * y[j] - x[j] * y[i]
        
    area = abs(area) / 2.0
    return area / 10000.0  # 1 Hectare = 10,000 m2

def calculate_jaccard_similarity(poly_old, poly_new):
    """
    Tính chỉ số Jaccard Similarity (IoU) giữa đa giác cũ và mới bằng Grid Sampling (100x100).
    Phương pháp này cực kỳ bền bỉ và không phụ thuộc vào thư viện bên ngoài.
    """
    # 1. Tìm bounding box bao trùm cả 2 đa giác
    all_lngs = [p[0] for p in poly_old] + [p[0] for p in poly_new]
    all_lats = [p[1] for p in poly_old] + [p[1] for p in poly_new]
    
    min_lng, max_lng = min(all_lngs), max(all_lngs)
    min_lat, max_lat = min(all_lats), max(all_lats)
    
    # 2. Sinh lưới điểm 100x100
    steps = 100
    lng_step = (max_lng - min_lng) / steps
    lat_step = (max_lat - min_lat) / steps
    
    intersection_count = 0
    union_count = 0
    
    for i in range(steps):
        lng = min_lng + (i + 0.5) * lng_step
        for j in range(steps):
            lat = min_lat + (j + 0.5) * lat_step
            
            in_old = point_in_polygon(lng, lat, poly_old)
            in_new = point_in_polygon(lng, lat, poly_new)
            
            if in_old and in_new:
                intersection_count += 1
                union_count += 1
            elif in_old or in_new:
                union_count += 1
                
    if union_count == 0:
        return 1.0
    return intersection_count / union_count

def calculate_distance_m(lng1, lat1, lng2, lat2):
    """Tính khoảng cách mét giữa 2 điểm (xấp xỉ phẳng tại Hà Nội)."""
    dx = (lng1 - lng2) * LNG_TO_M
    dy = (lat1 - lat2) * LAT_TO_M
    return math.sqrt(dx*dx + dy*dy)

def calculate_max_boundary_shift_m(poly_old, poly_new):
    """
    Tính khoảng cách dịch biên lớn nhất (Hausdorff Distance xấp xỉ).
    Đối với mỗi điểm của poly_new, tìm khoảng cách ngắn nhất đến biên của poly_old.
    Sau đó lấy giá trị lớn nhất trong số các khoảng cách ngắn nhất đó.
    """
    max_dist = 0.0
    
    # 1. Từ Mới -> Cũ
    for lng_new, lat_new in poly_new:
        min_dist_to_old = float('inf')
        for lng_old, lat_old in poly_old:
            d = calculate_distance_m(lng_new, lat_new, lng_old, lat_old)
            if d < min_dist_to_old:
                min_dist_to_old = d
        if min_dist_to_old > max_dist:
            max_dist = min_dist_to_old
            
    # 2. Từ Cũ -> Mới
    for lng_old, lat_old in poly_old:
        min_dist_to_new = float('inf')
        for lng_new, lat_new in poly_new:
            d = calculate_distance_m(lng_old, lat_old, lng_new, lat_new)
            if d < min_dist_to_new:
                min_dist_to_new = d
        if min_dist_to_new > max_dist:
            max_dist = min_dist_to_new
            
    return max_dist

def run_diff(file_old, file_new, output_report_path="data/diff_report.json"):
    print("🔄 BẮT ĐẦU SO SÁNH RANH GIỚI POLYGON...")
    print(f"   📂 File cũ (Gốc): {file_old}")
    print(f"   📂 File mới (Đề xuất): {file_new}")
    
    if not os.path.exists(file_old):
        print(f"❌ LỖI: Không tìm thấy file gốc tại {file_old}")
        return None
    if not os.path.exists(file_new):
        print(f"❌ LỖI: Không tìm thấy file mới tại {file_new}")
        return None
        
    with open(file_old, "r", encoding="utf-8") as f:
        geo_old = json.load(f)
    with open(file_new, "r", encoding="utf-8") as f:
        geo_new = json.load(f)
        
    features_old = {feat["properties"]["id"]: feat for feat in geo_old.get("features", []) if "id" in feat.get("properties", {})}
    features_new = {feat["properties"]["id"]: feat for feat in geo_new.get("features", []) if "id" in feat.get("properties", {})}
    
    diff_results = {}
    
    for pid in set(list(features_old.keys()) + list(features_new.keys())):
        if pid not in features_old:
            # Polygon mới tinh
            feat = features_new[pid]
            coords = feat["geometry"]["coordinates"][0]
            area = calculate_shoelace_area_ha(coords)
            diff_results[pid] = {
                "id": pid,
                "status": "ADDED",
                "tenKhu": feat["properties"].get("tenKhu", pid),
                "area_old_ha": 0.0,
                "area_new_ha": round(area, 2),
                "area_change_pct": 100.0,
                "similarity_pct": 0.0,
                "max_boundary_shift_m": 0.0,
                "level": "CRITICAL"
            }
        elif pid not in features_new:
            # Polygon bị xóa
            feat = features_old[pid]
            coords = feat["geometry"]["coordinates"][0]
            area = calculate_shoelace_area_ha(coords)
            diff_results[pid] = {
                "id": pid,
                "status": "DELETED",
                "tenKhu": feat["properties"].get("tenKhu", pid),
                "area_old_ha": round(area, 2),
                "area_new_ha": 0.0,
                "area_change_pct": -100.0,
                "similarity_pct": 0.0,
                "max_boundary_shift_m": 0.0,
                "level": "CRITICAL"
            }
        else:
            # Polygon có ở cả hai bản
            feat_old = features_old[pid]
            feat_new = features_new[pid]
            
            coords_old = feat_old["geometry"]["coordinates"][0]
            coords_new = feat_new["geometry"]["coordinates"][0]
            
            area_old = calculate_shoelace_area_ha(coords_old)
            area_new = calculate_shoelace_area_ha(coords_new)
            
            similarity = calculate_jaccard_similarity(coords_old, coords_new)
            shift = calculate_max_boundary_shift_m(coords_old, coords_new)
            
            area_change_pct = ((area_new - area_old) / area_old) * 100.0 if area_old > 0 else 0.0
            
            # Đánh giá mức độ thay đổi
            similarity_pct = similarity * 100.0
            if similarity_pct < 85.0:
                level = "CRITICAL"  # Thay đổi cực lớn
            elif similarity_pct < 95.0:
                level = "WARNING"   # Thay đổi trung bình
            else:
                level = "INFO"      # Thay đổi nhỏ
                
            diff_results[pid] = {
                "id": pid,
                "status": "MODIFIED" if similarity_pct < 100.0 else "UNCHANGED",
                "tenKhu": feat_new["properties"].get("tenKhu", pid),
                "area_old_ha": round(area_old, 2),
                "area_new_ha": round(area_new, 2),
                "area_change_pct": round(area_change_pct, 2),
                "similarity_pct": round(similarity_pct, 2),
                "max_boundary_shift_m": round(shift, 2),
                "level": level
            }
            
    # In ra báo cáo tóm tắt
    print("\n📊 BÁO CÁO KẾT QUẢ SO SÁNH RANH GIỚI:")
    print("-" * 75)
    for pid, res in diff_results.items():
        status_color = res["status"]
        if status_color == "MODIFIED":
            status_emoji = "🔀"
        elif status_color == "ADDED":
            status_emoji = "➕"
        elif status_color == "DELETED":
            status_emoji = "➖"
        else:
            status_emoji = "✅"
            
        print(f"{status_emoji} ID: {pid} ({res['tenKhu']})")
        print(f"   👉 Trạng thái: {res['status']} | Mức độ: {res.get('level', 'INFO')}")
        print(f"   👉 Diện tích: {res['area_old_ha']} ha -> {res['area_new_ha']} ha (Lệch {res['area_change_pct']}%)")
        print(f"   👉 Độ tương đồng: {res['similarity_pct']}% | Dịch ranh giới tối đa: {res['max_boundary_shift_m']} mét")
        print("-" * 75)
        
    # Ghi báo cáo JSON
    os.makedirs(os.path.dirname(output_report_path), exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(diff_results, f, ensure_ascii=False, indent=2)
    print(f"💾 Báo cáo so sánh đã lưu tại: {output_report_path}")
    
    return diff_results

if __name__ == "__main__":
    # Test nhanh bằng cách so sánh map.geojson với chính nó
    run_diff("data/map.geojson", "data/map.geojson")
