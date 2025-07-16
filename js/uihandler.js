/**
 * UI处理模块
 */
const UIHandler = (() => {
    // DOM元素
    const elements = {
        fileList: null,
        addJsonBtn: null,
        removeJsonBtn: null,
        linkInput: null,
        pasteLinkBtn: null,
        clearLinkBtn: null,
        parseLinkBtn: null,
        addToJsonBtn: null,
        exportSelectedBtn: null,
        exportAllBtn: null,
        linkTable: null,
        selectAllCheckbox: null
    };

    /**
     * 初始化UI处理模块
     */
    function init() {
        // 获取DOM元素
        elements.fileList = document.getElementById('json-file-list');
        elements.addJsonBtn = document.getElementById('add-json-btn');
        elements.removeJsonBtn = document.getElementById('remove-json-btn');
        elements.linkInput = document.getElementById('link-input');
        elements.pasteLinkBtn = document.getElementById('paste-link-btn');
        elements.clearLinkBtn = document.getElementById('clear-link-btn');
        elements.parseLinkBtn = document.getElementById('parse-link-btn');
        elements.addToJsonBtn = document.getElementById('add-to-json-btn');
        elements.exportSelectedBtn = document.getElementById('export-selected-btn');
        elements.exportAllBtn = document.getElementById('export-all-btn');
        elements.linkTable = document.getElementById('link-table');
        elements.selectAllCheckbox = document.getElementById('select-all');

        // 初始化UI
        renderFileList();
        attachEventListeners();
        updateButtonStates();
    }

    let filterSelectedMode = false;
    let filterType = 'compare';

    /**
     * 渲染文件列表
     */
    function renderFileList() {
        let files = JsonManager.getAllFiles();
        // 控制筛选条显示
        const filterBar = document.getElementById('filter-bar');
        if (filterBar) filterBar.style.display = files.length > 0 ? 'flex' : 'none';
        // 控制全选显示
        const selectAllFilesBox = document.getElementById('select-all-files');
        const selectAllFilesLabel = document.getElementById('select-all-files-label');
        if (selectAllFilesBox && selectAllFilesLabel) {
            const show = files.length > 0;
            selectAllFilesBox.style.display = show ? '' : 'none';
            selectAllFilesLabel.style.display = show ? '' : 'none';
        }
        // 筛选逻辑
        if (filterSelectedMode && filterType === 'compare') {
            files = files.filter(f => f.name.startsWith('对比结果'));
        }
        elements.fileList.innerHTML = '';
        if (files.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = '没有JSON文件，请添加文件';
            elements.fileList.appendChild(emptyMessage);
            return;
        }

        files.forEach(file => {
            const li = document.createElement('li');
            li.dataset.id = file.id;
            
            // 文件列表复选框渲染
            const fileCheckbox = document.createElement('span');
            fileCheckbox.className = 'iconfont icon-gouxuankuang file-checkbox';
            fileCheckbox.dataset.id = file.id;
            fileCheckbox.style.cursor = 'pointer';
            fileCheckbox.style.fontSize = '18px';
            fileCheckbox.addEventListener('click', function(e) {
                e.stopPropagation();
                fileCheckbox.classList.toggle('checked');
                if (fileCheckbox.classList.contains('checked')) {
                    fileCheckbox.classList.remove('icon-gouxuankuang');
                    fileCheckbox.classList.add('icon-gouxuankuanggouxuan');
                } else {
                    fileCheckbox.classList.remove('icon-gouxuankuanggouxuan');
                    fileCheckbox.classList.add('icon-gouxuankuang');
                }
                updateFileSelectState();
            });
            li.appendChild(fileCheckbox);
            
            // 创建文件名和链接数量的容器
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info-container';
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            fileName.title = file.name;
            
            const linkCount = document.createElement('div');
            linkCount.className = 'link-count';
            linkCount.textContent = `${file.links.length}个链接`;
            linkCount.style.color = li.classList.contains('selected') ? '#fff' : '#222';
            linkCount.style.fontWeight = 'bold';
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(linkCount);
            li.appendChild(fileInfo);
            
            // 添加下载按钮
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.dataset.id = file.id;
            downloadBtn.title = '下载JSON文件';
            // 只显示iconfont下载图标
            const downloadIcon = document.createElement('span');
            downloadIcon.className = 'iconfont icon-xiazai';
            downloadIcon.style.fontSize = '18px';
            downloadBtn.appendChild(downloadIcon);
            li.appendChild(downloadBtn);
            
            // 添加编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.title = '重命名JSON文件';
            editBtn.style.marginRight = '4px';
            // 使用iconfont图标
            const editIcon = document.createElement('span');
            editIcon.className = 'iconfont icon-xiugai';
            editIcon.style.fontSize = '18px';
            editBtn.appendChild(editIcon);
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                UIUtils.showPrompt('请输入新的文件名', file.name, (newName) => {
                    if (newName && newName.trim() && newName !== file.name) {
                        file.name = newName.trim();
                        JsonManager.updateJsonFile(file.id, file.links, newName.trim());
                        UIHandler.renderFileList();
                        UIHandler.renderLinkTable();
                        UIHandler.updateButtonStates();
                        UIUtils.showNotification('文件名已更新');
                    }
                });
            });
            li.appendChild(editBtn);
            
            // 如果是当前选中的文件，添加选中样式
            const selectedFile = JsonManager.getSelectedFile();
            if (selectedFile && selectedFile.id === file.id) {
                li.classList.add('selected');
                linkCount.style.color = '#fff';
            }
            
            elements.fileList.appendChild(li);
        });
        updateButtonStates(); // 新增：渲染后同步按钮状态
        
        // 关键：渲染文件列表后，同时刷新链接表格
        renderLinkTable();
    }

    // 在renderLinkTable前，添加排序状态
    let linkSortField = 'fileName';
    let linkSortAsc = true;

    /**
     * 更新文件选择状态
     */
    function updateFileSelectState() {
        const fileCheckboxes = elements.fileList.querySelectorAll('.file-checkbox');
        const selectAllFiles = document.getElementById('select-all-files');
        if (!selectAllFiles) return;
        
        const checked = Array.from(fileCheckboxes).filter(cb => cb.classList.contains('checked'));
        selectAllFiles.className = 'iconfont ' + (checked.length === fileCheckboxes.length && fileCheckboxes.length > 0 ? 'icon-gouxuankuanggouxuan' : 'icon-gouxuankuang');
        selectAllFiles.classList.toggle('checked', checked.length === fileCheckboxes.length && fileCheckboxes.length > 0);
        updateRemoveBtnState();
    }

    /**
     * 渲染链接表格
     */
    function renderLinkTable() {
        const selectedFile = JsonManager.getSelectedFile();
        const tbody = elements.linkTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (!selectedFile || selectedFile.links.length === 0) {
            // 分页UI也要清空
            if (window.LinkTablePagination) window.LinkTablePagination.updatePagination([]);
            return;
        }

        // 搜索过滤
        let links = selectedFile.links;
        if (window.LinkSearch && typeof window.LinkSearch.getKeyword === 'function') {
            const keyword = window.LinkSearch.getKeyword();
            // 修正：允许单个数字等关键字
            if (keyword !== undefined && keyword !== null && keyword !== '') {
                // 过滤掉文件名中的年份、分辨率和常见编码/音轨/语言/版本等标记
                const yearPattern = /\b[12][0-9]{3}\b/gi;
                const resPattern = /\b(480p|720p|1080p|2160p)\b/gi;
                const codecPattern = /\b(h265|h264|aac|4k|hevc|x264|x265|avc|mp4|mkv|web-dl|webdl|hdr|dv|remux|bluray|bdrip|webrip|dts|flac|ac3|mp3|ogg|opus|truehd|atmos|dolby|ma|vc1|repack|proper|internal|complete|uncut|extended|limited|remastered|dubbed|subbed|multi|dual|chinese|english|japanese|french|german|spanish|russian|italian|korean|thai|vostfr|vost|vff|vfq|vfi|vfo|vfa|vfb|vfc|vfd|vfe|vfg|vfh|vfi|vfj|vfk|vfl|vfm|vfn|vfo|vfp|vfq|vfr|vfs|vft|vfu|vfv|vfw|vfx|vfy|vfz)\b/gi;
                links = links.filter(link => {
                    if (!link.fileName) return false;
                    // 去除文件名中的年份、分辨率和编码等再匹配
                    let filteredName = String(link.fileName)
                        .replace(yearPattern, '')
                        .replace(resPattern, '')
                        .replace(codecPattern, '')
                        .toLowerCase();
                    return filteredName.includes(keyword);
                });
            }
        }

        // 分页处理
        if (window.LinkTablePagination) {
            window.LinkTablePagination.updatePagination(links);
            links = window.LinkTablePagination.getCurrentPageLinks(links);
        }

        // 排序
        if (linkSortField === 'fileName') {
            links = window.LinkTableSort.sortLinksByFileName(links, linkSortAsc);
        } else if (linkSortField === 'size') {
            links = window.LinkTableSort.sortLinksBySize(links, linkSortAsc);
        }

        links.forEach(link => {
            const tr = document.createElement('tr');
            tr.dataset.etag = link.etag;
            
            // 复选框单元格
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('span');
            checkbox.className = 'iconfont icon-gouxuankuang link-checkbox';
            checkbox.dataset.etag = link.etag;
            checkbox.style.cursor = 'pointer';
            checkbox.style.fontSize = '18px';
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation();
                checkbox.classList.toggle('checked');
                if (checkbox.classList.contains('checked')) {
                    checkbox.classList.remove('icon-gouxuankuang');
                    checkbox.classList.add('icon-gouxuankuanggouxuan');
                } else {
                    checkbox.classList.remove('icon-gouxuankuanggouxuan');
                    checkbox.classList.add('icon-gouxuankuang');
                }
                if (window.updateLinkSelectState) {
                    window.updateLinkSelectState();
                }
            });
            checkboxCell.appendChild(checkbox);
            
            // 文件名单元格
            const nameCell = document.createElement('td');
            nameCell.textContent = link.fileName;
            nameCell.title = link.fileName;
            
            // 大小单元格
            const sizeCell = document.createElement('td');
            sizeCell.textContent = LinkParser.formatFileSize(link.size);
            
            // 链接单元格
            const linkCell = document.createElement('td');
            const linkText = LinkParser.generateSingleLink(link);
            // 创建链接文本容器
            const linkTextSpan = document.createElement('span');
            linkTextSpan.textContent = linkText;
            linkTextSpan.title = linkText;
            linkTextSpan.className = 'link-text';
            linkTextSpan.style.wordBreak = 'break-all';
            linkCell.appendChild(linkTextSpan);

            // 操作单元格
            const actionCell = document.createElement('td');
            // 导出按钮
            const exportBtn = document.createElement('button');
            exportBtn.className = 'export-btn';
            exportBtn.title = '导出该秒链';
            const exportIcon = document.createElement('span');
            exportIcon.className = 'iconfont icon-daochu';
            exportIcon.style.fontSize = '18px';
            exportBtn.appendChild(exportIcon);
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                UIUtils.copyToClipboard(linkText)
                    .then(() => {
                        UIUtils.showNotification('链接已复制到剪贴板');
                    })
                    .catch(err => {
                        UIUtils.showNotification('复制失败，请手动复制', true);
                    });
            });
            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = '删除该秒链';
            const deleteIcon = document.createElement('span');
            deleteIcon.className = 'iconfont icon-shanchu';
            deleteIcon.style.fontSize = '18px';
            deleteBtn.appendChild(deleteIcon);
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 从 selectedFile.links 中移除该 link
                const selectedFile = JsonManager.getSelectedFile();
                if (selectedFile) {
                    const idx = selectedFile.links.findIndex(l => l.etag === link.etag);
                    if (idx !== -1) {
                        selectedFile.links.splice(idx, 1);
                        JsonManager.updateJsonFile(selectedFile.id, selectedFile.links);
                        // 重新设置选中文件，确保 selectedFileId 指向最新对象
                        JsonManager.setSelectedFile(selectedFile.id);
                        UIHandler.renderFileList();
                        UIHandler.renderLinkTable();
                        UIHandler.updateButtonStates();
                        UIUtils.showNotification('已删除该秒链');
                    }
                }
            });
            actionCell.appendChild(exportBtn);
            actionCell.appendChild(deleteBtn);

            // 添加所有单元格到行
            tr.appendChild(checkboxCell);
            tr.appendChild(nameCell);
            tr.appendChild(sizeCell);
            tr.appendChild(linkCell);
            tr.appendChild(actionCell);
            
            tbody.appendChild(tr);
        });
        // 渲染完表格后，刷新排序按钮和箭头
        addLinkTableSortHeader();
        updateSortHeader();
        // 重新绑定删除选中按钮事件
        const delBtn = document.getElementById('delete-all-links-btn');
        if (delBtn) {
            delBtn.onclick = function() {
                const selectedFile = JsonManager.getSelectedFile();
                if (!selectedFile || !selectedFile.links.length) return;
                // 找到所有勾选的link-checkbox
                const checkedBoxes = elements.linkTable.querySelectorAll('tbody .link-checkbox.checked');
                if (checkedBoxes.length === 0) return;
                UIUtils.showConfirm(`确定要删除选中的${checkedBoxes.length}个链接吗？`, function() {
                    const checkedEtags = Array.from(checkedBoxes).map(cb => cb.dataset.etag);
                    selectedFile.links = selectedFile.links.filter(link => !checkedEtags.includes(link.etag));
                    JsonManager.updateJsonFile(selectedFile.id, selectedFile.links, selectedFile.name);
                    UIHandler.renderLinkTable();
                    UIHandler.updateButtonStates();
                    UIUtils.showNotification(`已删除${checkedBoxes.length}个链接`);
                });
            };
        }
        // 保证切换文件后全选框状态同步
        if (window.updateLinkSelectState) {
            window.updateLinkSelectState();
        }
    }

    // 修改表头，添加排序按钮
    function addLinkTableSortHeader() {
        const thead = elements.linkTable.querySelector('thead tr');
        if (!thead) return;
        // 只添加一次
        if (thead.querySelector('.sort-btn')) return;
        // 文件名
        const nameTh = thead.children[1];
        const nameSortBtn = document.createElement('span');
        nameSortBtn.className = 'sort-btn';
        nameSortBtn.style.cursor = 'pointer';
        nameSortBtn.style.marginLeft = '4px';
        nameSortBtn.innerHTML = linkSortField === 'fileName' ? (linkSortAsc ? '↑' : '↓') : '↕';
        nameSortBtn.title = '点击排序';
        nameSortBtn.addEventListener('click', () => {
            if (linkSortField === 'fileName') {
                linkSortAsc = !linkSortAsc;
            } else {
                linkSortField = 'fileName';
                linkSortAsc = true;
            }
            renderLinkTable();
            updateSortHeader();
        });
        nameTh.appendChild(nameSortBtn);
        // 大小
        const sizeTh = thead.children[2];
        const sizeSortBtn = document.createElement('span');
        sizeSortBtn.className = 'sort-btn';
        sizeSortBtn.style.cursor = 'pointer';
        sizeSortBtn.style.marginLeft = '4px';
        sizeSortBtn.innerHTML = linkSortField === 'size' ? (linkSortAsc ? '↑' : '↓') : '↕';
        sizeSortBtn.title = '点击排序';
        sizeSortBtn.addEventListener('click', () => {
            if (linkSortField === 'size') {
                linkSortAsc = !linkSortAsc;
            } else {
                linkSortField = 'size';
                linkSortAsc = true;
            }
            renderLinkTable();
            updateSortHeader();
        });
        sizeTh.appendChild(sizeSortBtn);
    }
    // 更新排序按钮箭头
    function updateSortHeader() {
        const thead = elements.linkTable.querySelector('thead tr');
        if (!thead) return;
        const nameSortBtn = thead.children[1].querySelector('.sort-btn');
        const sizeSortBtn = thead.children[2].querySelector('.sort-btn');
        if (nameSortBtn) nameSortBtn.innerHTML = linkSortField === 'fileName' ? (linkSortAsc ? '↑' : '↓') : '↕';
        if (sizeSortBtn) sizeSortBtn.innerHTML = linkSortField === 'size' ? (linkSortAsc ? '↑' : '↓') : '↕';
    }

    /**
     * 绑定事件监听器
     */
    function attachEventListeners() {
        // 文件列表全选框
        const selectAllFiles = document.getElementById('select-all-files');
        selectAllFiles.addEventListener('change', () => {
            const checkboxes = elements.fileList.querySelectorAll('.file-checkbox');
            checkboxes.forEach(cb => { cb.checked = selectAllFiles.checked; });
            updateRemoveBtnState();
        });
        // 文件复选框联动全选框和移除按钮
        elements.fileList.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-checkbox')) {
                const checkboxes = elements.fileList.querySelectorAll('.file-checkbox');
                const checked = Array.from(checkboxes).filter(cb => cb.classList.contains('checked'));
                selectAllFiles.className = 'iconfont ' + (checked.length === checkboxes.length && checkboxes.length > 0 ? 'icon-gouxuankuanggouxuan' : 'icon-gouxuankuang');
                selectAllFiles.classList.toggle('checked', checked.length === checkboxes.length && checkboxes.length > 0);
                updateRemoveBtnState();
                updateButtonStates(); // 新增：同步按钮状态
            }
        });
        // 批量移除按钮
        elements.removeJsonBtn.addEventListener('click', () => {
            const checkboxes = elements.fileList.querySelectorAll('.file-checkbox.checked');
            if (checkboxes.length === 0) return;
            UIUtils.showConfirm(`确定要删除选中的${checkboxes.length}个文件吗？`, () => {
                checkboxes.forEach(cb => {
                    JsonManager.removeJsonFile(cb.dataset.id);
                });
                // 移除后自动选中第一个文件
                const allFiles = JsonManager.getAllFiles();
                if (allFiles.length > 0) {
                    JsonManager.setSelectedFile(allFiles[0].id);
                } else {
                    JsonManager.setSelectedFile(null);
                }
                UIHandler.renderFileList();
                UIHandler.renderLinkTable();
                UIHandler.updateButtonStates();
                // 全选框自动取消勾选
                const selectAllFiles = document.getElementById('select-all-files');
                if (selectAllFiles) selectAllFiles.className = 'iconfont icon-gouxuankuang';
                UIUtils.showNotification(`已成功删除${checkboxes.length}个文件`);
            });
        });
        // 拖拽支持多文件
        const dropArea = document.getElementById('drop-area');
        dropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length === 0) return;
            let successCount = 0;
            let existingNames = JsonManager.getAllFiles().map(f => f.name);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.name.toLowerCase().endsWith('.json') && !file.type.includes('json')) continue;
                if (existingNames.includes(file.name)) continue;
                try {
                    const content = await UIUtils.readFileContent(file);
                    const jsonData = JSON.parse(content);
                    if (jsonData.files && Array.isArray(jsonData.files)) {
                        const links = jsonData.files.map(fileInfo => ({
                            etag: fileInfo.etag,
                            size: fileInfo.size,
                            fileName: fileInfo.path,
                            isV2Format: jsonData.usesBase62EtagsInExport || false
                        }));
                        JsonManager.addJsonFile(file.name, links);
                        successCount++;
                        // renderFileList后再获取最新existingNames，彻底防止重复
                        UIHandler.renderFileList();
                        existingNames = JsonManager.getAllFiles().map(f => f.name);
                    }
                } catch {}
            }
            UIHandler.renderLinkTable();
            UIHandler.updateButtonStates();
            if (successCount > 0) UIUtils.showNotification(`成功添加${successCount}个JSON文件`);
        });
        // 文件列表点击事件
        elements.fileList.addEventListener('click', (e) => {
            // 处理下载按钮点击
            if (e.target.closest('.download-btn')) {
                const btn = e.target.closest('.download-btn');
                const fileId = btn.dataset.id;
                EventHandlers.handleDownloadJsonFile(fileId);
                return;
            }
            
            // 处理文件项点击
            const li = e.target.closest('li');
            if (!li || li.classList.contains('empty-message')) return;
            
            // 移除所有选中样式
            Array.from(elements.fileList.children).forEach(item => {
                item.classList.remove('selected');
            });
            
            // 添加选中样式
            li.classList.add('selected');
            
            // 设置当前选中文件
            JsonManager.setSelectedFile(li.dataset.id);
            
            // 渲染链接表格
            renderLinkTable();
            
            // 更新按钮状态
            updateButtonStates();
        });

        // 添加JSON文件按钮点击事件
        elements.addJsonBtn.addEventListener('click', EventHandlers.handleAddJsonFile);

        // 移除JSON文件按钮点击事件（彻底移除，避免重复弹窗）
        // elements.removeJsonBtn.addEventListener('click', EventHandlers.handleRemoveJsonFile);

        // 秒链相关按钮点击事件
        elements.pasteLinkBtn.addEventListener('click', EventHandlers.handlePasteLinkBtn);
        elements.clearLinkBtn.addEventListener('click', EventHandlers.handleClearLinkBtn);
        elements.parseLinkBtn.addEventListener('click', EventHandlers.handleParseLinkBtn);

        // 添加到JSON按钮点击事件
        elements.addToJsonBtn.addEventListener('click', EventHandlers.handleAddToJsonBtn);

        // 导出选中链接按钮点击事件
        elements.exportSelectedBtn.addEventListener('click', EventHandlers.handleExportSelectedBtn);

        // 导出全部链接按钮点击事件
        elements.exportAllBtn.addEventListener('click', EventHandlers.handleExportAllBtn);

        // 文件合并按钮点击事件
        const mergeFilesBtn = document.getElementById('merge-files-btn');
        if (mergeFilesBtn) {
            mergeFilesBtn.addEventListener('click', EventHandlers.handleMergeFilesBtn);
        }

        // 文件对比按钮点击事件
        const compareFilesBtn = document.getElementById('compare-files-btn');
        if (compareFilesBtn) {
            compareFilesBtn.addEventListener('click', EventHandlers.handleCompareFilesBtn);
        }

        // 全选复选框点击事件
        elements.selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = elements.linkTable.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = elements.selectAllCheckbox.checked;
            });
        });

        // 监听输入框变化，更新按钮状态
        elements.linkInput.addEventListener('input', updateButtonStates);

        // 全选文件复选框逻辑
        selectAllFiles.addEventListener('click', function() {
            const fileCheckboxes = elements.fileList.querySelectorAll('.file-checkbox');
            const isAll = !Array.from(fileCheckboxes).every(cb => cb.classList.contains('checked'));
            selectAllFiles.className = 'iconfont ' + (isAll ? 'icon-gouxuankuanggouxuan' : 'icon-gouxuankuang');
            selectAllFiles.classList.toggle('checked', isAll);
            fileCheckboxes.forEach(cb => {
                cb.classList.toggle('checked', isAll);
                if (cb.classList.contains('checked')) {
                    cb.classList.remove('icon-gouxuankuang');
                    cb.classList.add('icon-gouxuankuanggouxuan');
                } else {
                    cb.classList.remove('icon-gouxuankuanggouxuan');
                    cb.classList.add('icon-gouxuankuang');
                }
            });
            updateFileSelectState();
            updateButtonStates(); // 新增：同步按钮状态
        });
        // 链接表格全选逻辑
        const selectAllLinks = document.getElementById('select-all');
        selectAllLinks.addEventListener('click', function() {
            const linkCheckboxes = elements.linkTable.querySelectorAll('tbody .link-checkbox');
            const isAll = !Array.from(linkCheckboxes).every(cb => cb.classList.contains('checked'));
            selectAllLinks.className = 'iconfont ' + (isAll ? 'icon-gouxuankuanggouxuan' : 'icon-gouxuankuang');
            selectAllLinks.classList.toggle('checked', isAll);
            linkCheckboxes.forEach(cb => {
                cb.classList.toggle('checked', isAll);
                if (cb.classList.contains('checked')) {
                    cb.classList.remove('icon-gouxuankuang');
                    cb.classList.add('icon-gouxuankuanggouxuan');
                } else {
                    cb.classList.remove('icon-gouxuankuanggouxuan');
                    cb.classList.add('icon-gouxuankuang');
                }
            });
        });
        // 挂载到window，防止报错
        window.updateLinkSelectState = function() {
            const linkTable = document.getElementById('link-table');
            const selectAllLinks = document.getElementById('select-all');
            if (!linkTable || !selectAllLinks) return;
            const linkCheckboxes = linkTable.querySelectorAll('tbody .link-checkbox');
            const checked = Array.from(linkCheckboxes).filter(cb => cb.classList.contains('checked'));
            selectAllLinks.className = 'iconfont ' + (checked.length === linkCheckboxes.length && linkCheckboxes.length > 0 ? 'icon-gouxuankuanggouxuan' : 'icon-gouxuankuang');
            selectAllLinks.classList.toggle('checked', checked.length === linkCheckboxes.length && linkCheckboxes.length > 0);
        };
        // 筛选类型下拉
        const filterTypeSelect = document.getElementById('filter-type-select');
        if (filterTypeSelect) {
            filterTypeSelect.addEventListener('change', (e) => {
                filterType = e.target.value;
                // 切换类型时自动关闭筛选
                filterSelectedMode = false;
                const filterBtn = document.getElementById('filter-selected-btn');
                if (filterBtn) filterBtn.classList.remove('active');
                renderFileList();
            });
        }
        // 筛选按钮
        const filterBtn = document.getElementById('filter-selected-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                filterSelectedMode = !filterSelectedMode;
                filterBtn.classList.toggle('active', filterSelectedMode);
                renderFileList();
            });
        }
    }

    /**
     * 更新按钮状态
     */
    function updateButtonStates() {
        const selectedFile = JsonManager.getSelectedFile();
        const hasSelectedFile = !!selectedFile;
        const hasLinkInput = !!elements.linkInput.value.trim();
        // 按需：移除选中按钮始终可用
        elements.removeJsonBtn.disabled = false;
        elements.addToJsonBtn.disabled = !hasSelectedFile || !hasLinkInput;
        elements.exportSelectedBtn.disabled = !hasSelectedFile;
        elements.exportAllBtn.disabled = !hasSelectedFile;
    }

    // ====== 提升 updateRemoveBtnState 到全局作用域 ======
    function updateRemoveBtnState() {
        // 只要有文件就可点亮移除按钮
        const files = JsonManager.getAllFiles ? JsonManager.getAllFiles() : [];
        const removeBtn = document.getElementById('remove-json-btn');
        if (removeBtn) removeBtn.disabled = files.length === 0;
    }

    // 公开API
    return {
        init,
        renderFileList,
        renderLinkTable,
        updateButtonStates
    };
})();

// 将UIHandler挂载到window，确保外部可以访问
window.UIHandler = UIHandler;

// 秒链排序按钮事件
document.addEventListener('DOMContentLoaded', () => {
    const sortBtn = document.getElementById('sort-links-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const selectedFile = JsonManager.getSelectedFile();
            if (!selectedFile) return;
            // 按文件名升序排序
            selectedFile.links.sort((a, b) => a.fileName.localeCompare(b.fileName, 'zh'));
            JsonManager.updateJsonFile(selectedFile.id, selectedFile.links, selectedFile.name);
            UIHandler.renderLinkTable();
            UIUtils.showNotification('已按文件名排序并保存');
        });
    }
});