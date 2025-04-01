// doanhthu.js
import { openIndexedDB } from "./index.js"; // Đảm bảo đường dẫn chính xác

document.addEventListener("DOMContentLoaded", async function () {
    await displayRevenue();
    const backButton = document.getElementById("back-btn");
    backButton.addEventListener("click", function() {
        window.location.href = "quanlibanan.html"; // Chuyển hướng về trang quanlibanan.html
    });
});

// ===========================
// 📊 **Lấy doanh thu từ IndexedDB & hiển thị**
// ===========================
async function getRevenueFromIndexedDB() {
    let db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        let transaction = db.transaction("revenue", "readonly");
        let store = transaction.objectStore("revenue");
        let request = store.getAll();
        
        request.onsuccess = function () {
            resolve(request.result);
        };
        
        request.onerror = function () {
            reject("❌ Lỗi khi lấy doanh thu từ IndexedDB");
        };
    });
}

async function displayRevenue() {
    let revenueList = document.getElementById("revenue-list");
    if (!revenueList) {
        console.error("❌ Không tìm thấy phần tử #revenue-list trong HTML!");
        return;
    }

    let revenues = await getRevenueFromIndexedDB();
    revenueList.innerHTML = ""; // Xóa nội dung cũ

    revenues.forEach((revenue) => {
        let totalAmount = revenue.totalAmount ? revenue.totalAmount.toLocaleString() + " VND" : "0 VND"; // Kiểm tra giá trị
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${revenue.id || "Không xác định"}</td>
            <td>${revenue.tableId || "Chưa có"}</td>
            <td>${totalAmount}</td>
            <td>${revenue.timestamp ? new Date(revenue.timestamp).toLocaleString() : "Không xác định"}</td>
        `;
        revenueList.appendChild(row);
    });
}

