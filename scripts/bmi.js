document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('calc-bmi');
  if(!btn) return;
  btn.addEventListener('click', function(){
    var h = parseFloat(document.getElementById('height').value);
    var w = parseFloat(document.getElementById('weight').value);
    if(!h || !w){ document.getElementById('bmi-result').innerText = 'Въведете височина и тегло.'; return; }
    var m = h/100;
    var bmi = (w/(m*m)).toFixed(1);
    var cat = 'Нормално';
    if(bmi < 18.5) cat = 'Поднормено';
    else if(bmi >=25) cat = 'Наднормено';
    document.getElementById('bmi-result').innerHTML = `<strong>BMI:</strong> ${bmi} — ${cat}`;
  });
});
