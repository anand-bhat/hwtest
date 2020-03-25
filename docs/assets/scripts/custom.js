$(document).ready(function () {
	'use strict';
	// Calculate QRB
	$('#calculateQRB').on('click', function (e) {
		e.preventDefault();
		var basePoints = $('#projectBasePoints').val();
		var k = $('#projectBonusFactor').val();
		var deadlineLength = $('#projectDeadlineLength').val();
		var wuStartTime = new Date($('#wuStartTime').val());
		var wuEndTime = new Date($('#wuEndTime').val());
		var wuDuration = (wuEndTime - wuStartTime)/1000/86400;
		var bonusFactor = Math.max(1, Math.sqrt(deadlineLength * k / wuDuration)) ;
		$('#wuTotal').val(basePoints*bonusFactor);
	});

	// Fetch credit for WU
	$('#fetchCredit').on('click', function (e) {
		e.preventDefault();

		var creditAPIURL = "https://api.foldingathome.org/project/" + $('#projectId').val() + "/run/" + $('#runId').val() + "/clone/" + $('#cloneId').val() + "/gen/" + $('#genId').val();
		//creditAPIURL = "https://assign1.foldingathome.org/api/ws/summary";

		//var xhttp = new XMLHttpRequest();
		//xhttp.onreadystatechange = function() {
		//	if (this.readyState == 4 && this.status == 200) {
		//		$('#wuTotal').val(this.responseText);
		//	}
		//};
		//xhttp.open("GET", url, true);
		//xhttp.send();

		var jqxhr = $.getJSON(creditAPIURL)
		.done(function(data) {
			alert( "second success" );
			alert(JSON.stringify(data));
		})
		.fail(function(data) {
			alert( "error" ); //2nd
			alert(data);
		})
		.always(function(data) {
			alert( "finished" ); //3rd
			//alert(data);
		});
		// Perform other work here ...
		//alert( "something" ); //1st before even making call
		//$("#fetchCredit").attr("disabled", true);
	});
});