// ==========================================================================
// 1. Khai báo biến toàn cục
// ==========================================================================
let currentPage = 1;
const transactionsPerPage = 10;
let currentTab = 'tab1';
let transactionsData = [];
let monthlyData = [];
let searchResults = [];
let keywordsData = [];
let categories = [];

// ==========================================================================
// 2. Hàm khởi tạo ứng dụng
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo ngày mặc định
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    document.getElementById('addDate').value = today;
    document.getElementById('editDate').value = today;

    // Thiết lập tháng hiện tại
    const currentMonth = new Date().getMonth() + 1;
    document.getElementById('startMonth').value = currentMonth;
    document.getElementById('endMonth').value = currentMonth;
    document.getElementById('expenseMonth').value = currentMonth;
    document.getElementById('searchMonth').value = currentMonth;

    // Đăng ký sự kiện
    setupEventListeners();
    
    // Tải dữ liệu ban đầu
    loadInitialData();
    
    // Hiển thị tab đầu tiên
    showTab(currentTab);
});

// ==========================================================================
// 3. Thiết lập sự kiện
// ==========================================================================
function setupEventListeners() {
    // Chuyển tab
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            currentTab = this.getAttribute('data-tab');
            showTab(currentTab);
        });
    });

    // Tab 1: Giao dịch trong ngày
    document.getElementById('fetchTransactionsBtn').addEventListener('click', fetchDailyTransactions);
    document.getElementById('addTransactionBtn').addEventListener('click', openAddForm);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Tab 2: Thống kê
    document.getElementById('fetchDataBtn').addEventListener('click', fetchStatistics);

    // Tab 3: Biểu đồ thu chi
    document.getElementById('fetchMonthlyDataBtn').addEventListener('click', fetchMonthlyChart);

    // Tab 5: Chi tiêu trong tháng
    document.getElementById('fetchMonthlyExpensesBtn').addEventListener('click', fetchMonthlyExpenses);
    document.getElementById('prevPageMonthly').addEventListener('click', () => changeMonthlyPage(-1));
    document.getElementById('nextPageMonthly').addEventListener('click', () => changeMonthlyPage(1));

    // Tab 6: Tìm kiếm
    document.getElementById('searchTransactionsBtn').addEventListener('click', searchTransactions);
    document.getElementById('prevPageSearch').addEventListener('click', () => changeSearchPage(-1));
    document.getElementById('nextPageSearch').addEventListener('click', () => changeSearchPage(1));

    // Tab 7: Từ khóa
    document.getElementById('addKeywordBtn').addEventListener('click', addKeyword);
    document.getElementById('deleteKeywordBtn').addEventListener('click', deleteKeyword);
    document.getElementById('fetchKeywordsBtn').addEventListener('click', fetchKeywords);

    // Modal
    document.getElementById('editForm').addEventListener('submit', saveEditedTransaction);
    document.getElementById('addForm').addEventListener('submit', saveNewTransaction);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

// ==========================================================================
// 4. Hàm xử lý tab
// ==========================================================================
function showTab(tabId) {
    // Ẩn tất cả tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hiển thị tab được chọn
    document.getElementById(tabId).classList.add('active');
    
    // Cập nhật navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });
    
    // Reset phân trang
    currentPage = 1;
    
    // Xử lý đặc biệt cho từng tab
    if (tabId === 'tab1') {
        fetchDailyTransactions();
    } else if (tabId === 'tab2') {
        fetchStatistics();
    } else if (tabId === 'tab3') {
        fetchMonthlyChart();
    } else if (tabId === 'tab5') {
        fetchMonthlyExpenses();
    } else if (tabId === 'tab7') {
        fetchCategories();
    }
}

// ==========================================================================
// 5. Hàm tải dữ liệu ban đầu
// ==========================================================================
async function loadInitialData() {
    try {
        // Tải danh mục từ "Google Sheet"
        const response = await fetch('data/categories.json');
        const data = await response.json();
        categories = [...data.income_categories, ...data.expense_categories];
        
        // Điền danh mục vào các dropdown
        populateCategoryDropdowns();
        
        // Tải dữ liệu giao dịch
        await fetchDailyTransactions();
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', error);
        showError('tab1', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    }
}

// ==========================================================================
// 6. Hàm xử lý danh mục
// ==========================================================================
function populateCategoryDropdowns() {
    const dropdowns = [
        'editCategory', 
        'addCategory', 
        'searchCategory', 
        'keywordCategory'
    ];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        dropdown.innerHTML = '<option value="">Chọn phân loại</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            dropdown.appendChild(option);
        });
    });
}

// ==========================================================================
// 7. Tab 1: Giao dịch trong ngày
// ==========================================================================
async function fetchDailyTransactions() {
    const date = document.getElementById('transactionDate').value;
    showLoading('tab1');
    hideMessages('tab1');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/transactions.json');
        const data = await response.json();
        
        // Lọc theo ngày
        transactionsData = data.transactions.filter(t => t.date === date);
        
        // Hiển thị kết quả
        displayDailyTransactions();
        updateDailySummary();
        
        showSuccess('tab1', `Đã tải ${transactionsData.length} giao dịch`);
    } catch (error) {
        console.error('Lỗi khi tải giao dịch:', error);
        showError('tab1', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab1');
    }
}

function displayDailyTransactions() {
    const container = document.getElementById('transactionsContainer');
    container.innerHTML = '';
    
    // Tính toán phân trang
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedData = transactionsData.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        container.innerHTML = '<div class="no-data">Không có giao dịch nào</div>';
        return;
    }
    
    // Hiển thị giao dịch
    paginatedData.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        transactionEl.innerHTML = `
            <div class="transaction-content">
                <div class="transaction-title">${transaction.content}</div>
                <div class="transaction-meta">
                    ${transaction.date} | ${transaction.category} ${transaction.note ? '| ' + transaction.note : ''}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type === 'Thu nhập' ? 'income-amount' : 'expense-amount'}">
                ${transaction.type === 'Thu nhập' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="actions">
                <button class="action-btn edit-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(transactionEl);
    });
    
    // Cập nhật phân trang
    updatePagination(transactionsData.length, 'pageInfo', 'prevPage', 'nextPage');
    
    // Thêm sự kiện cho nút chỉnh sửa/xóa
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openConfirmDelete(btn.dataset.id));
    });
}

function updateDailySummary() {
    const income = transactionsData
        .filter(t => t.type === 'Thu nhập')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const expense = transactionsData
        .filter(t => t.type === 'Chi tiêu')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const balance = income - expense;
    
    document.querySelector('#dailySummary .income .amount').textContent = formatCurrency(income);
    document.querySelector('#dailySummary .expense .amount').textContent = formatCurrency(expense);
    document.querySelector('#dailySummary .balance .amount').textContent = formatCurrency(balance);
}

// ==========================================================================
// 8. Tab 2: Thống kê
// ==========================================================================
async function fetchStatistics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showError('tab2', 'Vui lòng chọn khoảng thời gian');
        return;
    }
    
    showLoading('tab2');
    hideMessages('tab2');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/transactions.json');
        const data = await response.json();
        
        // Lọc theo khoảng thời gian
        const filteredData = data.transactions.filter(t => {
            return t.date >= startDate && t.date <= endDate;
        });
        
        // Hiển thị kết quả
        updateStatisticsSummary(filteredData);
        renderStatisticsChart(filteredData);
        
        showSuccess('tab2', `Đã tải ${filteredData.length} giao dịch`);
    } catch (error) {
        console.error('Lỗi khi tải thống kê:', error);
        showError('tab2', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab2');
    }
}

function updateStatisticsSummary(transactions) {
    const income = transactions
        .filter(t => t.type === 'Thu nhập')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const expense = transactions
        .filter(t => t.type === 'Chi tiêu')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const balance = income - expense;
    
    document.querySelector('#statsContainer .income .amount').textContent = formatCurrency(income);
    document.querySelector('#statsContainer .expense .amount').textContent = formatCurrency(expense);
    document.querySelector('#statsContainer .balance .amount').textContent = formatCurrency(balance);
}

function renderStatisticsChart(transactions) {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Nhóm dữ liệu theo category
    const categoryMap = {};
    
    transactions.forEach(t => {
        if (t.type === 'Chi tiêu') {
            if (!categoryMap[t.category]) {
                categoryMap[t.category] = 0;
            }
            categoryMap[t.category] += t.amount;
        }
    });
    
    // Chuẩn bị dữ liệu cho biểu đồ
    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
    // Tạo màu ngẫu nhiên
    const backgroundColors = labels.map(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });
    
    // Hủy biểu đồ cũ nếu tồn tại
    if (window.statisticsChart) {
        window.statisticsChart.destroy();
    }
    
    // Tạo biểu đồ mới
    window.statisticsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Tạo legend tùy chỉnh
    createCustomLegend(labels, backgroundColors, data);
}

function createCustomLegend(labels, colors, values) {
    const total = values.reduce((a, b) => a + b, 0);
    const legendContainer = document.getElementById('customLegend');
    legendContainer.innerHTML = '';
    
    labels.forEach((label, index) => {
        const percentage = Math.round((values[index] / total) * 100);
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${colors[index]}"></div>
            <div class="legend-label">${label}</div>
            <div class="legend-value">${formatCurrency(values[index])} (${percentage}%)</div>
        `;
        legendContainer.appendChild(legendItem);
    });
}

// ==========================================================================
// 9. Tab 3: Biểu đồ thu chi theo tháng
// ==========================================================================
async function fetchMonthlyChart() {
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const endMonth = parseInt(document.getElementById('endMonth').value);
    
    if (startMonth > endMonth) {
        showError('tab3', 'Tháng bắt đầu phải nhỏ hơn tháng kết thúc');
        return;
    }
    
    showLoading('tab3');
    hideMessages('tab3');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/transactions.json');
        const data = await response.json();
        
        // Lọc và nhóm dữ liệu theo tháng
        monthlyData = [];
        const months = [];
        
        for (let month = startMonth; month <= endMonth; month++) {
            const monthData = data.transactions.filter(t => {
                const transactionMonth = parseInt(t.date.split('-')[1]);
                return transactionMonth === month;
            });
            
            const income = monthData
                .filter(t => t.type === 'Thu nhập')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expense = monthData
                .filter(t => t.type === 'Chi tiêu')
                .reduce((sum, t) => sum + t.amount, 0);
                
            monthlyData.push({ month, income, expense });
            months.push(`Tháng ${month}`);
        }
        
        // Hiển thị biểu đồ
        renderMonthlyChart(months);
        
        showSuccess('tab3', `Đã tải dữ liệu cho ${months.length} tháng`);
    } catch (error) {
        console.error('Lỗi khi tải biểu đồ:', error);
        showError('tab3', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab3');
    }
}

function renderMonthlyChart(months) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Hủy biểu đồ cũ nếu tồn tại
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }
    
    // Tạo biểu đồ mới
    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Thu nhập',
                    data: monthlyData.map(d => d.income),
                    backgroundColor: 'rgba(28, 200, 138, 0.7)',
                    borderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Chi tiêu',
                    data: monthlyData.map(d => d.expense),
                    backgroundColor: 'rgba(231, 74, 59, 0.7)',
                    borderColor: 'rgba(231, 74, 59, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Tạo legend
    createMonthlyLegend();
}

function createMonthlyLegend() {
    const legendContainer = document.getElementById('monthlyLegend');
    legendContainer.innerHTML = '';
    
    const incomeItem = document.createElement('div');
    incomeItem.className = 'legend-item';
    incomeItem.innerHTML = `
        <div class="legend-color" style="background-color: rgba(28, 200, 138, 0.7)"></div>
        <div class="legend-label">Thu nhập</div>
    `;
    
    const expenseItem = document.createElement('div');
    expenseItem.className = 'legend-item';
    expenseItem.innerHTML = `
        <div class="legend-color" style="background-color: rgba(231, 74, 59, 0.7)"></div>
        <div class="legend-label">Chi tiêu</div>
    `;
    
    legendContainer.appendChild(incomeItem);
    legendContainer.appendChild(expenseItem);
}

// ==========================================================================
// 10. Tab 5: Chi tiêu trong tháng
// ==========================================================================
async function fetchMonthlyExpenses() {
    const month = parseInt(document.getElementById('expenseMonth').value);
    showLoading('tab5');
    hideMessages('tab5');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/transactions.json');
        const data = await response.json();
        
        // Lọc theo tháng
        transactionsData = data.transactions.filter(t => {
            const transactionMonth = parseInt(t.date.split('-')[1]);
            return transactionMonth === month;
        });
        
        // Hiển thị kết quả
        displayMonthlyExpenses();
        updateMonthlyExpenseSummary();
        
        showSuccess('tab5', `Đã tải ${transactionsData.length} giao dịch`);
    } catch (error) {
        console.error('Lỗi khi tải giao dịch:', error);
        showError('tab5', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab5');
    }
}

function displayMonthlyExpenses() {
    const container = document.getElementById('monthlyExpensesContainer');
    container.innerHTML = '';
    
    // Tính toán phân trang
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedData = transactionsData.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        container.innerHTML = '<div class="no-data">Không có giao dịch nào</div>';
        return;
    }
    
    // Hiển thị giao dịch
    paginatedData.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        transactionEl.innerHTML = `
            <div class="transaction-content">
                <div class="transaction-title">${transaction.content}</div>
                <div class="transaction-meta">
                    ${transaction.date} | ${transaction.category} ${transaction.note ? '| ' + transaction.note : ''}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type === 'Thu nhập' ? 'income-amount' : 'expense-amount'}">
                ${transaction.type === 'Thu nhập' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="actions">
                <button class="action-btn edit-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(transactionEl);
    });
    
    // Cập nhật phân trang
    updatePagination(transactionsData.length, 'pageInfoMonthly', 'prevPageMonthly', 'nextPageMonthly');
    
    // Thêm sự kiện cho nút chỉnh sửa/xóa
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditForm(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openConfirmDelete(btn.dataset.id));
    });
}

function updateMonthlyExpenseSummary() {
    const income = transactionsData
        .filter(t => t.type === 'Thu nhập')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const expense = transactionsData
        .filter(t => t.type === 'Chi tiêu')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const balance = income - expense;
    
    document.querySelector('#monthlyExpenseSummary .income .amount').textContent = formatCurrency(income);
    document.querySelector('#monthlyExpenseSummary .expense .amount').textContent = formatCurrency(expense);
    document.querySelector('#monthlyExpenseSummary .balance .amount').textContent = formatCurrency(balance);
}

// ==========================================================================
// 11. Tab 6: Tìm kiếm giao dịch
// ==========================================================================
async function searchTransactions() {
    const month = document.getElementById('searchMonth').value;
    const content = document.getElementById('searchContent').value.trim();
    const amount = document.getElementById('searchAmount').value.trim();
    const category = document.getElementById('searchCategory').value;
    
    if (!content && !amount && !category) {
        showError('tab6', 'Vui lòng nhập ít nhất một tiêu chí tìm kiếm');
        return;
    }
    
    showLoading('tab6');
    hideMessages('tab6');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/transactions.json');
        const data = await response.json();
        
        // Lọc theo tiêu chí
        searchResults = data.transactions.filter(t => {
            // Lọc theo tháng
            if (month) {
                const transactionMonth = parseInt(t.date.split('-')[1]);
                if (transactionMonth !== parseInt(month)) return false;
            }
            
            // Lọc theo nội dung
            if (content && !t.content.toLowerCase().includes(content.toLowerCase())) {
                return false;
            }
            
            // Lọc theo số tiền
            if (amount) {
                const searchAmount = parseInt(amount.replace(/\./g, ''));
                if (t.amount !== searchAmount) return false;
            }
            
            // Lọc theo danh mục
            if (category && t.category !== category) {
                return false;
            }
            
            return true;
        });
        
        // Hiển thị kết quả
        displaySearchResults();
        
        showSuccess('tab6', `Tìm thấy ${searchResults.length} giao dịch`);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        showError('tab6', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab6');
    }
}

function displaySearchResults() {
    const container = document.getElementById('searchResultsContainer');
    container.innerHTML = '';
    
    // Tính toán phân trang
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedData = searchResults.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        container.innerHTML = '<div class="no-data">Không tìm thấy giao dịch nào</div>';
        return;
    }
    
    // Hiển thị kết quả
    paginatedData.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        transactionEl.innerHTML = `
            <div class="transaction-content">
                <div class="transaction-title">${transaction.content}</div>
                <div class="transaction-meta">
                    ${transaction.date} | ${transaction.category} ${transaction.note ? '| ' + transaction.note : ''}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type === 'Thu nhập' ? 'income-amount' : 'expense-amount'}">
                ${transaction.type === 'Thu nhập' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
        `;
        container.appendChild(transactionEl);
    });
    
    // Cập nhật phân trang
    updatePagination(searchResults.length, 'pageInfoSearch', 'prevPageSearch', 'nextPageSearch');
}

// ==========================================================================
// 12. Tab 7: Quản lý từ khóa
// ==========================================================================
async function fetchCategories() {
    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/categories.json');
        const data = await response.json();
        categories = [...data.income_categories, ...data.expense_categories];
        
        // Điền danh mục vào dropdown
        populateCategoryDropdowns();
        
        // Tải từ khóa
        fetchKeywords();
        
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        showError('tab7', 'Không thể tải danh mục. Vui lòng thử lại sau.');
    }
}

async function fetchKeywords() {
    showLoading('tab7');
    hideMessages('tab7');

    try {
        // Giả lập API call đến Google Sheet
        const response = await fetch('data/keywords.json');
        keywordsData = await response.json();
        
        // Hiển thị từ khóa
        displayKeywords();
        
        showSuccess('tab7', `Đã tải ${keywordsData.length} từ khóa`);
    } catch (error) {
        console.error('Lỗi khi tải từ khóa:', error);
        showError('tab7', 'Không thể tải từ khóa. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab7');
    }
}

function displayKeywords() {
    const container = document.getElementById('keywordsContainer');
    container.innerHTML = '';
    
    if (keywordsData.length === 0) {
        container.innerHTML = '<div class="no-data">Không có từ khóa nào</div>';
        return;
    }
    
    // Hiển thị từ khóa theo danh mục
    const categoriesMap = {};
    
    keywordsData.forEach(keyword => {
        if (!categoriesMap[keyword.category]) {
            categoriesMap[keyword.category] = [];
        }
        categoriesMap[keyword.category].push(keyword.keyword);
    });
    
    Object.keys(categoriesMap).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `<h3>${category}</h3>`;
        
        const keywordsList = document.createElement('div');
        keywordsList.className = 'keywords-list';
        
        categoriesMap[category].forEach(keyword => {
            const keywordItem = document.createElement('div');
            keywordItem.className = 'keyword-item';
            keywordItem.textContent = keyword;
            keywordsList.appendChild(keywordItem);
        });
        
        categorySection.appendChild(keywordsList);
        container.appendChild(categorySection);
    });
}

async function addKeyword() {
    const category = document.getElementById('keywordCategory').value;
    const keyword = document.getElementById('keywordInput').value.trim();
    
    if (!category || !keyword) {
        showError('tab7', 'Vui lòng chọn danh mục và nhập từ khóa');
        return;
    }
    
    showLoading('tab7');
    
    try {
        // Giả lập thêm từ khóa vào Google Sheet
        keywordsData.push({ category, keyword });
        
        // Hiển thị lại danh sách
        displayKeywords();
        
        // Reset form
        document.getElementById('keywordInput').value = '';
        
        showSuccess('tab7', `Đã thêm từ khóa "${keyword}" vào danh mục "${category}"`);
    } catch (error) {
        console.error('Lỗi khi thêm từ khóa:', error);
        showError('tab7', 'Không thể thêm từ khóa. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab7');
    }
}

async function deleteKeyword() {
    const category = document.getElementById('keywordCategory').value;
    const keyword = document.getElementById('keywordInput').value.trim();
    
    if (!category || !keyword) {
        showError('tab7', 'Vui lòng chọn danh mục và nhập từ khóa');
        return;
    }
    
    showLoading('tab7');
    
    try {
        // Giả lập xóa từ khóa khỏi Google Sheet
        const index = keywordsData.findIndex(k => 
            k.category === category && k.keyword === keyword
        );
        
        if (index === -1) {
            showError('tab7', 'Không tìm thấy từ khóa này trong danh mục');
            return;
        }
        
        keywordsData.splice(index, 1);
        
        // Hiển thị lại danh sách
        displayKeywords();
        
        // Reset form
        document.getElementById('keywordInput').value = '';
        
        showSuccess('tab7', `Đã xóa từ khóa "${keyword}" khỏi danh mục "${category}"`);
    } catch (error) {
        console.error('Lỗi khi xóa từ khóa:', error);
        showError('tab7', 'Không thể xóa từ khóa. Vui lòng thử lại sau.');
    } finally {
        hideLoading('tab7');
    }
}

// ==========================================================================
// 13. Modal quản lý giao dịch
// ==========================================================================
function openEditForm(transactionId) {
    // Tìm giao dịch
    const transaction = [...transactionsData, ...searchResults].find(t => t.id === transactionId);
    
    if (!transaction) return;
    
    // Điền dữ liệu vào form
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editDate').value = transaction.date;
    document.getElementById('editContent').value = transaction.content;
    document.getElementById('editAmount').value = formatCurrencyInput(transaction.amount);
    document.getElementById('editType').value = transaction.type;
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editNote').value = transaction.note || '';
    
    // Hiển thị modal
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditForm() {
    document.getElementById('editModal').style.display = 'none';
}

function openAddForm() {
    // Reset form
    document.getElementById('addDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addContent').value = '';
    document.getElementById('addAmount').value = '';
    document.getElementById('addType').value = 'Chi tiêu';
    document.getElementById('addCategory').value = '';
    document.getElementById('addNote').value = '';
    
    // Hiển thị modal
    document.getElementById('addModal').style.display = 'flex';
}

function closeAddForm() {
    document.getElementById('addModal').style.display = 'none';
}

function openConfirmDelete(transactionId) {
    // Lưu ID giao dịch cần xóa
    document.getElementById('confirmDeleteBtn').dataset.id = transactionId;
    
    // Hiển thị modal
    document.getElementById('confirmDeleteModal').style.display = 'flex';
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
}

async function saveEditedTransaction(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTransactionId').value;
    const date = document.getElementById('editDate').value;
    const content = document.getElementById('editContent').value.trim();
    const amount = parseInt(document.getElementById('editAmount').value.replace(/\./g, ''));
    const type = document.getElementById('editType').value;
    const category = document.getElementById('editCategory').value;
    const note = document.getElementById('editNote').value.trim();
    
    if (!date || !content || !amount || !category) {
        document.getElementById('editError').textContent = 'Vui lòng điền đầy đủ thông tin';
        return;
    }
    
    try {
        // Giả lập cập nhật trên Google Sheet
        const transactionIndex = transactionsData.findIndex(t => t.id === id);
        if (transactionIndex !== -1) {
            transactionsData[transactionIndex] = {
                ...transactionsData[transactionIndex],
                date,
                content,
                amount,
                type,
                category,
                note
            };
        }
        
        // Đóng modal và làm mới dữ liệu
        closeEditForm();
        
        // Làm mới tab hiện tại
        if (currentTab === 'tab1') {
            displayDailyTransactions();
            updateDailySummary();
        } else if (currentTab === 'tab5') {
            displayMonthlyExpenses();
            updateMonthlyExpenseSummary();
        }
        
        showSuccess(currentTab, 'Đã cập nhật giao dịch thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật giao dịch:', error);
        showError(currentTab, 'Không thể cập nhật giao dịch. Vui lòng thử lại sau.');
    }
}

async function saveNewTransaction(e) {
    e.preventDefault();
    
    const date = document.getElementById('addDate').value;
    const content = document.getElementById('addContent').value.trim();
    const amount = parseInt(document.getElementById('addAmount').value.replace(/\./g, ''));
    const type = document.getElementById('addType').value;
    const category = document.getElementById('addCategory').value;
    const note = document.getElementById('addNote').value.trim();
    
    if (!date || !content || !amount || !category) {
        document.getElementById('addError').textContent = 'Vui lòng điền đầy đủ thông tin';
        return;
    }
    
    try {
        // Giả lập thêm giao dịch vào Google Sheet
        const newTransaction = {
            id: 'GD' + Math.floor(Math.random() * 10000),
            date,
            content,
            amount,
            type,
            category,
            note
        };
        
        transactionsData.unshift(newTransaction);
        
        // Đóng modal và làm mới dữ liệu
        closeAddForm();
        
        // Làm mới tab hiện tại
        if (currentTab === 'tab1') {
            displayDailyTransactions();
            updateDailySummary();
        } else if (currentTab === 'tab5') {
            displayMonthlyExpenses();
            updateMonthlyExpenseSummary();
        }
        
        showSuccess(currentTab, 'Đã thêm giao dịch mới thành công');
    } catch (error) {
        console.error('Lỗi khi thêm giao dịch:', error);
        showError(currentTab, 'Không thể thêm giao dịch. Vui lòng thử lại sau.');
    }
}

async function confirmDelete() {
    const transactionId = document.getElementById('confirmDeleteBtn').dataset.id;
    
    try {
        // Giả lập xóa giao dịch trên Google Sheet
        const transactionIndex = transactionsData.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            transactionsData.splice(transactionIndex, 1);
        }
        
        // Đóng modal và làm mới dữ liệu
        closeConfirmDeleteModal();
        
        // Làm mới tab hiện tại
        if (currentTab === 'tab1') {
            displayDailyTransactions();
            updateDailySummary();
        } else if (currentTab === 'tab5') {
            displayMonthlyExpenses();
            updateMonthlyExpenseSummary();
        }
        
        showSuccess(currentTab, 'Đã xóa giao dịch thành công');
    } catch (error) {
        console.error('Lỗi khi xóa giao dịch:', error);
        showError(currentTab, 'Không thể xóa giao dịch. Vui lòng thử lại sau.');
    }
}

// ==========================================================================
// 14. Hàm tiện ích
// ==========================================================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatCurrencyInput(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function updatePagination(totalItems, pageInfoId, prevBtnId, nextBtnId) {
    const totalPages = Math.ceil(totalItems / transactionsPerPage);
    document.getElementById(pageInfoId).textContent = `Trang ${currentPage}/${totalPages}`;
    
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
    const totalPages = Math.ceil(transactionsData.length / transactionsPerPage);
    currentPage += direction;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    displayDailyTransactions();
}

function changeMonthlyPage(direction) {
    const totalPages = Math.ceil(transactionsData.length / transactionsPerPage);
    currentPage += direction;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    displayMonthlyExpenses();
}

function changeSearchPage(direction) {
    const totalPages = Math.ceil(searchResults.length / transactionsPerPage);
    currentPage += direction;
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    displaySearchResults();
}

function showLoading(tabId) {
    document.getElementById(`loading${tabId.charAt(3).toUpperCase() + tabId.slice(4)}`).style.display = 'block';
}

function hideLoading(tabId) {
    document.getElementById(`loading${tabId.charAt(3).toUpperCase() + tabId.slice(4)}`).style.display = 'none';
}

function showError(tabId, message) {
    const errorElement = document.getElementById(`errorMessage${tabId.charAt(3).toUpperCase() + tabId.slice(4)}`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showSuccess(tabId, message) {
    const successElement = document.getElementById(`successMessage${tabId.charAt(3).toUpperCase() + tabId.slice(4)}`);
    successElement.textContent = message;
    successElement.style.display = 'block';
}

function hideMessages(tabId) {
    const tabNum = tabId.charAt(3).toUpperCase() + tabId.slice(4);
    document.getElementById(`errorMessageTab${tabNum}`).style.display = 'none';
    document.getElementById(`successMessageTab${tabNum}`).style.display = 'none';
}
