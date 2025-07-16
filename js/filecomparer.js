/**
 * 文件对比功能模块
 */
const FileComparer = (() => {
    
    /**
     * 对比两个JSON文件
     * @param {string} file1Id - 第一个文件ID
     * @param {string} file2Id - 第二个文件ID
     * @param {string} compareType - 对比类型：'same' 或 'different'
     * @returns {Object|null} 对比结果文件对象或null
     */
    function compareFiles(file1Id, file2Id, compareType) {
        const file1 = JsonManager.getFileById(file1Id);
        const file2 = JsonManager.getFileById(file2Id);
        
        if (!file1 || !file2) {
            UIUtils.showNotification('选择的文件不存在', true);
            return null;
        }
        
        // 创建etag集合
        const file1Etags = new Set(file1.links.map(link => link.etag));
        const file2Etags = new Set(file2.links.map(link => link.etag));
        
        let resultLinks = [];
        
        if (compareType === 'same') {
            // 找出相同的文件（两个文件都有的）
            const sameEtags = new Set();
            file1.links.forEach(link => {
                if (file2Etags.has(link.etag)) {
                    sameEtags.add(link.etag);
                }
            });
            
            resultLinks = file1.links.filter(link => sameEtags.has(link.etag));
        } else if (compareType === 'different') {
            // 找出不同的文件（只在其中一个文件中有的）
            const differentEtags = new Set();
            
            // 在file1中但不在file2中的
            file1.links.forEach(link => {
                if (!file2Etags.has(link.etag)) {
                    differentEtags.add(link.etag);
                }
            });
            
            // 在file2中但不在file1中的
            file2.links.forEach(link => {
                if (!file1Etags.has(link.etag)) {
                    differentEtags.add(link.etag);
                }
            });
            
            // 收集所有不同的链接
            const allLinks = [...file1.links, ...file2.links];
            resultLinks = allLinks.filter(link => differentEtags.has(link.etag));
            
            // 去重（因为可能有重复的etag）
            const seenEtags = new Set();
            resultLinks = resultLinks.filter(link => {
                if (seenEtags.has(link.etag)) {
                    return false;
                }
                seenEtags.add(link.etag);
                return true;
            });
        }
        
        // 按文件名排序
        resultLinks.sort((a, b) => a.fileName.localeCompare(b.fileName));
        
        if (resultLinks.length === 0) {
            UIUtils.showNotification(`对比结果为空，没有找到${compareType === 'same' ? '相同' : '不同'}的文件`, true);
            return null;
        }
        
        // 生成时间戳文件名
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const compareTypeText = compareType === 'same' ? '相同' : '不同';
        const fileName = `对比结果${compareTypeText}123FastLink_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        
        // 创建对比结果文件
        const resultFile = JsonManager.addJsonFile(fileName, resultLinks);
        
        // 选中新创建的文件
        JsonManager.setSelectedFile(resultFile.id);
        
        // 更新UI
        UIHandler.renderFileList();
        UIHandler.renderLinkTable();
        UIHandler.updateButtonStates();
        
        UIUtils.showNotification(`对比完成，找到 ${resultLinks.length} 个${compareType === 'same' ? '相同' : '不同'}的文件`);
        
        return resultFile;
    }
    
    /**
     * 处理文件对比按钮点击
     */
    function handleCompareFiles() {
        const allFiles = JsonManager.getAllFiles();
        
        if (allFiles.length < 2) {
            UIUtils.showNotification('至少需要两个JSON文件才能进行对比', true);
            return;
        }
        
        // 获取选中的文件
        const selectedFileCheckboxes = document.querySelectorAll('.file-checkbox.checked');
        const selectedFileIds = Array.from(selectedFileCheckboxes).map(cb => cb.dataset.id);
        
        if (selectedFileIds.length !== 2) {
            UIUtils.showNotification('请选择恰好两个文件进行对比', true);
            return;
        }
        
        // 创建对比类型选择对话框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>选择对比类型</h3>
                <div class="compare-type-selection">
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="compare-type" value="same" checked>
                            相同文件
                        </label>
                        <label>
                            <input type="radio" name="compare-type" value="different">
                            不同文件
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="compare-confirm-btn">开始对比</button>
                    <button id="compare-cancel-btn">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            }
            .modal-content h3 {
                margin-bottom: 20px;
                color: #2c3e50;
                text-align: center;
            }
            .compare-type-selection {
                margin-bottom: 20px;
            }
            .radio-group {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            .radio-group label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-weight: normal;
                cursor: pointer;
                font-size: 16px;
            }
            .radio-group input[type="radio"] {
                margin: 0;
            }
            .modal-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .modal-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            #compare-confirm-btn {
                background-color: #007bff;
                color: white;
            }
            #compare-confirm-btn:hover {
                background-color: #0056b3;
            }
            #compare-cancel-btn {
                background-color: #6c757d;
                color: white;
            }
            #compare-cancel-btn:hover {
                background-color: #545b62;
            }
        `;
        document.head.appendChild(style);
        
        // 事件处理
        const confirmBtn = document.getElementById('compare-confirm-btn');
        const cancelBtn = document.getElementById('compare-cancel-btn');
        
        confirmBtn.addEventListener('click', () => {
            const compareType = document.querySelector('input[name="compare-type"]:checked').value;
            compareFiles(selectedFileIds[0], selectedFileIds[1], compareType);
            closeModal();
        });
        
        cancelBtn.addEventListener('click', closeModal);
        
        function closeModal() {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
        
        // 点击遮罩层关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // 公开API
    return {
        compareFiles,
        handleCompareFiles
    };
})(); 