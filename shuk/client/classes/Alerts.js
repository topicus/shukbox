(function(window){
	function Alerts(){


	}

	Alerts.show = function(t){
		$('.alert').slideDown('slow');
		$('.alert').html(t)
		Alerts.timeout = setTimeout(function() {
			Alerts.hide();
		}, 3000);
	};
	Alerts.hide = function(){
		$('.alert').slideUp('slow');
	};	
	window.Alerts = Alerts;
})(window);