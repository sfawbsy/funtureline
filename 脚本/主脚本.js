/**
 * ============================================
 * 主脚本 — 心灵驿站解压网站交互功能
 * 包含：导航、游戏、音频、名言等模块
 * ============================================
 */

document.addEventListener('DOMContentLoaded', function () {
    初始化导航栏();
    初始化回到顶部();
    初始化游戏切换();
    初始化泡泡游戏();
    初始化涂鸦画布();
    初始化呼吸引导();
    初始化点击游戏();
    初始化音频播放();
    初始化名言切换();
});

/* ==========================================
   1. 导航栏
   ========================================== */
function 初始化导航栏() {
    var 菜单按钮 = document.getElementById('菜单按钮');
    var 菜单列表 = document.querySelector('.菜单列表');
    var 导航栏 = document.getElementById('导航栏');

    菜单按钮.addEventListener('click', function () {
        菜单列表.classList.toggle('展开');
    });

    菜单列表.querySelectorAll('a').forEach(function (链接) {
        链接.addEventListener('click', function () {
            菜单列表.classList.remove('展开');
        });
    });

    window.addEventListener('scroll', function () {
        导航栏.style.boxShadow = window.scrollY > 50
            ? '0 4px 20px rgba(0,0,0,0.1)'
            : '0 1px 8px rgba(0,0,0,0.05)';
    });
}

/* ==========================================
   2. 回到顶部
   ========================================== */
function 初始化回到顶部() {
    var 按钮 = document.getElementById('回到顶部');
    window.addEventListener('scroll', function () {
        按钮.classList.toggle('显示', window.scrollY > 400);
    });
    按钮.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ==========================================
   3. 游戏标签切换
   ========================================== */
function 初始化游戏切换() {
    var 标签列表 = document.querySelectorAll('.游戏标签');
    var 面板列表 = document.querySelectorAll('.游戏面板');

    标签列表.forEach(function (标签) {
        标签.addEventListener('click', function () {
            // 切换标签活跃状态
            标签列表.forEach(function (t) { t.classList.remove('活跃'); });
            标签.classList.add('活跃');

            // 显示对应面板
            var 游戏名 = 标签.getAttribute('data-game');
            面板列表.forEach(function (面板) {
                面板.style.display = 'none';
            });
            document.getElementById('游戏-' + 游戏名).style.display = 'block';
        });
    });
}

/* ==========================================
   4. 捏泡泡游戏
   ========================================== */
function 初始化泡泡游戏() {
    var 泡泡区域 = document.getElementById('泡泡区域');
    var 计数显示 = document.getElementById('泡泡计数');
    var 重置按钮 = document.getElementById('重置泡泡');
    var 计数 = 0;

    // 生成泡泡
    function 生成泡泡() {
        泡泡区域.innerHTML = '';
        计数 = 0;
        计数显示.textContent = '0';
        var 数量 = 24;
        for (var i = 0; i < 数量; i++) {
            var 泡泡 = document.createElement('div');
            泡泡.className = '泡泡';
            // 随机大小
            var 大小 = 44 + Math.floor(Math.random() * 36);
            泡泡.style.width = 大小 + 'px';
            泡泡.style.height = 大小 + 'px';
            // 随机动画延迟
            泡泡.style.animationDelay = (Math.random() * 2) + 's';
            // 随机颜色偏移
            var 色相偏移 = Math.floor(Math.random() * 30) - 15;
            泡泡.style.filter = 'hue-rotate(' + 色相偏移 + 'deg)';

            泡泡.addEventListener('click', function () {
                if (this.parentNode) {
                    this.style.transform = 'scale(0)';
                    this.style.opacity = '0';
                    this.style.transition = 'all 0.2s ease';
                    setTimeout((function (el) {
                        return function () {
                            if (el.parentNode) el.remove();
                        };
                    })(this), 200);
                    计数++;
                    计数显示.textContent = 计数;
                    // 播放简短音效反馈（可选）
                    if (计数 % 10 === 0) {
                        计数显示.parentElement.style.transform = 'scale(1.1)';
                        setTimeout(function () {
                            计数显示.parentElement.style.transform = 'scale(1)';
                        }, 150);
                    }
                }
            });

            泡泡区域.appendChild(泡泡);
        }
    }

    重置按钮.addEventListener('click', 生成泡泡);
    // 初始生成
    生成泡泡();
}

/* ==========================================
   5. 自由涂鸦
   ========================================== */
function 初始化涂鸦画布() {
    var 画布 = document.getElementById('涂鸦画布');
    var ctx = 画布.getContext('2d');
    var 颜色选择器 = document.getElementById('画笔颜色');
    var 粗细滑块 = document.getElementById('画笔粗细');
    var 清空按钮 = document.getElementById('清空画布');
    var 正在绘制 = false;

    // 根据容器大小自适应画布
    function 调整画布() {
        var 容器 = 画布.parentElement;
        var 宽 = Math.min(容器.clientWidth - 60, 800);
        画布.width = 宽;
        画布.height = 450;
        // 白色背景
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, 画布.width, 画布.height);
    }
    调整画布();
    window.addEventListener('resize', 调整画布);

    // 鼠标事件
    画布.addEventListener('mousedown', function (e) { 正在绘制 = true; 开始绘制(e); });
    画布.addEventListener('mousemove', function (e) { if (正在绘制) 绘制(e); });
    画布.addEventListener('mouseup', function () { 正在绘制 = false; });
    画布.addEventListener('mouseleave', function () { 正在绘制 = false; });

    // 触摸事件（手机端）
    画布.addEventListener('touchstart', function (e) { e.preventDefault(); 正在绘制 = true; 开始绘制(e.touches[0]); });
    画布.addEventListener('touchmove', function (e) { e.preventDefault(); if (正在绘制) 绘制(e.touches[0]); });
    画布.addEventListener('touchend', function () { 正在绘制 = false; });

    function 获取坐标(e) {
        var rect = 画布.getBoundingClientRect();
        var 缩放X = 画布.width / rect.width;
        var 缩放Y = 画布.height / rect.height;
        return {
            x: (e.clientX - rect.left) * 缩放X,
            y: (e.clientY - rect.top) * 缩放Y
        };
    }

    function 开始绘制(e) {
        var 坐标 = 获取坐标(e);
        ctx.beginPath();
        ctx.moveTo(坐标.x, 坐标.y);
        ctx.strokeStyle = 颜色选择器.value;
        ctx.lineWidth = parseInt(粗细滑块.value);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function 绘制(e) {
        var 坐标 = 获取坐标(e);
        ctx.lineTo(坐标.x, 坐标.y);
        ctx.stroke();
    }

    清空按钮.addEventListener('click', function () {
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, 画布.width, 画布.height);
    });
}

/* ==========================================
   6. 呼吸引导
   ========================================== */
function 初始化呼吸引导() {
    var 开始按钮 = document.getElementById('开始呼吸');
    var 停止按钮 = document.getElementById('停止呼吸');
    var 圆圈 = document.getElementById('呼吸圆圈');
    var 文字 = document.getElementById('呼吸文字');
    var 状态显示 = document.getElementById('呼吸状态');
    var 定时器 = null;
    var 当前阶段 = 0; // 0=吸气 1=屏息 2=呼气

    var 阶段配置 = [
        { 类名: '吸气', 文字: '吸 气', 状态: '🌬️ 吸气中...', 时长: 4000 },
        { 类名: '屏息', 文字: '屏 息', 状态: '⏸️ 屏息中...', 时长: 7000 },
        { 类名: '呼气', 文字: '呼 气', 状态: '💨 呼气中...', 时长: 8000 }
    ];

    function 运行阶段() {
        var 配置 = 阶段配置[当前阶段];
        圆圈.className = '呼吸圆圈 ' + 配置.类名;
        文字.textContent = 配置.文字;
        状态显示.textContent = 配置.状态;

        定时器 = setTimeout(function () {
            当前阶段 = (当前阶段 + 1) % 3;
            运行阶段();
        }, 配置.时长);
    }

    function 停止呼吸() {
        clearTimeout(定时器);
        圆圈.className = '呼吸圆圈';
        文字.textContent = '准备';
        状态显示.textContent = '已停止';
        当前阶段 = 0;
    }

    开始按钮.addEventListener('click', function () {
        开始按钮.style.display = 'none';
        停止按钮.style.display = 'inline-block';
        当前阶段 = 0;
        运行阶段();
    });

    停止按钮.addEventListener('click', function () {
        停止按钮.style.display = 'none';
        开始按钮.style.display = 'inline-block';
        停止呼吸();
    });
}

/* ==========================================
   7. 疯狂点击游戏
   ========================================== */
function 初始化点击游戏() {
    var 开始按钮 = document.getElementById('开始计数');
    var 大按钮 = document.getElementById('点击大按钮');
    var 点击数显示 = document.getElementById('点击数');
    var 倒计时显示 = document.getElementById('倒计时');
    var 倒计时数字 = 倒计时显示.querySelector('strong');
    var 游戏进行中 = false;
    var 点击数 = 0;
    var 倒计时定时器 = null;
    var 剩余时间 = 10;

    开始按钮.addEventListener('click', function () {
        if (游戏进行中) return;
        游戏进行中 = true;
        点击数 = 0;
        剩余时间 = 10;
        点击数显示.textContent = '0';
        倒计时数字.textContent = '10';
        倒计时显示.style.display = 'inline';
        大按钮.classList.remove('禁用');
        开始按钮.textContent = '⏳ 进行中...';
        开始按钮.disabled = true;

        倒计时定时器 = setInterval(function () {
            剩余时间--;
            倒计时数字.textContent = 剩余时间;
            if (剩余时间 <= 0) {
                结束游戏();
            }
        }, 1000);
    });

    大按钮.addEventListener('click', function () {
        if (!游戏进行中) return;
        点击数++;
        点击数显示.textContent = 点击数;
        // 点击时的小动画
        大按钮.style.transform = 'scale(0.85)';
        setTimeout(function () {
            大按钮.style.transform = '';
        }, 80);
        // 颜色随机微调
        var 色相 = Math.floor(Math.random() * 40) - 20;
        大按钮.style.filter = 'hue-rotate(' + 色相 + 'deg)';
        setTimeout(function () {
            大按钮.style.filter = '';
        }, 120);
    });

    function 结束游戏() {
        clearInterval(倒计时定时器);
        游戏进行中 = false;
        大按钮.classList.add('禁用');
        开始按钮.textContent = '🔄 再来一次';
        开始按钮.disabled = false;
        倒计时显示.style.display = 'none';
        // 显示结果
        alert('⏰ 时间到！你点击了 ' + 点击数 + ' 次！\n\n' + 评价成绩(点击数));
    }

    function 评价成绩(次数) {
        if (次数 >= 80) return '🏆 太厉害了！压力释放得淋漓尽致！';
        if (次数 >= 60) return '👍 不错！感觉压力小了不少吧？';
        if (次数 >= 40) return '🙂 还行，再来一次试试突破自己！';
        return '💪 加油！多试几次会越来越快的~';
    }
}

/* ==========================================
   8. 音频播放控制
   ========================================== */
function 初始化音频播放() {
    var 当前播放的音频 = null;
    var 当前播放的按钮 = null;

    document.querySelectorAll('.音频卡片').forEach(function (卡片) {
        var 按钮 = 卡片.querySelector('.播放按钮');
        var 音频 = 卡片.querySelector('.音频元素');

        按钮.addEventListener('click', function () {
            // 如果已经在播放这个，则暂停
            if (当前播放的音频 === 音频 && !音频.paused) {
                音频.pause();
                按钮.textContent = '▶ 播放';
                按钮.classList.remove('播放中状态');
                卡片.classList.remove('播放中');
                当前播放的音频 = null;
                当前播放的按钮 = null;
                return;
            }

            // 停止之前播放的音频
            if (当前播放的音频 && 当前播放的音频 !== 音频) {
                当前播放的音频.pause();
                if (当前播放的按钮) {
                    当前播放的按钮.textContent = '▶ 播放';
                    当前播放的按钮.classList.remove('播放中状态');
                    当前播放的按钮.closest('.音频卡片').classList.remove('播放中');
                }
            }

            // 播放新的
            音频.play().then(function () {
                按钮.textContent = '⏸ 暂停';
                按钮.classList.add('播放中状态');
                卡片.classList.add('播放中');
                当前播放的音频 = 音频;
                当前播放的按钮 = 按钮;
            }).catch(function () {
                alert('抱歉，音频加载失败，请稍后再试 😢');
            });
        });
    });
}

/* ==========================================
   9. 每日名言切换
   ========================================== */
function 初始化名言切换() {
    var 名言列表 = [
        { 文字: '你已经在努力了，这本身就值得被肯定。', 来源: '—— 心灵驿站' },
        { 文字: '不必太在意结果，享受过程中的每一个瞬间。', 来源: '—— 佚名' },
        { 文字: '今天的你已经比昨天更好了，哪怕只是一点点。', 来源: '—— 心灵驿站' },
        { 文字: '停下来休息不是放弃，是为了走更远的路。', 来源: '—— 日本谚语' },
        { 文字: '你不需要完美，做真实的自己就足够好。', 来源: '—— 布琳·布朗' },
        { 文字: '每一个不曾起舞的日子，都是对生命的辜负。', 来源: '—— 尼采' },
        { 文字: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', 来源: '—— 佚名' },
        { 文字: '世界很大，烦恼很小。深呼吸，一切都会好的。', 来源: '—— 心灵驿站' },
        { 文字: '温柔对待自己，就像对待最好的朋友一样。', 来源: '—— 佚名' },
        { 文字: '最困难的时刻，往往离成功最近。', 来源: '—— 拿破仑' },
        { 文字: '你的价值不取决于你做了什么，而在于你是谁。', 来源: '—— 心灵驿站' },
        { 文字: '累了就歇一歇，没有人规定你必须一直奔跑。', 来源: '—— 佚名' },
    ];

    var 文字元素 = document.getElementById('名言文字');
    var 来源元素 = document.getElementById('名言来源');
    var 按钮 = document.getElementById('换一句');
    var 上次索引 = -1;

    function 随机名言() {
        var 索引;
        do {
            索引 = Math.floor(Math.random() * 名言列表.length);
        } while (索引 === 上次索引 && 名言列表.length > 1);
        上次索引 = 索引;

        // 淡出再淡入
        文字元素.style.opacity = '0';
        来源元素.style.opacity = '0';
        setTimeout(function () {
            文字元素.textContent = 名言列表[索引].文字;
            来源元素.textContent = 名言列表[索引].来源;
            文字元素.style.opacity = '1';
            来源元素.style.opacity = '1';
        }, 300);
    }

    按钮.addEventListener('click', 随机名言);
}
