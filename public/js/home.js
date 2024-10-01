const diaSemana = document.getElementById('dia-semana');
const popup = document.getElementById('popup');
const overlay = document.getElementById('overlay');
const fechar = document.getElementById('fechar');

diaSemana.onclick = function () {
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

fechar.onclick = function () {
    popup.style.display = 'none';
    overlay.style.display = 'none';
}

overlay.onclick = function () {
    popup.style.display = 'none';
    overlay.style.display = 'none';
}