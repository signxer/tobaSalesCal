// 初始化客户级别和库存
const customerLevels = 30;
const customers = Array(customerLevels).fill(0);  // 保存每个等级的客户数量
const skus = [];

// 生成客户输入表格
window.onload = () => {
    const tableBody = document.getElementById('customerTableBody');
    for (let i = 1; i <= customerLevels; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i}档</td>
            <td><input type="number" value="100" id="customerLevel${i}" min="0"></td>
        `;
        tableBody.appendChild(row);
    }
};

// 读取上传的商品库
document.getElementById('skuFile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const lines = e.target.result.split('\n');
        lines.slice(1).forEach(line => {  // 忽略第一行表头
            const [sku, stock] = line.split(',');
            if (sku && stock) {
                skus.push({ sku, stock: parseInt(stock, 10) });
            }
        });
    };
    reader.readAsText(file);
});

// 计算分配
function calculateDistribution() {
    // 获取比例
    const ratio = parseFloat(document.getElementById('ratio').value);

    // 获取客户数量
    for (let i = 1; i <= customerLevels; i++) {
        customers[i - 1] = parseInt(document.getElementById(`customerLevel${i}`).value);
    }

    const totalCustomers = customers.reduce((sum, num) => sum + num, 0);
    const resultTable = document.getElementById('resultTable');
    const resultTableBody = resultTable.getElementsByTagName('tbody')[0];
    const resultTableHead = resultTable.getElementsByTagName('thead')[0];
    resultTableBody.innerHTML = '';  // 清空之前的结果
    resultTableHead.innerHTML = '';  // 清空之前的表头

    // 添加表头（包括客户等级）
    let headerRow = `<tr><th>SKU</th><th>库存</th>`;
    for (let i = 1; i <= customerLevels; i++) {
        headerRow += `<th>${i}档</th>`;
    }
    headerRow += `<th>剩余</th>`;
    headerRow += `</tr>`;
    resultTableHead.innerHTML = headerRow;

    skus.forEach(sku => {
        const { sku: skuName, stock } = sku;
        let totalWeight = 0;
        let allocations = Array(customerLevels).fill(0); // 每个等级客户的分配量
        let remainingStock = stock;

        // 分配规则
        if (stock > totalCustomers) {

            // 0，库存充足，先每个人一份
            for (let level = customerLevels - 1; level >= 0 && remainingStock > 0; level--) {
                const levelCustomers = customers[level];
                if (levelCustomers > 0) {
                    allocations[level] = levelCustomers; // 分配给当前级别的客户
                    remainingStock -= allocations[level]; // 更新剩余库存
                }
            }

            //动态分配
            for (let i = 1; i <= 5; i++) {
                // 处理剩余库存，按优先级从高等级开始分配，并且优先保证最高等级
                for (let level = customerLevels - 1; level >= 0 && remainingStock > 0; level--) {
                    const levelCustomers = customers[level];
                    if (level == customerLevels - 1 && stock >= (totalCustomers * 1.5)) {
                        console.log(level,"AAA")
                        const lv30Number = allocations[customerLevels - 1] / customers[customerLevels - 1];
                        console.log(lv30Number,"lv30Number")
                        const lv1Number = allocations[0] / customers[0];
                        console.log(lv1Number,"lv1Number")
                        const needAddFive = (customers[customerLevels - 1] * (lv1Number * ratio - lv30Number));
                        console.log(needAddFive,"needAddFive")
                        if (lv30Number / lv1Number < ratio && remainingStock >= needAddFive) {
                            remainingStock -= needAddFive;
                            allocations[customerLevels - 1] += needAddFive;
                        }
                    } else {
                        if (levelCustomers > 0 && remainingStock >= levelCustomers) {
                            //1级客户只有满足剩余库存>ratio*lv30 + lv1 才能加
                            if (stock >= totalCustomers * 1.5) {
                                if (level > 0 || remainingStock >= (customers[0] + customers[customerLevels - 1] * ratio)) {
                                    console.log(level,"BBB")
                                    const additionalAllocation = levelCustomers;
                                    allocations[level] += additionalAllocation;
                                    remainingStock -= additionalAllocation;
                                }
                            } else {
                                const additionalAllocation = levelCustomers;
                                allocations[level] += additionalAllocation;
                                remainingStock -= additionalAllocation;
                            }
                        }
                    }
                }
            }
        } else {
            // 库存不足时，优先高等级分配
            for (let level = customerLevels - 1; level >= 0 && remainingStock > 0; level--) {
                const levelCustomers = customers[level];
                if (levelCustomers > 0) {
                    const allocationPerCustomer = Math.min(levelCustomers, remainingStock); // 每个客户的分配量
                    allocations[level] = Math.floor(allocationPerCustomer); // 分配给当前级别的客户
                    remainingStock -= allocations[level]; // 更新剩余库存
                    console.log(remainingStock, levelCustomers)
                }
            }
        }

        allocations.push(remainingStock);
        // 添加结果到表格中
        const row = document.createElement('tr');
        let allocationCells = allocations.map(allocation => `<td>${allocation}</td>`).join('');
        row.innerHTML = `
            <td>${skuName}</td>
            <td>${stock}</td>
            ${allocationCells}
        `;
        resultTableBody.appendChild(row);
    });
}

// 导出为CSV
function exportToCSV() {
    let csv = '';
    const resultTable = document.getElementById('resultTable');
    const rows = resultTable.querySelectorAll('tr');

    // 循环表格的行并转换为CSV格式
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => cell.innerText).join(',');
        csv += rowData + '\n';
    });

    // 创建下载链接并自动触发下载
    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'distribution_result.csv';
    hiddenElement.click();
}