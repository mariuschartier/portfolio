
// Year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


(function(){
  const el = document.getElementById('moustacheLogo');
  const lines = JSON.parse(el.getAttribute('data-lines'));
  el.textContent = '';
  el.setAttribute('aria-hidden','true');
  function typeLine(){
    el.textContent = lines.join('\n');
    el.classList.add('typed');
    el.setAttribute('aria-hidden','false');
    setTimeout(()=> document.body.classList.add('intro-done'), 450);
  }
  window.addEventListener('load', ()=> setTimeout(typeLine, 300));
})();


const buttons = document.querySelectorAll(".filters button");
const projects = document.querySelectorAll(".project");

// Set "Tous" button as active by default
const allBtn = document.querySelector('.filters button[data-filter="all"]');
if (allBtn) {
  allBtn.classList.add("active");
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        // Remove active class from all buttons
        buttons.forEach(btn => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");

        const filter = button.dataset.filter;

        projects.forEach(project => {
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

// Project modal functionality
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

document.querySelectorAll('.project-link').forEach(button => {
  button.addEventListener('click', function() {
    const project = this.dataset.project;
    fetch(`liste_projet/${project}.html`)
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

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});