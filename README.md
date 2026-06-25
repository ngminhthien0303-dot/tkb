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
- **Backend**: Express + SQLite (`node:sqlite` có sẵn trong Node 24) — thư mục `server/`
- **Đăng nhập**: JWT + mật khẩu mã hoá (bcryptjs)

## Yêu cầu
- Node.js 22.5 trở lên (khuyến nghị 24+, vì dùng `node:sqlite`)

## Cách chạy (mở 2 cửa sổ terminal)

### 1. Backend
```bash
cd server
npm install
npm run dev      # chạy tại http://localhost:3001
```

### 2. Frontend
```bash
cd client
npm install
npm run dev      # mở http://localhost:5173
```

Mở trình duyệt vào http://localhost:5173 → đăng ký tài khoản → bắt đầu thêm việc.

## Cấu trúc
```
TKB/
├── server/          # API backend
│   ├── index.js     # routes: auth + tasks
│   ├── db.js        # khởi tạo SQLite
│   └── tkb.db       # file database (tự tạo khi chạy)
└── client/          # giao diện React
    └── src/
        ├── App.jsx      # điều hướng theo trạng thái đăng nhập
        ├── Auth.jsx     # màn hình đăng nhập / đăng ký
        ├── Planner.jsx  # màn hình chính: lịch việc trong ngày
        └── api.js       # gọi API + lưu token
```

## API
| Method | Đường dẫn              | Mô tả                       |
|--------|------------------------|-----------------------------|
| POST   | `/api/auth/register`   | Đăng ký                     |
| POST   | `/api/auth/login`      | Đăng nhập → trả về token    |
| GET    | `/api/tasks?date=...`  | Lấy việc theo ngày          |
| POST   | `/api/tasks`           | Thêm việc                   |
| PATCH  | `/api/tasks/:id`       | Sửa / tick hoàn thành       |
| DELETE | `/api/tasks/:id`       | Xoá việc                    |

> Khi deploy thật, nhớ đặt biến môi trường `JWT_SECRET` thành chuỗi bí mật riêng.
