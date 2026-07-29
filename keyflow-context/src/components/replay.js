export class TypingReplay {
    /**
     * @param {HTMLElement} container - The DOM element to render the replay into
     * @param {Object} sessionData - Output from StatsEngine
     * @param {String} originalText - The text that was typed
     */
    constructor(container, sessionData, originalText) {
        this.container = container;
        this.sessionData = sessionData;
        this.originalText = originalText;
        this.timeline = sessionData.timeline;
        this.isPlaying = false;
        this.currentIndex = 0;
        this.replayStartTime = 0;
        this.animationFrame = null;
        this.containerRectCache = null;
        
        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="replay-container" style="position: relative; font-family: monospace; font-size: 1.5rem; line-height: 2; padding: 20px; background: #1e1e1e; color: #666; border-radius: 8px; overflow: hidden;">
                <div class="replay-controls" style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
                    <button id="replay-play-btn" style="padding: 5px 15px; cursor: pointer; background: #4caf50; color: white; border: none; border-radius: 4px;">Play</button>
                    <button id="replay-pause-btn" style="padding: 5px 15px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;">Pause</button>
                    <button id="replay-reset-btn" style="padding: 5px 15px; cursor: pointer; background: #2196f3; color: white; border: none; border-radius: 4px;">Reset</button>
                    <span id="replay-speed-indicator" style="color: #fff; margin-left: auto; font-size: 1rem;">WPM: 0</span>
                </div>
                <div id="replay-text-display" style="position: relative; white-space: pre-wrap; word-break: break-all;">
                    ${this.originalText.split('').map((char, i) => `<span id="replay-char-${i}">${char}</span>`).join('')}
                    <div id="replay-cursor" style="position: absolute; width: 2px; height: 1.5rem; background: #fff; display: none; transition: all 0.05s ease;"></div>
                </div>
                <canvas id="replay-speed-graph" width="600" height="100" style="margin-top: 20px; width: 100%; background: #2a2a2a; border-radius: 4px;"></canvas>
            </div>
        `;

        this.textDisplay = this.container.querySelector('#replay-text-display');
        this.cursor = this.container.querySelector('#replay-cursor');
        this.speedIndicator = this.container.querySelector('#replay-speed-indicator');
        this.canvas = this.container.querySelector('#replay-speed-graph');
        this.ctx = this.canvas.getContext('2d');

        this.container.querySelector('#replay-play-btn').addEventListener('click', () => this.play());
        this.container.querySelector('#replay-pause-btn').addEventListener('click', () => this.pause());
        this.container.querySelector('#replay-reset-btn').addEventListener('click', () => this.reset());

        this.drawSpeedGraphStatic();
    }

    play() {
        if (this.isPlaying || this.timeline.length === 0) return;
        this.isPlaying = true;
        
        if (this.currentIndex >= this.timeline.length) {
            this.reset();
            this.isPlaying = true; // reset sets it to false, need to toggle back
        }

        this.cursor.style.display = 'block';
        
        const currentEventTime = this.currentIndex < this.timeline.length ? this.timeline[this.currentIndex].timestamp : 0;
        this.replayStartTime = performance.now() - currentEventTime;
        this.containerRectCache = this.textDisplay.getBoundingClientRect();

        const loop = () => {
            if (!this.isPlaying) return;

            const now = performance.now();
            const elapsed = now - this.replayStartTime;

            while (this.currentIndex < this.timeline.length && this.timeline[this.currentIndex].timestamp <= elapsed) {
                this.renderKeystroke(this.timeline[this.currentIndex], this.currentIndex);
                this.currentIndex++;
            }

            if (this.currentIndex < this.timeline.length) {
                this.animationFrame = requestAnimationFrame(loop);
            } else {
                this.isPlaying = false;
            }
        };

        this.animationFrame = requestAnimationFrame(loop);
    }

    pause() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    reset() {
        this.pause();
        this.currentIndex = 0;
        this.cursor.style.display = 'none';
        this.speedIndicator.textContent = 'WPM: 0';
        this.containerRectCache = null;
        
        for (let i = 0; i < this.originalText.length; i++) {
            const span = this.container.querySelector(`#replay-char-${i}`);
            if (span) {
                span.style.color = '#666';
                span.style.background = 'transparent';
                span.textContent = this.originalText[i];
            }
        }
        
        this.drawSpeedGraphStatic();
    }

    renderKeystroke(event, index) {
        const span = this.container.querySelector(`#replay-char-${index}`);
        if (!span) return;

        if (event.correct) {
            span.style.color = '#e2b714'; 
        } else {
            span.style.color = '#ca4754';
            span.style.background = '#4a1e22';
            span.textContent = event.char === ' ' ? '_' : event.char;
        }

        // Move cursor relative to container
        const spanRect = span.getBoundingClientRect();
        const containerRect = this.containerRectCache || this.textDisplay.getBoundingClientRect();
        this.cursor.style.left = `${spanRect.right - containerRect.left}px`;
        this.cursor.style.top = `${spanRect.top - containerRect.top}px`;

        // Update WPM Indicator 
        const recentEvents = this.timeline.slice(Math.max(0, index - 10), index + 1);
        if (recentEvents.length > 1) {
            const timeDiff = (recentEvents[recentEvents.length - 1].timestamp - recentEvents[0].timestamp) / 60000;
            if (timeDiff > 0) {
                const currentWPM = Math.round((recentEvents.length / 5) / timeDiff);
                this.speedIndicator.textContent = `WPM: ${currentWPM}`;
            }
        }

        this.drawSpeedGraphProgress(event.timestamp);
    }

    drawSpeedGraphStatic() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        
        if (!this.sessionData.speedCurve || this.sessionData.speedCurve.length === 0) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;

        const maxTime = this.sessionData.totalTimeMs;
        const maxWpm = Math.max(...this.sessionData.speedCurve.map(s => s.wpm), 100);

        this.sessionData.speedCurve.forEach((point, i) => {
            const x = (point.time / maxTime) * width;
            const y = height - (point.wpm / maxWpm) * height;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
    }

    drawSpeedGraphProgress(currentTimestamp) {
        const { width, height } = this.canvas;
        this.drawSpeedGraphStatic(); 
        
        if (!this.sessionData.speedCurve || this.sessionData.speedCurve.length === 0) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e2b714';
        this.ctx.lineWidth = 3;

        const maxTime = this.sessionData.totalTimeMs;
        const maxWpm = Math.max(...this.sessionData.speedCurve.map(s => s.wpm), 100);
        
        this.sessionData.speedCurve.forEach((point, i) => {
            if (point.time > currentTimestamp) return;

            const x = (point.time / maxTime) * width;
            const y = height - (point.wpm / maxWpm) * height;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        
        this.ctx.stroke();

        // Draw playhead
        const currentX = (currentTimestamp / maxTime) * width;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(currentX, 0);
        this.ctx.lineTo(currentX, height);
        this.ctx.stroke();
    }
}
