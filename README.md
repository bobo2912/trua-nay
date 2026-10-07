# Trưa Nay v2

App chọn quán ăn trưa và chia bill với bạn bè. Chạy trên GitHub Pages, dữ liệu lưu ở Firebase (gói Spark miễn phí), AI dùng API key Claude của từng người.

## Cách hoạt động

- **Không có nhóm cố định.** Mỗi người có một hồ sơ riêng (tên, Zalo, tài khoản ngân hàng) và một **danh bạ** những người hay ăn cùng.
- **Bill là trung tâm.** Mỗi lần ăn, chọn người từ danh bạ vào bill rồi chia. Bấm **Gửi bill** để gửi link vào Zalo.
- Người nhận mở link, bấm **Là tôi** ở dòng tên mình. Từ đó bill (và các bill sau) tự hiện trong app của họ, kèm QR trả tiền.
- **Công nợ** tính hai chiều: ai nợ tôi, tôi nợ ai, theo từng bill.
- **Bình chọn** quán cũng gửi bằng link.

## Menu

| Tab | Dùng để |
|---|---|
| Ăn gì | Quay số từ quán hay ăn hoặc món ăn, AI gợi ý, tìm quán gần (định vị), bình chọn |
| Bill | Bill tôi trả hoặc có tên tôi |
| Công nợ | Ai nợ tôi, tôi nợ ai, bao nhiêu, bill nào; nhắc kèm QR |
| Danh bạ | Người hay ăn cùng, số dư với từng người |
| Cài đặt | Hồ sơ và ngân hàng, địa chỉ, định vị, quán hay ăn, nhắc nợ, API key, mã khôi phục, phiên bản |

## Cập nhật từ v1

Thay toàn bộ **Firestore → Rules** bằng nội dung file `firestore.rules`, rồi bấm **Publish**. Dữ liệu nhóm cũ của v1 không dùng nữa.

## Mã khôi phục

App không cần đăng ký tài khoản. Hồ sơ gắn với máy qua **mã khôi phục** (Cài đặt → Thiết bị). Cần mã này khi:
- Mở app từ màn hình chính lần đầu (iPhone tách dữ liệu Safari và app màn hình chính).
- Đổi điện thoại hoặc xóa dữ liệu trình duyệt.

Giữ kín mã như mật khẩu.

## Firebase có mất phí không?

Không, nếu giữ gói Spark (không cần thẻ). Hạn mức miễn phí của Firestore: 1 GiB dữ liệu, 50.000 lượt đọc, 20.000 lượt ghi, 20.000 lượt xóa mỗi ngày. Vượt hạn mức thì Firebase chặn tạm đến hôm sau, không tự trừ tiền.

## AI (mỗi người tự trả)

Cài đặt → API key Claude. Key chỉ lưu trên máy đó. Gợi ý món với Haiku 4.5 khoảng 100–300đ/lần. Tìm quán trên web dùng Sonnet 5.5 kèm tìm kiếm web, khoảng 2.000–4.000đ/lần (tắt được).

## Bảo mật

- Giá trị trong `config.js` được phép công khai.
- Link bill và link bình chọn là mã dài ngẫu nhiên; ai có link thì xem được bill đó. Chỉ gửi trong nhóm.
- Danh bạ, quán và cài đặt riêng chỉ chủ hồ sơ đọc được.
- Tên, Zalo và tài khoản ngân hàng trong hồ sơ hiển thị cho người cùng bill hoặc có link của bạn, để tạo QR.
