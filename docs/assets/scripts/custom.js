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
		if($(this).closest('form')[0].checkValidity()) {
			e.preventDefault();

			var projectId = $('#projectId').val()
			var runId = $('#runId').val()
			var cloneId = $('#cloneId').val()
			var genId = $('#genId').val()

			var creditAPIURL = 'https://api.foldingathome.org/project/' + projectId + '/run/' + runId + '/clone/' + cloneId + '/gen/' + genId;
			
			var wuDescription = 'Project: ' + projectId + ' (Run: ' + runId + '; Clone: ' + cloneId + '; Gen: ' + genId + ')';

			var jqxhr = $.getJSON(creditAPIURL)
			.done(function(data) {
				$('#wuStatus').text('WU credit check complete for ' + wuDescription + '.');
				$('#wuStatusTable').bootstrapTable('removeAll');
				$('#wuStatusTable').bootstrapTable({data: data, formatNoMatches: function () {return 'No credits found.';}});
				$('#wuStatusData').show();
			})
			.fail(function(data) {
				$('#wuStatus').text('An error occured when checking WU credits.');
				$('#wuStatusTable').bootstrapTable('removeAll');
				$('#wuStatusData').hide();
			})
			.always(function(data) {
				$('#fetchCredit').attr('disabled', true);
				setTimeout(function() {
					$('#fetchCredit').attr('disabled', false);
				}, 5000);
			});
			$('#wuStatus').text('Checking for WU credits...');
			$('#wuStatusData').hide();
			$('#wuStatusTable').bootstrapTable('removeAll');
		} else {
			return false;
		}
	});
});