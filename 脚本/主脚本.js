/**
 * ============================================
 * 主脚本 — 心灵驿站解压网站
 * 包含：音效引擎、游戏、导航、名言等
 * ============================================
 */

/* ==========================================
   0. Web Audio API 音效引擎
   所有音效纯代码生成，无需外部文件
   ========================================== */
var 音效引擎 = (function () {
    var 音频上下文 = null;
    var 已初始化 = false;

    /** 获取或创建音频上下文，并确保恢复运行 */
    function 获取上下文() {
        if (!音频上下文) {
            try {
                音频上下文 = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ AudioContext 已创建，采样率:', 音频上下文.sampleRate, '状态:', 音频上下文.state);
            } catch(e) {
                console.error('❌ 无法创建 AudioContext:', e);
                return null;
            }
        }
        // 关键：如果浏览器挂起了音频，恢复它
        if (音频上下文.state === 'suspended') {
            音频上下文.resume().then(function() {
                console.log('🔊 AudioContext 已恢复');
            });
        }
        return 音频上下文;
    }

    /** 播放一个简单的音调 */
    function 播放音调(频率, 类型, 时长, 音量, 起始时间) {
        var ctx = 获取上下文();
        if (!ctx) return;
        var 起始 = 起始时间 || ctx.currentTime;
        var 振荡器 = ctx.createOscillator();
        var 增益 = ctx.createGain();
        振荡器.type = 类型 || 'sine';
        振荡器.frequency.setValueAtTime(频率, 起始);
        增益.gain.setValueAtTime(音量 || 0.5, 起始);
        增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 时长);
        振荡器.connect(增益);
        增益.connect(ctx.destination);
        振荡器.start(起始);
        振荡器.stop(起始 + 时长 + 0.05);
    }

    /** 泡泡破裂音效 — 响亮清脆 */
    function 播放泡泡音() {
        var ctx = 获取上下文();
        if (!ctx) return;
        var 起始 = ctx.currentTime;
        console.log('🫧 泡泡音播放中...');
        // 高频短促音
        播放音调(900 + Math.random() * 500, 'sine', 0.1, 0.5, 起始);
        播放音调(250 + Math.random() * 150, 'triangle', 0.15, 0.35, 起始 + 0.01);
        // 噪音爆破感
        var 缓冲大小 = Math.floor(ctx.sampleRate * 0.08);
        var 缓冲 = ctx.createBuffer(1, 缓冲大小, ctx.sampleRate);
        var 数据 = 缓冲.getChannelData(0);
        for (var i = 0; i < 缓冲大小; i++) {
            数据[i] = (Math.random() * 2 - 1) * Math.exp(-i / (缓冲大小 * 0.15));
        }
        var 噪音源 = ctx.createBufferSource();
        var 噪音增益 = ctx.createGain();
        噪音源.buffer = 缓冲;
        噪音增益.gain.setValueAtTime(0.45, 起始);
        噪音增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 0.08);
        噪音源.connect(噪音增益);
        噪音增益.connect(ctx.destination);
        噪音源.start(起始);
    }

    /** 点击反馈音 — 清脆短促 */
    function 播放点击音() {
        var ctx = 获取上下文();
        if (!ctx) return;
        var 起始 = ctx.currentTime;
        播放音调(880, 'sine', 0.06, 0.4, 起始);
        播放音调(1320, 'sine', 0.04, 0.2, 起始 + 0.01);
    }

    /** 呼吸引导音 — 吸气上升 */
    function 播放吸气音() {
        var ctx = 获取上下文();
        if (!ctx) return;
        var 起始 = ctx.currentTime;
        console.log('🌬️ 吸气音播放中...');
        var 振荡器 = ctx.createOscillator();
        var 增益 = ctx.createGain();
        振荡器.type = 'sine';
        振荡器.frequency.setValueAtTime(200, 起始);
        振荡器.frequency.linearRampToValueAtTime(450, 起始 + 3.8);
        增益.gain.setValueAtTime(0.35, 起始);
        增益.gain.setValueAtTime(0.35, 起始 + 3.5);
        增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 4);
        振荡器.connect(增益);
        增益.connect(ctx.destination);
        振荡器.start(起始);
        振荡器.stop(起始 + 4.1);
    }

    /** 呼吸引导音 — 呼气下降 */
    function 播放呼气音() {
        var ctx = 获取上下文();
        if (!ctx) return;
        var 起始 = ctx.currentTime;
        console.log('💨 呼气音播放中...');
        var 振荡器 = ctx.createOscillator();
        var 增益 = ctx.createGain();
        振荡器.type = 'sine';
        振荡器.frequency.setValueAtTime(450, 起始);
        振荡器.frequency.linearRampToValueAtTime(150, 起始 + 7.8);
        增益.gain.setValueAtTime(0.4, 起始);
        增益.gain.setValueAtTime(0.4, 起始 + 7.5);
        增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 8);
        振荡器.connect(增益);
        增益.connect(ctx.destination);
        振荡器.start(起始);
        振荡器.stop(起始 + 8.1);
    }

    /* ---- 环境音效生成器 ---- */
    var 环境音节点 = null;
    var 环境音类型 = null;

    function 停止环境音() {
        if (环境音节点) {
            try { 环境音节点.stop(); } catch (e) { }
            环境音节点 = null;
            环境音类型 = null;
            console.log('🔇 环境音已停止');
        }
    }

    function 创建噪音缓冲(时长) {
        var ctx = 获取上下文();
        if (!ctx) return null;
        var 大小 = Math.floor(ctx.sampleRate * 时长);
        var 缓冲 = ctx.createBuffer(1, 大小, ctx.sampleRate);
        var 数据 = 缓冲.getChannelData(0);
        for (var i = 0; i < 大小; i++) {
            数据[i] = Math.random() * 2 - 1;
        }
        return 缓冲;
    }

    function 创建噪音源(低频, 高频, 音量值) {
        var ctx = 获取上下文();
        if (!ctx) return null;
        var 源 = ctx.createBufferSource();
        var buf = 创建噪音缓冲(4);
        if (!buf) return null;
        源.buffer = buf;
        源.loop = true;
        var 低切 = ctx.createBiquadFilter();
        低切.type = 'highpass';
        低切.frequency.value = 低频;
        var 高切 = ctx.createBiquadFilter();
        高切.type = 'lowpass';
        高切.frequency.value = 高频;
        var 增益 = ctx.createGain();
        增益.gain.setValueAtTime(0, ctx.currentTime);
        增益.gain.linearRampToValueAtTime(音量值, ctx.currentTime + 0.3);
        源.connect(低切);
        低切.connect(高切);
        高切.connect(增益);
        增益.connect(ctx.destination);
        return { 源: 源, 增益: 增益 };
    }

    /** 雨声 — 加了更响的雨滴 */
    function 播放雨声() {
        停止环境音();
        var 主雨声 = 创建噪音源(200, 5000, 0.5);
        if (!主雨声) return;
        var ctx = 获取上下文();
        // 低频滴答
        var 滴答源 = ctx.createBufferSource();
        滴答源.buffer = 创建噪音缓冲(0.6);
        滴答源.loop = true;
        var 滴答滤波 = ctx.createBiquadFilter();
        滴答滤波.type = 'bandpass';
        滴答滤波.frequency.value = 2000;
        滴答滤波.Q.value = 1.5;
        var 滴答增益 = ctx.createGain();
        滴答增益.gain.setValueAtTime(0, ctx.currentTime);
        滴答增益.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
        滴答源.connect(滴答滤波);
        滴答滤波.connect(滴答增益);
        滴答增益.connect(ctx.destination);
        主雨声.源.start();
        滴答源.start();
        环境音类型 = 'rain';
        环境音节点 = { stop: function () { 主雨声.源.stop(); 滴答源.stop(); } };
        console.log('🌧️ 雨声开始播放');
    }

    /** 海浪声 */
    function 播放海浪() {
        停止环境音();
        var 低频 = 创建噪音源(30, 350, 0.55);
        if (!低频) return;
        var ctx = 获取上下文();
        var lfo = ctx.createOscillator();
        var lfo增益 = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        lfo增益.gain.value = 0.2;
        lfo.connect(lfo增益);
        lfo增益.connect(低频.增益.gain);
        lfo.start();
        低频.源.start();
        环境音类型 = 'ocean';
        环境音节点 = { stop: function () { 低频.源.stop(); lfo.stop(); } };
        console.log('🌊 海浪声开始播放');
    }

    /** 森林鸟鸣 */
    function 播放森林() {
        停止环境音();
        var 背景 = 创建噪音源(150, 2500, 0.18);
        if (!背景) return;
        var ctx = 获取上下文();
        背景.源.start();

        var 鸟叫定时器 = setInterval(function () {
            if (环境音类型 !== 'forest') { clearInterval(鸟叫定时器); return; }
            var 频率 = 2000 + Math.random() * 3000;
            var 起始 = ctx.currentTime;
            播放音调(频率, 'sine', 0.12, 0.2, 起始);
            播放音调(频率 * 1.25, 'sine', 0.1, 0.15, 起始 + 0.07);
            播放音调(频率 * 0.85, 'sine', 0.08, 0.12, 起始 + 0.12);
        }, 600 + Math.random() * 1800);

        环境音类型 = 'forest';
        环境音节点 = {
            stop: function () {
                背景.源.stop();
                clearInterval(鸟叫定时器);
            }
        };
        console.log('🌲 森林鸟鸣开始播放');
    }

    /** 轻柔钢琴 */
    var 钢琴音符 = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 523.3, 587.3, 659.3];
    var 钢琴索引 = 0;
    var 钢琴定时器 = null;

    function 播放钢琴() {
        停止环境音();
        var ctx = 获取上下文();
        if (!ctx) return;

        function 弹奏音符() {
            if (环境音类型 !== 'piano') return;
            var 频率 = 钢琴音符[钢琴索引 % 钢琴音符.length];
            钢琴索引++;
            var 起始 = ctx.currentTime;
            var 基音增益 = ctx.createGain();
            基音增益.gain.setValueAtTime(0.3, 起始);
            基音增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 3);
            var 振荡器 = ctx.createOscillator();
            振荡器.type = 'triangle';
            振荡器.frequency.setValueAtTime(频率, 起始);
            振荡器.connect(基音增益);
            基音增益.connect(ctx.destination);
            振荡器.start(起始);
            振荡器.stop(起始 + 3.1);
            // 八度泛音增加亮度
            var 泛音增益 = ctx.createGain();
            泛音增益.gain.setValueAtTime(0.08, 起始);
            泛音增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 2);
            var 泛音 = ctx.createOscillator();
            泛音.type = 'sine';
            泛音.frequency.setValueAtTime(频率 * 2, 起始);
            泛音.connect(泛音增益);
            泛音增益.connect(ctx.destination);
            泛音.start(起始);
            泛音.stop(起始 + 2.1);
        }

        弹奏音符();
        钢琴定时器 = setInterval(function () {
            setTimeout(弹奏音符, 0);
        }, 2000);

        环境音类型 = 'piano';
        环境音节点 = {
            stop: function () {
                clearInterval(钢琴定时器);
            }
        };
        console.log('🎹 钢琴开始播放');
    }

    function 切换环境音(类型) {
        console.log('🎵 切换环境音:', 类型);
        if (环境音类型 === 类型) {
            停止环境音();
            return false;
        }
        switch (类型) {
            case 'rain': 播放雨声(); break;
            case 'ocean': 播放海浪(); break;
            case 'forest': 播放森林(); break;
            case 'piano': 播放钢琴(); break;
        }
        return true;
    }

    function 正在播放(类型) {
        return 环境音类型 === 类型;
    }

    // 公开方法
    return {
        播放泡泡音: 播放泡泡音,
        播放点击音: 播放点击音,
        播放吸气音: 播放吸气音,
        播放呼气音: 播放呼气音,
        切换环境音: 切换环境音,
        正在播放: 正在播放,
        停止环境音: 停止环境音,
        获取上下文: 获取上下文
    };
})();


/* ==========================================
   主初始化 — 页面加载完成后执行
   ========================================== */
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
            标签列表.forEach(function (t) { t.classList.remove('活跃'); });
            标签.classList.add('活跃');
            var 游戏名 = 标签.getAttribute('data-game');
            面板列表.forEach(function (面板) { 面板.style.display = 'none'; });
            document.getElementById('游戏-' + 游戏名).style.display = 'block';
        });
    });
}


/* ==========================================
   4. 捏泡泡游戏（带音效）
   ========================================== */
function 初始化泡泡游戏() {
    var 泡泡区域 = document.getElementById('泡泡区域');
    var 计数显示 = document.getElementById('泡泡计数');
    var 重置按钮 = document.getElementById('重置泡泡');
    var 计数 = 0;

    function 生成泡泡() {
        泡泡区域.innerHTML = '';
        计数 = 0;
        计数显示.textContent = '0';
        var 数量 = 24;
        for (var i = 0; i < 数量; i++) {
            var 泡泡 = document.createElement('div');
            泡泡.className = '泡泡';
            var 大小 = 44 + Math.floor(Math.random() * 36);
            泡泡.style.width = 大小 + 'px';
            泡泡.style.height = 大小 + 'px';
            泡泡.style.animationDelay = (Math.random() * 2) + 's';
            var 色相偏移 = Math.floor(Math.random() * 30) - 15;
            泡泡.style.filter = 'hue-rotate(' + 色相偏移 + 'deg)';

            泡泡.addEventListener('click', function () {
                if (this.parentNode) {
                    音效引擎.播放泡泡音(); // 🔊 泡泡音效
                    this.style.transform = 'scale(0)';
                    this.style.opacity = '0';
                    this.style.transition = 'all 0.2s ease';
                    var self = this;
                    setTimeout(function () {
                        if (self.parentNode) self.remove();
                    }, 200);
                    计数++;
                    计数显示.textContent = 计数;
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

    function 调整画布() {
        var 容器 = 画布.parentElement;
        var 宽 = Math.min(容器.clientWidth - 60, 800);
        画布.width = 宽;
        画布.height = 450;
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, 画布.width, 画布.height);
    }
    调整画布();
    window.addEventListener('resize', 调整画布);

    画布.addEventListener('mousedown', function (e) { 正在绘制 = true; 开始绘制(e); });
    画布.addEventListener('mousemove', function (e) { if (正在绘制) 绘制(e); });
    画布.addEventListener('mouseup', function () { 正在绘制 = false; });
    画布.addEventListener('mouseleave', function () { 正在绘制 = false; });

    画布.addEventListener('touchstart', function (e) { e.preventDefault(); 正在绘制 = true; 开始绘制(e.touches[0]); });
    画布.addEventListener('touchmove', function (e) { e.preventDefault(); if (正在绘制) 绘制(e.touches[0]); });
    画布.addEventListener('touchend', function () { 正在绘制 = false; });

    function 获取坐标(e) {
        var rect = 画布.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (画布.width / rect.width),
            y: (e.clientY - rect.top) * (画布.height / rect.height)
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
   6. 呼吸引导（带音效）
   ========================================== */
function 初始化呼吸引导() {
    var 开始按钮 = document.getElementById('开始呼吸');
    var 停止按钮 = document.getElementById('停止呼吸');
    var 圆圈 = document.getElementById('呼吸圆圈');
    var 文字 = document.getElementById('呼吸文字');
    var 状态显示 = document.getElementById('呼吸状态');
    var 定时器 = null;
    var 当前阶段 = 0;

    var 阶段配置 = [
        { 类名: '吸气', 文字: '吸 气', 状态: '🌬️ 吸气 4 秒...', 时长: 4000, 音效: '吸气' },
        { 类名: '屏息', 文字: '屏 息', 状态: '⏸️ 屏息 7 秒...', 时长: 7000, 音效: null },
        { 类名: '呼气', 文字: '呼 气', 状态: '💨 呼气 8 秒...', 时长: 8000, 音效: '呼气' }
    ];

    function 运行阶段() {
        var 配置 = 阶段配置[当前阶段];
        圆圈.className = '呼吸圆圈 ' + 配置.类名;
        文字.textContent = 配置.文字;
        状态显示.textContent = 配置.状态;

        // 播放对应音效
        if (配置.音效 === '吸气') 音效引擎.播放吸气音();
        if (配置.音效 === '呼气') 音效引擎.播放呼气音();

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
   7. 疯狂点击（带音效）
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

    // 倒计时音效（每秒滴一声）
    var 滴答定时器 = null;

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
            // 最后3秒急促提示音
            if (剩余时间 <= 3 && 剩余时间 > 0) {
                音效引擎.播放点击音();
            }
            if (剩余时间 <= 0) {
                结束游戏();
            }
        }, 1000);
    });

    大按钮.addEventListener('click', function () {
        if (!游戏进行中) return;
        点击数++;
        点击数显示.textContent = 点击数;
        音效引擎.播放点击音(); // 🔊 点击音效
        大按钮.style.transform = 'scale(0.85)';
        setTimeout(function () { 大按钮.style.transform = ''; }, 80);
        var 色相 = Math.floor(Math.random() * 40) - 20;
        大按钮.style.filter = 'hue-rotate(' + 色相 + 'deg)';
        setTimeout(function () { 大按钮.style.filter = ''; }, 120);
    });

    function 结束游戏() {
        clearInterval(倒计时定时器);
        游戏进行中 = false;
        大按钮.classList.add('禁用');
        开始按钮.textContent = '🔄 再来一次';
        开始按钮.disabled = false;
        倒计时显示.style.display = 'none';
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
   8. 音频播放（使用内置合成音效）
   ========================================== */
function 初始化音频播放() {
    var 所有音频卡片 = document.querySelectorAll('.音频卡片');

    所有音频卡片.forEach(function (卡片) {
        var 按钮 = 卡片.querySelector('.播放按钮');
        var 音效类型 = 卡片.getAttribute('data-sound');

        按钮.addEventListener('click', function () {
            var 已在播放 = 音效引擎.正在播放(音效类型);

            // 先清除所有卡片的播放状态
            所有音频卡片.forEach(function (c) {
                c.classList.remove('播放中');
                var btn = c.querySelector('.播放按钮');
                btn.textContent = '▶ 播放';
                btn.classList.remove('播放中状态');
            });

            if (已在播放) {
                // 停止当前播放
                音效引擎.停止环境音();
            } else {
                // 开始播放新的
                音效引擎.切换环境音(音效类型);
                卡片.classList.add('播放中');
                按钮.textContent = '⏸ 暂停';
                按钮.classList.add('播放中状态');
            }
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
