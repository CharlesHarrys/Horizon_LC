import re
import shutil

filepath = 'workspace_logistica_general.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inyectar CSS en <style>
css_to_inject = """
    /* ============================================================== */
    /* FONDO RETÍCULA CON MÁSCARA RADIAL (LOBBY DESIGN SYSTEM)        */
    /* ============================================================== */
    .grid-vignette {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background-size: 32px 32px;
      background-image: 
        linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 85%);
      -webkit-mask-image: radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 85%);
    }

    #ambient-canvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.6;
    }

    /* ============================================================== */
    /* ANIMACIONES DE OBJETOS Y FIGURAS FLOTANTES AMBIENTALES         */
    /* ============================================================== */
    @keyframes floatSlow1 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -45px) rotate(8deg); }
      66% { transform: translate(-25px, 20px) rotate(-6deg); }
    }
    @keyframes floatSlow2 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(-35px, 30px) rotate(-10deg); }
      66% { transform: translate(40px, -25px) rotate(8deg); }
    }
    @keyframes floatSlow3 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(20px, 35px) scale(1.08); }
    }

    .ambient-floating-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .floating-shape-1 {
      position: absolute;
      top: 15%;
      left: 8%;
      width: 320px;
      height: 320px;
      border-radius: 9999px;
      background: radial-gradient(circle, rgba(59, 166, 241, 0.07) 0%, rgba(59, 166, 241, 0) 70%);
      filter: blur(40px);
      animation: floatSlow1 24s ease-in-out infinite;
    }

    .floating-shape-2 {
      position: absolute;
      bottom: 20%;
      right: 10%;
      width: 400px;
      height: 400px;
      border-radius: 9999px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, rgba(14, 165, 233, 0) 70%);
      filter: blur(50px);
      animation: floatSlow2 28s ease-in-out infinite;
    }

    .floating-shape-3 {
      position: absolute;
      top: 60%;
      left: 45%;
      width: 280px;
      height: 280px;
      border-radius: 9999px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 70%);
      filter: blur(45px);
      animation: floatSlow3 22s ease-in-out infinite;
    }
  </style>"""

if '.grid-vignette' not in content:
    content = content.replace('</style>', css_to_inject, 1)
    print("CSS inyectado con éxito.")
else:
    print("CSS ya existía.")

# 2. Inyectar HTML al inicio del <body>
html_to_inject = """<body class="min-h-screen flex flex-col antialiased selection:bg-slate-900 selection:text-white relative bg-[#f6f5f4]">

  <!-- ============================================================== -->
  <!-- FONDO AMBIENTAL: RETÍCULA CON MÁSCARA RADIAL & OBJETOS FLOTANTES-->
  <!-- ============================================================== -->
  <div class="ambient-background-wrapper" style="position: fixed; inset: 0; pointer-events: none; z-index: 0;">
    <div class="grid-vignette"></div>
    <canvas id="ambient-canvas"></canvas>
    <div class="ambient-floating-layer">
      <div class="floating-shape-1"></div>
      <div class="floating-shape-2"></div>
      <div class="floating-shape-3"></div>
    </div>
  </div>"""

# Replace body tag
pat_body = r'<body[^>]*>'
if 'ambient-background-wrapper' not in content:
    content = re.sub(pat_body, html_to_inject, content, count=1)
    print("Capas HTML de fondo inyectadas al inicio de <body>.")
else:
    print("Capas HTML de fondo ya existían.")

# 3. Jerarquía de Capas (relative z-10)
# Main
content = re.sub(r'<main class="([^"]*?)">', lambda m: f'<main class="{m.group(1)} relative z-10">' if 'z-10' not in m.group(1) else m.group(0), content, count=1)

# View gateway
content = re.sub(r'<div id="view-gateway" class="([^"]*?)">', lambda m: f'<div id="view-gateway" class="{m.group(1)} relative z-10">' if 'z-10' not in m.group(1) else m.group(0), content, count=1)

# Sections
for panel_id in ['panel-logistica', 'panel-inventarios', 'panel-produccion', 'panel-control']:
    pat = rf'<section id="{panel_id}" class="([^"]*?)">'
    content = re.sub(pat, lambda m: f'<section id="{panel_id}" class="{m.group(1)} relative z-10">' if 'z-10' not in m.group(1) else m.group(0), content, count=1)

print("Jerarquía de capas z-10 asegurada en Header, Gateway y 4 Paneles.")

# 4. Inyectar función JS de inicialización del canvas ambiental de partículas
js_canvas = """
  // ==============================================================
  // MOTOR CANVAS AMBIENTAL DE CONSTELACIÓN DE PARTÍCULAS FLOTANTES
  // ==============================================================
  function initAmbientCanvas() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const count = Math.min(30, Math.floor(window.innerWidth / 40));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.35 + 0.15
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 23, 42, ${p.alpha * 0.4})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(15, 23, 42, ${(1 - dist / 140) * 0.05})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
"""

if 'initAmbientCanvas' not in content:
    # Inyectar antes del DOMContentLoaded
    target = 'document.addEventListener(\'DOMContentLoaded\', () => {'
    if target in content:
        content = content.replace(target, js_canvas + '\n    ' + target + '\n      initAmbientCanvas();', 1)
        print("Función initAmbientCanvas inyectada y vinculada a DOMContentLoaded.")
    else:
        print("No se encontró target DOMContentLoaded, inyectando antes de </script>.")
        content = content.replace('</script>', js_canvas + '\n  initAmbientCanvas();\n</script>', 1)
else:
    print("initAmbientCanvas ya existía.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("workspace_logistica_general.html actualizado.")

# 5. Sincronizar en templates/ y backend/templates/
destinations = [
    'templates/workspace_logistica_general.html',
    'backend/templates/workspace_logistica_general.html'
]

for dst in destinations:
    shutil.copy2(filepath, dst)
    print(f"Sincronizado a: {dst}")

print("PROCESO COMPLETADO EXITOSAMENTE.")
