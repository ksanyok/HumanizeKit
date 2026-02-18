/**
 * Particle Background Animation — HumanizeKit
 * Creates floating, interconnected particles with subtle glow effects.
 */
(function () {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouse = { x: null, y: null, radius: 120 };
    let animationId;
    let width, height;

    const CONFIG = {
        count: 60,
        speed: 0.3,
        size: { min: 1, max: 3 },
        connectionDistance: 140,
        colors: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'],
        mouseRepel: 80,
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * CONFIG.speed;
            this.vy = (Math.random() - 0.5) * CONFIG.speed;
            this.size = CONFIG.size.min + Math.random() * (CONFIG.size.max - CONFIG.size.min);
            this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
            this.opacity = 0.3 + Math.random() * 0.5;
            this.pulseSpeed = 0.01 + Math.random() * 0.02;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }

        update() {
            // Mouse interaction
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.vx += (dx / dist) * force * 0.02;
                    this.vy += (dy / dist) * force * 0.02;
                }
            }

            // Damping
            this.vx *= 0.999;
            this.vy *= 0.999;

            this.x += this.vx;
            this.y += this.vy;

            // Boundaries
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
            this.x = Math.max(0, Math.min(width, this.x));
            this.y = Math.max(0, Math.min(height, this.y));

            // Pulse
            this.pulsePhase += this.pulseSpeed;
            this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.pulsePhase));
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.currentOpacity;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 3
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = this.currentOpacity * 0.15;
            ctx.fill();
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    const opacity = (1 - dist / CONFIG.connectionDistance) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = opacity;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalAlpha = 1;

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        ctx.globalAlpha = 1;

        animationId = requestAnimationFrame(animate);
    }

    function init() {
        resize();
        particles = Array.from({ length: CONFIG.count }, () => new Particle());
        animate();
    }

    // Events
    window.addEventListener('resize', () => {
        resize();
        // Recreate if too many are out of bounds
        particles.forEach(p => {
            if (p.x > width || p.y > height) p.reset();
        });
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Reduce particles on low-end devices
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        CONFIG.count = 15;
        CONFIG.speed = 0.1;
    }

    init();
})();
