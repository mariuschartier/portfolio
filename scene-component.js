class MysticalScene extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    try {
      const response = await fetch('/scene.html');
      if (!response.ok) throw new Error(response.status);

      const html = await response.text();
      this.shadowRoot.innerHTML = html;

      this.dispatchEvent(new CustomEvent('sceneLoaded', { bubbles: true }));
    } catch (err) {
      console.error('Erreur lors du chargement de la scène:', err);
      this.shadowRoot.innerHTML = `<p>Impossible de charger la scène.</p>`;
    }
  }
}

customElements.define('mystical-scene', MysticalScene);
