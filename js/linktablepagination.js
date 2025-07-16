// 秒链分页功能模块
(function() {
    // 分页状态
    let pageSize = 20;
    let currentPage = 1;
    let totalItems = 0;
    let totalPages = 1;
    let pageSizeOptions = [20, 50, 100, 'all'];

    // 获取当前分页的链接数据
    function getPagedLinks(links) {
        if (pageSize === 'all') return links;
        const start = (currentPage - 1) * pageSize;
        return links.slice(start, start + pageSize);
    }

    // 渲染分页UI
    function renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;
        if (totalItems === 0) {
            container.innerHTML = '';
            return;
        }
        let html = '';
        // 页数选择
        html += '<select id="page-size-select" class="pagination-size-select">';
        pageSizeOptions.forEach(opt => {
            let label = opt === 'all' ? '全部' : opt;
            html += `<option value="${opt}"${pageSize==opt?' selected':''}>${label}/页</option>`;
        });
        html += '</select>';
        // 首页、上一页
        html += `<button class="iconfont icon-shuangjiantou-copy-copy-copy pagination-btn" id="first-page-btn" title="首页" ${currentPage===1?'disabled':''}></button>`;
        html += `<button class="iconfont icon-anniu_jiantouxiangzuo_o pagination-btn" id="prev-page-btn" title="上一页" ${currentPage===1?'disabled':''}></button>`;
        // 页码
        html += `<span style="margin:0 8px;">第 <input id="page-input" type="number" min="1" max="${totalPages}" value="${currentPage}" style="width:40px;text-align:center;"> / ${totalPages} 页</span>`;
        // 下一页、末页
        html += `<button class="iconfont icon-anniu-jiantouxiangyou_o pagination-btn" id="next-page-btn" title="下一页" ${currentPage===totalPages?'disabled':''}></button>`;
        html += `<button class="iconfont icon-shuangjiantou pagination-btn" id="last-page-btn" title="末页" ${currentPage===totalPages?'disabled':''}></button>`;
        // 总数
        html += `<span style="margin-left:16px;color:#888;">共 ${totalItems} 条</span>`;
        container.innerHTML = html;
        bindPaginationEvents();
    }

    // 绑定分页事件
    function bindPaginationEvents() {
        const firstBtn = document.getElementById('first-page-btn');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const lastBtn = document.getElementById('last-page-btn');
        const pageInput = document.getElementById('page-input');
        const pageSizeSelect = document.getElementById('page-size-select');
        if (firstBtn) firstBtn.onclick = () => setPage(1);
        if (prevBtn) prevBtn.onclick = () => setPage(currentPage - 1);
        if (nextBtn) nextBtn.onclick = () => setPage(currentPage + 1);
        if (lastBtn) lastBtn.onclick = () => setPage(totalPages);
        if (pageInput) pageInput.onchange = () => setPage(Number(pageInput.value));
        if (pageSizeSelect) pageSizeSelect.onchange = () => {
            pageSize = pageSizeSelect.value === 'all' ? 'all' : Number(pageSizeSelect.value);
            setPage(1);
        };
    }

    // 设置当前页并刷新
    function setPage(page) {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        updateTable();
    }

    // 供外部调用：刷新分页状态并渲染
    function updatePagination(links) {
        totalItems = links.length;
        if (pageSize === 'all') {
            totalPages = 1;
            currentPage = 1;
        } else {
            totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            if (currentPage > totalPages) currentPage = totalPages;
        }
        renderPagination();
    }

    // 供外部调用：获取当前页数据
    function getCurrentPageLinks(links) {
        return getPagedLinks(links);
    }

    // 供外部调用：重置分页到第一页
    function resetPagination() {
        currentPage = 1;
    }

    // 表格刷新联动（由UIHandler调用）
    function updateTable() {
        if (window.UIHandler && window.UIHandler.renderLinkTable) {
            window.UIHandler.renderLinkTable();
        }
    }

    // 挂载到window
    window.LinkTablePagination = {
        updatePagination,
        getCurrentPageLinks,
        resetPagination,
        setPageSize: (size) => { pageSize = size; setPage(1); },
        getPageSize: () => pageSize,
        getCurrentPage: () => currentPage
    };
})(); 