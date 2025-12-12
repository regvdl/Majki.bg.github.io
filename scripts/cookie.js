document.addEventListener('DOMContentLoaded', function(){
  try{
    var banner = document.getElementById('cookie-banner');
    if(!banner) return;
    var accepted = localStorage.getItem('cookies_accepted');
    if(!accepted){
      banner.setAttribute('aria-hidden','false');
      banner.style.display = 'block';
    }
    document.getElementById('cookie-accept').addEventListener('click', function(){
      localStorage.setItem('cookies_accepted','1');
      banner.setAttribute('aria-hidden','true');
      banner.style.display = 'none';
    });
  }catch(e){console.warn(e)}
});
