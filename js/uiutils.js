/**
 * UI工具函数模块
 */
const UIUtils = (() => {
    /**
     * 读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<string>} - 文件内容
     */
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * 智能复制文本到剪贴板，iframe下自动postMessage父页面代理
     * @param {string} text - 要复制的文本
     * @returns {Promise}
     */
    function copyToClipboardSmart(text) {
        return new Promise((resolve, reject) => {
            if (window.self !== window.top && window.parent) {
                // 在iframe中，postMessage请求父页面
                window.parent.postMessage({ type: 'copyToClipboard', text }, '*');
                function handler(e) {
                    if (e.data && e.data.type === 'copyResult') {
                        window.removeEventListener('message', handler);
                        if (e.data.success) resolve();
                        else reject(new Error(e.data.error || '复制失败'));
                    }
                }
                window.addEventListener('message', handler);
            } else {
                // 原生实现
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(resolve, reject);
                } else {
                    // 兼容旧方案
                    try {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            }
        });
    }

    /**
     * 智能读取剪贴板文本，iframe下自动postMessage父页面代理
     * @returns {Promise<string>}
     */
    function pasteFromClipboardSmart() {
        return new Promise((resolve, reject) => {
            if (window.self !== window.top && window.parent) {
                window.parent.postMessage({ type: 'pasteFromClipboard' }, '*');
                function handler(e) {
                    if (e.data && e.data.type === 'pasteResult') {
                        window.removeEventListener('message', handler);
                        if (e.data.success) resolve(e.data.text);
                        else reject(new Error(e.data.error || '粘贴失败'));
                    }
                }
                window.addEventListener('message', handler);
            } else {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    navigator.clipboard.readText().then(resolve, reject);
                } else {
                    reject(new Error('当前环境不支持读取剪贴板'));
                }
            }
        });
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {boolean} isError - 是否为错误通知
     */
    function showNotification(message, isError = false) {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `notification${isError ? ' error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动隐藏通知
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 自定义美化确认弹窗
     * @param {string} message - 提示内容
     * @param {function} onConfirm - 确认回调
     */
    function showConfirm(message, onConfirm) {
        // 移除现有弹窗
        const existing = document.querySelector('.custom-confirm');
        if (existing) document.body.removeChild(existing);
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'custom-confirm';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.25)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        // 内容框
        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.borderRadius = '8px';
        box.style.padding = '28px 32px 18px 32px';
        box.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        box.style.textAlign = 'center';
        box.style.minWidth = '260px';
        // 文本
        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.fontSize = '1.1rem';
        msg.style.marginBottom = '22px';
        box.appendChild(msg);
        // 按钮
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.justifyContent = 'center';
        btnGroup.style.gap = '18px';
        const okBtn = document.createElement('button');
        okBtn.textContent = '确定';
        okBtn.style.background = '#007bff';
        okBtn.style.color = '#fff';
        okBtn.style.border = 'none';
        okBtn.style.padding = '6px 22px';
        okBtn.style.borderRadius = '4px';
        okBtn.style.fontSize = '1rem';
        okBtn.style.cursor = 'pointer';
        okBtn.onclick = () => {
            document.body.removeChild(modal);
            onConfirm && onConfirm();
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.background = '#e0e0e0';
        cancelBtn.style.color = '#333';
        cancelBtn.style.border = 'none';
        cancelBtn.style.padding = '6px 22px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.fontSize = '1rem';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        btnGroup.appendChild(okBtn);
        btnGroup.appendChild(cancelBtn);
        box.appendChild(btnGroup);
        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    /**
     * 自定义美化输入弹窗
     * @param {string} message - 提示内容
     * @param {string} defaultValue - 默认值
     * @param {function} onConfirm - 确认回调，参数为输入值
     */
    function showPrompt(message, defaultValue, onConfirm) {
        // 移除现有弹窗
        const existing = document.querySelector('.custom-prompt');
        if (existing) document.body.removeChild(existing);
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'custom-prompt';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.25)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        // 内容框
        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.borderRadius = '8px';
        box.style.padding = '28px 32px 18px 32px';
        box.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        box.style.textAlign = 'center';
        box.style.minWidth = '260px';
        // 文本
        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.fontSize = '1.1rem';
        msg.style.marginBottom = '18px';
        box.appendChild(msg);
        // 输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue || '';
        input.style.width = '90%';
        input.style.fontSize = '1rem';
        input.style.padding = '6px 8px';
        input.style.marginBottom = '18px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';
        box.appendChild(input);
        // 按钮
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.justifyContent = 'center';
        btnGroup.style.gap = '18px';
        const okBtn = document.createElement('button');
        okBtn.textContent = '确定';
        okBtn.style.background = '#007bff';
        okBtn.style.color = '#fff';
        okBtn.style.border = 'none';
        okBtn.style.padding = '6px 22px';
        okBtn.style.borderRadius = '4px';
        okBtn.style.fontSize = '1rem';
        okBtn.style.cursor = 'pointer';
        okBtn.onclick = () => {
            document.body.removeChild(modal);
            onConfirm && onConfirm(input.value);
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.background = '#e0e0e0';
        cancelBtn.style.color = '#333';
        cancelBtn.style.border = 'none';
        cancelBtn.style.padding = '6px 22px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.fontSize = '1rem';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        btnGroup.appendChild(okBtn);
        btnGroup.appendChild(cancelBtn);
        box.appendChild(btnGroup);
        modal.appendChild(box);
        document.body.appendChild(modal);
        input.focus();
        input.select();
    }

    // 公开API
    return {
        readFileContent,
        copyToClipboard: copyToClipboardSmart,
        pasteFromClipboard: pasteFromClipboardSmart,
        showNotification,
        showConfirm,
        showPrompt
    };
})();