document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('gen-vax');
  if(!btn) return;
  btn.addEventListener('click', function(){
    var b = document.getElementById('birthdate').value;
    if(!b){ document.getElementById('vax-result').innerText = 'Въведете дата на раждане.'; return; }
    var birth = new Date(b);
    function addMonths(d,m){ var dt=new Date(d); dt.setMonth(dt.getMonth()+m); return dt; }
    var schedule = [
      {name:'БЦЖ', months:0},
      {name:'Хепатит B', months:0},
      {name:'Пневмококова', months:2},
      {name:'Ротавирус', months:2},
      {name:'DTP/Полимелит/Хемофилус', months:2},
      {name:'DTP/Полимелит/Хемофилус (втора доза)', months:4},
      {name:'Грипна (годишна)', months:6}
    ];
    var out = '<ul>';
    schedule.forEach(s=>{ out += `<li><strong>${s.name}</strong>: ${addMonths(birth,s.months).toLocaleDateString()}</li>`});
    out += '</ul>';
    document.getElementById('vax-result').innerHTML = out;
  });
});
