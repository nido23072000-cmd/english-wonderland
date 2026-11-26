# English Wonderland – triển khai miễn phí

## Có gì trong bản này?
Ứng dụng web full-stack gồm đăng ký/đăng nhập, từ vựng cá nhân, 72 chủ đề ngữ pháp A1–C2, luyện viết, thư viện đọc song ngữ, luyện tập, giao diện responsive và chế độ tối.

## Cách đưa lên mạng bằng Render + GitHub

1. Giải nén ZIP này.
2. Tạo tài khoản GitHub và tạo repository mới tên `english-wonderland`.
3. Đưa toàn bộ nội dung thư mục đã giải nén lên repository (không đưa file `.env` hoặc khóa API lên GitHub).
4. Đăng nhập Render bằng GitHub, chọn **New → Blueprint**, kết nối repository vừa tạo.
5. Render đọc file `render.yaml`; chọn triển khai dịch vụ `english-wonderland`.
6. Trong phần Environment của dịch vụ, thêm `OPENAI_API_KEY` nếu muốn dùng chức năng AI (tạo bài, làm giàu từ vựng, chấm viết). API key có thể phát sinh chi phí riêng; không nhập khóa vào mã nguồn hoặc gửi cho người khác.
7. Chờ trạng thái **Live**, mở URL `.onrender.com` mà Render cấp.

## Lưu ý quan trọng về gói miễn phí

- Render Free có thể cho dịch vụ ngủ khi không có lượt truy cập và cần thời gian khởi động lại.
- Cơ sở dữ liệu hiện tại là SQLite lưu trên ổ đĩa của dịch vụ. Trên Render Free, hệ thống tệp không bền vững; dữ liệu tài khoản/từ vựng có thể mất sau khi deploy hoặc khởi động lại.
- Vì vậy bản này phù hợp để chạy thử và xem giao diện, chưa nên dùng làm nơi lưu dữ liệu học tập quan trọng. Muốn lưu dữ liệu bền vững cần chuyển SQLite sang PostgreSQL/Supabase và cấu hình kết nối trước khi dùng lâu dài.
- Không có URL website công khai cho đến khi chủ tài khoản hoàn tất các bước tạo repository và nhấn deploy trên Render.

## Chạy thử trên máy tính
Yêu cầu Node.js 20 trở lên:

```bash
npm install
cp .env.example .env
npm start
```

Mở `http://localhost:3000`.
