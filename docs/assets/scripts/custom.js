var colorClass = {
	0: '#FF0000',
	1: '#FF1100',
	2: '#FF2300',
	3: '#FF3400',
	4: '#FF4600',
	5: '#FF5700',
	6: '#FF6900',
	7: '#FF7B00',
	8: '#FF8C00',
	9: '#FF9E00',
	10: '#FFAF00',
	11: '#FFC100',
	12: '#FFD300',
	13: '#FFE400',
	14: '#FFF600',
	15: '#F7FF00',
	16: '#E5FF00',
	17: '#D4FF00',
	18: '#C2FF00',
	19: '#B0FF00',
	20: '#9FFF00',
	21: '#8DFF00',
	22: '#7CFF00',
	23: '#6AFF00',
	24: '#58FF00',
	25: '#47FF00',
	26: '#35FF00',
	27: '#24FF00',
	28: '#12FF00',
	29: '#00FF00'
};

function getProgressBar(percentage, color) {
	'use strict';
	return `<div class="progress"><div class="progress-bar role="progressbar" style="width: ${percentage}%; background-color: ${color}" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div></div>`;
}

function prcg2Chart(projectId, runId, maxClonesPerRun, maxGensPerClone, dataSeries) {
	'use strict';
	var myChart = new Chart($('#prcg2Chart'), {
		type: 'scatter',
		data: {
			datasets: dataSeries,
		},
		options: {
			maintainAspectRatio: false,
			datasets : [{
				line: {
					showLine: true
				}
			}],
			legend: {
				display: false,
			},
			scales: {
				xAxes: [{
					gridLines: {
						display: false,
					},
					scaleLabel : {
						display: true,
						labelString: 'Clone #'
					},
					ticks: {
						stepSize: 1,
						max: maxClonesPerRun-1
					}
				}],
				yAxes: [{
					scaleLabel : {
						display: true,
						labelString: 'Gen #'
					},
					ticks: {
						max: maxGensPerClone
					}
				}]
			},
			title: {
				display: true,
				text: 'Progress for Project: ' + projectId + '; Run: ' + runId
			},
			tooltips: {
				callbacks: {
					label: function(tooltipItem, data) {
						// Returned formatted tooltip
						return 'Clone: ' + tooltipItem.xLabel + '; Gen: ' + tooltipItem.yLabel + ' (' + (((tooltipItem.yLabel + 1)/maxGensPerClone) * 100) + '%)';
					}
				},
				filter: function (tooltipItem, data) {
					// Hide tooltip for first coordinate
					return !(tooltipItem.index == 0);
				}
			}
		}
	});

	return myChart;
}

function prcgProgress2Link(project, run) {
	'use strict';
	return `<div><a href="./prcgProgress2?project=${project}&run=${run}">Details</a></div>`;
}

function prcgProgress() {
	'use strict';
	var urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has('project')) {
		alert('Missing project ID');
		return;
	}

	var projectId = urlParams.get('project');
	if (!Number.isInteger(parseInt(projectId))) {
		alert('Unable to get data for Project: ' + projectId);
		return;
	}

	$.getJSON("../assets/data/" + projectId + ".json")
	.done(function(data) {
		$('#prcgTitle').html('Progress for Project: ' + projectId + '. Last updated at ' + new Date(data.lastUpdated).toLocaleString());

		var dataRows = [];
		var totalGensCompleted = 0;
		var totalWUsCompleted = 0;
		var totalWUsRemaining = 0;
		var percentage = 0.0;
		var colorClassIndex = '';
		var totalGensForRun = data.maxClonesPerRun * data.maxGensPerClone;

		$.each(data.runs, function(index, run) {
			var totalGensCompletedForRun = 0;
			var abortedCount = 0;
			$.each(run.clones, function(index, clone) {
				abortedCount = clone.aborted ? abortedCount + 1 : abortedCount;
				var genCount = clone.aborted ? data.maxGensPerClone : clone.gen + 1;
				totalGensCompleted += genCount;
				totalGensCompletedForRun += genCount;
				totalWUsRemaining = totalWUsRemaining + (data.maxGensPerClone - genCount);
				totalWUsCompleted = totalWUsCompleted + (clone.gen + 1);
			});

			colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForRun) / totalGensForRun) - 1);
			percentage =  Math.round((((100 * totalGensCompletedForRun) / totalGensForRun) + Number.EPSILON) * 100) / 100;

			// TODO: Pluralize in a better manner
			var abortedAlert1 = ` <svg class="bi bi-exclamation-triangle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"><title>${abortedCount} trajectory aborted </title></path></svg>`;
			var abortedAlert = ` <svg class="bi bi-exclamation-triangle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"><title>${abortedCount} trajectories aborted</title></path></svg>`;

			var runText = abortedCount > 0 ? (abortedCount === 1 ? run.run + abortedAlert1 : run.run + abortedAlert) : run.run;
			dataRows[index] = { run: runText, details: prcgProgress2Link(projectId, run.run), remaining: totalWUsRemaining, completed: totalWUsCompleted, progress: getProgressBar(percentage, colorClass[colorClassIndex]) };
		});
		$('#prcgTable').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		var totalGensForProject = totalGensForRun * data.maxRuns;
		colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompleted) / totalGensForProject) - 1);
		percentage = Math.round((((100 * totalGensCompleted) / totalGensForProject) + Number.EPSILON) * 100) / 100;
		$('#prcgProgressBar').html(getProgressBar(percentage, colorClass[colorClassIndex]));
		$('#prcgTable').show();
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project
		alert('Unable to get data for Project: ' + projectId);
	})
	.always(function(data) {
		//alert('always');
	});
}

function prcgProgress2() {
	'use strict';
	var urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has('project')) {
		alert('Missing project ID');
		return;
	}
	if (!urlParams.has('run')) {
		alert('Missing run ID');
		return;
	}

	var projectId = urlParams.get('project');
	if (!Number.isInteger(parseInt(projectId))) {
		alert('Unable to get data for Project: ' + projectId);
		return;
	}

	var runId = urlParams.get('run');
	if (!Number.isInteger(parseInt(runId))) {
		alert('Unable to get data for Project: ' + projectId + '; Run: ' + runId);
		return;
	}

	projectId = parseInt(projectId);
	runId = parseInt(runId);

	$.getJSON("../assets/data/" + projectId + ".json")
	.done(function(data) {
		var runData = data.runs.find(run=>run.run==runId);
		if (!runData) {
			alert('Unable to get data for Project: ' + projectId + '; Run: ' + runId);
			return;
		}

		$('#prcg2Title').html('Progress for Project: ' + projectId + '; Run: ' + runId + '. Last updated at ' + new Date(data.lastUpdated).toLocaleString());

		var abortedAlert = ' <svg class="bi bi-exclamation-triangle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"><title>Trajectory aborted due to failures</title></path></svg>';

		var dataSeries = [];
		var dataRows = [];
		var totalGensCompleted = 0;
		var percentage = 0.0;
		var colorClassIndex = '';
		$.each(runData.clones, function(index, clone) {
			var genCount = clone.aborted ? data.maxGensPerClone : clone.gen + 1;
			colorClassIndex = Math.max(0, Math.floor((30 * genCount) / data.maxGensPerClone) - 1);
			percentage =  Math.round((((100 * genCount) / data.maxGensPerClone) + Number.EPSILON) * 100) / 100;
			dataSeries[index] = { data: [{x: clone.clone, y: 0}, {x: clone.clone, y: Math.max(0, clone.gen)}], borderColor: colorClass[colorClassIndex], backgroundColor:colorClass[colorClassIndex] };
			var lastCompleted = clone.gen === -1 ? '-' : clone.gen;
			lastCompleted = clone.aborted ? lastCompleted + abortedAlert : lastCompleted;

			dataRows[index] = { clone: clone.clone, gen: lastCompleted, completed: clone.gen + 1, remaining: (data.maxGensPerClone - genCount), progress: getProgressBar(percentage, colorClass[colorClassIndex]) };
			totalGensCompleted += genCount;
		});
		prcg2Chart(projectId, runId, data.maxClonesPerRun, data.maxGensPerClone, dataSeries);
		$('#prcg2Table').bootstrapTable({data: dataRows, formatNoMatches: function () {return 'No data found.';}});
		var totalGensForRun = data.maxClonesPerRun * data.maxGensPerClone;
		colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompleted) / totalGensForRun) - 1);
		percentage = Math.round((((100 * totalGensCompleted) / totalGensForRun) + Number.EPSILON) * 100) / 100;
		$('#prcg2ProgressBar').html(getProgressBar(percentage, colorClass[colorClassIndex]));
		$('#prcg2Table').show();
		$('#prcg2UpToProject').show();
		$('#prcg2UpToProjectURL').attr('href', './prcgProgress?project=' + projectId);

		if (runId != 0) {
			$('#prcg2PreviousRun').show();
			$('#prcg2PreviousRunURL').attr('href', './prcgProgress2?project=' + projectId + '&run=' + (runId-1));
		}
		if (runId != data.maxRuns-1) {
			$('#prcg2NextRun').show();
			$('#prcg2NextRunURL').attr('href', './prcgProgress2?project=' + projectId + '&run=' + (runId+1));
		}
	})
	.fail(function(data) {
		// The project specified in the URL does not point to a valid project
		alert('Unable to get data for Project: ' + projectId);
	})
	.always(function(data) {
		//alert('always');
	});
}

function totalLabelFormatter(data) {
	'use strict';
	return 'Total:';
}

function totalNumberFormatter(data) {
	'use strict';
	var field = this.field
	var total = 0;
	$.each(data, function (i, row) { total += row[field]; });
	return total;
}

$(document).ready(function () {
	'use strict';
	// PRCG Progress
	var page = window.location.pathname.split('/').pop();
	if (page === 'prcgProgress') {
		prcgProgress();
	}

	// PRCG Progress 2
	if (page === 'prcgProgress2') {
		prcgProgress2();
	}

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
			//var logLinePattern = /^.*.project:(?<p>\d*) run:(?<r>\d*) clone:(?<c>\d*) gen:(?<g>\d*).*.$/;
			//var match = logLinePattern.exec(logLine);
			var match = null;
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

			$.getJSON(creditAPIURL)
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