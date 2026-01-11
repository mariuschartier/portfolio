
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
const projects = document.querySelectorAll(".project-card");

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        projects.forEach(project => {
            const tags = project.dataset.tags;

            if (filter === "all" || tags.includes(filter)) {
                project.style.display = "block";
            } else {
                project.style.display = "none";
            }
        });
    });
});
