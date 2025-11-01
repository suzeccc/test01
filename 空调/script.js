class AirConditioner {
    constructor() {
        this.isOn = false;
        this.temperature = 16;
        this.mode = '制冷';
        this.fanSpeed = '自动';
        this.modes = ['制冷', '制热', '除湿', '送风'];
        this.fanSpeeds = ['自动', '低速', '中速', '高速'];
        this.isSmartMode = false;
        this.isNightMode = false;
        this.isEcoMode = false;
        this.timer = null;
        this.tempHistory = [];
        this.chart = null;
        this.beepAudio = document.getElementById('beepAudio') || new Audio('beep.mp3');
        this.runAudio = new Audio('run.mp3');
        this.runAudio.loop = true;
        this.testAudio = new Audio('1.mp3');
        
        this.initElements();
        this.initEventListeners();
        this.initChart();
        this.updateDisplay();
        this.test1mp3();
    }

    initElements() {
        this.tempDisplay = document.querySelector('.temperature');
        this.modeDisplay = document.querySelector('.mode');
        this.fanSpeedDisplay = document.querySelector('.fan-speed');
        this.timerDisplay = document.querySelector('.timer-display');
        this.smartModeDisplay = document.querySelector('.smart-mode');
        this.powerButton = document.getElementById('powerButton');
        this.tempUpButton = document.getElementById('tempUp');
        this.tempDownButton = document.getElementById('tempDown');
        this.modeButton = document.getElementById('modeButton');
        this.fanButton = document.getElementById('fanButton');
        this.smartButton = document.getElementById('smartButton');
        this.timerButton = document.getElementById('timerButton');
        this.nightButton = document.getElementById('nightButton');
        this.ecoButton = document.getElementById('ecoButton');
        this.timerSettings = document.querySelector('.timer-settings');
        this.timerInput = document.getElementById('timerInput');
        this.confirmTimerButton = document.getElementById('confirmTimer');
        this.cancelTimerButton = document.getElementById('cancelTimer');
        this.controlsTemp = document.getElementById('acControlsTemp');
    }

    initEventListeners() {
        this.powerButton && (this.powerButton.onclick = () => { this.playBeep(); this.togglePower(); });
        this.tempUpButton && (this.tempUpButton.onclick = () => { this.playBeep(); this.increaseTemp(); });
        this.tempDownButton && (this.tempDownButton.onclick = () => { this.playBeep(); this.decreaseTemp(); });
        this.modeButton && (this.modeButton.onclick = () => { this.playBeep(); this.changeMode(); });
        this.fanButton && (this.fanButton.onclick = () => { this.playBeep(); this.changeFanSpeed(); });
        this.smartButton && (this.smartButton.onclick = () => { this.playBeep(); this.toggleSmartMode(); });
        this.timerButton && (this.timerButton.onclick = () => { this.playBeep(); this.showTimerSettings(); });
        this.nightButton && (this.nightButton.onclick = () => { this.playBeep(); this.toggleNightMode(); });
        this.ecoButton && (this.ecoButton.onclick = () => { this.playBeep(); this.toggleEcoMode(); });
        this.confirmTimerButton && (this.confirmTimerButton.onclick = () => { this.playBeep(); this.setTimer(); });
        this.cancelTimerButton && (this.cancelTimerButton.onclick = () => { this.playBeep(); this.hideTimerSettings(); });
    }

    initChart() {
        const ctx = document.getElementById('tempChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '温度变化',
                    data: [],
                    borderColor: '#3498db',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 16,
                        max: 30
                    }
                }
            }
        });
    }

    updateChart() {
        const now = new Date();
        const timeLabel = `${now.getHours()}:${now.getMinutes()}`;
        
        this.tempHistory.push({
            time: timeLabel,
            temp: this.temperature
        });

        if (this.tempHistory.length > 10) {
            this.tempHistory.shift();
        }

        this.chart.data.labels = this.tempHistory.map(h => h.time);
        this.chart.data.datasets[0].data = this.tempHistory.map(h => h.temp);
        this.chart.update();
    }

    toggleSmartMode() {
        if (this.isOn) {
            this.isSmartMode = !this.isSmartMode;
            if (this.isSmartMode) {
                this.startSmartMode();
            } else {
                this.stopSmartMode();
            }
            this.updateDisplay();
        }
    }

    startSmartMode() {
        // 智能模式：根据时间自动调节温度
        this.smartModeInterval = setInterval(() => {
            const hour = new Date().getHours();
            if (hour >= 22 || hour < 6) {
                // 夜间模式：保持26度
                this.temperature = 26;
            } else if (hour >= 6 && hour < 9) {
                // 早晨模式：逐渐升温到24度
                this.temperature = 24;
            } else {
                // 日间模式：保持25度
                this.temperature = 25;
            }
            this.updateDisplay();
        }, 60000); // 每分钟检查一次
    }

    stopSmartMode() {
        clearInterval(this.smartModeInterval);
    }

    showTimerSettings() {
        if (this.isOn) {
            this.timerSettings.style.display = 'grid';
        }
    }

    hideTimerSettings() {
        this.timerSettings.style.display = 'none';
    }

    setTimer() {
        const time = this.timerInput.value;
        if (time) {
            const [hours, minutes] = time.split(':');
            const now = new Date();
            const targetTime = new Date(now);
            targetTime.setHours(parseInt(hours), parseInt(minutes), 0);

            if (targetTime > now) {
                this.timer = setTimeout(() => {
                    this.togglePower();
                    this.timer = null;
                    this.timerDisplay.textContent = '定时：未设置';
                    this.timerDisplay.classList.remove('active');
                }, targetTime - now);

                this.timerDisplay.textContent = `定时：${time}`;
                this.timerDisplay.classList.add('active');
                this.hideTimerSettings();
            }
        }
    }

    togglePower() {
        this.isOn = !this.isOn;
        if (this.isOn) {
            this.playRun();
        } else {
            this.stopRun();
            this.stopSmartMode();
            this.isSmartMode = false;
            this.isNightMode = false;
            this.isEcoMode = false;
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
                this.timerDisplay.textContent = '定时：未设置';
                this.timerDisplay.classList.remove('active');
            }
        }
        this.updateDisplay();
    }

    increaseTemp() {
        if (this.isOn && this.temperature < 30) {
            this.temperature++;
            this.updateDisplay();
            this.updateChart();
        }
    }

    decreaseTemp() {
        if (this.isOn && this.temperature > 16) {
            this.temperature--;
            this.updateDisplay();
            this.updateChart();
        }
    }

    changeMode() {
        if (this.isOn) {
            const currentIndex = this.modes.indexOf(this.mode);
            const nextIndex = (currentIndex + 1) % this.modes.length;
            this.mode = this.modes[nextIndex];
            this.updateDisplay();
        }
    }

    changeFanSpeed() {
        if (this.isOn) {
            const currentIndex = this.fanSpeeds.indexOf(this.fanSpeed);
            const nextIndex = (currentIndex + 1) % this.fanSpeeds.length;
            this.fanSpeed = this.fanSpeeds[nextIndex];
            this.updateDisplay();
        }
    }

    toggleNightMode() {
        if (!this.isOn) return;
        this.isNightMode = !this.isNightMode;
        if (this.isNightMode) {
            this.isEcoMode = false;
            this.temperature = 24;
            this.fanSpeed = '低速';
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
        this.updateDisplay();
    }

    toggleEcoMode() {
        if (!this.isOn) return;
        this.isEcoMode = !this.isEcoMode;
        if (this.isEcoMode) {
            this.isNightMode = false;
            this.temperature = 26;
            this.fanSpeed = '自动';
        }
        this.updateDisplay();
    }

    updateDisplay() {
        this.tempDisplay && (this.tempDisplay.textContent = `${this.temperature}°C`);
        this.modeDisplay && (this.modeDisplay.textContent = `${this.mode}模式`);
        this.fanSpeedDisplay && (this.fanSpeedDisplay.textContent = `风速：${this.fanSpeed}`);
        this.smartModeDisplay && (this.smartModeDisplay.textContent = `智能模式：${this.isSmartMode ? '开启' : '关闭'}`);
        this.smartModeDisplay && this.smartModeDisplay.classList.toggle('active', this.isSmartMode);
        // 数码管温度联动
        const acTempDigit = document.getElementById('acTempDigit');
        if (acTempDigit) acTempDigit.textContent = this.temperature;
        // 控制区温度联动
        if (this.controlsTemp) this.controlsTemp.textContent = this.temperature + '°C';
        // 状态条联动
        document.getElementById('status-power').textContent = '状态：' + (this.isOn ? '开机' : '关机');
        document.getElementById('status-mode').textContent = '模式：' + this.mode;
        document.getElementById('status-fan').textContent = '风速：' + this.fanSpeed;
        document.getElementById('status-smart').textContent = '智能：' + (this.isSmartMode ? '开启' : '关闭');
        if (this.timerDisplay && this.timerDisplay.textContent) {
            document.getElementById('status-timer').textContent = this.timerDisplay.textContent.replace('定时：', '定时：');
        } else {
            document.getElementById('status-timer').textContent = '定时：未设置';
        }
        // 夜间模式状态显示
        if (this.isNightMode) {
            document.getElementById('status-power').textContent += '（夜间模式）';
        }
        // 按钮高亮
        this.smartButton && this.smartButton.classList.toggle('active', this.isSmartMode);
        this.nightButton && this.nightButton.classList.toggle('active', this.isNightMode);
        this.ecoButton && this.ecoButton.classList.toggle('active', this.isEcoMode);
        // 按钮禁用逻辑
        const controls = [
            this.tempUpButton, 
            this.tempDownButton, 
            this.modeButton, 
            this.fanButton,
            this.smartButton,
            this.timerButton,
            this.nightButton,
            this.ecoButton
        ];
        controls.forEach(control => {
            if (control) {
                control.classList.add('off');
                control.disabled = true;
                if (this.isOn) {
                    control.classList.remove('off');
                    control.disabled = false;
                }
            }
        });
        // 只有开关按钮可用
        this.powerButton && (this.powerButton.textContent = this.isOn ? '关机' : '开机');
        this.powerButton && (this.powerButton.disabled = false);
        this.powerButton && this.powerButton.classList.remove('off');
    }

    playBeep() {
        if (this.beepAudio) {
            this.beepAudio.currentTime = 0;
            this.beepAudio.play();
        }
    }

    playRun() {
        if (this.runAudio) {
            this.runAudio.currentTime = 0;
            this.runAudio.play();
        }
    }

    stopRun() {
        if (this.runAudio) {
            this.runAudio.pause();
            this.runAudio.currentTime = 0;
        }
    }

    test1mp3() {
        this.testAudio.currentTime = 0;
        this.testAudio.play().then(() => {
            console.log('1.mp3音效播放正常');
        }).catch(e => {
            console.warn('1.mp3音效无法播放', e);
        });
    }
}

// 初始化空调
const ac = new AirConditioner(); 