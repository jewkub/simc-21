var loadingV;
function loading() {
  loadingV = setTimeout(daTa, 100);
}
function daTa() {
  document.getElementById("loader").style.display = "none";
  document.getElementById("content").style.display = "block";
}
function loadTeam(){
	$.get('/team', function(data){
		$("#topthree").empty();
		$("#maintable").empty();
		let lastcnt = 0, valmem;
		let value = data.sort(function (mn, mx) { return mx.score - mn.score; });
		let medalpic = ['gold-medal.svg', 'silver-medal.svg', 'bronze-medal.svg'];
		let teampic = [
			'https://storage.googleapis.com/simc-20.appspot.com/team/1.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/2.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/3.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/4.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/5.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/6.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/7.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/8.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/9.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/10.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/11.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/12.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/13.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/14.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/15.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/16.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/17.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/18.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/19.png',
			'https://storage.googleapis.com/simc-20.appspot.com/team/20.png'
		];
		$.each(value, function(key, val){
			if(key < 3){
				if(valmem!=val.score){
					lastcnt = key;
				}
				$("#topthree").append('<div><h3 class="topthreebox">อันดับ ' + (lastcnt+1) + ' : <img style="padding-right: 5px; vertical-align: middle;" width="64" height="64" src="' + teampic[val.team-1] + '">'+val.name+'</br><p style="color: yellow;"><img style="width: 64px; height: 64px; vertical-align: middle" src="imgs/' + medalpic[lastcnt] + '" alt="' + medalpic[lastcnt] + '">' + val.score + '<img style="width: 64px; height: 64px; vertical-align: middle" src="imgs/' + medalpic[lastcnt] + '" alt="' + medalpic[lastcnt] + '"></p></h3></div>');
				if(valmem!=val.score){
					lastcnt = key;
				}
				valmem=val.score;
			}else{
				if(valmem!=val.score){
					lastcnt = key;
				}
				$("#maintable").append('<tr><td style="text-align: center; width: 40px;">' + (lastcnt+1) + '</td><td><img style="padding-right: 5px; vertical-align: middle;" width="50" height="50" src="' + teampic[val.team-1] + '">' + val.name + '</td><td>' + val.score + '</td><.tr>');
				valmem = val.score;
			}
		});
	});
}
$(function(){
	loadTeam();
	setInterval(loadTeam, 5000);
	$('#bye').modal('show');
});

// อย่าลืมแก้ให้มันปัดทศนิยมด้วย