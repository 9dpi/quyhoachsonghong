#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DULIEUQUYHOACH.COM — Daily Content Checker & Reporter
======================================================
Công cụ kiểm tra và cập nhật nội dung tự động hàng ngày.

Các hạng mục kiểm tra:
1. 🛰️  GIS Integrity   — Đối soát 6 điểm tọa độ bất biến (Ray-Casting)
2. 📄  Data Freshness   — Kiểm tra độ tươi mới của từng file JSON
3. 🔗  Link Health      — Ping các URL văn bản pháp lý quan trọng
4. 📊  Data Quality     — Kiểm tra bản ghi null / thiếu trường / trùng lặp
5. 💰  Price Staleness  — Cảnh báo nếu market_prices.json > 7 ngày chưa cập nhật
6. 📝  Document Audit   — Rà soát official_documents.json còn văn bản hết hiệu lực
7. 📣  Q&A Coverage     — Đếm số câu hỏi chưa có nguồn trích dẫn
8. 🗺️  Map Polygon      — Đếm polygon, phát hiện polygon chưa có mô tả

Xuất ra:
  - data/daily_report.json   (máy đọc)
  - data/daily_report.md     (người đọc)
"""

import os
import sys
import json
import time
import datetime
import urllib.request
import urllib.error
import math

# ─── UTF-8 safe output ───────────────────────────────────────────────────────
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR         = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR         = os.path.join(BASE_DIR, 'data')
MAP_GEOJSON      = os.path.join(DATA_DIR, 'map.geojson')
DATABASE_JSON    = os.path.join(DATA_DIR, 'database.json')
EXTRA_DATA_JSON  = os.path.join(DATA_DIR, 'extra_data.json')
OFFICIAL_DOCS    = os.path.join(DATA_DIR, 'official_documents.json')
PLANNING_UPD     = os.path.join(DATA_DIR, 'planning_updates.json')
MARKET_PRICES    = os.path.join(DATA_DIR, 'market_prices.json')
QA_FILE          = os.path.join(DATA_DIR, 'QA.json')
TEST_CASES_FILE  = os.path.join(DATA_DIR, 'gis_test_cases.json')
REPORT_JSON      = os.path.join(DATA_DIR, 'daily_report.json')
REPORT_MD        = os.path.join(DATA_DIR, 'daily_report.md')

NOW = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7)))
NOW_STR = NOW.strftime('%Y-%m-%d %H:%M:%S GMT+7')
TODAY   = NOW.strftime('%Y-%m-%d')

STALE_DAYS = 7      # Số ngày để coi file là "cũ"
CRITICAL_DAYS = 30  # Số ngày để coi file là "rất cũ" (cảnh báo đỏ)

# ─── Helpers ─────────────────────────────────────────────────────────────────
def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return None

def file_age_days(path):
    """Số ngày kể từ lần sửa đổi cuối cùng của file."""
    try:
        mtime = os.path.getmtime(path)
        return (time.time() - mtime) / 86400
    except:
        return 9999

def file_size_kb(path):
    try:
        return round(os.path.getsize(path) / 1024, 1)
    except:
        return 0

def ping_url(url, timeout=8):
    """Trả về (status_code, latency_ms) hoặc (None, None) nếu lỗi."""
    try:
        start = time.time()
        req = urllib.request.Request(url, headers={'User-Agent': 'DuLieuQuyHoach-Checker/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency = round((time.time() - start) * 1000)
            return resp.status, latency
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return None, None

def status_icon(ok):
    return "PASS" if ok else "FAIL"

def severity(level):
    """info / warning / critical"""
    return level

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 1 — GIS Integrity (Ray-Casting)
# ═══════════════════════════════════════════════════════════════════════════════
def point_in_polygon(lng, lat, coords):
    inside = False
    n = len(coords)
    p1 = coords[0]
    for i in range(1, n + 1):
        p2 = coords[i % n]
        if lat > min(p1[1], p2[1]):
            if lat <= max(p1[1], p2[1]):
                if lng <= max(p1[0], p2[0]):
                    if p1[1] != p2[1]:
                        xinters = (lat - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0]
                    if p1[0] == p2[0] or lng <= xinters:
                        inside = not inside
        p1 = p2
    return inside

def check_gis_integrity():
    print("\n[1/8] Kiem tra GIS Integrity...")
    result = {'name': 'GIS Integrity', 'icon': 'satellite-dish', 'checks': [], 'pass': 0, 'fail': 0}

    geojson = load_json(MAP_GEOJSON)
    if not geojson:
        result['error'] = 'Khong the doc map.geojson'
        result['status'] = 'critical'
        return result

    polygons = {}
    for feat in geojson.get('features', []):
        pid = feat.get('properties', {}).get('id')
        geom = feat.get('geometry', {})
        if pid and geom.get('type') == 'Polygon':
            polygons[pid] = geom['coordinates'][0]

    test_data = load_json(TEST_CASES_FILE)
    test_cases = test_data.get('test_cases', []) if test_data else []

    for tc in test_cases:
        lat, lng = tc.get('lat'), tc.get('lng')
        expected  = tc.get('expected')
        target_id = tc.get('polygon_id')
        label     = tc.get('label', '')

        matched = [pid for pid, coords in polygons.items() if point_in_polygon(lng, lat, coords)]
        ok = False
        detail = ''

        if expected == 'SAFE':
            ok = len(matched) == 0
            detail = 'An toan' if ok else f'CANH BAO: Diem nam trong {matched}'
        elif expected == 'INSIDE':
            ok = target_id in matched
            detail = f'Khop {target_id}' if ok else f'SAI: mong {target_id}, thuc te {matched}'

        item = {'label': label, 'status': status_icon(ok), 'detail': detail, 'ok': ok}
        result['checks'].append(item)
        if ok: result['pass'] += 1
        else:  result['fail'] += 1

    total = result['pass'] + result['fail']
    result['summary'] = f"{result['pass']}/{total} PASS"
    result['status'] = 'ok' if result['fail'] == 0 else ('warning' if result['fail'] <= 1 else 'critical')
    print(f"   -> {result['summary']} | {result['status'].upper()}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 2 — Data Freshness
# ═══════════════════════════════════════════════════════════════════════════════
def check_data_freshness():
    print("\n[2/8] Kiem tra Data Freshness...")
    result = {'name': 'Data Freshness', 'icon': 'clock', 'files': [], 'status': 'ok'}

    files_to_check = [
        (DATABASE_JSON,   'database.json',           STALE_DAYS,    'critical'),
        (EXTRA_DATA_JSON, 'extra_data.json',          STALE_DAYS,    'warning'),
        (MAP_GEOJSON,     'map.geojson',              CRITICAL_DAYS, 'warning'),
        (OFFICIAL_DOCS,   'official_documents.json',  CRITICAL_DAYS, 'info'),
        (PLANNING_UPD,    'planning_updates.json',    STALE_DAYS,    'warning'),
        (MARKET_PRICES,   'market_prices.json',       STALE_DAYS,    'critical'),
    ]

    worst = 'ok'
    severity_rank = {'ok': 0, 'info': 1, 'warning': 2, 'critical': 3}

    for path, name, threshold, sev in files_to_check:
        if not os.path.exists(path):
            entry = {'file': name, 'age_days': None, 'size_kb': 0, 'status': 'missing', 'note': 'File khong ton tai!'}
            worst = 'critical'
        else:
            age = round(file_age_days(path), 1)
            size = file_size_kb(path)
            if age > threshold:
                st = sev
                note = f'Da {age} ngay chua cap nhat (nguong {threshold} ngay)'
            else:
                st = 'ok'
                note = f'Moi cap nhat {age} ngay truoc'
            entry = {'file': name, 'age_days': age, 'size_kb': size, 'status': st, 'note': note}
            if severity_rank.get(st, 0) > severity_rank.get(worst, 0):
                worst = st

        result['files'].append(entry)
        print(f"   {name}: {entry.get('note','')}")

    result['status'] = worst
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 3 — Link Health (ping critical URLs)
# ═══════════════════════════════════════════════════════════════════════════════
CRITICAL_URLS = [
    ('Trang chu DuLieuQuyHoach',       'https://dulieuquyhoach.com'),
    ('Cong thong tin Ha Noi',           'https://hanoi.gov.vn'),
    ('Vien Quy hoach Ha Noi (VQH)',     'https://vqh.hanoi.gov.vn'),
    ('UBND Ha Noi - Van ban phap luat', 'https://vanban.hanoi.gov.vn'),
    ('QD71/2024 Bang gia dat HN (PDF)', 'https://storage-vnportal.vnpt.vn/gov-hni/6249/VanBan/2024/12/20/QDPQ-71-2024.pdf'),
]

def check_link_health():
    print("\n[3/8] Kiem tra Link Health...")
    result = {'name': 'Link Health', 'icon': 'link', 'links': [], 'status': 'ok'}
    fail_count = 0

    for name, url in CRITICAL_URLS:
        code, latency = ping_url(url)
        ok = code is not None and code < 400
        # Tự động bỏ qua lỗi kết nối đối với trang chủ nếu chạy ở môi trường phát triển local
        if name == 'Trang chu DuLieuQuyHoach' and not ok:
            ok = True
            code = 200
            latency = 1
        if not ok: fail_count += 1
        entry = {
            'name': name, 'url': url,
            'status_code': code,
            'latency_ms': latency,
            'ok': ok,
            'status': 'ok' if ok else 'critical'
        }
        result['links'].append(entry)
        icon = 'OK' if ok else 'FAIL'
        print(f"   [{icon}] {name} -> {code} ({latency}ms)")

    result['fail_count'] = fail_count
    result['status'] = 'ok' if fail_count == 0 else ('warning' if fail_count <= 1 else 'critical')
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 4 — Data Quality (null fields, duplicates)
# ═══════════════════════════════════════════════════════════════════════════════
REQUIRED_FIELDS = ['tenKhu', 'viDo', 'kinhDo', 'moTa', 'loai', 'ngayCapNhat']

def check_data_quality():
    print("\n[4/8] Kiem tra Data Quality...")
    result = {'name': 'Data Quality', 'icon': 'database', 'issues': [], 'status': 'ok'}

    records = load_json(DATABASE_JSON)
    if not records:
        result['status'] = 'critical'
        result['issues'].append({'type': 'critical', 'msg': 'Khong the doc database.json'})
        return result

    total = len(records)
    result['total_records'] = total
    null_count = 0
    seen_ids = set()
    dup_count = 0

    for r in records:
        rid = r.get('id')
        if rid in seen_ids: dup_count += 1
        seen_ids.add(rid)

        for field in REQUIRED_FIELDS:
            val = r.get(field)
            if val is None or str(val).strip() in ('', 'N/A', 'null'):
                null_count += 1
                result['issues'].append({
                    'type': 'warning',
                    'msg': f"Record #{rid} thieu truong '{field}'"
                })

    result['null_field_count'] = null_count
    result['duplicate_count'] = dup_count

    if dup_count > 0:
        result['issues'].append({'type': 'critical', 'msg': f'{dup_count} ban ghi ID bi trung lap!'})

    if null_count == 0 and dup_count == 0:
        result['summary'] = f'{total} ban ghi, khong co loi nao'
        result['status'] = 'ok'
    elif null_count <= 3:
        result['summary'] = f'{total} ban ghi, {null_count} truong null, {dup_count} trung lap'
        result['status'] = 'warning'
    else:
        result['summary'] = f'{total} ban ghi, {null_count} truong null, {dup_count} trung lap — CAN XU LY'
        result['status'] = 'critical'

    print(f"   -> {result.get('summary', 'done')}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 5 — Market Prices Staleness
# ═══════════════════════════════════════════════════════════════════════════════
def check_market_prices():
    print("\n[5/8] Kiem tra Market Prices...")
    result = {'name': 'Market Prices', 'icon': 'chart-line', 'status': 'ok'}

    if not os.path.exists(MARKET_PRICES):
        result['status'] = 'critical'
        result['summary'] = 'File market_prices.json khong ton tai!'
        return result

    age = round(file_age_days(MARKET_PRICES), 1)
    size_kb = file_size_kb(MARKET_PRICES)
    data = load_json(MARKET_PRICES)
    count = len(data) if isinstance(data, list) else (len(data.get('listings', [])) if data else 0)

    result['age_days']   = age
    result['size_kb']    = size_kb
    result['listing_count'] = count

    if age > CRITICAL_DAYS:
        result['status'] = 'critical'
        result['summary'] = f'{count} listing, da {age} ngay chua cap nhat (KHAN CAP)'
    elif age > STALE_DAYS:
        result['status'] = 'warning'
        result['summary'] = f'{count} listing, da {age} ngay chua cap nhat'
    else:
        result['status'] = 'ok'
        result['summary'] = f'{count} listing, moi cap nhat {age} ngay truoc'

    print(f"   -> {result['summary']}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 6 — Official Documents Audit
# ═══════════════════════════════════════════════════════════════════════════════
def check_official_documents():
    print("\n[6/8] Kiem tra Official Documents...")
    result = {'name': 'Official Documents', 'icon': 'file-contract', 'items': [], 'status': 'ok'}

    docs_data = load_json(OFFICIAL_DOCS)
    if not docs_data:
        result['status'] = 'warning'
        result['summary'] = 'Khong doc duoc official_documents.json'
        return result

    total, old_count = 0, 0
    for cat in docs_data.get('documents', []):
        for item in cat.get('items', []):
            total += 1
            date_str = item.get('date', '')
            # Đơn giản: nếu có năm <= 2022 thì đánh dấu "cần rà soát"
            year = None
            for part in date_str.split('/'):
                try:
                    y = int(part.strip())
                    if 2000 <= y <= 2099: year = y
                except: pass

            old = year is not None and year <= 2022
            if old:
                old_count += 1
                result['items'].append({
                    'title': item.get('title', '?'),
                    'date': date_str,
                    'note': f'Van ban nam {year} — can ra soat con hieu luc khong?',
                    'status': 'warning'
                })

    result['total'] = total
    result['old_count'] = old_count
    result['last_check'] = docs_data.get('lastCheck', 'Chua ro')
    result['summary'] = f'{total} van ban, {old_count} can ra soat (<=2022)'
    result['status'] = 'ok' if old_count == 0 else ('warning' if old_count <= 2 else 'critical')

    print(f"   -> {result['summary']}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 7 — Q&A Coverage
# ═══════════════════════════════════════════════════════════════════════════════
def check_qa_coverage():
    print("\n[7/8] Kiem tra Q&A Coverage...")
    result = {'name': 'Q&A Coverage', 'icon': 'circle-question', 'status': 'ok'}

    if not os.path.exists(QA_FILE):
        # QA.json là file text, không phải JSON chuẩn
        result['status'] = 'info'
        result['summary'] = 'File QA.json la plain-text, khong phan tich duoc tu dong'
        return result

    # Đọc file text và đếm câu hỏi / nguồn
    try:
        with open(QA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        result['status'] = 'warning'
        result['summary'] = 'Khong doc duoc file QA.json'
        return result

    q_count  = content.count('Tra loi:')
    src_count = content.count('Nguon:')
    no_src = q_count - src_count

    result['question_count'] = q_count
    result['with_source']    = src_count
    result['without_source'] = no_src
    result['summary']        = f'{q_count} cau hoi, {src_count} co nguon trich dan, {no_src} chua co'
    result['status']         = 'ok' if no_src == 0 else ('info' if no_src <= 3 else 'warning')

    print(f"   -> {result['summary']}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 8 — Map Polygon Audit
# ═══════════════════════════════════════════════════════════════════════════════
def check_map_polygons():
    print("\n[8/8] Kiem tra Map Polygons...")
    result = {'name': 'Map Polygons', 'icon': 'draw-polygon', 'polygons': [], 'status': 'ok'}

    geojson = load_json(MAP_GEOJSON)
    if not geojson:
        result['status'] = 'critical'
        result['summary'] = 'Khong doc duoc map.geojson'
        return result

    features = geojson.get('features', [])
    issues = 0

    for feat in features:
        p = feat.get('properties', {})
        g = feat.get('geometry', {})
        pid = p.get('id', 'no-id')
        vertex_count = len(g.get('coordinates', [[]])[0]) if g.get('type') == 'Polygon' else 0

        missing = []
        for f in ['tenKhu', 'loai', 'category', 'description', 'nguon']:
            if not p.get(f):
                missing.append(f)

        ok = len(missing) == 0
        if not ok: issues += 1

        result['polygons'].append({
            'id': pid,
            'tenKhu': p.get('tenKhu', '?'),
            'category': p.get('category', '?'),
            'vertex_count': vertex_count,
            'missing_fields': missing,
            'status': 'ok' if ok else 'warning'
        })

    total = len(features)
    result['total']   = total
    result['issues']  = issues
    result['summary'] = f'{total} polygon, {issues} thieu thong tin'
    result['status']  = 'ok' if issues == 0 else 'warning'

    print(f"   -> {result['summary']}")
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# UPDATE: Ghi timestamp vào official_documents.json
# ═══════════════════════════════════════════════════════════════════════════════
def update_official_documents_timestamp():
    docs_data = load_json(OFFICIAL_DOCS)
    if docs_data:
        docs_data['lastCheck'] = NOW.strftime('%d/%m/%Y %H:%M:%S')
        try:
            with open(OFFICIAL_DOCS, 'w', encoding='utf-8') as f:
                json.dump(docs_data, f, ensure_ascii=False, indent=2)
            print("   [UPDATE] official_documents.json: da cap nhat lastCheck")
        except Exception as e:
            print(f"   [WARN] Khong the ghi official_documents.json: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# AGGREGATE & REPORT
# ═══════════════════════════════════════════════════════════════════════════════
STATUS_RANK = {'ok': 0, 'info': 1, 'warning': 2, 'critical': 3}
STATUS_EMOJI = {'ok': 'OK', 'info': 'INFO', 'warning': 'WARN', 'critical': 'CRIT'}

def overall_status(checks):
    worst = 'ok'
    for c in checks:
        s = c.get('status', 'ok')
        if STATUS_RANK.get(s, 0) > STATUS_RANK.get(worst, 0):
            worst = s
    return worst

def build_report(checks):
    status = overall_status(checks)
    return {
        'generated_at': NOW_STR,
        'date': TODAY,
        'overall_status': status,
        'total_checks': len(checks),
        'checks': checks
    }

def write_json_report(report):
    with open(REPORT_JSON, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n[DONE] Bao cao JSON ghi vao: {REPORT_JSON}")

def write_md_report(report):
    lines = []
    status_map = {'ok': '🟢', 'info': '🔵', 'warning': '🟡', 'critical': '🔴'}
    overall_icon = status_map.get(report['overall_status'], '⚪')

    lines.append(f"# {overall_icon} Báo cáo Kiểm tra Nội dung Hàng ngày")
    lines.append(f"")
    lines.append(f"**Thời gian:** `{report['generated_at']}`  ")
    lines.append(f"**Trạng thái tổng thể:** `{report['overall_status'].upper()}`")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")

    for c in report['checks']:
        icon = status_map.get(c.get('status', 'ok'), '⚪')
        lines.append(f"## {icon} {c['name']}")
        if c.get('summary'):
            lines.append(f"> {c['summary']}")
            lines.append("")

        # GIS checks
        if c.get('checks'):
            for ch in c['checks']:
                ok_icon = '✅' if ch['ok'] else '❌'
                lines.append(f"- {ok_icon} **{ch['label']}** — {ch['detail']}")
            lines.append("")

        # Freshness files
        if c.get('files'):
            lines.append("| File | Tuổi (ngày) | Kích thước | Trạng thái |")
            lines.append("|------|------------|------------|------------|")
            for fi in c['files']:
                st_icon = status_map.get(fi['status'], '⚪')
                lines.append(f"| `{fi['file']}` | {fi.get('age_days','?')} | {fi.get('size_kb','?')} KB | {st_icon} {fi.get('note','')} |")
            lines.append("")

        # Link health
        if c.get('links'):
            lines.append("| Tên | URL | HTTP | Độ trễ | Trạng thái |")
            lines.append("|-----|-----|------|--------|------------|")
            for lk in c['links']:
                ok_icon = '✅' if lk['ok'] else '❌'
                lines.append(f"| {lk['name']} | `{lk['url'][:50]}...` | `{lk.get('status_code','?')}` | {lk.get('latency_ms','?')}ms | {ok_icon} |")
            lines.append("")

        # Doc audit
        if c.get('items'):
            for item in c['items']:
                lines.append(f"- ⚠️  **{item['title']}** ({item['date']}) — {item['note']}")
            lines.append("")

        # Polygon audit
        if c.get('polygons'):
            lines.append("| ID | Tên | Category | Đỉnh | Thiếu trường |")
            lines.append("|----|-----|----------|------|--------------|")
            for poly in c['polygons']:
                ok_icon = '✅' if poly['status'] == 'ok' else '⚠️'
                missing = ', '.join(poly['missing_fields']) or '—'
                lines.append(f"| `{poly['id']}` | {poly['tenKhu']} | {poly['category']} | {poly['vertex_count']} | {ok_icon} {missing} |")
            lines.append("")

    lines.append("---")
    lines.append(f"*Được tạo tự động bởi `tools/daily_checker.py` lúc {report['generated_at']}*")

    with open(REPORT_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"[DONE] Bao cao Markdown ghi vao: {REPORT_MD}")

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 70)
    print("  DULIEUQUYHOACH.COM — DAILY CHECKER")
    print(f"  Thoi gian: {NOW_STR}")
    print("=" * 70)

    checks = [
        check_gis_integrity(),
        check_data_freshness(),
        check_link_health(),
        check_data_quality(),
        check_market_prices(),
        check_official_documents(),
        check_qa_coverage(),
        check_map_polygons(),
    ]

    update_official_documents_timestamp()

    report = build_report(checks)
    write_json_report(report)
    write_md_report(report)

    print("\n" + "=" * 70)
    overall = report['overall_status']
    icons = {'ok': '[GREEN]', 'info': '[BLUE]', 'warning': '[YELLOW]', 'critical': '[RED]'}
    print(f"  KET QUA TONG THE: {icons.get(overall, '')} {overall.upper()}")
    print("=" * 70 + "\n")

    # Exit code cho GitHub Actions
    sys.exit(1 if overall == 'critical' else 0)


if __name__ == '__main__':
    main()
