(function(){
  const LS = window.localStorage;
  // Fast geolocation with caching
  async function getFastLocation(){
    try{
      const cached = LS.getItem('geo_cache');
      if (cached){
        const obj = JSON.parse(cached);
        const ageMs = Date.now() - (obj.ts||0);
        if (ageMs < 15*60*1000) return obj.pos; // 15min cache
      }
      const pos = await new Promise((resolve,reject)=>{
        if (!navigator.geolocation) return reject('no geo');
        navigator.geolocation.getCurrentPosition(p=>{
          resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy });
        }, err=>reject(err), { enableHighAccuracy: false, timeout: 3000, maximumAge: 600000 });
      });
      LS.setItem('geo_cache', JSON.stringify({ ts: Date.now(), pos }));
      // expose globally for pages to reuse
      window.geolocFast = pos;
      return pos;
    } catch(e){
      const fb = { lat: 42.6977, lon: 23.3219, acc: 1000 }; // Sofia fallback
      window.geolocFast = fb;
      return fb;
    }
  }

  // Climate: temperature, wind, humidity, AQI via open APIs
  async function fetchClimate(lat, lon){
    try{
      // Open-Meteo (no key)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m,precipitation,uv_index`;
      const r = await fetch(url);
      const data = await r.json();
      const temp = data.current_weather?.temperature;
      const wind = data.current_weather?.windspeed;
      const rh = (data.hourly && data.hourly.relativehumidity_2m && data.hourly.relativehumidity_2m[0]);
      const precip = (data.hourly && data.hourly.precipitation && data.hourly.precipitation[0]);
      const uv = (data.hourly && data.hourly.uv_index && data.hourly.uv_index[0]);
      // AQI from IQAir demo (city-based fallback)
      let aqi = null;
      try{
        const aq = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`);
        const aqj = await aq.json();
        aqi = aqj?.data?.aqi || null;
      }catch(_){}
      return { temp, wind, rh, precip, uv, aqi };
    } catch(e){ return null; }
  }

  function renderClimate(cl){
    const el = document.getElementById('climateText');
    if (!el) return;
    if (!cl){ el.textContent = 'Условията не са налични в момента.'; return; }
    const parts = [];
    if (cl.temp!=null) parts.push(`🌡️ ${Math.round(cl.temp)}°C`);
    if (cl.wind!=null) parts.push(`🌬️ ${Math.round(cl.wind)} м/с`);
    if (cl.rh!=null) parts.push(`💧 ${cl.rh}%`);
    if (cl.precip!=null && cl.precip > 0) parts.push(`☔️ ${cl.precip} mm`);
    if (cl.uv!=null) parts.push(`🔆 UV${Math.round(cl.uv)}`);
    if (cl.aqi!=null) parts.push(`😷 ${cl.aqi}`);
    el.innerHTML = parts.length ? parts.join(' · ') : 'Условията не са налични.';
  }

  // News ticker from RSS (BBC Health, WHO)
  async function fetchNews(){
    // Bulgarian-only sources (prioritized). If any endpoint changes, we fall back via proxy/XML parsing.
    const feeds = [
      // Министерство на здравеопазването (официални съобщения)
      'https://www.mh.government.bg/bg/rss/',
      // БНР – здраве (част от общия RSS, ще филтрираме заглавия по ключови думи ако е нужно)
      'https://www.bnr.bg/rss',
      // Капитал Здраве
      'https://www.capital.bg/rss/health/',
      // Дневник Здраве
      'https://www.dnevnik.bg/rss/zdrowe/',
      // Investor.bg Здраве (ако RSS е наличен)
      'https://www.investor.bg/rss/',
      // Dir.bg Здраве (ако RSS е наличен)
      'https://rss.dir.bg/',
    ];
    try{
      const cacheKey = 'news_cache_v1';
      const cached = LS.getItem(cacheKey);
      if (cached){
        const obj = JSON.parse(cached);
        const ageMs = Date.now() - (obj.ts||0);
        if (ageMs < 30*60*1000) return obj.items; // 30min cache
      }
      const items = [];
      for (const f of feeds){
        let added = false;
        // Primary: rss2json (may have rate/CORS limits)
        try{
          const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f)}`);
          if (r.ok){
            const j = await r.json();
            (j.items||[]).slice(0,5).forEach(it=>{
              if (it && it.title && it.link){
                items.push({ title: it.title, link: it.link });
                added = true;
              }
            });
          }
        }catch(err){ /* continue to fallback */ }
        // Fallback: allorigins proxy to bypass CORS and parse XML
        if (!added){
          try{
            const prox = `https://api.allorigins.win/get?url=${encodeURIComponent(f)}`;
            const rp = await fetch(prox);
            if (rp.ok){
              const pj = await rp.json();
              const tx = pj.contents || '';
              // Robust XML parse: RSS <item> and Atom <entry>
              const dom = new DOMParser().parseFromString(tx, 'application/xml');
              const nodes = Array.from(dom.querySelectorAll('item, entry')).slice(0,5);
              nodes.forEach(n=>{
                const t = n.querySelector('title');
                const l = n.querySelector('link');
                const href = l ? (l.getAttribute('href') || l.textContent) : null;
                const title = t ? t.textContent : null;
                if (title && href){ items.push({ title: title.trim(), link: href.trim() }); added = true; }
              });
            }
          }catch(_){ /* ignore */ }
        }
      }
      let top = items.slice(0,10);
      // Final fallback: curated Bulgarian headlines if nothing fetched
      if (!top.length){
        top = [
          { title: 'МЗ: Официални прессъобщения', link: 'https://www.mh.government.bg/bg/novini/' },
          { title: 'БНР: Здраве – последни', link: 'https://www.bnr.bg/' },
          { title: 'Капитал: Здраве – новини', link: 'https://www.capital.bg/biznes/kompanii/zdrave/' },
          { title: 'Дневник: Здраве', link: 'https://www.dnevnik.bg/tema/zdrave/' },
          { title: 'Dir.bg: Здраве', link: 'https://dir.bg/zdrave' }
        ];
      }
      LS.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: top }));
      return top;
    }catch(e){ return []; }
  }

  function startTicker(items){
    const box = document.getElementById('newsItems');
    if (!box) return;
    if (!items.length){ box.innerHTML = '<span style="opacity:0.6;">Няма налични новини.</span>'; return; }
    let i=0;
    if (window.newsTickerInterval){ clearInterval(window.newsTickerInterval); }
    
    function render(){
      // Show 2-3 news items rotating
      const showCount = Math.min(3, items.length);
      const slice = [];
      for (let j = 0; j < showCount; j++){
        slice.push(items[(i + j) % items.length]);
      }
      const html = slice.map((it, idx) => 
        `<a href="${it.link}" target="_blank" rel="noopener">${idx > 0 ? ' · ' : ''}${it.title}</a>`
      ).join('');
      box.innerHTML = `<span class="news-ticker-icon" aria-hidden="true">📰</span><span style="flex:1;">${html}</span>`;
      i++;
    }
    render();
    // Rotate every 6 seconds (instead of 8)
    window.newsTickerInterval = setInterval(render, 6000);
    // Periodic refresh of news list (15 min during daytime, 30 min at night)
    async function scheduleRefresh(){
      const now = new Date();
      const hour = now.getHours();
      const interval = (hour >= 7 && hour <= 22) ? 15*60*1000 : 30*60*1000;
      setTimeout(async ()=>{
        const fresh = await fetchNews();
        if (fresh && fresh.length){ items = fresh; i = 0; } else { box.innerHTML = '<span style="opacity:0.6;">Няма налични новини.</span>'; }
        scheduleRefresh();
      }, interval);
    }
    scheduleRefresh();
  }

  // Ensure legends include "Вие сте тук"
  function ensureLegendHere(){
    const candidates = [];
    // Known IDs
    candidates.push(...['eduLegend','vacLegend','nbLegend','mhLegend','resLegend','pregLegend','todLegend','psLegend','saLegend','welLegend','nutLegend','scLegend','legalLegend','healthLegend']
      .map(id=>document.getElementById(id)).filter(Boolean));
    // Generic selectors
    candidates.push(...Array.from(document.querySelectorAll('[data-role="legend"], .legend, [id$="Legend"]')));
    const seen = new Set();
    candidates.forEach(el=>{
      if (!el || seen.has(el)) return; seen.add(el);
      const exists = el.querySelector('.legend-here');
      if (exists) return;
      const row = document.createElement('div');
      row.className = 'legend-here';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.innerHTML = '<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 6px rgba(239,68,68,0.7);"></div><strong>Вие сте тук</strong>';
      el.prepend(row);
    });
  }

  document.addEventListener('DOMContentLoaded', async function(){
    try {
      ensureLegendHere();

      // Climate: always attempt, but never block UI if it fails
      let pos = { lat: 42.6977, lon: 23.3219 };
      try {
        const fast = await getFastLocation();
        if (fast) pos = fast;
      } catch(_){ /* fallback to Sofia */ }

      try {
        const cl = await fetchClimate(pos.lat, pos.lon);
        renderClimate(cl);
      } catch(_){ renderClimate(null); }

      // Preload with richer Bulgarian list to guarantee immediate headlines
      let initial = [
        { title: 'МЗ: Официални прессъобщения', link: 'https://www.mh.government.bg/bg/novini/' },
        { title: 'БНР: Здраве – последни', link: 'https://www.bnr.bg/' },
        { title: 'Капитал: Здраве – новини', link: 'https://www.capital.bg/biznes/kompanii/zdrave/' },
        { title: 'Дневник: Здраве', link: 'https://www.dnevnik.bg/tema/zdrave/' },
        { title: 'Dir.bg: Здраве', link: 'https://dir.bg/zdrave' },
        { title: 'Investor.bg: Здраве', link: 'https://www.investor.bg/zdrave/' },
        { title: 'Offnews: Здраве', link: 'https://offnews.bg/rss' }
      ];
      startTicker(initial);

      // Fetch live RSS and replace when ready (never block UI)
      fetchNews()
        .then(live => { if (live && live.length) startTicker(live); })
        .catch(()=>{});
    } catch(_){
      renderClimate(null);
      startTicker([
        { title: 'МЗ: Официални прессъобщения', link: 'https://www.mh.government.bg/bg/novini/' },
        { title: 'БНР: Здраве – последни', link: 'https://www.bnr.bg/' }
      ]);
    }
  });
})();
