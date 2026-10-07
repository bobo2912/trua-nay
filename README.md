# Trưa Nay: hướng dẫn cài đặt

App chọn quán ăn trưa và chia bill cho cả nhóm. Chạy trên GitHub Pages, dữ liệu dùng chung lưu ở Firebase (gói miễn phí), AI dùng API key Claude của từng người.

Chỉ **một người** (người lập nhóm) làm phần 1 và 2. Mọi người còn lại chỉ cần làm phần 3.

## 1. Tạo Firebase (khoảng 5 phút)

1. Vào https://console.firebase.google.com, đăng nhập Google, bấm **Create a project**.
   - Tên: `trua-nay`. Tắt **Google Analytics** (không cần). Bấm **Create project**.
2. Bật đăng nhập ẩn danh:
   - Menu trái **Build → Authentication → Get started**.
   - Tab **Sign-in method**, chọn **Anonymous**, bật **Enable**, bấm **Save**.
3. Tạo cơ sở dữ liệu:
   - **Build → Firestore Database → Create database**.
   - Location: chọn `asia-southeast1 (Singapore)` (gần Việt Nam nhất). Chọn **Start in production mode**. Bấm **Create**.
4. Dán luật bảo vệ dữ liệu:
   - Trong Firestore, mở tab **Rules**, xóa hết nội dung cũ.
   - Mở file `firestore.rules` trong thư mục này, chép toàn bộ, dán vào, bấm **Publish**.
5. Lấy cấu hình:
   - Bấm biểu tượng bánh răng → **Project settings**. Kéo xuống **Your apps**, bấm biểu tượng **`</>`** (Web).
   - Đặt tên `trua-nay`, **không** tick Firebase Hosting, bấm **Register app**.
   - Firebase hiện đoạn `const firebaseConfig = { apiKey: "...", ... }`. Giữ trang này để chép ở bước 2.4.

Không cần thêm thẻ thanh toán. Gói Spark miễn phí là đủ.

## 2. Đưa app lên GitHub Pages

1. Vào https://github.com, bấm **+ → New repository**. Tên `trua-nay`, chọn **Public**, bấm **Create repository**.
2. Bấm **uploading an existing file**. Kéo vào tất cả file trong thư mục này: `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, `firestore.rules`, `README.md` và thư mục `icons`. Bấm **Commit changes**.
3. Vào **Settings → Pages**. Ở **Branch** chọn `main` và `/ (root)`, bấm **Save**. Sau 1–2 phút có link dạng `https://<tên-github>.github.io/trua-nay/`.
4. Điền cấu hình Firebase: trong repo, mở `config.js`, bấm biểu tượng bút chì (Edit). Thay từng giá trị bằng giá trị trong `firebaseConfig` ở bước 1.5 (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Bấm **Commit changes**.
5. Quay lại Firebase: **Authentication → Settings → Authorized domains → Add domain**, thêm `<tên-github>.github.io`.

## 3. Bắt đầu dùng

**Người lập nhóm**
1. Mở link GitHub Pages, bấm **Tạo nhóm mới**.
2. Tab **Nhóm**: gõ tên bạn, bấm **Thêm tôi**, nhập số Zalo và tài khoản ngân hàng, bấm **Xem thử QR** để quét kiểm tra.
3. Điền **Khu vực văn phòng** ở Cài đặt chung.
4. Ở mục **Link nhóm**, bấm **Gửi link qua Zalo** (hoặc **Chép**) và gửi vào nhóm ăn trưa.

**Mọi người**
1. Mở link nhóm (có đoạn `#g=` ở cuối).
2. Tab **Nhóm**: chọn tên mình (hoặc gõ tên rồi **Thêm tôi**), nhập tài khoản ngân hàng nếu có lúc trả trước cho cả nhóm.
3. Cài lên màn hình chính: trên iPhone mở bằng **Safari → Chia sẻ → Thêm vào MH chính**; trên Android mở bằng **Chrome → menu → Cài đặt ứng dụng**. Nếu mở từ màn hình chính mà app hỏi link nhóm, dán lại link nhóm một lần.

**Hằng ngày**
- Khoảng 11h: **Ăn gì → Bình chọn**, chọn vài quán, bấm **Mở bình chọn**, nhắn nhóm vào vote. Bấm **Chốt quán** khi đủ phiếu.
- Ăn xong: người trả tiền bấm **Tạo bill bữa này**, chọn cách chia, lưu. Bấm **Ảnh QR cả nhóm** rồi **Gửi ảnh QR (chọn Zalo)**.
- Ai chuyển khoản rồi thì bấm **Đã trả**. Tab **Công nợ** đánh dấu ai cần nhắc.

## 4. AI (không bắt buộc, mỗi người tự trả)

1. Vào https://console.anthropic.com, đăng ký, vào **Billing** nạp tiền (tối thiểu 5 USD).
2. Vào **Settings → Limits**, đặt giới hạn chi tiêu hằng tháng (ví dụ 2 USD) để không bị trừ quá tay.
3. Vào **Settings → API keys → Create key**, chép key (bắt đầu bằng `sk-ant-`).
4. Trong app: tab **Nhóm → AI của bạn**, dán key, bấm **Lưu và thử key**.

Chi phí ước tính (tỷ giá khoảng 26.000đ/USD):
- **Gợi ý cho trưa nay** với Claude Haiku 4.5: khoảng 100–300đ mỗi lần.
- **AI tìm trên web** dùng Claude Sonnet 5.5 kèm tìm kiếm web (10 USD cho 1.000 lượt tìm, cộng tiền token): khoảng 2.000–4.000đ mỗi lần. Tắt mục **Cho AI tìm quán trên web** nếu muốn rẻ hơn; khi đó AI trả lời theo hiểu biết sẵn có.

Key chỉ lưu trong trình duyệt của máy đó (không lên Firebase, không ai trong nhóm thấy). Không nhập key trên máy dùng chung. Muốn gỡ thì bấm **Xóa key**.

## 5. Firebase có mất phí không?

Không, nếu giữ gói **Spark** (mặc định, không cần thẻ). Hạn mức miễn phí của Firestore:

| Hạng mục | Miễn phí |
|---|---|
| Dung lượng lưu | 1 GiB |
| Lượt đọc | 50.000 / ngày |
| Lượt ghi | 20.000 / ngày |
| Lượt xóa | 20.000 / ngày |
| Băng thông ra | 10 GiB / tháng |
| Đăng nhập ẩn danh | Miễn phí |

Nhóm 10 người, mỗi người mở app vài lần một ngày, dùng cỡ vài nghìn đến hơn chục nghìn lượt đọc mỗi ngày, vẫn dưới mức 50.000. Mỗi bill chỉ vài KB nên 1 GiB đủ cho rất nhiều năm.

Nếu vượt hạn mức, Firebase chỉ tạm chặn đến hôm sau, **không tự trừ tiền**. Chỉ khi bạn tự nâng lên gói Blaze (phải gắn thẻ) thì mới có thể phát sinh phí.

## Bảo mật

- Giá trị trong `config.js` được thiết kế để công khai, không phải mật khẩu.
- **Link nhóm** (đoạn `#g=...`) mới là chìa khóa: ai có link đều xem và sửa được dữ liệu nhóm. Chỉ gửi trong nhóm Zalo, đừng đăng công khai.
- Số tài khoản ngân hàng hiển thị cho mọi người có link nhóm, vì cần để tạo QR.
- Muốn đổi nhóm (ví dụ lỡ lộ link): tab Nhóm → **Rời nhóm trên máy này** → **Tạo nhóm mới**, rồi gửi link mới.
