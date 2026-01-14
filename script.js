// Consolidated script: intro, parallax, movement/panning
// Year
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Typing intro for moustache logo ---------- */
(function(){
  const el = document.getElementById('moustacheLogo');
  const lines = JSON.parse(el.getAttribute('data-lines'));
  el.textContent = '';
  el.setAttribute('aria-hidden','true');
  const charDelay = 6; // ms per char
  const lineDelay = 220;
  let li = 0;
  function typeLine(){
    if(li >= lines.length){
      el.classList.add('typed');
      el.setAttribute('aria-hidden','false');
      setTimeout(()=> document.body.classList.add('intro-done'), 450);
      return;
    }
    const line = lines[li];
    let i = 0;
    const t = setInterval(()=>{
      el.textContent += line[i] || '';
      i++;
      if(i > line.length){
        clearInterval(t);
        el.textContent += '\n';
        li++;
        setTimeout(typeLine, lineDelay);
      }
    }, charDelay);
  }
  window.addEventListener('load', ()=> setTimeout(typeLine, 300));
})();

/* ---------- Parallax sync with scroll (updates CSS var for Y only) ---------- */
(function(){
  const stars = document.querySelector('.stars');
  const world = document.getElementById('world');
  const temple = world.querySelector('.temple');
  const isles = world.querySelectorAll('.isle');

  function parallax(){
    const scrollY = window.scrollY;
    const height = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const ratio = scrollY / height;

    // background stars move slightly opposite to scroll
    stars.style.transform = `translateY(${ratio * -80}px)`;

    // world vertical parallax: update CSS var so we don't overwrite transform
    world.style.setProperty('--world-y', `${ratio * 120}px`);

    // temple and isles move subtly for depth
    temple.style.transform = `translateY(${ratio * 40}px)`;
    isles.forEach((isle,i)=>{
      const factor = (i%2===0?1:-1)*ratio*60;
      isle.style.transform = `translateY(${factor}px)`;
    });
  }

  window.addEventListener('scroll', parallax);
  // run once to set initial positions
  parallax();
})();

/* ---------- Player movement + world panning limité à la taille du world ---------- */
(function(){
  const player = document.getElementById('player');
  const world = document.getElementById('world');
  const scene = document.getElementById('scene');

  // paramètres
  const SPEED = 200; // px/sec
  const PLAYER_W = 40;
  const PLAYER_H = 56;

  // état
  const keys = { left:false, right:false, up:false, down:false };
  let px = 200; // position du joueur dans le monde
  let py = 140;
  let scrollX = 0;

  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

  // contrôle clavier (ZQSD + flèches)
  window.addEventListener('keydown',(e)=>{
    const k = e.key;
    if(k === 'ArrowLeft' || k === 'q' || k === 'Q') { keys.left = true; e.preventDefault(); }
    if(k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    if(k === 'ArrowUp' || k === 'z' || k === 'Z') { keys.up = true; e.preventDefault(); }
    if(k === 'ArrowDown' || k === 's' || k === 'S') { keys.down = true; e.preventDefault(); }
  });
  window.addEventListener('keyup',(e)=>{
    const k = e.key;
    if(k === 'ArrowLeft' || k === 'q' || k === 'Q') keys.left = false;
    if(k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    if(k === 'ArrowUp' || k === 'z' || k === 'Z') keys.up = false;
    if(k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
  });

  // compatibilité tactile
  window.addEventListener('touchstart', (ev)=>{
    const t = ev.changedTouches[0];
    const x = t.clientX;
    if(x < window.innerWidth/2) { keys.left = true; } else { keys.right = true; }
  }, {passive:true});
  window.addEventListener('touchend', ()=>{ keys.left = keys.right = false; });

  // fonction principale d'animation
  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.05, (now - last)/1000); last = now;

    function rect(el){ return el.getBoundingClientRect(); }
    // const worldWidth = world.scrollWidth;s
    const temple = world.querySelector('.temple');
    const tr = rect(temple);

    const worldWidth = tr.left + tr.width + 200; // 200px de marge à droite
    const worldHeight = world.scrollHeight;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let dx = 0, dy = 0;
    if(keys.left) dx -= SPEED * dt;
    if(keys.right) dx += SPEED * dt;
    if(keys.up) dy -= SPEED * dt;
    if(keys.down) dy += SPEED * dt;

    const moved = dx !== 0 || dy !== 0;

    // nouvelle position dans les limites du monde
    px = clamp(px + dx, 0, worldWidth - PLAYER_W);
    py = clamp(py + dy, 0, worldHeight - PLAYER_H);

    // limites de défilement : garder le joueur visible au centre si possible
    const screenMin = viewportW * 0.3;
    const screenMax = viewportW * 0.7;
    const maxScroll = Math.max(0, worldWidth - viewportW);
    let screenX = px - scrollX;

    // ajustement du défilement horizontal
    if(screenX < screenMin) scrollX = clamp(px - screenMin, 0, maxScroll);
    if(screenX > screenMax) scrollX = clamp(px - screenMax, 0, maxScroll);

    // appliquer les positions
    player.style.left = px + 'px';
    player.style.top = py + 'px';
    world.style.setProperty('--world-x', `${-scrollX}px`);

    if(moved) player.classList.add('moving');
    else player.classList.remove('moving');

    requestAnimationFrame(loop);
  }

  function startWhenReady(){
    if(document.body.classList.contains('intro-done')){
      last = performance.now();
      requestAnimationFrame(loop);
    } else setTimeout(startWhenReady, 100);
  }
  startWhenReady();

  // accessibilité clavier
  world.addEventListener('click', ()=> world.setAttribute('tabindex','0'));
})();

/* ---------- Temple interaction: show prompt when near, press E to enter ---------- */
(function(){
  // initialize when DOM is ready and retry if elements aren't present yet
  function init(){
    const player = document.getElementById('player');
    const temple = document.querySelector('.temple');
    const prompt = document.getElementById('interactPrompt');
    // console.log('initTempleInteraction: elements found', { player: !!player, temple: !!temple, prompt: !!prompt });s

    // retry shortly if any element is missing (script may run before DOM insertion)
    if(!player || !temple || !prompt){
      setTimeout(init, 150);
      return;
    }

    let canInteract = false;
    let entered = false;

    // use world-local coordinates to avoid discrepancies caused by transforms on the scene/world
    function parsePx(v){ return v ? parseFloat(v.replace('px','')) : 0; }

    function checkProximity(){
      // player's left/top are set inline as px in the main loop
      const pLeft = parsePx(player.style.left);
      const pTop = parsePx(player.style.top);
      const pCenterX = pLeft + (player.offsetWidth / 2);
      const pCenterY = pTop + (player.offsetHeight / 2);

      // temple offsetLeft/Top are relative to the same world container
      const tLeft = temple.offsetLeft;
      const tTop = temple.offsetTop;
      const tRight = tLeft + temple.offsetWidth;
      const tBottom = tTop + temple.offsetHeight;

      const expand = 40; // buffer in world coords
      const inX = pCenterX >= (tLeft - expand) && pCenterX <= (tRight + expand);
      const inY = pCenterY >= (tTop - expand) && pCenterY <= (tBottom + expand);
      const near = inX && inY;

      // console.log('checkProximity:', { pCenterX, pCenterY, tLeft, tTop, tRight, tBottom, near });

      if(near && !canInteract){
        canInteract = true;
        prompt.classList.add('show');
        prompt.setAttribute('aria-hidden','false');
        console.log('Player is near the temple. Press E to enter.');
      } else if(!near && canInteract){
        canInteract = false;
        prompt.classList.remove('show');
        prompt.setAttribute('aria-hidden','true');
        console.log('Player left temple proximity.');
      }
    }

    // check at an interval (not every frame) for perf
    const iv = setInterval(checkProximity, 120);

    window.addEventListener('keydown', (e)=>{
      if(entered) return;
      if(!canInteract) return;
      if(e.key === 'e' || e.key === 'E'){
        entered = true;
        // small visual feedback
        prompt.textContent = 'Entrée du temple…';
        console.log('Entering temple...');
        // navigate to temple page after a tiny delay
        setTimeout(()=>{ window.location.href = 'temple.html'; }, 220);
      }
    });

    // cleanup if the page unloads
    window.addEventListener('beforeunload', ()=> clearInterval(iv));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

  /* ---------- Header height sync for anchor scrolling ---------- */
  (function(){
    const root = document.documentElement;
    const header = document.querySelector('.site-header');
    if(!header) return;

    function updateHeaderHeight(){
      // getBoundingClientRect to include transforms/zoom; add 2px buffer
      const h = Math.ceil(header.getBoundingClientRect().height) + 2;
      root.style.setProperty('--header-height', h + 'px');
    }

    window.addEventListener('load', updateHeaderHeight);
    window.addEventListener('resize', updateHeaderHeight);
    // in case content changes dynamically (fonts, layout), observe header size
    if('ResizeObserver' in window){
      const ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(header);
    }
    // run once now
    updateHeaderHeight();
  })();

// Project modal functionality
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

if (modal && modalBody && closeModal) {
  document.querySelectorAll('.project-link').forEach(button => {
    button.addEventListener('click', function() {
      const project = this.dataset.project;
      fetch(`./projet/liste_projet/${project}.html`)
        .then(response => response.text())
        .then(html => {
          modalBody.innerHTML = html;
          modal.style.display = 'flex';
        })
        .catch(error => {
          console.error('Erreur lors du chargement du projet:', error);
          modalBody.innerHTML = '<p>Erreur lors du chargement du projet.</p>';
          modal.style.display = 'flex';
        });
    });
  });

  document.querySelectorAll('.competence-link').forEach(button => {
    button.addEventListener('click', function () {
      const competence_project = this.dataset.project;

      fetch(`../../projet/liste_projet/${competence_project}.html`)
        .then(response => {
          if (!response.ok) throw new Error("404");
          return response.text();
        })
        .then(html => {
          modalBody.innerHTML = html;
          modal.style.display = 'flex';
        })
        .catch(error => {
          console.error('Erreur lors du chargement de la compétence:', error);
          modalBody.innerHTML = '<p>Erreur lors du chargement de la compétence.</p>';
          modal.style.display = 'flex';
        });
    });
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}
// Project filtering functionality
const filterButtons = document.querySelectorAll(".filters button");
const projectArticles = document.querySelectorAll(".project");

// Set "Tous" button as active by default
const allButton = document.querySelector('.filters button[data-filter="all"]');
if (allButton) {
  allButton.classList.add("active");
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    filterButtons.forEach(btn => btn.classList.remove("active"));
    // Add active class to clicked button
    button.classList.add("active");

    const filter = button.dataset.filter;

    projectArticles.forEach(project => {
      const tags = project.dataset.tags;

      if (filter === "all") {
        project.style.display = "block";
      } else if (tags && tags.includes(filter)) {
        project.style.display = "block";
      } else {
        project.style.display = "none";
      }
    });
  });
});

