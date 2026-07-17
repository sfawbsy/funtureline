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
   0.5 背景音乐引擎 — 柔和环境氛围音，进入即播
   ========================================== */
var 背景音乐 = (function () {
    var 正在播放中 = false;
    var 已暂停 = false;
    var 音符定时器 = null;
    var 当前音符组 = [];
    var 全局音量 = 0.06;
    var 已尝试自动播放 = false;

    var 和弦列表 = [
        [220.0, 261.6, 329.6, 440.0],  // Am
        [174.6, 220.0, 261.6, 349.2],  // F
        [130.8, 164.8, 196.0, 261.6],  // C
        [196.0, 246.9, 293.7, 392.0],  // G
    ];
    var 当前和弦 = 0;

    function 清除音符() {
        当前音符组.forEach(function (osc) {
            try { osc.stop(); } catch (e) { }
        });
        当前音符组 = [];
    }

    function 弹奏和弦(和弦) {
        var ctx = 音效引擎.获取上下文();
        if (!ctx) return;
        var 起始 = ctx.currentTime;
        和弦.forEach(function (频率, 索引) {
            var 振荡器 = ctx.createOscillator();
            var 增益 = ctx.createGain();
            振荡器.type = 索引 % 2 === 0 ? 'sine' : 'triangle';
            振荡器.frequency.setValueAtTime(频率 + (Math.random() - 0.5) * 1.5, 起始);
            增益.gain.setValueAtTime(0.0001, 起始);
            增益.gain.exponentialRampToValueAtTime(全局音量 * (0.6 + 索引 * 0.15), 起始 + 3);
            增益.gain.setValueAtTime(全局音量 * (0.6 + 索引 * 0.15), 起始 + 6.5);
            增益.gain.exponentialRampToValueAtTime(0.0001, 起始 + 9);
            振荡器.connect(增益);
            增益.connect(ctx.destination);
            振荡器.start(起始);
            振荡器.stop(起始 + 9.2);
            当前音符组.push(振荡器);
        });
    }

    function 下一个和弦() {
        if (!正在播放中) return;
        清除音符();
        弹奏和弦(和弦列表[当前和弦]);
        当前和弦 = (当前和弦 + 1) % 和弦列表.length;
        音符定时器 = setTimeout(下一个和弦, 7800);
    }

    function 开始() {
        if (正在播放中) return;
        正在播放中 = true;
        已暂停 = false;
        当前和弦 = Math.floor(Math.random() * 和弦列表.length);
        下一个和弦();
        console.log('🎵 背景音乐开始');
    }

    function 暂停() {
        if (!正在播放中) return;
        正在播放中 = false;
        已暂停 = true;
        clearTimeout(音符定时器);
        清除音符();
        console.log('⏸ 背景音乐暂停');
    }

    function 恢复() {
        if (正在播放中 || !已暂停) return;
        开始();
    }

    function 切换暂停恢复() {
        if (正在播放中) {
            暂停();
            return 'paused';
        } else if (已暂停) {
            恢复();
            return 'playing';
        } else {
            开始();
            return 'playing';
        }
    }

    /** 尝试自动播放 — 页面加载时调用 */
    function 尝试自动播放() {
        if (已尝试自动播放) return;
        已尝试自动播放 = true;
        // 先尝试直接播放
        var ctx = 音效引擎.获取上下文();
        if (ctx && ctx.state === 'running') {
            开始();
            console.log('🎵 背景音乐自动播放成功');
            return true;
        }
        // 浏览器阻止了，等首次用户交互再播
        console.log('⏳ 等待用户交互后自动播放...');
        等待用户交互();
        return false;
    }

    /** 在页面上监听首次用户交互，然后自动开始 */
    function 等待用户交互() {
        function 启动() {
            var ctx = 音效引擎.获取上下文();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().then(function () {
                    开始();
                });
            } else {
                开始();
            }
            // 移除监听
            ['click', 'touchstart', 'scroll', 'keydown'].forEach(function (事件) {
                document.removeEventListener(事件, 启动, { once: true });
            });
        }
        ['click', 'touchstart', 'scroll', 'keydown'].forEach(function (事件) {
            document.addEventListener(事件, 启动, { once: true });
        });
    }

    function 是否播放中() { return 正在播放中; }
    function 是否已暂停() { return 已暂停; }

    return {
        开始: 开始,
        暂停: 暂停,
        恢复: 恢复,
        切换暂停恢复: 切换暂停恢复,
        是否播放中: 是否播放中,
        是否已暂停: 是否已暂停,
        尝试自动播放: 尝试自动播放
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
    初始化宠物游戏();
    初始化2048();
    初始化五子棋();
    初始化俄罗斯方块();
    初始化音频播放();
    初始化名言切换();
    初始化背景音乐();

    // ⬇ 页面加载即尝试自动播放背景音乐
    背景音乐.尝试自动播放();
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


/* ==========================================
   10. 背景音乐控制
   ========================================== */
function 初始化背景音乐() {
    var 按钮 = document.getElementById('背景音乐按钮');
    if (!按钮) return;

    function 更新图标() {
        if (背景音乐.是否播放中()) {
            // 正在播放中 — 显示播放中图标
            按钮.innerHTML = '🎵';
            按钮.title = '点击暂停背景音乐';
            按钮.classList.add('播放中');
        } else if (背景音乐.是否已暂停()) {
            // 已暂停 — 显示暂停图标提示
            按钮.innerHTML = '🔇';
            按钮.title = '点击恢复背景音乐';
            按钮.classList.remove('播放中');
        } else {
            // 从未播放过 — 初始状态
            按钮.innerHTML = '🎵';
            按钮.title = '背景音乐加载中...';
            按钮.classList.add('播放中');
        }
    }

    按钮.addEventListener('click', function () {
        背景音乐.切换暂停恢复();
        更新图标();
    });

    // 初始状态设为播放中（等待自动播放）
    按钮.classList.add('播放中');
    按钮.title = '背景音乐加载中...';

    // 定期检查自动播放状态
    var 检查定时器 = setInterval(function () {
        if (背景音乐.是否播放中()) {
            更新图标();
            clearInterval(检查定时器);
        }
    }, 500);
}


/* ==========================================
   11. 宠物养成游戏
   ========================================== */
function 初始化宠物游戏() {
    var 面板 = document.getElementById('游戏-宠物');
    if (!面板) return;

    var 表情元素 = document.getElementById('宠物表情');
    var 名字元素 = document.getElementById('宠物名字');
    var 等级元素 = document.getElementById('宠物等级');
    var 阶段元素 = document.getElementById('宠物阶段');
    var 气泡元素 = document.getElementById('宠物气泡');
    var 升级特效 = document.getElementById('升级特效');

    var 饱腹条 = document.getElementById('饱腹条');
    var 开心条 = document.getElementById('开心条');
    var 精力条 = document.getElementById('精力条');
    var 经验条 = document.getElementById('经验条');
    var 饱腹值 = document.getElementById('饱腹值');
    var 开心值 = document.getElementById('开心值');
    var 精力值 = document.getElementById('精力值');
    var 经验值元素 = document.getElementById('经验值');

    // ========== 进化阶段表 ==========
    function 获取外观(等级) {
        if (等级 >= 20) return { emoji: '🐉', stage: '传说喵神' };
        if (等级 >= 16) return { emoji: '🦁', stage: '威猛狮王' };
        if (等级 >= 13) return { emoji: '🐆', stage: '迅捷灵猫' };
        if (等级 >= 10) return { emoji: '😸', stage: '快乐大喵' };
        if (等级 >= 7)  return { emoji: '🐈', stage: '优雅猫咪' };
        if (等级 >= 4)  return { emoji: '😺', stage: '可爱小猫' };
        return { emoji: '🐱', stage: '小奶猫' };
    }

    function 计算升级经验(等级) {
        return 等级 * 100 + 50;
    }

    // ========== 存档系统 ==========
    var 数据 = 读取存档();
    var 饱腹 = 数据.饱腹;
    var 开心 = 数据.开心;
    var 精力 = 数据.精力;
    var 宠物名 = 数据.名字;
    var 等级 = 数据.等级 || 1;
    var 经验 = 数据.经验 || 0;
    var 之前等级 = 等级;  // 用于检测升级

    function 读取存档() {
        try {
            var raw = localStorage.getItem('pet_data');
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { 饱腹: 100, 开心: 100, 精力: 100, 名字: '小团子', 等级: 1, 经验: 0 };
    }

    function 保存存档() {
        try {
            localStorage.setItem('pet_data', JSON.stringify({
                饱腹: 饱腹, 开心: 开心, 精力: 精力,
                名字: 宠物名, 等级: 等级, 经验: 经验
            }));
        } catch(e) {}
    }

    // ========== UI 刷新 ==========
    function 刷新UI() {
        饱腹条.style.width = 饱腹 + '%';
        开心条.style.width = 开心 + '%';
        精力条.style.width = 精力 + '%';
        饱腹值.textContent = Math.round(饱腹);
        开心值.textContent = Math.round(开心);
        精力值.textContent = Math.round(精力);
        名字元素.textContent = 宠物名;

        // 等级 & 外观
        var 外观 = 获取外观(等级);
        等级元素.textContent = 'Lv.' + 等级;
        阶段元素.textContent = 外观.stage;
        表情元素.textContent = 外观.emoji;

        // 经验条
        var 需要 = 计算升级经验(等级);
        var 百分比 = Math.min(100, (经验 / 需要) * 100);
        经验条.style.width = 百分比 + '%';
        经验值元素.textContent = 经验 + '/' + 需要;

        // 满级
        if (等级 >= 30) {
            经验条.style.width = '100%';
            经验值元素.textContent = 'MAX';
            阶段元素.textContent = '⭐ 满级至尊 ⭐';
        }
    }

    // ========== 经验 & 升级 ==========
    function 增加经验(数量) {
        if (等级 >= 30) return false;  // 满级不再加经验
        经验 += 数量;
        var 升级了 = false;
        while (经验 >= 计算升级经验(等级) && 等级 < 30) {
            经验 -= 计算升级经验(等级);
            等级++;
            升级了 = true;
        }
        if (升级了) {
            触发升级动画();
        }
        return 升级了;
    }

    function 触发升级动画() {
        var 外观 = 获取外观(等级);
        // 飘字特效
        升级特效.querySelector('.升级文字').textContent = '🎉 升级了！';
        升级特效.style.display = 'flex';
        升级特效.classList.remove('播放');
        void 升级特效.offsetWidth;  // 强制回流
        升级特效.classList.add('播放');

        // 宠物抖动
        表情元素.classList.add('进化中');
        setTimeout(function () {
            升级特效.style.display = 'none';
            表情元素.classList.remove('进化中');
        }, 1500);

        显示气泡('✨ 进化成 ' + 外观.stage + ' 啦！');
        音效引擎.播放泡泡音();
        setTimeout(function () { 音效引擎.播放泡泡音(); }, 200);
    }

    // ========== 气泡 ==========
    function 显示气泡(文字) {
        气泡元素.textContent = 文字;
        气泡元素.classList.add('显示');
        clearTimeout(气泡元素._timeout);
        气泡元素._timeout = setTimeout(function () {
            气泡元素.classList.remove('显示');
        }, 2000);
    }

    // ========== 操作 ==========
    // 喂食
    document.getElementById('喂食按钮').addEventListener('click', function () {
        if (精力 <= 5) { 显示气泡('太累了，先睡会儿吧 💤'); return; }
        饱腹 = Math.min(100, 饱腹 + 25);
        开心 = Math.min(100, 开心 + 5);
        精力 = Math.max(0, 精力 - 5);
        增加经验(30);
        保存存档(); 刷新UI();
        显示气泡('好好吃！再来一点~ 🍖');
        音效引擎.播放点击音();
    });

    // 玩耍
    document.getElementById('玩耍按钮').addEventListener('click', function () {
        if (精力 <= 10) { 显示气泡('没力气了，想休息... 😴'); return; }
        if (饱腹 <= 10) { 显示气泡('好饿，先吃点东西吧 🍖'); return; }
        开心 = Math.min(100, 开心 + 30);
        精力 = Math.max(0, 精力 - 15);
        饱腹 = Math.max(0, 饱腹 - 8);
        增加经验(40);
        保存存档(); 刷新UI();
        var 反应 = ['好开心！', '再玩一会儿~', '嘻嘻！', '你是我最好的朋友 ❤️'];
        显示气泡(反应[Math.floor(Math.random() * 反应.length)]);
        音效引擎.播放泡泡音();
    });

    // 睡觉
    document.getElementById('睡觉按钮').addEventListener('click', function () {
        精力 = Math.min(100, 精力 + 50);
        饱腹 = Math.max(0, 饱腹 - 10);
        开心 = Math.min(100, 开心 + 10);
        增加经验(20);
        保存存档(); 刷新UI();
        显示气泡('zzZ... 好舒服 💤');
        音效引擎.播放吸气音();
    });

    // 抚摸宠物
    表情元素.addEventListener('click', function () {
        开心 = Math.min(100, 开心 + 3);
        增加经验(10);
        保存存档(); 刷新UI();
        var 外观 = 获取外观(等级);
        var 反应列表 = ['喵~', '呼噜呼噜...', '蹭蹭你~', '❤️', 外观.stage + '喜欢你！'];
        var 反应 = 反应列表[Math.floor(Math.random() * 反应列表.length)];
        显示气泡(反应);
        音效引擎.播放点击音();
    });

    // 改名
    document.getElementById('改名按钮').addEventListener('click', function () {
        var 区域 = document.getElementById('改名区域');
        var 输入 = document.getElementById('改名输入');
        输入.value = 宠物名;
        区域.style.display = 'flex';
        输入.focus();
    });

    document.getElementById('确认改名').addEventListener('click', function () {
        var 新名字 = document.getElementById('改名输入').value.trim();
        if (新名字) {
            宠物名 = 新名字;
            保存存档(); 刷新UI();
            显示气泡('我叫' + 宠物名 + '！请多关照~');
        }
        document.getElementById('改名区域').style.display = 'none';
    });

    document.getElementById('取消改名').addEventListener('click', function () {
        document.getElementById('改名区域').style.display = 'none';
    });

    // ========== 计时衰减 ==========
    function 计时扣除() {
        if (面板.style.display === 'none') return;
        饱腹 = Math.max(0, 饱腹 - 1);
        if (饱腹 <= 15) 开心 = Math.max(0, 开心 - 1);
        精力 = Math.max(0, 精力 - 0.5);
        保存存档(); 刷新UI();

        if (饱腹 <= 8) 显示气泡('好饿... 🍖');
        if (开心 <= 8) 显示气泡('好无聊... 🎾');
        if (精力 <= 5) 显示气泡('好困... 💤');
    }

    // 每 5 秒扣除一次
    setInterval(计时扣除, 5000);

    刷新UI();
    var 初始外观 = 获取外观(等级);
    显示气泡('Lv.' + 等级 + ' ' + 初始外观.stage + '~ 陪我玩吧！');
}


/* ==========================================
   12. 2048 游戏
   ========================================== */
function 初始化2048() {
    var 网格元素 = document.getElementById('网格2048');
    var 分数元素 = document.getElementById('2048分数');
    var 最高分元素 = document.getElementById('2048最高分');
    var 覆盖层 = document.getElementById('2048覆盖');
    var 覆盖文字 = document.getElementById('2048覆盖文字');

    var 格子元素 = [];   // 4x4 DOM 元素
    var 格子值 = [];     // 4x4 数值
    var 分数 = 0;
    var 最高分 = 0;
    var 游戏结束 = false;
    var 已达2048 = false;

    // 读取最高分
    try {
        var raw = localStorage.getItem('2048_high_score');
        if (raw) 最高分 = parseInt(raw);
    } catch(e) {}
    最高分元素.textContent = 最高分;

    // 创建网格 DOM
    function 创建网格DOM() {
        网格元素.innerHTML = '';
        格子元素 = [];
        for (var r = 0; r < 4; r++) {
            格子元素[r] = [];
            for (var c = 0; c < 4; c++) {
                var 格子 = document.createElement('div');
                格子.className = '格子2048';
                格子元素[r][c] = 格子;
                网格元素.appendChild(格子);
            }
        }
    }

    function 刷新DOM() {
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var 值 = 格子值[r][c];
                var 格子 = 格子元素[r][c];
                格子.textContent = 值 || '';
                格子.setAttribute('data-value', 值 || '');
            }
        }
        分数元素.textContent = 分数;
        if (分数 > 最高分) {
            最高分 = 分数;
            最高分元素.textContent = 最高分;
            try { localStorage.setItem('2048_high_score', 最高分); } catch(e) {}
        }
    }

    function 随机空格() {
        var 空列表 = [];
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++)
                if (格子值[r][c] === 0) 空列表.push({r: r, c: c});
        if (空列表.length === 0) return null;
        return 空列表[Math.floor(Math.random() * 空列表.length)];
    }

    function 添加随机格子() {
        var 位置 = 随机空格();
        if (!位置) return;
        格子值[位置.r][位置.c] = Math.random() < 0.9 ? 2 : 4;
        // 动画
        var 格子 = 格子元素[位置.r][位置.c];
        格子.classList.add('新合并');
        setTimeout(function () { 格子.classList.remove('新合并'); }, 200);
    }

    function 初始化格子值() {
        格子值 = [];
        for (var r = 0; r < 4; r++) {
            格子值[r] = [0, 0, 0, 0];
        }
    }

    function 新游戏() {
        初始化格子值();
        分数 = 0;
        游戏结束 = false;
        已达2048 = false;
        覆盖层.style.display = 'none';
        添加随机格子();
        添加随机格子();
        刷新DOM();
    }

    // 移动逻辑
    function 旋转矩阵(矩阵, 次数) {
        var 结果 = 矩阵;
        for (var t = 0; t < 次数; t++) {
            var 新矩阵 = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
            for (var r = 0; r < 4; r++)
                for (var c = 0; c < 4; c++)
                    新矩阵[c][3-r] = 结果[r][c];
            结果 = 新矩阵;
        }
        return 结果;
    }

    function 左移一行(行) {
        // 先去掉0
        var 紧凑 = [];
        for (var i = 0; i < 4; i++) {
            if (行[i] !== 0) 紧凑.push(行[i]);
        }
        // 合并相邻相同
        var 结果 = [];
        var 得分增量 = 0;
        for (var i = 0; i < 紧凑.length; i++) {
            if (i < 紧凑.length - 1 && 紧凑[i] === 紧凑[i+1]) {
                结果.push(紧凑[i] * 2);
                得分增量 += 紧凑[i] * 2;
                i++; // 跳过下一个
            } else {
                结果.push(紧凑[i]);
            }
        }
        // 补0到4个
        while (结果.length < 4) 结果.push(0);
        return { 行: 结果, 得分: 得分增量 };
    }

    function 移动(方向) {
        // 方向: 0=左, 1=上, 2=右, 3=下
        // 通过旋转把不同方向都变成"左移"
        var 旋转次数;
        switch (方向) {
            case 0: 旋转次数 = 0; break; // 左
            case 1: 旋转次数 = 1; break; // 上
            case 2: 旋转次数 = 2; break; // 右
            case 3: 旋转次数 = 3; break; // 下
        }

        var 旋转后 = 旋转矩阵(格子值, 旋转次数);
        var 移动了 = false;
        var 总分 = 0;

        for (var r = 0; r < 4; r++) {
            var 原行 = 旋转后[r];
            var 结果 = 左移一行(原行);
            if (结果.行.join(',') !== 原行.join(',')) 移动了 = true;
            旋转后[r] = 结果.行;
            总分 += 结果.得分;
        }

        if (!移动了) return false;

        格子值 = 旋转矩阵(旋转后, (4 - 旋转次数) % 4);
        分数 += 总分;

        // 检查2048
        if (!已达2048) {
            for (var r = 0; r < 4; r++)
                for (var c = 0; c < 4; c++)
                    if (格子值[r][c] === 2048) { 已达2048 = true; break; }
        }

        添加随机格子();
        刷新DOM();

        // 检查失败
        if (!有可用移动()) {
            游戏结束 = true;
            setTimeout(function () {
                覆盖文字.textContent = 已达2048 ? '🎉 你赢了！' : '游戏结束';
                覆盖层.style.display = 'flex';
            }, 300);
        }

        return true;
    }

    function 有可用移动() {
        // 有空位
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++)
                if (格子值[r][c] === 0) return true;
        // 有相邻相同
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++) {
                if (c < 3 && 格子值[r][c] === 格子值[r][c+1]) return true;
                if (r < 3 && 格子值[r][c] === 格子值[r+1][c]) return true;
            }
        return false;
    }

    // 键盘事件
    document.addEventListener('keydown', function (e) {
        var 面板 = document.getElementById('游戏-2048');
        if (面板.style.display === 'none' || 游戏结束) return;
        var 方向;
        switch (e.key) {
            case 'ArrowLeft':  方向 = 0; break;
            case 'ArrowUp':    方向 = 1; break;
            case 'ArrowRight': 方向 = 2; break;
            case 'ArrowDown':  方向 = 3; break;
            default: return;
        }
        e.preventDefault();
        if (移动(方向)) 音效引擎.播放点击音();
    });

    // 触摸滑动
    var 触摸起始 = null;
    网格元素.addEventListener('touchstart', function (e) {
        if (游戏结束) return;
        触摸起始 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    网格元素.addEventListener('touchend', function (e) {
        if (!触摸起始 || 游戏结束) return;
        var dx = e.changedTouches[0].clientX - 触摸起始.x;
        var dy = e.changedTouches[0].clientY - 触摸起始.y;
        var 最小距离 = 30;
        if (Math.abs(dx) < 最小距离 && Math.abs(dy) < 最小距离) return;

        var 方向;
        if (Math.abs(dx) > Math.abs(dy)) {
            方向 = dx > 0 ? 2 : 0; // 右 : 左
        } else {
            方向 = dy > 0 ? 3 : 1; // 下 : 上
        }
        if (移动(方向)) 音效引擎.播放点击音();
        触摸起始 = null;
    });

    document.getElementById('2048新游戏').addEventListener('click', 新游戏);
    document.getElementById('2048重来').addEventListener('click', 新游戏);

    // 启动
    创建网格DOM();
    新游戏();
}


/* ==========================================
   13. 五子棋（双人对弈）
   ========================================== */
function 初始化五子棋() {
    var 画布 = document.getElementById('五子棋画布');
    var ctx = 画布.getContext('2d');
    var 状态元素 = document.getElementById('五子棋状态');
    var 黑方胜场元素 = document.getElementById('黑方胜场');
    var 白方胜场元素 = document.getElementById('白方胜场');

    // 联机元素
    var 联机面板 = document.getElementById('五子棋联机面板');
    var 联机按钮 = document.getElementById('五子棋联机按钮');
    var 状态灯 = document.getElementById('联机状态灯');
    var 状态文字 = document.getElementById('联机状态文字');
    var 操作区 = document.getElementById('联机操作区');
    var 房间信息区 = document.getElementById('联机房间信息');
    var 房间号显示 = document.getElementById('房间号显示');
    var 断开按钮 = document.getElementById('断开联机按钮');

    var 格子数 = 15;
    var 格子大小 = 35;
    var 边距 = 40;
    var 棋子半径 = 14;
    var 棋盘 = [];
    var 当前玩家 = 1;
    var 游戏结束 = false;
    var 获胜线 = null;
    var 黑方胜场 = 0;
    var 白方胜场 = 0;

    // 联机状态
    var 联机模式 = false;
    var 我是房主 = false;
    var 我的颜色 = 0;  // 1=黑(先手), 2=白(后手)
    var peer = null;
    var 连接 = null;
    var 已连接 = false;

    // ========== 棋盘逻辑（同本地） ==========
    function 初始化棋盘() {
        棋盘 = [];
        for (var r = 0; r < 格子数; r++) {
            棋盘[r] = [];
            for (var c = 0; c < 格子数; c++) { 棋盘[r][c] = 0; }
        }
        当前玩家 = 1;
        游戏结束 = false;
        获胜线 = null;
        更新状态文字();
    }

    function 更新状态文字() {
        if (游戏结束) {
            var 胜者 = 当前玩家 === 1 ? '⚪ 白方' : '⚫ 黑方';
            if (联机模式 && 我的颜色 > 0) {
                胜者 = 当前玩家 === 我的颜色 ? '🎉 你' : '😢 对手';
            }
            状态元素.innerHTML = '🏆 <strong>' + 胜者 + '获胜！</strong>';
        } else {
            var 玩家名 = 当前玩家 === 1 ? '⚫ 黑方' : '⚪ 白方';
            if (联机模式 && 我的颜色 > 0) {
                玩家名 = 当前玩家 === 我的颜色 ? '轮到你了' : '等待对手...';
            }
            状态元素.innerHTML = '轮到：<strong>' + 玩家名 + '</strong>';
        }
        黑方胜场元素.textContent = 黑方胜场;
        白方胜场元素.textContent = 白方胜场;
    }

    function 绘制棋盘() {
        var 画布尺寸 = 边距 * 2 + 格子大小 * (格子数 - 1);
        画布.width = 画布尺寸;
        画布.height = 画布尺寸;
        ctx.fillStyle = '#dcb468';
        ctx.fillRect(0, 0, 画布尺寸, 画布尺寸);
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 1;
        for (var i = 0; i < 格子数; i++) {
            var 坐标 = 边距 + i * 格子大小;
            ctx.beginPath(); ctx.moveTo(边距, 坐标); ctx.lineTo(边距 + 格子大小 * (格子数 - 1), 坐标); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(坐标, 边距); ctx.lineTo(坐标, 边距 + 格子大小 * (格子数 - 1)); ctx.stroke();
        }
        var 星位 = [[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]];
        ctx.fillStyle = '#5a4a3a';
        for (var s = 0; s < 星位.length; s++) {
            ctx.beginPath(); ctx.arc(边距 + 星位[s][0] * 格子大小, 边距 + 星位[s][1] * 格子大小, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        for (var r = 0; r < 格子数; r++) {
            for (var c = 0; c < 格子数; c++) {
                if (棋盘[r][c] === 0) continue;
                var x = 边距 + c * 格子大小, y = 边距 + r * 格子大小;
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.arc(x + 1.5, y + 1.5, 棋子半径, 0, Math.PI * 2); ctx.fill();
                var 渐变 = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 棋子半径);
                if (棋盘[r][c] === 1) { 渐变.addColorStop(0,'#555'); 渐变.addColorStop(0.6,'#222'); 渐变.addColorStop(1,'#000'); }
                else { 渐变.addColorStop(0,'#fff'); 渐变.addColorStop(0.6,'#eee'); 渐变.addColorStop(1,'#ccc'); }
                ctx.fillStyle = 渐变;
                ctx.beginPath(); ctx.arc(x, y, 棋子半径, 0, Math.PI * 2); ctx.fill();
            }
        }
        if (获胜线 && 获胜线.length === 5) {
            ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(边距 + 获胜线[0].c * 格子大小, 边距 + 获胜线[0].r * 格子大小);
            for (var i = 1; i < 获胜线.length; i++) ctx.lineTo(边距 + 获胜线[i].c * 格子大小, 边距 + 获胜线[i].r * 格子大小);
            ctx.stroke();
            for (var i = 0; i < 获胜线.length; i++) {
                ctx.beginPath(); ctx.arc(边距 + 获胜线[i].c * 格子大小, 边距 + 获胜线[i].r * 格子大小, 棋子半径 + 3, 0, Math.PI * 2); ctx.stroke();
            }
        }
        if (!游戏结束 && 棋盘.最后落子) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath(); ctx.arc(边距 + 棋盘.最后落子.c * 格子大小, 边距 + 棋盘.最后落子.r * 格子大小, 3.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    function 检查胜利(r, c) {
        var 玩家 = 棋盘[r][c];
        if (玩家 === 0) return false;
        var 方向组 = [[{dr:0,dc:1},{dr:0,dc:-1}],[{dr:1,dc:0},{dr:-1,dc:0}],[{dr:1,dc:1},{dr:-1,dc:-1}],[{dr:1,dc:-1},{dr:-1,dc:1}]];
        for (var d = 0; d < 方向组.length; d++) {
            var 连线 = [{r:r,c:c}];
            for (var dir = 0; dir < 2; dir++) {
                var dr = 方向组[d][dir].dr, dc = 方向组[d][dir].dc;
                for (var step = 1; step < 5; step++) {
                    var nr = r + dr * step, nc = c + dc * step;
                    if (nr >= 0 && nr < 格子数 && nc >= 0 && nc < 格子数 && 棋盘[nr][nc] === 玩家) {
                        if (dir === 0) 连线.push({r:nr,c:nc}); else 连线.unshift({r:nr,c:nc});
                    } else break;
                }
            }
            if (连线.length >= 5) {
                连线.sort(function(a,b){ return a.r !== b.r ? a.r - b.r : a.c - b.c; });
                var 连续5;
                if (连线.length === 5) { 连续5 = 连线; }
                else {
                    for (var i = 0; i <= 连线.length - 5; i++) {
                        var ok = false;
                        for (var j = i; j < i + 5; j++) { if (连线[j].r === r && 连线[j].c === c) { ok = true; break; } }
                        if (ok) { 连续5 = 连线.slice(i, i + 5); break; }
                    }
                    if (!连续5 || 连续5.length === 0) 连续5 = 连线.slice(0, 5);
                }
                获胜线 = 连续5;
                return true;
            }
        }
        return false;
    }

    function 落子(r, c, 来自网络) {
        if (游戏结束 || 棋盘[r][c] !== 0) return false;
        // 联机模式：不是自己回合不能落子
        if (联机模式 && !来自网络 && 当前玩家 !== 我的颜色) return false;

        棋盘[r][c] = 当前玩家;
        棋盘.最后落子 = {r:r, c:c};

        // 联机模式：发送给对方
        if (联机模式 && !来自网络 && 已连接) {
            连接.send({ type: 'move', r: r, c: c });
        }

        if (检查胜利(r, c)) {
            游戏结束 = true;
            if (当前玩家 === 1) 黑方胜场++; else 白方胜场++;
            音效引擎.播放泡泡音();
            绘制棋盘(); 更新状态文字();
            return true;
        }
        var 满了 = true;
        for (var rr = 0; rr < 格子数 && 满了; rr++)
            for (var cc = 0; cc < 格子数 && 满了; cc++)
                if (棋盘[rr][cc] === 0) { 满了 = false; break; }
        if (满了) {
            游戏结束 = true;
            状态元素.innerHTML = '🤝 <strong>平局！</strong>';
            绘制棋盘(); 更新状态文字();
            return true;
        }
        当前玩家 = 当前玩家 === 1 ? 2 : 1;
        音效引擎.播放点击音();
        绘制棋盘(); 更新状态文字();
        return true;
    }

    // ========== 联机逻辑 ==========
    function 更新联机UI() {
        if (联机模式) {
            联机面板.style.display = 'block';
            联机按钮.textContent = '💻 本地模式';
            联机按钮.classList.add('联机模式中');
            if (已连接) {
                操作区.style.display = 'none';
                房间信息区.style.display = 'flex';
                断开按钮.style.display = 'inline-block';
            } else {
                操作区.style.display = 'block';
                房间信息区.style.display = 'none';
                断开按钮.style.display = 'none';
            }
        } else {
            联机面板.style.display = 'none';
            联机按钮.textContent = '🌐 联机对战';
            联机按钮.classList.remove('联机模式中');
            断开连接();
        }
    }

    function 设置连接状态(灯类, 文字) {
        状态灯.className = '联机状态灯 ' + 灯类;
        状态文字.textContent = 文字;
    }

    function 初始化Peer() {
        if (peer) { peer.destroy(); }
        var id = 'gomoku-' + Math.random().toString(36).substr(2, 8);
        peer = new Peer(id);
        setConnectionListeners();
        return id;
    }

    function setConnectionListeners() {
        peer.on('open', function(myId) {
            console.log('PeerJS ready:', myId);
        });

        peer.on('connection', function(conn) {
            if (已连接) { conn.close(); return; }
            连接 = conn;
            建立连接(false);
        });

        peer.on('error', function(err) {
            console.error('PeerJS error:', err);
            设置连接状态('', '连接失败：' + err.type);
        });
    }

    function 建立连接(我是发起方) {
        已连接 = true;
        我是房主 = 我是发起方;
        我的颜色 = 我是发起方 ? 1 : 2; // 房主执黑先手

        连接.on('data', function(data) {
            if (data.type === 'move') {
                当前玩家 = 我的颜色 === 1 ? 2 : 1;
                落子(data.r, data.c, true);
            } else if (data.type === 'reset') {
                初始化棋盘();
                棋盘.最后落子 = null;
                绘制棋盘();
                音效引擎.播放点击音();
            } else if (data.type === 'ping') {
                连接.send({ type: 'pong' });
            }
        });

        连接.on('close', function() {
            已连接 = false;
            设置连接状态('', '对手已断开');
            操作区.style.display = 'block';
            房间信息区.style.display = 'none';
            断开按钮.style.display = 'none';
        });

        connectionEstablished();
    }

    function connectionEstablished() {
        设置连接状态('已连接', '已连接 — ' + (我是房主 ? '你执黑⚫先手' : '你执白⚪后手'));
        更新联机UI();
        初始化棋盘();
        棋盘.最后落子 = null;
        绘制棋盘();
        // 发送 ping
        if (连接 && 连接.open) 连接.send({ type: 'ping' });
        音效引擎.播放泡泡音();
    }

    function 断开连接() {
        if (连接) { try { 连接.close(); } catch(e) {} 连接 = null; }
        if (peer) { try { peer.destroy(); } catch(e) {} peer = null; }
        已连接 = false;
        我是房主 = false;
        我的颜色 = 0;
        设置连接状态('', '未连接');
        操作区.style.display = 'block';
        房间信息区.style.display = 'none';
        断开按钮.style.display = 'none';
        初始化棋盘();
        棋盘.最后落子 = null;
        绘制棋盘();
    }

    // ========== 按钮事件 ==========
    联机按钮.addEventListener('click', function() {
        联机模式 = !联机模式;
        更新联机UI();
        if (联机模式) {
            断开连接();
            初始化Peer();
            设置连接状态('', '等待创建或加入房间...');
        } else {
            断开连接();
            初始化棋盘();
            棋盘.最后落子 = null;
            绘制棋盘();
        }
    });

    document.getElementById('创建房间按钮').addEventListener('click', function() {
        if (!peer) 初始化Peer();
        peer.on('open', function(myId) {
            房间号显示.textContent = myId;
            设置连接状态('连接中', '等待对手加入...');
            更新联机UI();
            // 连接由 peer.on('connection') 处理
        });
        // 如果 peer 已经 open，直接显示
        if (peer.id) {
            房间号显示.textContent = peer.id;
            设置连接状态('连接中', '等待对手加入...');
            更新联机UI();
        }
    });

    document.getElementById('加入房间按钮').addEventListener('click', function() {
        var 房间号 = document.getElementById('房间号输入').value.trim();
        if (!房间号) { alert('请输入房间号'); return; }
        if (!peer) 初始化Peer();
        设置连接状态('连接中', '正在连接...');
        var conn = peer.connect(房间号, { reliable: true });
        连接 = conn;
        conn.on('open', function() {
            建立连接(true);
        });
        conn.on('error', function() {
            设置连接状态('', '连接失败，请检查房间号');
        });
    });

    document.getElementById('断开联机按钮').addEventListener('click', function() {
        断开连接();
    });

    document.getElementById('复制房间号').addEventListener('click', function() {
        var 号 = 房间号显示.textContent;
        if (号 && 号 !== '---') {
            navigator.clipboard.writeText(号).then(function() {
                alert('房间号已复制！发给朋友即可对战');
            }).catch(function() {
                prompt('复制此房间号发给朋友：', 号);
            });
        }
    });

    // ========== 画布点击 ==========
    画布.addEventListener('click', function (e) {
        var rect = 画布.getBoundingClientRect();
        var 缩放 = 画布.width / rect.width;
        var x = (e.clientX - rect.left) * 缩放;
        var y = (e.clientY - rect.top) * 缩放;
        var c = Math.round((x - 边距) / 格子大小);
        var r = Math.round((y - 边距) / 格子大小);
        if (r < 0 || r >= 格子数 || c < 0 || c >= 格子数) return;
        var 距离 = Math.sqrt(Math.pow(x - 边距 - c * 格子大小, 2) + Math.pow(y - 边距 - r * 格子大小, 2));
        if (距离 > 棋子半径 + 2) return;
        // 联机模式未连接时提示
        if (联机模式 && !已连接) { alert('请先创建或加入房间'); return; }
        落子(r, c, false);
    });

    // 重置按钮（联机模式发送重置请求）
    document.getElementById('五子棋重置').addEventListener('click', function () {
        if (联机模式 && 已连接 && !游戏结束) {
            if (!confirm('确定要重开一局？')) return;
            连接.send({ type: 'reset' });
        }
        初始化棋盘();
        棋盘.最后落子 = null;
        绘制棋盘();
    });

    // 启动
    初始化棋盘();
    绘制棋盘();
}


/* ==========================================
   14. 俄罗斯方块
   ========================================== */
function 初始化俄罗斯方块() {
    var 画布 = document.getElementById('方块画布');
    var ctx = 画布.getContext('2d');
    var 预览画布 = document.getElementById('方块预览');
    var 预览ctx = 预览画布.getContext('2d');

    var 分数元素 = document.getElementById('方块分数');
    var 等级元素 = document.getElementById('方块等级');
    var 行数元素 = document.getElementById('方块行数');
    var 开始按钮 = document.getElementById('方块开始');
    var 暂停按钮 = document.getElementById('方块暂停');

    var 列数 = 10;
    var 行数 = 20;
    var 格子 = 30;

    // 颜色映射
    var 颜色表 = {
        I: '#00e5ff', O: '#ffea00', T: '#d500f9',
        S: '#76ff03', Z: '#ff1744', J: '#2979ff', L: '#ff9100'
    };
    var 暗色表 = {
        I: '#009faf', O: '#c7a000', T: '#7b00a0',
        S: '#338800', Z: '#b00020', J: '#0040c0', L: '#c56000'
    };

    // 方块形状定义
    var 方块类型 = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    var 形状表 = {
        I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1],[0,0,0]],
        S: [[0,1,1],[1,1,0],[0,0,0]],
        Z: [[1,1,0],[0,1,1],[0,0,0]],
        J: [[1,0,0],[1,1,1],[0,0,0]],
        L: [[0,0,1],[1,1,1],[0,0,0]]
    };

    // 游戏状态
    var 面板元素 = document.getElementById('游戏-俄罗斯');
    var 棋盘 = [];
    var 当前类型 = null;
    var 当前形状 = null;
    var 当前X = 0;
    var 当前Y = 0;
    var 下一个类型 = null;
    var 分数 = 0;
    var 等级 = 1;
    var 消除行数 = 0;
    var 游戏中 = false;
    var 暂停中 = false;
    var 游戏循环定时器 = null;

    function 初始化棋盘() {
        for (var r = 0; r < 行数; r++) {
            棋盘[r] = [];
            for (var c = 0; c < 列数; c++) {
                棋盘[r][c] = null; // null 或颜色名如 'I','O'等
            }
        }
    }

    function 随机类型() {
        return 方块类型[Math.floor(Math.random() * 方块类型.length)];
    }

    function 旋转形状(形状) {
        var 大小 = 形状.length;
        var 新形状 = [];
        for (var r = 0; r < 大小; r++) {
            新形状[r] = [];
            for (var c = 0; c < 大小; c++) {
                新形状[r][c] = 形状[大小 - 1 - c][r];
            }
        }
        return 新形状;
    }

    function 生成方块(类型) {
        return 形状表[类型].map(function (行) { return 行.slice(); });
    }

    function 碰撞检测(形状, x, y) {
        for (var r = 0; r < 形状.length; r++) {
            for (var c = 0; c < 形状[r].length; c++) {
                if (!形状[r][c]) continue;
                var 新X = x + c;
                var 新Y = y + r;
                if (新X < 0 || 新X >= 列数 || 新Y >= 行数) return true;
                if (新Y < 0) continue;
                if (棋盘[新Y][新X]) return true;
            }
        }
        return false;
    }

    function 锁定方块() {
        for (var r = 0; r < 当前形状.length; r++) {
            for (var c = 0; c < 当前形状[r].length; c++) {
                if (!当前形状[r][c]) continue;
                var 棋盘Y = 当前Y + r;
                var 棋盘X = 当前X + c;
                if (棋盘Y < 0) {
                    游戏结束();
                    return;
                }
                棋盘[棋盘Y][棋盘X] = 当前类型;
            }
        }
        清除行();
        生成下一个();
    }

    function 清除行() {
        var 消除 = 0;
        for (var r = 行数 - 1; r >= 0; r--) {
            var 满行 = true;
            for (var c = 0; c < 列数; c++) {
                if (!棋盘[r][c]) { 满行 = false; break; }
            }
            if (满行) {
                // 闪光效果
                棋盘[r] = 棋盘[r].map(function () { return 'flash'; });
                绘制();
                棋盘.splice(r, 1);
                棋盘.unshift(new Array(列数).fill(null));
                消除++;
                r++; // 重新检查当前行
            }
        }
        if (消除 > 0) {
            var 加分 = [0, 100, 300, 500, 800];
            分数 += (加分[消除] || 消除 * 200) * 等级;
            消除行数 += 消除;
            等级 = Math.floor(消除行数 / 10) + 1;
            更新UI();
            音效引擎.播放泡泡音();
        }
    }

    function 生成下一个() {
        if (下一个类型) {
            当前类型 = 下一个类型;
            当前形状 = 生成方块(当前类型);
        } else {
            当前类型 = 随机类型();
            当前形状 = 生成方块(当前类型);
        }
        下一个类型 = 随机类型();
        当前X = Math.floor((列数 - 当前形状[0].length) / 2);
        当前Y = -1;

        if (碰撞检测(当前形状, 当前X, 当前Y + 1)) {
            当前Y = 0;
            if (碰撞检测(当前形状, 当前X, 当前Y)) {
                游戏结束();
            }
        }
        绘制预览();
    }

    function 下落() {
        if (!碰撞检测(当前形状, 当前X, 当前Y + 1)) {
            当前Y++;
            绘制();
            return true;
        }
        锁定方块();
        return false;
    }

    function 硬降() {
        var 距离 = 0;
        while (!碰撞检测(当前形状, 当前X, 当前Y + 1)) {
            当前Y++;
            距离++;
        }
        分数 += 距离 * 2;
        锁定方块();
        音效引擎.播放点击音();
    }

    function 移动(方向) {
        if (!碰撞检测(当前形状, 当前X + 方向, 当前Y)) {
            当前X += 方向;
            绘制();
            return true;
        }
        return false;
    }

    function 旋转() {
        var 旋转后 = 旋转形状(当前形状);
        // 踢墙：尝试左右偏移
        var 偏移量 = [0, -1, 1, -2, 2];
        for (var i = 0; i < 偏移量.length; i++) {
            if (!碰撞检测(旋转后, 当前X + 偏移量[i], 当前Y)) {
                当前形状 = 旋转后;
                当前X += 偏移量[i];
                绘制();
                return true;
            }
        }
        return false;
    }

    function 软降() {
        if (下落()) {
            分数 += 1;
            更新UI();
        }
    }

    function 绘制() {
        if (暂停中) return;
        ctx.clearRect(0, 0, 画布.width, 画布.height);

        // 背景网格
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 画布.width, 画布.height);
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 0.5;
        for (var r = 0; r <= 行数; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * 格子);
            ctx.lineTo(列数 * 格子, r * 格子);
            ctx.stroke();
        }
        for (var c = 0; c <= 列数; c++) {
            ctx.beginPath();
            ctx.moveTo(c * 格子, 0);
            ctx.lineTo(c * 格子, 行数 * 格子);
            ctx.stroke();
        }

        // 已锁定的方块
        for (var r = 0; r < 行数; r++) {
            for (var c = 0; c < 列数; c++) {
                if (棋盘[r][c]) {
                    绘制格子(ctx, c, r, 棋盘[r][c]);
                }
            }
        }

        // 投影（ghost piece）
        if (当前形状 && 游戏中) {
            var 投影Y = 当前Y;
            while (!碰撞检测(当前形状, 当前X, 投影Y + 1)) 投影Y++;
            if (投影Y !== 当前Y) {
                for (var r = 0; r < 当前形状.length; r++) {
                    for (var c = 0; c < 当前形状[r].length; c++) {
                        if (当前形状[r][c]) {
                            ctx.fillStyle = 'rgba(255,255,255,0.12)';
                            ctx.fillRect((当前X + c) * 格子 + 1, (投影Y + r) * 格子 + 1, 格子 - 2, 格子 - 2);
                        }
                    }
                }
            }
        }

        // 当前方块
        if (当前形状 && 游戏中) {
            for (var r = 0; r < 当前形状.length; r++) {
                for (var c = 0; c < 当前形状[r].length; c++) {
                    if (当前形状[r][c]) {
                        绘制格子(ctx, 当前X + c, 当前Y + r, 当前类型);
                    }
                }
            }
        }

        // 暂停遮罩
        if (暂停中) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, 画布.width, 画布.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 30px "Microsoft YaHei"';
            ctx.textAlign = 'center';
            ctx.fillText('⏸ 暂停中', 画布.width / 2, 画布.height / 2);
        }
    }

    function 绘制格子(ctx, x, y, 类型) {
        var px = x * 格子;
        var py = y * 格子;
        var color = 类型 === 'flash' ? '#fff' : 颜色表[类型];
        var dark = 类型 === 'flash' ? '#ccc' : 暗色表[类型];

        // 主体
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, 格子 - 2, 格子 - 2);

        // 高光（左上）
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(px + 1, py + 1, 格子 - 2, 4);
        ctx.fillRect(px + 1, py + 1, 4, 格子 - 2);

        // 阴影（右下）
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px + 1, py + 格子 - 5, 格子 - 2, 4);
        ctx.fillRect(px + 格子 - 5, py + 1, 4, 格子 - 2);
    }

    function 绘制预览() {
        预览ctx.clearRect(0, 0, 预览画布.width, 预览画布.height);
        预览ctx.fillStyle = '#1a1a2e';
        预览ctx.fillRect(0, 0, 预览画布.width, 预览画布.height);

        if (!下一个类型) return;
        var 预览形状 = 形状表[下一个类型];
        var 预览格子 = 24;
        var 偏移X = (预览画布.width - 预览形状[0].length * 预览格子) / 2;
        var 偏移Y = (预览画布.height - 预览形状.length * 预览格子) / 2;

        for (var r = 0; r < 预览形状.length; r++) {
            for (var c = 0; c < 预览形状[r].length; c++) {
                if (预览形状[r][c]) {
                    预览ctx.fillStyle = 颜色表[下一个类型];
                    预览ctx.fillRect(偏移X + c * 预览格子 + 1, 偏移Y + r * 预览格子 + 1, 预览格子 - 2, 预览格子 - 2);
                    预览ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    预览ctx.fillRect(偏移X + c * 预览格子 + 1, 偏移Y + r * 预览格子 + 1, 预览格子 - 2, 3);
                    预览ctx.fillRect(偏移X + c * 预览格子 + 1, 偏移Y + r * 预览格子 + 1, 3, 预览格子 - 2);
                }
            }
        }
    }

    function 更新UI() {
        分数元素.textContent = 分数;
        等级元素.textContent = 等级;
        行数元素.textContent = 消除行数;
    }

    function 获取速度() {
        return Math.max(50, 800 - (等级 - 1) * 70);
    }

    function 游戏循环() {
        if (!游戏中 || 暂停中) return;
        if (!下落()) {
            // 下落失败由 下落() 内部处理
        }
        绘制();
        更新UI();
        游戏循环定时器 = setTimeout(游戏循环, 获取速度());
    }

    function 开始游戏() {
        初始化棋盘();
        分数 = 0;
        等级 = 1;
        消除行数 = 0;
        当前形状 = null;
        下一个类型 = null;
        游戏中 = true;
        暂停中 = false;
        更新UI();
        开始按钮.style.display = 'none';
        暂停按钮.style.display = 'inline-block';
        暂停按钮.textContent = '⏸ 暂停';
        生成下一个();
        绘制();
        游戏循环定时器 = setTimeout(游戏循环, 获取速度());
    }

    function 游戏结束() {
        游戏中 = false;
        clearTimeout(游戏循环定时器);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 画布.width, 画布.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', 画布.width / 2, 画布.height / 2 - 15);
        ctx.font = '18px "Microsoft YaHei"';
        ctx.fillText('得分：' + 分数, 画布.width / 2, 画布.height / 2 + 25);
        开始按钮.style.display = 'inline-block';
        开始按钮.textContent = '🔄 再来一局';
        暂停按钮.style.display = 'none';
        音效引擎.播放吸气音();
    }

    function 切换暂停() {
        if (!游戏中) return;
        暂停中 = !暂停中;
        if (暂停中) {
            clearTimeout(游戏循环定时器);
            暂停按钮.textContent = '▶️ 继续';
            绘制();
        } else {
            暂停按钮.textContent = '⏸ 暂停';
            绘制();
            游戏循环定时器 = setTimeout(游戏循环, 获取速度());
        }
    }

    // 键盘事件（需要检查面板是否可见）
    document.addEventListener('keydown', function (e) {
        if (面板元素.style.display === 'none') return;
        if (!游戏中 || 暂停中) {
            if (e.key === 'p' || e.key === 'P') { 切换暂停(); e.preventDefault(); }
            return;
        }
        switch (e.key) {
            case 'ArrowLeft':  e.preventDefault(); 移动(-1); 音效引擎.播放点击音(); break;
            case 'ArrowRight': e.preventDefault(); 移动(1); 音效引擎.播放点击音(); break;
            case 'ArrowDown':  e.preventDefault(); 软降(); 音效引擎.播放点击音(); break;
            case 'ArrowUp':    e.preventDefault(); 旋转(); 音效引擎.播放点击音(); break;
            case ' ':          e.preventDefault(); 硬降(); break;
            case 'p': case 'P': 切换暂停(); e.preventDefault(); break;
        }
    });

    // 触摸支持
    var 触摸起始X = 0, 触摸起始Y = 0;
    画布.addEventListener('touchstart', function (e) {
        if (!游戏中 || 暂停中) return;
        触摸起始X = e.touches[0].clientX;
        触摸起始Y = e.touches[0].clientY;
    }, { passive: true });

    画布.addEventListener('touchend', function (e) {
        if (!游戏中 || 暂停中) return;
        var dx = e.changedTouches[0].clientX - 触摸起始X;
        var dy = e.changedTouches[0].clientY - 触摸起始Y;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            旋转(); // tap to rotate
        } else if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 20) 移动(1); else if (dx < -20) 移动(-1);
        } else {
            if (dy > 20) 软降();
        }
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) 音效引擎.播放点击音();
        触摸起始X = 0; 触摸起始Y = 0;
    });

    开始按钮.addEventListener('click', 开始游戏);
    暂停按钮.addEventListener('click', 切换暂停);

    // 初始状态
    初始化棋盘();
    绘制();
    绘制预览();
}
