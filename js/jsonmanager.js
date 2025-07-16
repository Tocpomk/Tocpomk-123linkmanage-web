/**
 * JSON文件管理模块
 */
const JsonManager = (() => {
    // 存储所有JSON文件
    let files = [];
    
    // 当前选中的文件ID
    let selectedFileId = null;
    
    // 本地存储键
    const STORAGE_KEY = 'json_files_data';
    
    /**
     * 初始化模块
     */
    function init() {
        loadFromStorage();
    }
    
    /**
     * 从本地存储加载数据
     */
    function loadFromStorage() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                files = parsedData.files || [];
                selectedFileId = parsedData.selectedFileId || null;
            } catch (error) {
                console.error('Error loading data from storage:', error);
                files = [];
                selectedFileId = null;
            }
        }
    }
    
    /**
     * 保存数据到本地存储
     */
    function saveToStorage() {
        try {
            const dataToStore = {
                files,
                selectedFileId
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    }
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * 添加JSON文件
     * @param {string} name - 文件名
     * @param {Array} links - 链接数组
     * @returns {Object} 新添加的文件对象
     */
    function addJsonFile(name, links) {
        const timestamp = new Date();
        const formattedName = name || `123FastLink_${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2, '0')}${timestamp.getDate().toString().padStart(2, '0')}_${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}${timestamp.getSeconds().toString().padStart(2, '0')}`;
        
        const newFile = {
            id: generateId(),
            name: formattedName,
            links: links || [],
            createdAt: timestamp.toISOString()
        };
        
        files.push(newFile);
        saveToStorage();
        
        return newFile;
    }
    
    /**
     * 移除JSON文件
     * @param {string} fileId - 文件ID
     * @returns {boolean} 是否成功移除
     */
    function removeJsonFile(fileId) {
        const initialLength = files.length;
        files = files.filter(file => file.id !== fileId);
        
        if (selectedFileId === fileId) {
            selectedFileId = null;
        }
        
        saveToStorage();
        
        return files.length < initialLength;
    }
    
    /**
     * 获取所有文件
     * @returns {Array} 文件数组
     */
    function getAllFiles() {
        return [...files];
    }
    
    /**
     * 获取文件
     * @param {string} fileId - 文件ID
     * @returns {Object|null} 文件对象或null
     */
    function getFile(fileId) {
        return files.find(file => file.id === fileId) || null;
    }
    
    /**
     * 获取文件（别名方法）
     * @param {string} fileId - 文件ID
     * @returns {Object|null} 文件对象或null
     */
    function getFileById(fileId) {
        return getFile(fileId);
    }
    
    /**
     * 设置当前选中的文件
     * @param {string|null} fileId - 文件ID或null
     */
    function setSelectedFile(fileId) {
        selectedFileId = fileId;
        saveToStorage();
    }
    
    /**
     * 获取当前选中的文件
     * @returns {Object|null} 文件对象或null
     */
    function getSelectedFile() {
        if (!selectedFileId) return null;
        return getFile(selectedFileId);
    }
    
    /**
     * 添加链接到选中的文件
     * @param {Object} link - 链接对象
     * @returns {boolean} 是否成功添加
     */
    function addLinkToSelectedFile(link) {
        const selectedFile = getSelectedFile();
        if (!selectedFile) return false;
        
        selectedFile.links.push(link);
        saveToStorage();
        
        return true;
    }
    
    /**
     * 从选中的文件中移除链接
     * @param {string} etag - 链接的etag
     * @returns {boolean} 是否成功移除
     */
    function removeLinkFromSelectedFile(etag) {
        const selectedFile = getSelectedFile();
        if (!selectedFile) return false;
        
        const initialLength = selectedFile.links.length;
        selectedFile.links = selectedFile.links.filter(link => link.etag !== etag);
        
        saveToStorage();
        
        return selectedFile.links.length < initialLength;
    }
    
    /**
     * 导出选中文件为JSON
     * @returns {string|null} JSON字符串或null
     */
    function exportSelectedFileAsJson() {
        const selectedFile = getSelectedFile();
        if (!selectedFile) return null;
        
        const exportData = {
            files: selectedFile.links.map(link => ({
                etag: link.etag,
                size: link.size,
                path: link.fileName
            })),
            usesBase62EtagsInExport: false
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * 更新JSON文件（支持重命名）
     * @param {string} fileId - 文件ID
     * @param {Array} links - 链接数组
     * @param {string} [newName] - 新文件名
     */
    function updateJsonFile(fileId, links, newName) {
        const file = files.find(f => f.id === fileId);
        if (file) {
            file.links = links;
            if (newName) file.name = newName;
            saveToStorage();
        }
    }
    
    // 初始化
    init();
    
    // 公开API
    return {
        addJsonFile,
        removeJsonFile,
        getAllFiles,
        getFile,
        getFileById,
        setSelectedFile,
        getSelectedFile,
        addLinkToSelectedFile,
        removeLinkFromSelectedFile,
        exportSelectedFileAsJson,
        updateJsonFile
    };
})();