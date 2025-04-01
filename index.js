import { db } from "./fire.js";
import { collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { renderFoodList } from "./banan.js"; // Đảm bảo đường dẫn chính xác

// ===========================
// 🗄 **Khởi tạo IndexedDB**
// ===========================
document.addEventListener("DOMContentLoaded", async function () {
    await checkAndSyncFoods(); // Kiểm tra và đồng bộ dữ liệu món ăn
    await checkAndSyncRevenue(); // Kiểm tra và đồng bộ dữ liệu doanh thu
    const foods = await getFoodsFromIndexedDB(); // Lấy dữ liệu món ăn từ IndexedDB
    renderFoodList(foods); // Hiển thị món ăn lên giao diện
    listenToFirebase(); // Lắng nghe Firebase để cập nhật IndexedDB khi có thay đổi
});


let indexedDBInstance = null;
export async function openIndexedDB() {
    if (indexedDBInstance) {
        console.log("⚡ IndexedDB đã mở trước đó!");
        return indexedDBInstance;
    }

    console.log("⏳ Đang mở IndexedDB...");

    return new Promise((resolve, reject) => {
        let request = indexedDB.open("FoodDB", 4); // Phiên bản 4, đảm bảo là phiên bản mới

        request.onupgradeneeded = function (event) {
            console.log("🔄 Đang nâng cấp IndexedDB...");
            let db = event.target.result;

            // Tạo store foods nếu chưa có
            if (!db.objectStoreNames.contains("foods")) {
                db.createObjectStore("foods", { keyPath: "id" });
                console.log("✅ Đã tạo object store 'foods'.");
            } else {
                console.log("📂 Object store 'foods' đã tồn tại.");
            }

            // Tạo store revenue nếu chưa có
            if (!db.objectStoreNames.contains("revenue")) {
                db.createObjectStore("revenue", { keyPath: "id" });
                console.log("✅ Đã tạo object store 'revenue'.");
            } else {
                console.log("📂 Object store 'revenue' đã tồn tại.");
            }
        };

        request.onsuccess = function (event) {
            let db = event.target.result;
            console.log("✅ IndexedDB đã mở thành công!");
            indexedDBInstance = db;
            resolve(db);
        };

        request.onerror = function (event) {
            console.error("❌ Lỗi mở IndexedDB:", event.target.error);
            reject("❌ Lỗi mở IndexedDB!");
        };
    });
}

// ===========================
// 🗄 **Lấy dữ liệu từ IndexedDB**
// ===========================
async function getFoodsFromIndexedDB() {
    let db = await openIndexedDB();
    return new Promise((resolve) => {
        let transaction = db.transaction("foods", "readonly");
        let store = transaction.objectStore("foods");
        let request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

// ===========================
// 🔄 **Cập nhật IndexedDB từ Firebase**
// ===========================
async function updateFoodsInIndexedDB(firebaseData) {
    let db = await openIndexedDB();
    return new Promise((resolve) => {
        let transaction = db.transaction("foods", "readwrite");
        let store = transaction.objectStore("foods");
        store.clear(); // Xóa dữ liệu cũ
        firebaseData.forEach(food => store.put(food)); // Cập nhật dữ liệu mới
        transaction.oncomplete = () => resolve();
    });
}

// ===========================
// 🔄 **Lắng nghe Firebase để cập nhật giao diện**
// ===========================
export function listenToFirebase() {
    console.log("👀 Đang lắng nghe Firebase để cập nhật giao diện...");

    onSnapshot(collection(db, "foods"), async (snapshot) => {
        let firebaseData = snapshot.docs.map(doc => ({
            id: parseInt(doc.id, 10),
            ...doc.data()
        }));

        console.log("⚡ Firebase thay đổi! Cập nhật IndexedDB và giao diện...", firebaseData);

        await updateFoodsInIndexedDB(firebaseData); // Cập nhật IndexedDB
        renderFoodList(firebaseData); // Cập nhật giao diện
    });
}

// ===========================
// 🔍 **So sánh IndexedDB và Firebase**
// ===========================
async function checkAndSyncFoods() {
    console.log("🔍 Kiểm tra đồng bộ dữ liệu giữa IndexedDB & Firebase...");

    let indexedDBData = await getFoodsFromIndexedDB();
    let firebaseData = [];

    // Lấy dữ liệu từ Firebase
    const snapshot = await getDocs(collection(db, "foods"));
    firebaseData = snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data()
    }));

    // So sánh dữ liệu
    let isSynced = JSON.stringify(indexedDBData) === JSON.stringify(firebaseData);
    
    if (!isSynced) {
        console.log("⚠️ Dữ liệu không đồng bộ! Tiến hành cập nhật IndexedDB từ Firebase...");
        await updateFoodsInIndexedDB(firebaseData);
        console.log("✅ IndexedDB đã cập nhật!");
    } else {
        console.log("✅ Dữ liệu đã đồng bộ!");
    }

    renderFoodList(indexedDBData);
 // Hiển thị dữ liệu từ IndexedDB nếu có
}
// index.js
// index.js hoặc file quản lý IndexedDB của bạn

// Lấy tất cả các món ăn từ IndexedDB
// Hàm lấy tất cả món ăn từ IndexedDB
// Lấy tất cả món ăn từ IndexedDB
export function getAllFoodsFromIndexedDB() {
    return new Promise(async (resolve, reject) => {
        // Đảm bảo IndexedDB đã mở
        await openIndexedDB();  // Đợi mở IndexedDB trước khi làm gì đó

        const db = indexedDBInstance;  // Sử dụng instance của IndexedDB đã mở
        const transaction = db.transaction("foods", "readonly");
        const objectStore = transaction.objectStore("foods");

        const request = objectStore.getAll();  // Lấy tất cả món ăn
        request.onsuccess = function(event) {
            resolve(event.target.result);  // Trả về kết quả món ăn
        };

        request.onerror = function(event) {
            reject("❌ Lỗi lấy món ăn từ IndexedDB");
        };
    });
}

// Lấy dữ liệu doanh thu từ IndexedDB
async function getRevenueFromIndexedDB() {
    let db = await openIndexedDB();
    return new Promise((resolve) => {
        let transaction = db.transaction("revenue", "readonly");
        let store = transaction.objectStore("revenue");
        let request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}
// Lấy dữ liệu doanh thu từ Firebase
async function getRevenueFromFirebase() {
    const snapshot = await getDocs(collection(db, "revenue"));
    return snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data()
    }));
}
// So sánh và đồng bộ dữ liệu doanh thu giữa Firebase và IndexedDB
async function checkAndSyncRevenue() {
    console.log("🔍 Kiểm tra đồng bộ dữ liệu doanh thu giữa IndexedDB & Firebase...");

    let indexedDBRevenue = await getRevenueFromIndexedDB();
    let firebaseRevenue = await getRevenueFromFirebase();

    // So sánh dữ liệu doanh thu giữa Firebase và IndexedDB
    let isSynced = JSON.stringify(indexedDBRevenue) === JSON.stringify(firebaseRevenue);

    if (!isSynced) {
        console.log("⚠️ Dữ liệu doanh thu không đồng bộ! Tiến hành cập nhật IndexedDB từ Firebase...");
        await updateRevenueInIndexedDB(firebaseRevenue);
        console.log("✅ Dữ liệu doanh thu trong IndexedDB đã được cập nhật!");
    } else {
        console.log("✅ Dữ liệu doanh thu đã đồng bộ!");
    }
}

// Cập nhật dữ liệu doanh thu từ Firebase vào IndexedDB
async function updateRevenueInIndexedDB(firebaseData) {
    if (firebaseData.length === 0) {
        console.log("⚠️ Không có dữ liệu doanh thu để cập nhật từ Firebase!");
        return;
    }

    let db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        let transaction = db.transaction("revenue", "readwrite");
        let store = transaction.objectStore("revenue");

        // Xóa dữ liệu cũ và thêm dữ liệu mới
        store.clear(); // Xóa dữ liệu cũ trước khi cập nhật
        firebaseData.forEach(revenue => {
            store.put(revenue); // Thêm dữ liệu vào IndexedDB
        });

        transaction.oncomplete = () => {
            console.log("✅ Dữ liệu doanh thu đã được cập nhật vào IndexedDB!");
            resolve();
        };

        transaction.onerror = (event) => {
            console.error("❌ Lỗi khi cập nhật doanh thu vào IndexedDB:", event.target.error);
            reject("❌ Lỗi khi cập nhật doanh thu vào IndexedDB!");
        };
    });
}


// ===========================
// 📦 **Lưu doanh thu vào IndexedDB**
// ===========================
export function saveRevenueToIndexedDB(revenueData) {
    return new Promise(async (resolve, reject) => {
        let db = await openIndexedDB();
        let transaction = db.transaction("revenue", "readwrite");
        let store = transaction.objectStore("revenue");

        // Lưu dữ liệu doanh thu vào object store 'revenue'
        store.put(revenueData);

        transaction.oncomplete = () => {
            console.log("✅ Doanh thu đã được lưu vào IndexedDB!");
            resolve();
        };

        transaction.onerror = () => {
            console.error("❌ Lỗi khi lưu doanh thu vào IndexedDB!");
            reject("❌ Lỗi khi lưu doanh thu vào IndexedDB!");
        };
    });
}


// ===========================
// ✅ Chạy khi trang load
// ===========================
