/**
 * 文件合并功能模块
 */
const FileMerger = (() => {
    
    /**
     * 合并两个JSON文件
     * @param {string} file1Id - 第一个文件ID
     * @param {string} file2Id - 第二个文件ID
     * @returns {Object|null} 合并后的文件对象或null
     */
    function mergeFiles(file1Id, file2Id) {
        const file1 = JsonManager.getFileById(file1Id);
        const file2 = JsonManager.getFileById(file2Id);
        
        if (!file1 || !file2) {
            UIUtils.showNotification('选择的文件不存在', true);
            return null;
        }
        
        // 合并链接，去重
        const mergedLinks = [];
        const seenEtags = new Set();
        
        // 添加第一个文件的所有链接
        file1.links.forEach(link => {
            if (!seenEtags.has(link.etag)) {
                mergedLinks.push(link);
                seenEtags.add(link.etag);
            }
        });
        
        // 添加第二个文件的所有链接
        file2.links.forEach(link => {
            if (!seenEtags.has(link.etag)) {
                mergedLinks.push(link);
                seenEtags.add(link.etag);
            }
        });
        
        // 按文件名排序
        mergedLinks.sort((a, b) => a.fileName.localeCompare(b.fileName));
        
        // 生成时间戳文件名
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const fileName = `123FastLink_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        // 创建合并后的文件
        const mergedFile = JsonManager.addJsonFile(fileName, mergedLinks);
        
        // 选中新合并的文件
        JsonManager.setSelectedFile(mergedFile.id);
        
        // 更新UI
        UIHandler.renderFileList();
        UIHandler.renderLinkTable();
        UIHandler.updateButtonStates();

        // 合并后重置全选按钮
        const selectAllFiles = document.getElementById('select-all-files');
        if (selectAllFiles) {
            selectAllFiles.className = 'iconfont icon-gouxuankuang';
            selectAllFiles.classList.remove('checked');
        }
        
        UIUtils.showNotification(`成功合并文件，共 ${mergedLinks.length} 个链接`);
        
        return mergedFile;
    }
    
    /**
     * 处理文件合并按钮点击
     */
    function handleMergeFiles() {
        const allFiles = JsonManager.getAllFiles();
        
        if (allFiles.length < 2) {
            UIUtils.showNotification('至少需要两个JSON文件才能进行合并', true);
            return;
        }
        
        // 获取选中的文件
        const selectedFileCheckboxes = document.querySelectorAll('.file-checkbox.checked');
        const selectedFileIds = Array.from(selectedFileCheckboxes).map(cb => cb.dataset.id);
        
        if (selectedFileIds.length < 2) {
            UIUtils.showNotification('请至少选择两个文件进行合并', true);
            return;
        }
        
        if (selectedFileIds.length === 2) {
            // 直接合并两个文件
            mergeFiles(selectedFileIds[0], selectedFileIds[1]);
        } else {
            // 合并多个文件
            mergeMultipleFiles(selectedFileIds);
        }
    }
    
    /**
     * 合并多个文件
     * @param {Array} fileIds - 文件ID数组
     */
    function mergeMultipleFiles(fileIds) {
        if (fileIds.length < 2) {
            UIUtils.showNotification('至少需要两个文件才能进行合并', true);
            return;
        }
        
        // 获取所有文件
        const files = fileIds.map(id => JsonManager.getFileById(id)).filter(Boolean);
        
        if (files.length < 2) {
            UIUtils.showNotification('选择的文件不存在', true);
            return;
        }
        
        // 合并链接，去重
        const mergedLinks = [];
        const seenEtags = new Set();
        
        // 添加所有文件的链接
        files.forEach(file => {
            file.links.forEach(link => {
                if (!seenEtags.has(link.etag)) {
                    mergedLinks.push(link);
                    seenEtags.add(link.etag);
                }
            });
        });
        
        // 按文件名排序
        mergedLinks.sort((a, b) => a.fileName.localeCompare(b.fileName));
        
        // 生成时间戳文件名
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const fileName = `123FastLink_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        // 创建合并后的文件
        const mergedFile = JsonManager.addJsonFile(fileName, mergedLinks);
        
        // 选中新合并的文件
        JsonManager.setSelectedFile(mergedFile.id);
        
        // 更新UI
        UIHandler.renderFileList();
        UIHandler.renderLinkTable();
        UIHandler.updateButtonStates();

        // 合并后重置全选按钮
        const selectAllFiles = document.getElementById('select-all-files');
        if (selectAllFiles) {
            selectAllFiles.className = 'iconfont icon-gouxuankuang';
            selectAllFiles.classList.remove('checked');
        }
        
        UIUtils.showNotification(`成功合并 ${files.length} 个文件，共 ${mergedLinks.length} 个链接`);
        
        return mergedFile;
    }
    
    // 公开API
    return {
        mergeFiles,
        handleMergeFiles
    };
})(); 