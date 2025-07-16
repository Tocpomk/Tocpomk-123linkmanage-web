// linkTableSort.js
// 秒链展示区域排序功能

/**
 * 按文件名排序（升序/降序）
 * @param {Array} links - 链接数组
 * @param {boolean} asc - true升序，false降序
 * @returns {Array}
 */
function sortLinksByFileName(links, asc = true) {
    return links.slice().sort((a, b) => {
        if (a.fileName < b.fileName) return asc ? -1 : 1;
        if (a.fileName > b.fileName) return asc ? 1 : -1;
        return 0;
    });
}

/**
 * 按大小排序（升序/降序）
 * @param {Array} links - 链接数组
 * @param {boolean} asc - true升序，false降序
 * @returns {Array}
 */
function sortLinksBySize(links, asc = true) {
    return links.slice().sort((a, b) => {
        return asc ? a.size - b.size : b.size - a.size;
    });
}

window.LinkTableSort = {
    sortLinksByFileName,
    sortLinksBySize
}; 