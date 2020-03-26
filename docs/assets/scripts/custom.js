$(document).ready(function () {
	'use strict';
	// Toggle page description visibility
	$('#togglePageDescription').on('click', function (e) {
		e.preventDefault();
		if ($('#pageDescription').is(':visible')) {
			$('#pageDescription').hide();
			$(this).text('Show instructions:');
		}
		else {
			$('#pageDescription').show();
			$(this).text('Hide instructions:');
		}
	});

	// Calculate QRB
	$('#calculateQRB').on('click', function (e) {
		if($(this).closest('form')[0].checkValidity()) {
			e.preventDefault();

			var basePoints = $('#projectBasePoints').val();
			var k = $('#projectBonusFactor').val();
			var deadlineLength = $('#projectDeadlineLength').val();
			var wuStartTime = new Date($('#wuStartTime').val());
			var wuEndTime = new Date($('#wuEndTime').val());

			var wuDuration = (wuEndTime - wuStartTime)/1000/86400;
			var bonusFactor = Math.max(1, Math.sqrt(deadlineLength * k / wuDuration)) ;

			$('#wuTotal').val(basePoints*bonusFactor);
		} else {
			$(this).closest('form')[0].reportValidity();
		}
	});

	// Fetch credit for WU
	$('#fetchCredit').on('click', function (e) {
		var logLine = $('#logLine').val();
		if (logLine != null && logLine != '') {
			var logLinePattern = /^.*.project:(?<p>\d*) run:(?<r>\d*) clone:(?<c>\d*) gen:(?<g>\d*).*.$/;
			var match = logLinePattern.exec(logLine);
			if (match == null) {
				$('#projectId').val('');
				$('#runId').val('');
				$('#cloneId').val('');
				$('#genId').val('');
				$('#wuStatus').text('Unable to parse line from log file.');
				$('#wuStatus').removeClass('good').addClass('bad');
				$('#wuStatusData').hide();
				e.preventDefault();
				return;
			} else {
				var p = match.groups.p;
				var r = match.groups.r;
				var c = match.groups.c;
				var g = match.groups.g;
				
				$('#projectId').val(p);
				$('#runId').val(r);
				$('#cloneId').val(c);
				$('#genId').val(g);
			}
		}

		if($(this).closest('form')[0].checkValidity()) {
			e.preventDefault();

			var projectId = $('#projectId').val();
			var runId = $('#runId').val();
			var cloneId = $('#cloneId').val();
			var genId = $('#genId').val();

			var creditAPIURL = 'https://api.foldingathome.org/project/' + projectId + '/run/' + runId + '/clone/' + cloneId + '/gen/' + genId + '?callback=?';
			var wuDescription = 'Project: ' + projectId + ' (Run: ' + runId + '; Clone: ' + cloneId + '; Gen: ' + genId + ')';

			var jqxhr = $.getJSON(creditAPIURL)
			.done(function(data) {
				$('#wuStatus').text('WU credit check complete for ' + wuDescription + '.');
				$('#wuStatus').removeClass('bad').addClass('good');
				$('#wuStatusTable').bootstrapTable({data: data, formatNoMatches: function () {return 'No credits found.';}});
				$('#wuStatusTable').bootstrapTable('load', data);
				$('#wuStatusData').show();
			})
			.fail(function(data) {
				$('#wuStatus').text('An error occured when checking WU credits.');
				$('#wuStatus').removeClass('good').addClass('bad');
				$('#wuStatusData').hide();
			})
			.always(function(data) {
				$('#fetchCredit').attr('disabled', true);
				setTimeout(function() {
					$('#fetchCredit').attr('disabled', false);
				}, 5000);
			});
			$('#wuStatus').text('Checking for WU credits...');
			$('#wuStatus').removeClass();
			$('#wuStatusData').hide();
		} else {
			$(this).closest('form')[0].reportValidity();
		}
	});
});