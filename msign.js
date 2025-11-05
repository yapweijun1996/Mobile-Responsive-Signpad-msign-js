
/**
 * msign.js v3.9-ios
 * - iPhone-safe fullscreen modal: uses JS-driven --msign-vh for true viewport height
 * - Grid layout (header / canvas / footer) so footer never disappears
 * - Safe-area insets handled (env(safe-area-inset-*))
 * - Pointer Events; HiDPI canvas; auto preview; data-* controls; namespaced buttons
 */
document.addEventListener('DOMContentLoaded', () => {
  /* ===== Config: pen width ===== */
  const MSIGN_PEN = { defaultWidth: 2, min: 1, max: 10 };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  let currentPenWidth = clamp(MSIGN_PEN.defaultWidth, MSIGN_PEN.min, MSIGN_PEN.max);
  function setPenWidth(px){ currentPenWidth = clamp(Number(px)||MSIGN_PEN.defaultWidth, MSIGN_PEN.min, MSIGN_PEN.max); if (ctx) ctx.lineWidth = currentPenWidth; }
  window.msignSetLineWidth = setPenWidth;
  window.msignConfig = MSIGN_PEN;

  /* ===== Overlay DOM & Styles ===== */
  const modalHTML = `
    <div class="msign-fullscreen-overlay" style="display:none;">
      <div class="msign-modal" role="dialog" aria-modal="true" aria-label="Signature Pad">
        <div class="msign-header">
          <span>Please Sign Below</span>
          <button class="msign-close-header msign-btn msign-btn--icon" type="button" aria-label="Close">&times;</button>
        </div>
        <canvas class="msign-canvas"></canvas>
        <div class="msign-footer">
          <button class="msign-close-footer msign-btn msign-btn--secondary" type="button">Close</button>
          <button class="msign-clear msign-btn msign-btn--secondary" type="button">Clear</button>
          <button class="msign-save msign-btn msign-btn--primary" type="button">Save Signature</button>
        </div>
      </div>
    </div>
  `;
  const modalStyle = `
    :root{ --msign-vh: 100; } /* will be set in JS to real CSS px height */

    /* ===== Field (thumbnail) ===== */
    .msign{
      box-sizing:border-box; position:relative; display:flex; align-items:center; justify-content:center;
      width:100%; height:100%; min-height:60px; color:#888; background:#fff; cursor:pointer; text-align:center;
      transition:border-color .2s ease;
    }
    .msign img{ width:100%; height:100%; object-fit:contain; display:block; }

    /* ===== Overlay ===== */
    .msign-fullscreen-overlay{
      position:fixed; left:0; top:0; right:0; bottom:0; z-index:99999;
      background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;
      -webkit-user-select:none; user-select:none;
      /* lock body scroll behind modal, even on iOS */
      touch-action:none;
    }

    /* ===== Modal =====
       Phone: true fullscreen using --msign-vh (iOS safe)
       Desktop: centered card.
    */
    .msign-modal{
      width: 100%;
      height: calc(var(--msign-vh) * 1px); /* REAL viewport height (iOS fix) */
      display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: 1fr;
      background:#fff; overflow:hidden;
      /* safe areas */
      padding-top: calc(env(safe-area-inset-top, 0px));
      padding-bottom: calc(env(safe-area-inset-bottom, 0px));
    }

    /* Desktop upgrade */
    @media (min-width: 820px){
      .msign-fullscreen-overlay{
        background:rgba(0,0,0,.6);
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
      }
      .msign-modal{
        width: min(800px, 90vw);
        height: min(600px, calc(var(--msign-vh) * 0.9px));
        border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,.28);
      }
    }

    .msign-header,.msign-footer{
      background:#f0f0f0; padding:10px 15px; display:flex; align-items:center;
    }
    .msign-header{ justify-content:space-between; border-bottom:1px solid #ccc; font-weight:600; }
    .msign-footer{ justify-content:flex-end; border-top:1px solid #ccc; gap:10px; padding: max(10px,12px) 15px; }

    .msign-canvas{
      width:100%; height:100%; min-height:160px; background:#fff; touch-action:none; display:block;
    }

    /* ===== Buttons (scoped) ===== */
    .msign-btn{
      all: unset; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
      padding:10px 16px; min-height:36px; border-radius:6px; border:1px solid #ccc; background:#fff;
      font: 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color:#111; cursor:pointer; user-select:none; text-decoration:none;
      transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .02s ease;
    }
    .msign-btn:focus-visible{ outline:2px solid #2684ff; outline-offset:2px; }
    .msign-btn:hover{ background:#f8f8f8; }
    .msign-btn:active{ transform: translateY(1px); }
    .msign-btn--primary{ background:#28a745; border-color:#28a745; color:#fff; }
    .msign-btn--primary:hover{ background:#23963e; border-color:#23963e; }
    .msign-btn--secondary{ background:#6c757d; border-color:#6c757d; color:#fff; }
    .msign-btn--secondary:hover{ background:#5f676e; border-color:#5f676e; }
    .msign-btn--icon{ width:36px; height:36px; padding:0; background:transparent; border:1px solid transparent; color:#333; font-size:22px; line-height:1; }
    .msign-btn--icon:hover{ background:#e9e9e9; border-color:#d0d0d0; }
  `;
  const styleEl = document.createElement('style'); styleEl.textContent = modalStyle; document.head.appendChild(styleEl);
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  /* ===== Refs ===== */
  const overlay = document.querySelector('.msign-fullscreen-overlay');
  const canvas  = document.querySelector('.msign-canvas');
  const clearBtn = document.querySelector('.msign-clear');
  const saveBtn  = document.querySelector('.msign-save');
  const closeHeaderBtn = document.querySelector('.msign-close-header');
  const closeFooterBtn = document.querySelector('.msign-close-footer');
  const ctx = canvas.getContext('2d', { willReadFrequently:false });

  /* ===== State ===== */
  let activeSignaturePad = null;
  let isDrawing = false, lastX = 0, lastY = 0, activePointerId = null;

  /* ===== iOS-safe viewport height ===== */
  function setRealVhVar(){
    const vv = window.visualViewport;
    const h = Math.max(1, Math.round((vv ? vv.height : window.innerHeight)));
    document.documentElement.style.setProperty('--msign-vh', String(h));
  }
  setRealVhVar();

  const recalcVhIfOpen = () => {
    setRealVhVar();
    if (overlay.style.display === 'flex') requestAnimationFrame(clearCanvas);
  };
  window.addEventListener('resize', recalcVhIfOpen, { passive:true });
  window.addEventListener('orientationchange', recalcVhIfOpen, { passive:true });
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', recalcVhIfOpen, { passive:true });
    window.visualViewport.addEventListener('scroll', recalcVhIfOpen, { passive:true });
  }

  /* ===== Canvas sizing & paint ===== */
  function sizeCanvasToCSSPixels(){
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width  * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w)  canvas.width  = w;
    if (canvas.height !== h) canvas.height = h;
    canvas.style.width  = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function paintCanvasBackground(){
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; setPenWidth(currentPenWidth);
  }
  function clearCanvas(){ sizeCanvasToCSSPixels(); paintCanvasBackground(); }

  /* ===== Drawing (Pointer Events) ===== */
  const getPos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function beginStroke(e){ if (activePointerId!==null && activePointerId!==e.pointerId) return; activePointerId=e.pointerId; isDrawing=true; const {x,y}=getPos(e); lastX=x; lastY=y; canvas.setPointerCapture(e.pointerId); }
  function continueStroke(e){ if (!isDrawing || activePointerId!==e.pointerId) return; e.preventDefault(); const {x,y}=getPos(e); ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); lastX=x; lastY=y; }
  function endStroke(e){ if (activePointerId!==e.pointerId) return; isDrawing=false; try{canvas.releasePointerCapture(e.pointerId);}catch{} activePointerId=null; }

  /* ===== Preview helpers ===== */
  const isDataImageURL = v => typeof v==='string' && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v.trim());
  function renderPreview(container, dataUrl){
    container.innerHTML=''; const img=document.createElement('img'); img.src=dataUrl; container.appendChild(img);
    container.classList.add('msign--signed'); container.style.border='none';
  }
  function applyEmptyVisuals(container){
    const ph   = container.getAttribute('data-placeholder') || 'Click to Sign';
    const phV  = (container.getAttribute('data-placeholder-visible') ?? 'true').toLowerCase() !== 'false';
    const bdV  = (container.getAttribute('data-border-visible') ?? 'true').toLowerCase() !== 'false';
    const bdS  = (container.getAttribute('data-border-style') || 'dashed').trim();
    const bdC  = container.getAttribute('data-border-color') || '#ccc';
    const bdW  = Number(container.getAttribute('data-border-width') || '2');
    container.classList.remove('msign--signed');
    container.innerHTML = phV ? ph : '';
    container.style.border = bdV ? `${bdW}px ${bdS} ${bdC}` : 'none';
  }
  function clearPreview(container){ applyEmptyVisuals(container); }

  /* ===== Overlay control ===== */
  function openOverlay(){
    setRealVhVar();                 // measure *now* (covers iOS URL bar state)
    overlay.style.display = 'flex';
    // Wait one frame for layout, then size canvas
    requestAnimationFrame(() => {
      const lw = activeSignaturePad?.lineWidth ?? MSIGN_PEN.defaultWidth;
      setPenWidth(lw); isDrawing=false; activePointerId=null;
      clearCanvas();
    });
  }
  function closeOverlay(){
    overlay.style.display = 'none';
    isDrawing=false; activePointerId=null; activeSignaturePad=null;
  }
  function saveSignature(e){
    e?.preventDefault();
    if (!activeSignaturePad) return;
    const dataURL = canvas.toDataURL('image/png');
    activeSignaturePad.output.value = dataURL;
    renderPreview(activeSignaturePad.container, dataURL);
    closeOverlay();
  }

  /* ===== Events ===== */
  overlay.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', beginStroke);
  canvas.addEventListener('pointermove', continueStroke);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  clearBtn.addEventListener('click', e => { e.preventDefault(); clearCanvas(); });
  saveBtn.addEventListener('click',  saveSignature);
  closeHeaderBtn.addEventListener('click', e => { e.preventDefault(); closeOverlay(); });
  closeFooterBtn.addEventListener('click', e => { e.preventDefault(); closeOverlay(); });

  /* ===== Init fields + auto-preview sync ===== */
  document.querySelectorAll('.msign').forEach(container => {
    const outputTextarea = container.nextElementSibling;
    if (!outputTextarea || !outputTextarea.classList.contains('msign_output')) {
      console.warn('msign: No .msign_output textarea found next to', container);
      return;
    }
    const lwAttr = Number(container.getAttribute('data-line-width'));
    const perInstanceWidth = isNaN(lwAttr) ? undefined : clamp(lwAttr, MSIGN_PEN.min, MSIGN_PEN.max);

    if (container.querySelector('img')) { container.classList.add('msign--signed'); container.style.border='none'; }
    else { applyEmptyVisuals(container); }

    let lastValue = outputTextarea.value;
    if (isDataImageURL(lastValue)) renderPreview(container, lastValue);

    const sync = () => {
      const v = outputTextarea.value;
      if (isDataImageURL(v)) {
        const cur = container.querySelector('img')?.src || '';
        if (cur !== v) renderPreview(container, v);
      } else {
        clearPreview(container);
      }
      lastValue = v;
    };
    outputTextarea.addEventListener('input', sync);
    outputTextarea.addEventListener('change', sync);
    setInterval(() => { if (outputTextarea.value !== lastValue) sync(); }, 500);

    container.addEventListener('click', () => {
      const ta = container.nextElementSibling;
      if (!ta || !ta.classList.contains('msign_output')) {
        console.error('Could not find a .msign_output textarea for', container);
        return;
      }
      activeSignaturePad = { container, output: ta, lineWidth: perInstanceWidth ?? currentPenWidth };
      openOverlay();
    });
  });
});

