/**
 * 秒传链接解析模块
 */
const LinkParser = (() => {
    // 秒传链接前缀常量
    const LEGACY_FOLDER_LINK_PREFIX_V1 = "123FSLinkV1$";
    const COMMON_PATH_LINK_PREFIX_V1 = "123FLCPV1$";
    const LEGACY_FOLDER_LINK_PREFIX_V2 = "123FSLinkV2$";
    const COMMON_PATH_LINK_PREFIX_V2 = "123FLCPV2$";
    const COMMON_PATH_DELIMITER = "%";

    /**
     * 解析秒传链接
     * @param {string} shareLink - 秒传链接
     * @returns {Array} - 解析后的文件信息数组
     */
    function parseShareLink(shareLink) {
        if (!shareLink || typeof shareLink !== 'string') {
            return [];
        }

        let commonBasePath = "";
        let isCommonPathFormat = false;
        let isV2EtagFormat = false;

        // 检查链接前缀类型
        if (shareLink.startsWith(COMMON_PATH_LINK_PREFIX_V2)) {
            isCommonPathFormat = true;
            isV2EtagFormat = true;
            shareLink = shareLink.substring(COMMON_PATH_LINK_PREFIX_V2.length);
        } else if (shareLink.startsWith(COMMON_PATH_LINK_PREFIX_V1)) {
            isCommonPathFormat = true;
            shareLink = shareLink.substring(COMMON_PATH_LINK_PREFIX_V1.length);
        }

        // 处理公共路径格式
        if (isCommonPathFormat) {
            const delimiterPos = shareLink.indexOf(COMMON_PATH_DELIMITER);
            if (delimiterPos > -1) {
                commonBasePath = shareLink.substring(0, delimiterPos);
                shareLink = shareLink.substring(delimiterPos + 1);
            } else {
                console.error("Malformed common path link: delimiter not found.");
                isCommonPathFormat = false;
            }
        } else {
            // 处理传统格式
            if (shareLink.startsWith(LEGACY_FOLDER_LINK_PREFIX_V2)) {
                isV2EtagFormat = true;
                shareLink = shareLink.substring(LEGACY_FOLDER_LINK_PREFIX_V2.length);
            } else if (shareLink.startsWith(LEGACY_FOLDER_LINK_PREFIX_V1)) {
                shareLink = shareLink.substring(LEGACY_FOLDER_LINK_PREFIX_V1.length);
            }
        }

        // 解析链接中的文件信息
        return shareLink.split('$')
            .map(sLink => {
                const parts = sLink.split('#');
                if (parts.length >= 3) {
                    let etag = parts[0];
                    let filePath = parts.slice(2).join('#');
                    
                    if (isCommonPathFormat && commonBasePath) {
                        filePath = commonBasePath + filePath;
                    }
                    
                    return {
                        etag: etag,
                        size: parts[1],
                        fileName: filePath,
                        isV2Format: isV2EtagFormat
                    };
                }
                return null;
            })
            .filter(i => i);
    }

    /**
     * 生成单个文件的秒传链接
     * @param {Object} fileInfo - 文件信息对象
     * @returns {string} - 生成的秒传链接
     */
    function generateSingleLink(fileInfo) {
        if (!fileInfo || !fileInfo.etag || !fileInfo.size || !fileInfo.fileName) {
            return '';
        }
        
        const prefix = fileInfo.isV2Format ? LEGACY_FOLDER_LINK_PREFIX_V2 : LEGACY_FOLDER_LINK_PREFIX_V1;
        return `${prefix}${fileInfo.etag}#${fileInfo.size}#${fileInfo.fileName}`;
    }

    /**
     * 生成多个文件的秒传链接
     * @param {Array} fileInfos - 文件信息对象数组
     * @returns {string} - 生成的秒传链接
     */
    function generateMultipleLinks(fileInfos) {
        if (!fileInfos || !Array.isArray(fileInfos) || fileInfos.length === 0) {
            return '';
        }
        
        // 检查是否所有文件都使用相同的格式
        const isAllV2 = fileInfos.every(file => file.isV2Format);
        const isAllV1 = fileInfos.every(file => !file.isV2Format);
        
        // 如果格式不一致，统一使用V2格式
        const useV2Format = isAllV2 || !isAllV1;
        const prefix = useV2Format ? LEGACY_FOLDER_LINK_PREFIX_V2 : LEGACY_FOLDER_LINK_PREFIX_V1;
        
        // 生成链接
        const linkParts = fileInfos.map(file => `${file.etag}#${file.size}#${file.fileName}`);
        return prefix + linkParts.join('$');
    }

    /**
     * 格式化文件大小
     * @param {number|string} bytes - 文件大小（字节）
     * @param {number} decimals - 小数位数
     * @returns {string} - 格式化后的文件大小
     */
    function formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // 公开API
    return {
        parseShareLink,
        generateSingleLink,
        generateMultipleLinks,
        formatFileSize
    };
})();