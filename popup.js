// Popup script - versão simplificada
document.getElementById('openInstagram').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.instagram.com/' });
  window.close();
});
