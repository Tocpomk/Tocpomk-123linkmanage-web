// linkTableEnhance.js
// 秒链展示区增强功能

function initLinkTableEnhance() {
    // 只绑定全部删除按钮事件
    document.addEventListener('DOMContentLoaded', function() {
        const delBtn = document.getElementById('delete-all-links-btn');
        if (!delBtn) return;
        delBtn.addEventListener('click', function() {
            const selectedFile = JsonManager.getSelectedFile();
            if (!selectedFile || !selectedFile.links.length) return;
            UIUtils.showConfirm('确定要删除全部链接吗？', function() {
                selectedFile.links = [];
                JsonManager.updateJsonFile(selectedFile.id, [], selectedFile.name);
                UIHandler.renderLinkTable();
                UIHandler.updateButtonStates();
                UIUtils.showNotification('已删除全部链接');
            });
        });
    });
    // 限制表格tbody最多显示7条，超出滚动，表头对齐
    document.addEventListener('DOMContentLoaded', () => {
        const tableSection = document.querySelector('.link-table-section');
        if (!tableSection) return;
        const table = tableSection.querySelector('table.link-table');
        if (!table) return;
        let thead = table.querySelector('thead');
        let tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        thead.style.display = 'table';
        thead.style.width = '100%';
        thead.style.tableLayout = 'fixed';
        tbody.style.display = 'block';
        tbody.style.maxHeight = '392px'; // 7行*56px
        tbody.style.overflowY = 'auto';
        tbody.style.width = '100%';
    });
}

window.initLinkTableEnhance = initLinkTableEnhance; 