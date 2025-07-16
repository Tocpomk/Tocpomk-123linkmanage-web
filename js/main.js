/**
 * 主逻辑模块
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    UIHandler.init();
    
    // 初始化事件监听器
    EventHandlers.initEventListeners();

    // 明暗主题切换（带波纹动画）
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    themeBtn.addEventListener('click', (e) => {
        // 波纹动画
        const rect = themeBtn.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple';
        // 计算波纹中心点（按钮中心）
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        ripple.style.left = `${x - 1}px`;
        ripple.style.top = `${y - 1}px`;
        ripple.style.width = ripple.style.height = '2px';
        // 颜色根据主题
        ripple.style.setProperty('--theme-ripple-color', document.body.classList.contains('dark-theme') ? '#ffe082' : '#007bff');
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);

        // 延迟切换主题，等波纹扩散一会
        setTimeout(() => {
            document.body.classList.toggle('dark-theme');
            if (document.body.classList.contains('dark-theme')) {
                themeIcon.classList.remove('icon-taiyang');
                themeIcon.classList.add('icon-yueliang');
            } else {
                themeIcon.classList.remove('icon-yueliang');
                themeIcon.classList.add('icon-taiyang');
            }
        }, 180);
    });

    // 使 .vertical-title 高度跟随 .sidebar 变化，并加14px，仅PC端生效
    function syncVerticalTitleHeight() {
      const sidebar = document.querySelector('.sidebar');
      const verticalTitle = document.querySelector('.vertical-title');
      if (!sidebar || !verticalTitle) return;

      // 先移除之前的 observer
      if (window._verticalTitleResizeObserver) {
        window._verticalTitleResizeObserver.disconnect();
        window._verticalTitleResizeObserver = null;
      }

      // 仅PC端（大于768px）跟随高度
      if (window.innerWidth > 768) {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            const height = entry.contentRect.height + 14;
            verticalTitle.style.height = height + 'px';
          }
        });
        resizeObserver.observe(sidebar);
        verticalTitle.style.height = (sidebar.offsetHeight + 14) + 'px';
        window._verticalTitleResizeObserver = resizeObserver;
      } else {
        // 手机端高度自动
        verticalTitle.style.height = '';
      }
    }

    window.addEventListener('resize', syncVerticalTitleHeight);
    document.addEventListener('DOMContentLoaded', syncVerticalTitleHeight);
    syncVerticalTitleHeight();
});