document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('calc-due');
  if(!btn) return;
  btn.addEventListener('click', function(){
    var lmp = document.getElementById('lmp').value;
    if(!lmp){ document.getElementById('due-result').innerText = 'Въведете дата.'; return; }
    var d = new Date(lmp);
    // average pregnancy 280 days from LMP
    var due = new Date(d.getTime() + 280*24*60*60*1000);
    var now = new Date();
    var diffDays = Math.ceil((due - now)/(24*60*60*1000));
    document.getElementById('due-result').innerHTML = `<strong>Приблизителен термин:</strong> ${due.toLocaleDateString()}<br><strong>Остава (дни):</strong> ${diffDays}`;
  });
});
