import json
import os
from pathlib import Path

# Vô hiệu hóa symlinks trên Windows để tránh lỗi quyền (WinError 1314)
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

# Đường dẫn file PDF và file JSON đầu ra
PDF_PATH = r"D:\Automator_Prj\DuLieu_QuyHoach_SongHong\data\bang-gia-dat-ha-noi-2026-du-kien.pdf"
OUTPUT_JSON_PATH = r"D:\Automator_Prj\DuLieu_QuyHoach_SongHong\data\extracted_land_prices.json"

def convert_pdf_to_json(pdf_path, output_path):
    """
    Chuyển đổi file PDF thành JSON bằng Docling.
    """
    if not os.path.exists(pdf_path):
        print(f"LỖI: Không tìm thấy file PDF tại: {pdf_path}")
        return

    print(f"Đang khởi tạo DocumentConverter (Tắt OCR để tiết kiệm RAM)...")
    
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options
            )
        }
    )

    print(f"Đang chuyển đổi file PDF (có thể mất vài phút nếu file lớn)...")
    try:
        result = converter.convert(pdf_path)
        
        # Xuất ra dictionary và lưu thành file JSON
        doc_json = result.document.export_to_dict()
        
        # Tạo thư mục nếu chưa có
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(doc_json, f, indent=2, ensure_ascii=False)
            
        print(f"✅ THÀNH CÔNG! Đã lưu file JSON tại: {output_path}")
        
        # Trích xuất thử bảng nếu có
        extract_tables_summary(doc_json)
        
    except Exception as e:
        print(f"❌ LỖI trong quá trình chuyển đổi: {e}")
        print("Vui lòng đảm bảo bạn đã cài đặt docling: pip install docling")

def extract_tables_summary(doc_json):
    """
    In tóm tắt các bảng tìm thấy để người dùng biết.
    """
    elements = doc_json.get("elements", [])
    tables_count = 0
    for el in elements:
        if el.get("type") == "Table":
            tables_count += 1
            
    print(f"ℹ️ Đã tìm thấy {tables_count} bảng trong tài liệu.")
    if tables_count > 0:
        print("Bạn có thể dùng file JSON này để phân tích tiếp hoặc import vào Google Sheets.")

if __name__ == "__main__":
    convert_pdf_to_json(PDF_PATH, OUTPUT_JSON_PATH)
