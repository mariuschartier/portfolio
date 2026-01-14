class MysticalScene extends HTMLElement {
  constructor() {
    super();
    this.loadScene();
  }

  loadScene() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/scene.html', false); // synchronous for simplicity
    xhr.send();
    if (xhr.status === 200) {
      this.innerHTML = xhr.responseText;
      this.dispatchEvent(new CustomEvent('sceneLoaded', { bubbles: true }));
    } else {
      console.error('Erreur lors du chargement de la scène:', xhr.status);
    }
  }
}

customElements.define('mystical-scene', MysticalScene);