/**
 * 事件处理模块
 */
const EventHandlers = (() => {
    /**
     * 初始化拖放区域
     */
    function initDragAndDrop() {
        const dropArea = document.getElementById('drop-area');
        
        // 阻止默认行为（防止文件被打开）
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // 高亮显示拖放区域
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        // 取消高亮显示
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        // dropArea.addEventListener('drop', handleDrop, false); // 已由 uiHandler.js 处理多文件拖拽，避免重复
        // function handleDrop(e) { /* ... */ } // 已废弃
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function highlight() {
            dropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            dropArea.classList.remove('highlight');
        }
    }
    
    /**
     * 处理下载JSON文件
     * @param {string} fileId - 要下载的文件ID
     */
    function handleDownloadJsonFile(fileId) {
        const file = JsonManager.getFileById(fileId);
        if (!file) {
            UIUtils.showNotification('文件不存在', true);
            return;
        }
        
        // 创建导出格式的JSON数据
        const exportData = {
            files: file.links.map(link => ({
                etag: link.etag,
                size: link.size,
                path: link.fileName
            })),
            usesBase62EtagsInExport: false
        };
        
        // 创建Blob对象
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.endsWith('.json') ? file.name : `${file.name}.json`;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        UIUtils.showNotification(`正在下载 ${file.name}`);
    }
    /**
     * 处理添加JSON文件按钮点击
     */
    function handleAddJsonFile() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.multiple = true; // 支持多选
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // 监听文件选择事件
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;
            
            const files = Array.from(e.target.files);
            let successCount = 0;
            let errorCount = 0;
            let totalLinks = 0;
            
            // 检查是否有重复文件名
            const existingNames = JsonManager.getAllFiles().map(f => f.name);
            const duplicateNames = files.filter(file => existingNames.includes(file.name));
            
            if (duplicateNames.length > 0) {
                const duplicateNamesList = duplicateNames.map(f => f.name).join(', ');
                UIUtils.showNotification(`以下文件已存在，将被跳过: ${duplicateNamesList}`, true);
            }
            
            // 处理每个文件
            for (const file of files) {
                // 跳过重复文件
                if (existingNames.includes(file.name)) {
                    continue;
                }
                
                try {
                    const content = await UIUtils.readFileContent(file);
                    const jsonData = JSON.parse(content);
                    
                    // 处理JSON数据
                    if (jsonData.files && Array.isArray(jsonData.files)) {
                        const links = jsonData.files.map(fileInfo => ({
                            etag: fileInfo.etag,
                            size: fileInfo.size,
                            fileName: fileInfo.path,
                            isV2Format: jsonData.usesBase62EtagsInExport || false
                        }));
                        
                        // 添加JSON文件
                        const newFile = JsonManager.addJsonFile(file.name, links);
                        successCount++;
                        totalLinks += links.length;
                        
                        // 如果是第一个成功添加的文件，选中它
                        if (successCount === 1) {
                            JsonManager.setSelectedFile(newFile.id);
                        }
                    } else {
                        throw new Error('无效的JSON文件格式');
                    }
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                    errorCount++;
                }
            }
            
            // 更新UI
            UIHandler.renderFileList();
            UIHandler.renderLinkTable();
            UIHandler.updateButtonStates();
            
            // 显示结果通知
            if (successCount > 0) {
                UIUtils.showNotification(`成功添加 ${successCount} 个文件，共 ${totalLinks} 个链接${errorCount > 0 ? `，${errorCount} 个文件处理失败` : ''}`);
            } else {
                UIUtils.showNotification('没有成功添加任何文件', true);
            }
            
            // 移除文件输入元素
            document.body.removeChild(fileInput);
        });
        
        // 触发文件选择对话框
        fileInput.click();
    }

    /**
     * 处理移除JSON文件按钮点击
     */
    function handleRemoveJsonFile() {
        const selectedFile = JsonManager.getSelectedFile();
        if (!selectedFile) {
            UIUtils.showNotification('请先选择一个文件', true);
            return;
        }
        
        if (confirm(`确定要删除文件 "${selectedFile.name}" 吗？`)) {
            JsonManager.removeJsonFile(selectedFile.id);
            JsonManager.setSelectedFile(null);
            UIHandler.renderFileList();
            UIHandler.renderLinkTable();
            UIHandler.updateButtonStates();
            UIUtils.showNotification(`已删除文件 ${selectedFile.name}`);
        }
    }

    /**
     * 处理粘贴秒链按钮点击
     */
    function handlePasteLinkBtn() {
        UIUtils.pasteFromClipboard()
            .then(text => {
                const linkInput = document.getElementById('link-input');
                linkInput.value = text;
                UIUtils.showNotification('已粘贴秒传链接');
                UIHandler.updateButtonStates();
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
                UIUtils.showNotification('无法读取剪贴板内容', true);
            });
    }

    /**
     * 处理清空秒链按钮点击
     */
    function handleClearLinkBtn() {
        const linkInput = document.getElementById('link-input');
        linkInput.value = '';
        UIHandler.updateButtonStates();
        UIUtils.showNotification('已清空秒传链接');
    }

    /**
     * 处理解析秒链按钮点击
     */
    function handleParseLinkBtn() {
        const linkInput = document.getElementById('link-input');
        const linkText = linkInput.value.trim();
        if (!linkText) {
            UIUtils.showNotification('请输入秒传链接', true);
            return;
        }
    
        try {
            const parsedLinks = LinkParser.parseShareLink(linkText);
            if (parsedLinks.length === 0) {
                UIUtils.showNotification('无法解析秒传链接，请检查格式', true);
                return;
            }
        
            // 创建新的解析结果文件，命名为123FastLink_时间戳
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            const fileName = `123FastLink_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const tempFile = {
                id: 'temp_parsed_' + Date.now(),
                name: fileName,
                links: parsedLinks,
                createdAt: now.toISOString()
            };
        
            // 添加临时文件到JsonManager
            JsonManager.addJsonFile(tempFile.name, parsedLinks);
            JsonManager.setSelectedFile(tempFile.id);
        
            // 更新UI
            UIHandler.renderFileList();
            UIHandler.renderLinkTable();
        
            // 显示解析结果
            UIUtils.showNotification(`成功解析 ${parsedLinks.length} 个链接`);
        
            // 更新按钮状态
            UIHandler.updateButtonStates();
        } catch (error) {
            console.error('Error parsing link:', error);
            UIUtils.showNotification(`解析链接失败: ${error.message}`, true);
        }
    }

    /**
     * 处理添加到JSON按钮点击
     */
    function handleAddToJsonBtn() {
        const selectedFile = JsonManager.getSelectedFile();
        if (!selectedFile) {
            UIUtils.showNotification('请先选择一个JSON文件', true);
            return;
        }
        
        const linkInput = document.getElementById('link-input');
        const linkText = linkInput.value.trim();
        if (!linkText) {
            UIUtils.showNotification('请输入秒传链接', true);
            return;
        }
        
        try {
            const parsedLinks = LinkParser.parseShareLink(linkText);
            if (parsedLinks.length === 0) {
                UIUtils.showNotification('无法解析秒传链接，请检查格式', true);
                return;
            }
            
            // 添加链接到选中的文件
            let addedCount = 0;
            let duplicateCount = 0;
            
            parsedLinks.forEach(link => {
                // 检查链接是否已存在
                const linkExists = selectedFile.links.some(
                    existingLink => existingLink.etag === link.etag && existingLink.fileName === link.fileName
                );
                
                if (!linkExists) {
                    JsonManager.addLinkToSelectedFile(link);
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            });
            
            // 更新UI
            UIHandler.renderFileList();
            UIHandler.renderLinkTable();
            
            // 显示结果通知
            if (addedCount > 0) {
                UIUtils.showNotification(`成功添加 ${addedCount} 个链接${duplicateCount > 0 ? `，${duplicateCount} 个重复链接被忽略` : ''}`);
            } else {
                UIUtils.showNotification(`所有链接 (${duplicateCount} 个) 已存在，未添加新链接`, true);
            }
        } catch (error) {
            console.error('Error adding links:', error);
            UIUtils.showNotification(`添加链接失败: ${error.message}`, true);
        }
    }

    /**
     * 处理导出选中链接按钮点击
     */
    function handleExportSelectedBtn() {
        const selectedFile = JsonManager.getSelectedFile();
        if (!selectedFile) {
            UIUtils.showNotification('请先选择一个JSON文件', true);
            return;
        }
        
        const linkTable = document.getElementById('link-table');
        const checkboxes = linkTable.querySelectorAll('tbody .link-checkbox.checked');
        if (checkboxes.length === 0) {
            UIUtils.showNotification('请选择要导出的链接', true);
            return;
        }
        
        // 获取选中的链接
        const selectedEtags = Array.from(checkboxes).map(cb => cb.dataset.etag);
        const selectedLinks = selectedFile.links.filter(link => selectedEtags.includes(link.etag));
        
        // 生成链接
        const exportedLink = LinkParser.generateMultipleLinks(selectedLinks);
        
        // 复制到剪贴板
        UIUtils.copyToClipboard(exportedLink);
        
        UIUtils.showNotification(`已复制 ${selectedLinks.length} 个链接到剪贴板`);
    }

    /**
     * 处理导出全部链接按钮点击
     */
    function handleExportAllBtn() {
        const selectedFile = JsonManager.getSelectedFile();
        if (!selectedFile || selectedFile.links.length === 0) {
            UIUtils.showNotification('没有可导出的链接', true);
            return;
        }
        
        // 生成链接
        const exportedLink = LinkParser.generateMultipleLinks(selectedFile.links);
        
        // 复制到剪贴板
        UIUtils.copyToClipboard(exportedLink);
        
        UIUtils.showNotification(`已复制全部 ${selectedFile.links.length} 个链接到剪贴板`);
    }

    /**
     * 处理文件合并按钮点击
     */
    function handleMergeFilesBtn() {
        FileMerger.handleMergeFiles();
    }

    /**
     * 处理文件对比按钮点击
     */
    function handleCompareFilesBtn() {
        FileComparer.handleCompareFiles();
    }

    /**
     * 初始化所有事件监听器
     */
    function initEventListeners() {
        // 初始化拖放功能
        initDragAndDrop();
    }

    // 公开API
    return {
        handleAddJsonFile,
        handleRemoveJsonFile,
        handlePasteLinkBtn,
        handleClearLinkBtn,
        handleParseLinkBtn,
        handleAddToJsonBtn,
        handleExportSelectedBtn,
        handleExportAllBtn,
        handleDownloadJsonFile,
        handleMergeFilesBtn,
        handleCompareFilesBtn,
        initEventListeners,
        initDragAndDrop
    };
})();