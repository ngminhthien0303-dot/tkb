# TKB — Web lịch việc trong ngày

Ứng dụng lên lịch các việc trong ngày: đăng nhập tài khoản, thêm việc theo giờ,
tick hoàn thành, xem theo từng ngày. Dữ liệu lưu trên server (đồng bộ theo tài khoản).

## Tính năng
- Đăng nhập / đăng ký (mật khẩu mã hoá, token lưu sẵn)
- 2 chế độ xem: **Danh sách** và **Khung giờ 24h** trực quan
- Thêm / **sửa** việc qua cửa sổ nổi; **màu sắc & phân loại**
- **Kéo-thả** sắp xếp + nút sắp xếp theo giờ
- Việc **lặp hằng ngày / hằng tuần** (hoàn thành tính riêng theo từng ngày)
- **Nhắc nhở** bằng thông báo trình duyệt khi đến giờ
- Giao diện **sáng / tối**, thanh tiến độ hoàn thành

- **Frontend**: React + Vite (thư mục `client/`)
- **Backend**: Express + Postgres (thư mục `server/`)
- **Đăng nhập**: JWT + mật khẩu mã hoá (bcryptjs)

## Yêu cầu
- Node.js 18 trở lên
- Một database Postgres — dùng [Neon](https://neon.tech) miễn phí (lưu vĩnh viễn)

## Chạy ở máy (dev)

Trước tiên tạo file `server/.env` (sao từ `server/.env.example`) và điền `DATABASE_URL` (chuỗi Neon) + `JWT_SECRET`.

Mở **2 cửa sổ** terminal:

```bash
# Cửa sổ 1 — backend
cd server
npm install
npm run dev      # http://localhost:3001

# Cửa sổ 2 — frontend
cd client
npm install
npm run dev      # http://localhost:5173
```

Mở http://localhost:5173 → đăng ký → thêm việc.

## Deploy lên Render (miễn phí)

1. **Tạo database Neon**: vào https://neon.tech → tạo project → copy **Connection string**.
2. **Đẩy code lên GitHub**:
   ```bash
   git remote add origin https://github.com/<tên-bạn>/tkb.git
   git push -u origin main
   ```
3. **Tạo dịch vụ trên Render**: vào https://render.com → **New → Blueprint** → chọn repo
   `tkb`. Render đọc `render.yaml` tự tạo web service.
4. Khi được hỏi, dán **DATABASE_URL** = chuỗi Neon ở bước 1. (`JWT_SECRET` Render tự sinh.)
5. Bấm **Apply / Deploy**. Vài phút sau bạn có link dạng `https://tkb-xxxx.onrender.com`.

> Bản free của Render sẽ "ngủ" sau ~15 phút không dùng; lần truy cập sau tỉnh dậy mất ~30 giây.
> Dữ liệu nằm trên Neon nên **không bị mất** khi deploy lại.

## Cấu trúc
```
TKB/
├── render.yaml      # cấu hình deploy Render
├── package.json     # script build/start gộp cả 2 phần
├── server/          # API backend
│   ├── index.js     # routes + phục vụ frontend khi deploy
│   └── db.js        # kết nối Postgres + tạo bảng
└── client/          # giao diện React
    └── src/
        ├── App.jsx        # điều hướng + chuyển sáng/tối
        ├── Auth.jsx       # đăng nhập / đăng ký
        ├── Planner.jsx    # màn hình chính
        ├── ListView.jsx   # chế độ danh sách (kéo-thả)
        ├── TimelineView.jsx # chế độ khung giờ 24h
        ├── TaskModal.jsx  # form thêm/sửa việc
        └── api.js         # gọi API + lưu token
```

## API
| Method | Đường dẫn                | Mô tả                          |
|--------|--------------------------|--------------------------------|
| POST   | `/api/auth/register`     | Đăng ký                        |
| POST   | `/api/auth/login`        | Đăng nhập → trả về token       |
| GET    | `/api/tasks?date=...`    | Lấy việc theo ngày             |
| POST   | `/api/tasks`             | Thêm việc                      |
| PATCH  | `/api/tasks/:id`         | Sửa việc                       |
| PATCH  | `/api/tasks/reorder`     | Sắp xếp lại thứ tự             |
| POST   | `/api/tasks/:id/toggle`  | Tick/bỏ hoàn thành theo ngày   |
| DELETE | `/api/tasks/:id`         | Xoá việc                       |
