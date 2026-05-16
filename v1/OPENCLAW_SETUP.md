Kế hoạch triển khai OpenClaw Python trên máy tính cá nhân
Dưới đây là kế hoạch chi tiết để bạn cài đặt và chạy OpenClaw Python ngay trên máy tính của mình, crawl dữ liệu tự động và ghi vào Google Sheets. Bạn có thể copy toàn bộ nội dung này vào file OPENCLAW_SETUP.md trong repository của mình.

markdown
# OPENCLAW_SETUP.md - Kế hoạch triển khai Crawler tự động trên máy tính cá nhân

## 🎯 Mục tiêu

- Chạy OpenClaw Python trên **máy tính cá nhân** (không cần VPS/Raspberry Pi)
- Tự động crawl tin tức từ các nguồn RSS chính thống lúc 9h và 16h (nếu máy bật)
- Ghi dữ liệu trực tiếp vào **Google Sheets hiện tại**
- Website `dulieuquyhoach.com` vẫn đọc dữ liệu từ Sheets qua Apps Script (không cần sửa)

## 📦 Yêu cầu hệ thống

| Thành phần | Yêu cầu | Kiểm tra |
|:---|:---|:---|
| **Python** | 3.11 trở lên | `python --version` |
| **pip** | Phiên bản mới nhất | `pip --version` |
| **Internet** | Kết nối ổn định | - |
| **Google account** | Có quyền truy cập sheet | Sheet ID: `1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I` |
| **RAM** | 512 MB trở lên | Đủ để chạy Python |

## 🚀 Lộ trình triển khai (Tổng quan)

```mermaid
flowchart LR
    A[Bước 1: Cài đặt] --> B[Bước 2: Tạo Service Account]
    B --> C[Bước 3: Code Crawler]
    C --> D[Bước 4: Chạy thử]
    D --> E[Bước 5: Lên lịch tự động]
Bước 1: Cài đặt OpenClaw Python và thư viện
1.1. Mở Terminal/Command Prompt
Windows: Nhấn Win + R, gõ cmd, Enter

Mac/Linux: Mở Terminal

1.2. Kiểm tra Python
bash
python --version
Nếu chưa có, tải Python 3.11+ từ python.org

1.3. Cài đặt OpenClaw
bash
pip install openclaw-python
1.4. Cài đặt các thư viện bổ trợ
bash
# Thư viện crawl RSS (xử lý tự động nhiều định dạng)
pip install feedparser

# Thư viện crawl web nâng cao (dự phòng)
pip install requests beautifulsoup4

# Thư viện kết nối Google Sheets
pip install gspread google-auth
1.5. Xác minh cài đặt thành công
bash
python -c "import openclaw; print('OpenClaw OK')"
python -c "import feedparser; print('feedparser OK')"
Bước 2: Tạo Service Account để ghi vào Google Sheets
Service Account là "robot" được phép ghi dữ liệu vào sheet của bạn.

2.1. Truy cập Google Cloud Console
Mở trình duyệt, truy cập: https://console.cloud.google.com

2.2. Tạo Project mới
Nhấn Select a project → New Project

Đặt tên: QuyHoachCrawler

Nhấn Create

2.3. Enable Google Sheets API
Trong project, vào APIs & Services → Library

Tìm Google Sheets API → Enable

2.4. Tạo Service Account
Vào APIs & Services → Credentials

Nhấn + Create Credentials → Service Account

Đặt tên: crawler-bot

Nhấn Create and Continue (bỏ qua các bước role, nhấn Done)

2.5. Tạo và tải JSON key
Click vào email của service account vừa tạo

Vào tab Keys → Add Key → Create New Key

Chọn JSON → Nhấn Create

File JSON sẽ tự động tải về (giữ cẩn thận, không chia sẻ)

2.6. Lấy email của Service Account
Trong file JSON vừa tải, tìm dòng:

json
"client_email": "crawler-bot@your-project.iam.gserviceaccount.com"
Copy email này (ví dụ: crawler-bot@...)

2.7. Chia sẻ Google Sheets với Service Account
Mở Google Sheet của bạn (ID: 1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I)

Nhấn Share (góc phải trên)

Dán email service account vào ô Add people

Chọn quyền Editor

Nhấn Share

Bước 3: Tạo script Crawler hoàn chỉnh
3.1. Tạo thư mục dự án
bash
mkdir ~/quyhoach-crawler
cd ~/quyhoach-crawler
3.2. Đặt file JSON key vào thư mục
Copy file JSON bạn đã tải vào thư mục này, đặt tên là service-account-key.json

3.3. Tạo file crawler.py
Dùng bất kỳ text editor nào (Notepad, VS Code, Sublime) tạo file crawler.py với nội dung sau:

python
#!/usr/bin/env python3
"""
Crawler tự động cho dulieuquyhoach.com
Thu thập tin tức quy hoạch từ RSS và ghi vào Google Sheets
"""

import feedparser
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import time
import logging

# ========== CẤU HÌNH ==========
SHEET_ID = '1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I'
SERVICE_ACCOUNT_FILE = 'service-account-key.json'

# Danh sách nguồn RSS và từ khóa
RSS_SOURCES = [
    'https://tuoitre.vn/rss/kinh-te.rss',
    'https://vietnamnet.vn/rss/thoi-su.rss',
    'https://vietnamnet.vn/rss/giao-thong.rss',
    'https://danviet.vn/rss/kinh-te.rss'
]

KEYWORDS = [
    'sông hồng', 'quy hoạch', 'vành đai', 'giải phóng mặt bằng',
    'tái định cư', 'đền bù', 'hệ số k', 'dự án', 'gpmb'
]

# ========== LOGGING ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========== KẾT NỐI GOOGLE SHEETS ==========
def connect_to_sheets():
    """Kết nối đến Google Sheets bằng service account"""
    try:
        creds = Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID)
        return sheet
    except Exception as e:
        logger.error(f"Không thể kết nối Google Sheets: {e}")
        return None

# ========== CRAWL RSS ==========
def crawl_rss_feed(rss_url):
    """Crawl một RSS feed, trả về danh sách bài viết liên quan"""
    try:
        feed = feedparser.parse(rss_url)
        articles = []
        
        for entry in feed.entries[:15]:  # Lấy 15 bài mới nhất
            title = entry.get('title', '').lower()
            summary = entry.get('summary', '').lower()
            content = title + ' ' + summary
            
            # Kiểm tra từ khóa
            matched_keywords = [kw for kw in KEYWORDS if kw in content]
            
            if matched_keywords:
                articles.append({
                    'title': entry.get('title', 'Không có tiêu đề'),
                    'link': entry.get('link', ''),
                    'published': entry.get('published', datetime.now().strftime('%Y-%m-%d')),
                    'summary': entry.get('summary', '')[:500],  # Giới hạn 500 ký tự
                    'source': rss_url,
                    'keywords': ', '.join(matched_keywords),
                    'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return articles
    except Exception as e:
        logger.error(f"Lỗi crawl {rss_url}: {e}")
        return []

# ========== GHI VÀO SHEET ==========
def save_to_sheet(sheet, articles):
    """Ghi dữ liệu vào sheet BaiBao"""
    try:
        worksheet = sheet.worksheet('BaiBao')
    except gspread.exceptions.WorksheetNotFound:
        # Tạo sheet mới nếu chưa có
        worksheet = sheet.add_worksheet(title='BaiBao', rows=1000, cols=8)
        # Thêm header
        worksheet.append_row([
            'Tiêu đề', 'Link', 'Ngày đăng', 'Tóm tắt', 
            'Nguồn', 'Từ khóa', 'Thời gian crawl', 'Đã xử lý AI'
        ])
    
    # Lấy danh sách link đã có để tránh trùng
    existing_links = []
    try:
        existing_data = worksheet.get_all_values()
        if len(existing_data) > 1:
            existing_links = [row[1] for row in existing_data[1:] if len(row) > 1]
    except:
        pass
    
    new_articles = []
    for article in articles:
        if article['link'] not in existing_links:
            worksheet.append_row([
                article['title'],
                article['link'],
                article['published'],
                article['summary'],
                article['source'],
                article['keywords'],
                article['crawled_at'],
                'pending'  # Chưa xử lý AI
            ])
            new_articles.append(article)
    
    return len(new_articles)

# ========== MAIN ==========
def main():
    logger.info("=" * 50)
    logger.info("BẮT ĐẦU CRAWL DỮ LIỆU QUY HOẠCH")
    logger.info("=" * 50)
    
    # 1. Kết nối Google Sheets
    sheet = connect_to_sheets()
    if not sheet:
        logger.error("Kết nối thất bại. Thoát.")
        return
    
    # 2. Crawl tất cả nguồn RSS
    all_articles = []
    for rss_url in RSS_SOURCES:
        logger.info(f"Đang crawl: {rss_url}")
        articles = crawl_rss_feed(rss_url)
        all_articles.extend(articles)
        time.sleep(1)  # Tránh rate limit
    
    logger.info(f"Đã crawl được {len(all_articles)} bài viết liên quan")
    
    # 3. Ghi vào Google Sheets
    if all_articles:
        new_count = save_to_sheet(sheet, all_articles)
        logger.info(f"✅ Đã thêm {new_count} bài viết mới vào sheet BaiBao")
    else:
        logger.info("ℹ️ Không có bài viết mới")
    
    logger.info("=" * 50)
    logger.info("CRAWL HOÀN TẤT")
    logger.info("=" * 50)

if __name__ == "__main__":
    main()
3.4. Tạo file .env (tùy chọn, để lưu cấu hình)
bash
# .env file
SHEET_ID=1_uwGa7TvGL6JJHMbSGDj_OqUbNMrGI5TqI7ozrg48_I
SERVICE_ACCOUNT_FILE=service-account-key.json
3.5. Cấu trúc thư mục hoàn chỉnh
text
quyhoach-crawler/
├── crawler.py
├── service-account-key.json
├── .env (tùy chọn)
└── README.md (ghi chú cho chính bạn)
Bước 4: Chạy thử lần đầu
4.1. Trong terminal, chạy lệnh:
bash
cd ~/quyhoach-crawler
python crawler.py
4.2. Kiểm tra kết quả
Terminal log: Xem có dòng ✅ Đã thêm X bài viết mới không

Google Sheets: Mở sheet của bạn, sẽ thấy sheet BaiBao được tạo và có dữ liệu

https://via.placeholder.com/400x200?text=Data+in+Google+Sheets

4.3. Nếu có lỗi, kiểm tra:
Lỗi	Nguyên nhân	Cách sửa
No module named 'feedparser'	Chưa cài thư viện	pip install feedparser
Credentials.from_service_account_file	File JSON không đúng đường dẫn	Kiểm tra tên file và vị trí
WorksheetNotFound	Bình thường, script sẽ tự tạo	Lần đầu sẽ tạo sheet mới
403: Permission denied	Chưa share sheet với service account	Share lại email trong JSON
Bước 5: Lên lịch chạy tự động (9h và 16h)
5.1. Windows - Task Scheduler
Mở Task Scheduler (gõ "Task Scheduler" trong Start menu)

Nhấn Create Basic Task

Đặt tên: Crawl Quy Hoach Sang

Chọn Daily, nhập giờ 09:00

Chọn Start a Program

Program: python

Arguments: C:\Users\YourName\quyhoach-crawler\crawler.py

Start in: C:\Users\YourName\quyhoach-crawler

Nhấn Finish

Làm tương tự cho lúc 16:00 (tạo task riêng)

5.2. Mac/Linux - Crontab
Mở terminal, gõ:

bash
crontab -e
Thêm 2 dòng sau:

cron
# Crawler quy hoạch - 9h sáng và 16h chiều
0 9 * * * cd /Users/yourname/quyhoach-crawler && /usr/bin/python3 crawler.py >> /tmp/crawler.log 2>&1
0 16 * * * cd /Users/yourname/quyhoach-crawler && /usr/bin/python3 crawler.py >> /tmp/crawler.log 2>&1
Lưu ý: Thay đường dẫn đúng với máy bạn (dùng pwd để xem đường dẫn hiện tại)

5.3. Kiểm tra cron đã chạy chưa
bash
# Xem log
cat /tmp/crawler.log

# Xem danh sách cron
crontab -l
Bước 6: Nâng cấp (Tích hợp AI extract)
Sau khi crawl cơ bản hoạt động ổn định, bạn có thể thêm trích xuất địa chỉ bằng AI vào script.

6.1. Lấy Gemini API key (miễn phí)
Truy cập https://aistudio.google.com

Đăng nhập bằng Google account

Nhấn Get API key → Create API key

Copy key và lưu vào file .env:

text
GEMINI_API_KEY=your_api_key_here
6.2. Thêm code AI extract vào crawler.py
Chèn vào đầu file (sau các import):

python
# Thêm vào phần import
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()  # Load từ file .env
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
Thêm hàm extract bằng Gemini:

python
def extract_address_with_gemini(text):
    """Gọi Gemini API để trích xuất địa chỉ từ nội dung"""
    if not GEMINI_API_KEY:
        return None
    
    prompt = f"""
    Hãy đọc đoạn văn sau và trích xuất thông tin quy hoạch:
    1. Địa chỉ cụ thể (số nhà, đường, phường, quận)
    2. Tên dự án
    3. Diện tích (nếu có)
    4. Trạng thái quy hoạch
    
    Đoạn văn: {text[:1500]}
    
    Trả về dưới dạng JSON với các key: address, project, area, status
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, json=payload)
        result = response.json()
        content = result['candidates'][0]['content']['parts'][0]['text']
        # Loại bỏ markdown code block nếu có
        content = content.replace('```json', '').replace('```', '').strip()
        return json.loads(content)
    except Exception as e:
        logger.error(f"Lỗi Gemini: {e}")
        return None
Sửa hàm save_to_sheet để thêm cột AI (đã có sẵn trong header).

Bước 7: Giám sát và bảo trì
7.1. Hàng ngày
Kiểm tra log crawler: cat /tmp/crawler.log (Mac/Linux) hoặc xem lịch sử Task Scheduler (Windows)

Kiểm tra sheet BaiBao xem có dữ liệu mới không

Nếu có lỗi, chạy thử thủ công: python crawler.py

7.2. Hàng tuần
Xóa bài viết cũ (nếu sheet quá lớn): Xóa các dòng cũ hơn 30 ngày

Cập nhật từ khóa nếu cần (thêm từ mới vào KEYWORDS)

Kiểm tra các nguồn RSS có hoạt động không

7.3. Xử lý sự cố thường gặp
Vấn đề	Giải pháp
feedparser parse lỗi	Cài lại: pip install --upgrade feedparser
Kết nối Google Sheets chậm	Kiểm tra internet, thử chạy lại
Cron không chạy	Kiểm tra đường dẫn tuyệt đối trong crontab
Trùng lặp dữ liệu	Script đã có cơ chế chống trùng theo link
📊 Tổng kết
✅ Bạn đã có:
Một crawler Python chạy trên máy tính cá nhân

Tự động crawl RSS từ các nguồn chính thống

Ghi dữ liệu trực tiếp vào Google Sheets

Lên lịch chạy lúc 9h và 16h (nếu máy bật)

Cơ chế chống trùng lặp dữ liệu

(Nâng cao) Tích hợp AI extract địa chỉ

🔄 Dữ liệu chảy thế nào?







📝 Ghi chú quan trọng
Máy tính cần bật lúc 9h và 16h để cron/Task Scheduler chạy

Nếu máy tắt, bạn vẫn có thể chạy thủ công sau khi bật máy

Dữ liệu đã lưu trên Google Sheets nên không bị mất khi máy tắt

Website dulieuquyhoach.com hoạt động độc lập, không phụ thuộc máy bạn

🎯 Lộ trình phát triển tiếp theo
Tuần 1: Crawl cơ bản (RSS → Sheet) ✅ (hoàn thành sau 30 phút)

Tuần 2: Thêm AI extract (Gemini) để tự động lấy địa chỉ

Tuần 3: Tự động cập nhật vào sheet DanhSachQuyHoach sau khi xác minh

Tuần 4: Dùng OpenClaw Agent để crawl sâu hơn (các trang web động)

📞 Hỗ trợ
Nếu gặp lỗi, hãy kiểm tra:

Log trong terminal khi chạy thủ công

File /tmp/crawler.log (Mac/Linux)

Lịch sử Task Scheduler (Windows)