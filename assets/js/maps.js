// Опростена версия на Google Maps - използва iframe embed вместо API
function initSimpleMap(containerId, searchQuery, locationName) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Създаваме iframe с Google Maps embed (безплатно, без API ключ)
  const encodedQuery = encodeURIComponent(searchQuery + ' ' + locationName);

  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '10px';
  iframe.style.display = 'block';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedQuery}`;

  container.appendChild(iframe);
}

// Инициализация при зареждане на страницата
document.addEventListener('DOMContentLoaded', function() {
  // Проверяваме кои карти има на страницата и ги инициализираме
  const maps = [
    { id: 'health-map', query: 'болница педиатър', location: 'София България' },
    { id: 'pregnancy-map', query: 'родилен дом акушер-гинеколог', location: 'София България' },
    { id: 'preschool-map', query: 'детска градина', location: 'София България' },
    { id: 'education-map', query: 'училище', location: 'София България' },
    { id: 'legal-map', query: 'община кметство', location: 'София България' },
    { id: 'resources-map', query: 'библиотека детска', location: 'София България' },
    { id: 'newborn-map', query: 'болница педиатър детски лекар', location: 'София България' },
    { id: 'toddler-map', query: 'детска площадка детски център', location: 'София България' },
    { id: 'nutrition-map', query: 'биомагазин фермерски пазар здравословна храна', location: 'София България' },
    { id: 'mental-health-map', query: 'психолог детски център подкрепа родители', location: 'София България' },
    { id: 'wellness-map', query: 'парк фитнес зала йога център', location: 'София България' }
  ];

  maps.forEach(mapConfig => {
    if (document.getElementById(mapConfig.id)) {
      initSimpleMap(mapConfig.id, mapConfig.query, mapConfig.location);
    }
  });
});
