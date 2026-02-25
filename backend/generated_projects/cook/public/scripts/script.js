```javascript
// Get all elements
const body = document.body;
const favicon = document.getElementById('favicon');
const adminLink = document.getElementById('admin-link');
const navBar = document.getElementById('nav-bar');

// Add event listener to admin link
adminLink.addEventListener('click', () => {
  window.location.href = '/admin';
});

// Add event listener to nav bar
navBar.addEventListener('mouseover', () => {
  navBar.style.backgroundColor = '#f0f0f0';
});

navBar.addEventListener('mouseout', () => {
  navBar.style.backgroundColor = 'transparent';
});

// Function to load script dynamically
function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
}

// Load script dynamically
loadScript('https://code.jquery.com/jquery-3.6.0.min.js');

// Use jQuery
$(document).ready(() => {
  console.log('Document is ready');
});

// Set favicon
function setFavicon(url) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
}

setFavicon('images/favicon.ico');
```