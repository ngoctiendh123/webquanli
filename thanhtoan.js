// ✅ Kết nối Firebase
import { db } from "./fire.js"; 
import { setDoc, doc, collection } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { saveRevenueToIndexedDB } from "./index.js";

document.addEventListener("DOMContentLoaded", function () {
    const tableId = localStorage.getItem("tableId");
    const totalAmount = localStorage.getItem("totalAmount");
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

    // Kiểm tra phần tử có tồn tại không trước khi cập nhật
    const tableIdElement = document.getElementById("table-id");
    const totalAmountElement = document.getElementById("total-amount");
    const cartList = document.getElementById("cart-list");

    if (tableIdElement) tableIdElement.innerText = `Bàn ăn: ${tableId}`;
    if (totalAmountElement) totalAmountElement.innerText = `Tổng tiền: ${totalAmount} VND`;

    if (cartList) {
        cartItems.forEach(item => {
            let li = document.createElement("li");
            li.textContent = `${item.name} - ${item.price} VND (x${item.quantity})`;
            cartList.appendChild(li);
        });
    }

    // Gọi hàm hiển thị mã QR nếu có đủ thông tin
    if (tableId && totalAmount) {
        generateQRCode(tableId, totalAmount);
    } else {
        console.error("❌ Thiếu thông tin để tạo mã QR!");
    }
    const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener("click", async function () {
            // Gọi hàm xác nhận thanh toán
            await confirmCashPayment();
        });
    }
});

// ===============================
// 📌 **Hàm tạo mã QR thanh toán**
// ===============================
function generateQRCode(tableId, totalAmount) {
    const qrImg = document.getElementById("qr-code");
    if (!qrImg) {
        console.error("❌ Không tìm thấy thẻ <img id='qr-code'> trong HTML.");
        return;
    }

    // 🔥 URL tạo mã QR với số tiền chính xác
    const qrUrl = `https://img.vietqr.io/image/MbBank-0945768636-compact.jpg?amount=${totalAmount}&addInfo=ThanhToanBàn${tableId}&size=300x300`;

    qrImg.src = qrUrl;
    console.log("✅ Mã QR đã được tạo:", qrUrl);
}

// ===============================
// 💰 **Xác nhận thanh toán tiền mặt & lưu vào Firebase**
// ===============================
// 💰 **Xác nhận thanh toán tiền mặt & lưu vào Firebase**
// Xử lý thanh toán
async function confirmCashPayment() {
    const tableId = localStorage.getItem("tableId");
    let totalAmount = parseFloat(localStorage.getItem("totalAmount"));
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

    // Kiểm tra thông tin thanh toán
    if (!tableId || isNaN(totalAmount) || totalAmount <= 0 || cartItems.length === 0) {
        alert("❌ Thông tin thanh toán không hợp lệ!");
        return;
    }

    try {
        // Tạo ID đơn hàng từ thời gian hiện tại theo định dạng giờ/phút/giây - ngày/tháng/năm
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0'); // Đảm bảo có 2 chữ số
        const minutes = now.getMinutes().toString().padStart(2, '0'); // Đảm bảo có 2 chữ số
        const seconds = now.getSeconds().toString().padStart(2, '0'); // Đảm bảo có 2 chữ số
        const day = now.getDate().toString().padStart(2, '0'); // Đảm bảo có 2 chữ số
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Đảm bảo có 2 chữ số
        const year = now.getFullYear();

        // Tạo ID theo định dạng giờ/phút/giây - ngày/tháng/năm
        const orderId = `${hours}/${minutes}/${seconds} - ${day}/${month}/${year}`;

        const timestamp = new Date().toISOString();
        const orderData = {
            id: orderId, // Sử dụng ID theo thời gian
            tableId: tableId,
            totalAmount: totalAmount,
            items: cartItems,
            timestamp: timestamp
        };
        localStorage.removeItem(`cart_ban${tableId}`);
        localStorage.removeItem("cartItems");
        localStorage.removeItem("tableId");
        localStorage.removeItem("totalAmount"); 
        console.log("✅ Đang xóa giỏ hàng khỏi localStorage...");
       
        // Lưu vào Firebase
        await setDoc(doc(db, "revenue", orderId), orderData);
        console.log(`✅ Đơn hàng ${orderId} đã lưu vào Firebase!`);

        // Lưu vào IndexedDB
        await saveRevenueToIndexedDB(orderData);
        console.log("✅ Dữ liệu đã được đồng bộ xuống IndexedDB!");

        // Xóa giỏ hàng khỏi localStorage ngay lập tức sau khi thanh toán thành công
        console.log("✅ Đang xóa giỏ hàng khỏi localStorage...");
        localStorage.removeItem(`cart_ban${tableId}`);
        
        // Kiểm tra lại giỏ hàng để đảm bảo đã xóa
        console.log("Giỏ hàng sau khi xóa: ", localStorage.getItem("cartItems"));

        // Thông báo thanh toán thành công
        alert(`✅ Thanh toán tiền mặt cho Bàn số ${tableId} đã thành công!`);

        // Chuyển trang sau khi thanh toán
        window.location.href = "quanlibanan.html";
    } catch (error) {
        console.error("❌ Lỗi khi thanh toán:", error);
        alert("❌ Không thể lưu thanh toán, vui lòng thử lại!");
    }
}
