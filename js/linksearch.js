// 秒链搜索功能模块
(function() {
    let lastKeyword = '';
    
    function triggerSearch() {
        // 如果没有选中文件，自动选中第一个
        if (window.JsonManager && typeof window.JsonManager.getSelectedFile === 'function') {
            let selected = window.JsonManager.getSelectedFile();
            if (!selected) {
                let all = window.JsonManager.getAllFiles && window.JsonManager.getAllFiles();
                if (all && all.length > 0 && window.JsonManager.setSelectedFile) {
                    window.JsonManager.setSelectedFile(all[0].id);
                }
            } else {
                // 关键：重新选中当前文件，强制刷新
                if (window.JsonManager.setSelectedFile) {
                    window.JsonManager.setSelectedFile(selected.id);
                }
            }
        }
        
        // 关键：强制刷新文件列表（会带动表格刷新）
        if (window.UIHandler && window.UIHandler.renderFileList) {
            window.UIHandler.renderFileList();
        }
        
        if (window.UIHandler && window.UIHandler.updateButtonStates) {
            window.UIHandler.updateButtonStates();
        }
        
        if (lastKeyword) {
            window.UIUtils && window.UIUtils.showNotification(`正在搜索: "${lastKeyword}"`);
        }
    }
    
    function updateClearButton() {
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.style.display = lastKeyword ? 'block' : 'none';
        }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        const input = document.getElementById('link-search-input');
        const btn = document.getElementById('link-search-btn');
        const clearBtn = document.getElementById('clear-search-btn');
        
        if (!input) return;
        
        // 输入框变化时实时搜索
        input.addEventListener('input', function() {
            lastKeyword = input.value.trim().toLowerCase();
            updateClearButton();
            // 实时搜索，延迟300ms避免频繁触发
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                triggerSearch();
            }, 300);
        });
        
        // 回车键搜索
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                lastKeyword = input.value.trim().toLowerCase();
                updateClearButton();
                triggerSearch();
            }
        });
        
        // 搜索按钮点击
        if (btn) {
            btn.addEventListener('click', function() {
                lastKeyword = input.value.trim().toLowerCase();
                updateClearButton();
                triggerSearch();
            });
        }
        
        // 清空搜索按钮点击
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                lastKeyword = '';
                input.value = '';
                updateClearButton();
                triggerSearch();
                window.UIUtils && window.UIUtils.showNotification('已清空搜索');
            });
        }
    });
    
    window.LinkSearch = {
        getKeyword: function() { 
            return lastKeyword; 
        },
        clearSearch: function() {
            lastKeyword = '';
            const input = document.getElementById('link-search-input');
            if (input) {
                input.value = '';
            }
            updateClearButton();
            triggerSearch();
        }
    };
})(); 