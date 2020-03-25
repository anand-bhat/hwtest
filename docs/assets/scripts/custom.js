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

		var jqxhr = $.getJSON(creditAPIURL)
		.done(function(data) {
			alert( "second success" );
			alert(JSON.stringify(data));
			$('#wuStatusTable').bootstrapTable({data: data});
		})
		.fail(function(data) {
			alert( "error" ); //2nd
			alert(data);
		})
		.always(function(data) {
			//$("#fetchCredit").attr("disabled", true);
			//sleep
		});
		// Perform other work here
		//$("#fetchCredit").attr("disabled", true);
	});
});