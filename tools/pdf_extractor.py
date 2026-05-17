```bash
  pip install PyMuPDF
```

BƯỚC 2: Mã Python
Dán đoạn mã này vào pdf_extractor.py:

```python
  import fitz # PyMuPDF
  import os

  # !!! QUAN TRỌNG: Thay đổi đường dẫn này thành đường dẫn THỰC TẾ của file PDF của bạn !!!
  PDF_PATH = r"D:\Automator_Prj\DuLieu_QuyHoach_SongHong\data\bang-gia-dat-ha-noi-2026-du-kien.pdf"

  def extract_text_from_pdf(pdf_path):
      """
      Trích xuất toàn bộ văn bản từ một file PDF lớn.
      """
      if not os.path.exists(pdf_path):
          print(f"LỖI: Không tìm thấy file tại đường dẫn: {pdf_path}")
          return None

      full_text = []
      try:
          # Mở tài liệu PDF
          doc = fitz.open(pdf_path)
          print(f"--- Đã mở tài liệu thành công. Tổng số trang: {doc.page_count} ---")

          # Lặp qua từng trang và trích xuất văn bản
          for page_num in range(doc.page_count):
              page = doc.load_page(page_num)
              text = page.get_text("text") # Trích xuất dưới dạng text thuần
              full_text.append(f"\n\n=========== TRANG {page_num + 1} ===========")
              full_text.append(text)

          doc.close()

          # Ghép tất cả văn bản lại
          final_output = "\n".join(full_text)
          print("\n" + "="*60)
          print("✅ TRÍCH XUẤT VĂN BẢN THÀNH CÔNG!")
          print("======================================================")
          print("Vui lòng COPY TOÀN BỘ nội dung văn bản bên dưới này và DÁN vào đây (trong cửa sổ chat).")
          print("======================================================")
          print(final_output)

      except Exception as e:
          print(f"\n!!! LỖI LỚN KHI TRUY CẬP PDF: {e}")
          print("Vui lòng kiểm tra lại đường dẫn file và đảm bảo file PDF không bị khóa.")
          return None

  # Chạy hàm trích xuất
  if __name__ == "__main__":
      extract_text_from_pdf(PDF_PATH)
```