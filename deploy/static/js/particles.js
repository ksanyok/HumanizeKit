/**
 * HumanizeKit — Particle System
 * Canvas-based particle animation with mouse interaction
 */
(function() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animationId;
    const PARTICLE_COUNT = 55;
    const CONNECTION_DISTANCE = 140;
    const MOUSE_RADIUS = 120;

    const palette = [
        { r: 99, g: 102, b: 241 },   // Indigo
        { r: 139, g: 92, b: 246 },    // Purple
        { r: 236, g: 72, b: 153 },    // Pink
        { r: 59, g: 130, b: 246 },    // Blue
        { r: 16, g: 185, b: 129 },    // Green
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticle() {
        const color = palette[Math.floor(Math.random() * palette.length)];
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2.5 + 1,
            color: color,
            alpha: Math.random() * 0.4 + 0.15,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.015 + 0.005,
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p, i) => {
            // Move
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;

            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS && dist > 0) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.015;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // Dampen velocity
            p.vx *= 0.998;
            p.vy *= 0.998;

            // Draw glow
            const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.1;
            const glowSize = p.radius * 3;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${pulseAlpha})`);
            gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${pulseAlpha * 1.5})`;
            ctx.fill();

            // Connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const cdx = p.x - p2.x;
                const cdy = p.y - p2.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist < CONNECTION_DISTANCE) {
                    const opacity = (1 - cdist / CONNECTION_DISTANCE) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        });

        animationId = requestAnimationFrame(animate);
    }

    // Event Listeners
    window.addEventListener('resize', () => {
        resize();
    });

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Reduce particles on mobile
    if (window.innerWidth < 768) {
        // halve
        const origCount = PARTICLE_COUNT;
        // keep the const but halve in init
    }

    init();
    animate();

    // Visibility API — pause when tab not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
})();
