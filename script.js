document.addEventListener('DOMContentLoaded', () => {
    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const letterContainer = document.querySelector('.letter-container');
    const envelopeAddress = document.querySelector('.envelope-address');
    const envelope = document.getElementById('envelope');
    const openLink = document.querySelector('a[href="#open"]');
    
    // 页面刷新时清除可能残留的 #open 锚点，以保持初始关闭状态
    // if (window.location.hash) {
    //     history.replaceState(null, '', window.location.pathname + window.location.search);
    // }

    // 交互触发元素：漂浮羽毛
    const feather = document.getElementById('feather');

    // ===== 背景音乐：Hedwig's Theme =====
    const bgm = new Audio('assets/Hedwig\'s Theme.mp3');
    bgm.volume = 0;       // 初始静音
    bgm.loop = true;      // 循环播放

    // 尝试自动播放音乐并在 X 秒内淡入音量
    function playBgmWithFadeIn() {
        const fadeDuration = 15000; // 淡入时长（毫秒）
        const steps = 100;          // 细分步数
        const stepTime = fadeDuration / steps;
        const volumeIncrement = 1 / steps;

        bgm.currentTime = 0;
        bgm.play();

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            bgm.volume = Math.min(currentStep * volumeIncrement, 1);
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }

    // 魔法逐行浮现动画（升级版：使用 CSS keyframes + 延时，过渡更自然）
    function magicalTextReveal(
        container,
        startDelay = 0,
        baseDelay = 250,      // 每元素基础间隔
        paragraphPause = 500  // 遇到 <div> 段落后的额外停顿
    ) {
        // 选取 letter-content 内所有后代元素（含图像）
        const elements = Array.from(container.querySelectorAll('.letter-content *'))
            .filter(el => el.textContent.trim() !== '' || el.tagName === 'IMG');

        let accumulatedDelay = startDelay;

        elements.forEach((element) => {
            // 指定动画与延迟
            element.style.animation = `fadeSlideIn 0.9s cubic-bezier(0.22,1,0.36,1) forwards`;
            element.style.animationDelay = `${accumulatedDelay}ms`;

            // 根据元素类型递增延时
            accumulatedDelay += baseDelay;

            // 如为段落 <div>，额外暂停以营造段落感
            if (element.tagName === 'DIV') {
                accumulatedDelay += paragraphPause;
            }
        });
    }

    // 监听CSS target变化（当信件打开时）
    function checkForLetterOpen() {
        if (window.location.hash === '#open' && !page1AnimationPlayed) {
            if (letterContainer) {
                // 等待 pop-letter 动画结束再触发文字浮现
                const onPopEnd = (e) => {
                    if (e.animationName === 'pop-letter') {
                        magicalTextReveal(page1, 0); // 动画结束后开始文字浮现
                        page1AnimationPlayed = true;
                    }
                };
                letterContainer.addEventListener('animationend', onPopEnd, { once: true });
            }
        }
    }

    // 为纸张内容添加拖拽滚动功能
    function addDragScroll(element) {
        let isDown = false;
        let startY = 0;
        let scrollTop = 0;

        element.addEventListener('mousedown', (e) => {
            isDown = true;
            element.style.cursor = 'grabbing';
            startY = e.pageY - element.offsetTop;
            scrollTop = element.scrollTop;
            e.preventDefault();
        });

        element.addEventListener('mouseleave', () => {
            isDown = false;
            element.style.cursor = 'auto';
        });

        element.addEventListener('mouseup', () => {
            isDown = false;
            element.style.cursor = 'auto';
        });

        element.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const y = e.pageY - element.offsetTop;
            const walk = (y - startY) * 2; // 滚动速度调节
            element.scrollTop = scrollTop - walk;
        });

        // 触摸事件支持
        element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            scrollTop = element.scrollTop;
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            const y = e.touches[0].clientY;
            const walk = (startY - y) * 1.5; // 触摸滚动速度
            element.scrollTop = scrollTop + walk;
        }, { passive: true });
    }

    // 为两页都添加拖拽滚动功能
    const page1Content = page1.querySelector('.letter-content');
    const page2Content = page2.querySelector('.letter-content');
    
    if (page1Content) {
        addDragScroll(page1Content);
    }
    if (page2Content) {
        addDragScroll(page2Content);
    }

    // 初始状态：显示envelope-address，隐藏envelope
    if (envelopeAddress && envelope) {
        // 初始隐藏地址，待猫头鹰送达后再显示
        envelopeAddress.classList.add('hidden');
        envelope.style.opacity = '0';
        envelope.style.pointerEvents = 'none';
        envelope.style.transform = 'scale(0.8)';
    }

    // ==== 猫头鹰送信动画封装 ====
    function startOwlDelivery() {
        const owlContainer = document.getElementById('owl-container');
        if (owlContainer && window.lottie) {
            owlContainer.classList.remove('hidden');

            const owlAnim = lottie.loadAnimation({
                container: owlContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/owl-animation.json'
            });

            // 信封地址淡入
            setTimeout(() => {
                if (envelopeAddress) {
                    envelopeAddress.classList.remove('hidden');
                    envelopeAddress.classList.add('show');
                }
            }, 9500);

            // 动画结束后处理
            owlContainer.addEventListener('animationend', (e) => {
                if (e.animationName === 'owlFlyIn') {
                    owlAnim.stop();
                    owlContainer.classList.add('hidden');
                }
            }, { once: true });
        }
    }

    // ========= 羽毛点击触发 =========
    if (feather) {
        // 如果页面已在 open 状态（例如刷新时带 #open），直接移除羽毛
        if (window.location.hash === '#open') {
            feather.remove();
        } else {
            // 初始时隐藏猫头鹰容器
            const owlInit = document.getElementById('owl-container');
            if (owlInit) owlInit.classList.add('hidden');

            const triggerStart = () => {
                feather.remove();           // 移除羽毛
                playBgmWithFadeIn();        // 播放音乐
                startOwlDelivery();         // 猫头鹰飞入
            };

            feather.addEventListener('click', triggerStart, { once: true });
            feather.addEventListener('touchstart', triggerStart, { once: true, passive: true });
        }
    }

    let page1AnimationPlayed = false;
    let page2AnimationPlayed = false;

    // 页面前后翻转逻辑
    // Initially page-2 is clickable to bring it to front
    page2.addEventListener('click', () => {
        if (!page2.classList.contains('swap-back')) {
            page1.classList.add('swap-front');
            page2.classList.add('swap-back');

            // 触发第二页的魔法动画（只播放一次）
            if (!page2AnimationPlayed) {
                setTimeout(() => {
                    magicalTextReveal(page2, 500); // 页面切换后x秒开始动画
                    page2AnimationPlayed = true;
                }, 100);
            }
        }
    });
    
    // When page-1 is at back, it should be clickable to bring it to front
    page1.addEventListener('click', () => {
        if (page1.classList.contains('swap-front')) {
            page1.classList.remove('swap-front');
            page2.classList.remove('swap-back');
        }
    });
    
    // Click on address to trigger flip animation and show envelope
    if (envelopeAddress) {
        envelopeAddress.addEventListener('click', () => {
            // 添加翻转动画
            envelopeAddress.classList.add('flip-out');
            
            // 动画完成后隐藏address并显示envelope
            setTimeout(() => {
                envelopeAddress.classList.remove('show', 'flip-out');
                envelopeAddress.classList.add('hidden');
                
                // 显示envelope
                envelope.style.opacity = '1';
                envelope.style.pointerEvents = 'auto';
                envelope.style.transform = 'scale(1)';
            }, 800); // 与flipOut动画时间匹配
        });
    }

    // Click on envelope (but not the seal) to show address again
    if (envelope) {
        envelope.addEventListener('click', (e) => {
            // Check if the click is on the seal area
            const isSealClick = openLink.contains(e.target);
            if (!isSealClick && envelopeAddress.classList.contains('hidden')) {
                // We prevent default only when we are not trying to open the letter
                e.preventDefault(); 
                
                // 隐藏envelope并显示address
                envelope.style.opacity = '0';
                envelope.style.pointerEvents = 'none';
                envelope.style.transform = 'scale(0.8)';
                
                // 重置address状态并显示（带旋转进入动画）
                setTimeout(() => {
                    envelopeAddress.classList.remove('hidden', 'flip-out');
                    envelopeAddress.classList.add('show', 'flip-in');
                    
                    // 动画完成后移除flip-in类，恢复正常hover动画
                    setTimeout(() => {
                        envelopeAddress.classList.remove('flip-in');
                    }, 800);
                }, 200);
            }
        });
    }

    // 初始检查并监听 hash 变化
    checkForLetterOpen();
    window.addEventListener('hashchange', checkForLetterOpen);
}); 