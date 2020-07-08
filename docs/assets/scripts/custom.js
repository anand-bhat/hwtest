const colorClass = {
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
  29: '#00FF00',
};

function round(value, decimals) {
  // Source: https://www.jacklmoore.com/notes/rounding-in-javascript/
  return Number(`${Math.round(`${value}e${decimals}`)}e-${decimals}`);
}

function getProgressBar(percentage, color) {
  return `<div class="progress"><div class="progress-bar role="progressbar" style="width: ${percentage}%; background-color: ${color}" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div></div>`;
}

function prcg2Chart(projectId, runId, maxClonesPerRun, maxGensPerClone, dataSeries) {
  const myChart = new Chart($('#prcg2Chart'), {
    type: 'scatter',
    data: {
      datasets: dataSeries,
    },
    options: {
      maintainAspectRatio: false,
      datasets: [{
        line: {
          showLine: true,
        },
      }],
      legend: {
        display: false,
      },
      scales: {
        xAxes: [{
          gridLines: {
            display: false,
          },
          scaleLabel: {
            display: true,
            labelString: 'Clone #',
          },
          ticks: {
            stepSize: 1,
            max: maxClonesPerRun - 1,
          },
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Gen #',
          },
          ticks: {
            max: maxGensPerClone,
          },
        }],
      },
      title: {
        display: true,
        text: `Progress for Project: ${projectId}; Run: ${runId}`,
      },
      tooltips: {
        callbacks: {
          label(tooltipItem) {
            // Returned formatted tooltip
            return `Clone: ${tooltipItem.xLabel}; Gen: ${tooltipItem.yLabel} (${((tooltipItem.yLabel + 1) / maxGensPerClone) * 100}%)`;
          },
        },
        filter(tooltipItem) {
          // Hide tooltip for first coordinate
          return tooltipItem.index !== 0;
        },
      },
    },
  });

  return myChart;
}

function prcgProgress2Link(project, run) {
  return `<a href="./prcgProgress2?project=${project}&run=${run}">${run}</a>`;
}

function wuLookupLink(project, run, clone, gen) {
  return `<a href="https://apps.foldingathome.org/wu#project=${project}&run=${run}&clone=${clone}&gen=${gen}" rel="noopener" target="_blank">${gen}</a>`;
}

function failedAlert(failedCount) {
  const entity = failedCount > 1 ? 'trajectories' : 'trajectory';
  return `<svg class="bi bi-exclamation-triangle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"><title>${failedCount} ${entity} aborted</title></path></svg>`;
}

function projectConfigText(projectId, data) {
  return `Project ${projectId} has been configured to have ${data.maxRuns}${data.maxRuns > 1 ? ' Runs' : ' Run'}, each with ${data.maxClonesPerRun}${data.maxClonesPerRun > 1 ? ' Clones' : ' Clone'}. Each Clone has ${data.maxGensPerClone}${data.maxGensPerClone > 1 ? ' Gens' : ' Gen'}, resulting in ${data.maxRuns * data.maxClonesPerRun * data.maxGensPerClone} potential WUs for the project. Each WU represents ${data.trajLengthPerWU} nanoseconds of simulation.`;
}

function formattedDateString(dateVal) {
  const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dateTimeFormat.formatToParts(new Date(dateVal));
  return `${parts[4].value}-${parts[0].value}-${parts[2].value} ${parts[6].value}:${parts[8].value}:${parts[10].value} UTC`;
}

function prcgProgress() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('project')) {
    alert('Missing project ID');
    return;
  }

  const projectId = urlParams.get('project');
  $('#titleProjectID').html(projectId);
  if (!Number.isInteger(parseInt(projectId, 10))) {
    alert(`Unable to get data for Project: ${projectId}`);
    return;
  }

  $.getJSON(`../assets/data/${projectId}.json`)
    .done((data) => {
      $('#prcgTitle').html(`Progress for Project: ${projectId}`);
      $('#timeUpdated').html(`Last updated at ${formattedDateString(data.lastUpdated)}`);

      const metricsRun = [];
      let percentage = 0.0;
      let colorClassIndex = '';
      const totalGensForRun = data.maxClonesPerRun * data.maxGensPerClone;
      const totalGensForProject = data.maxRuns * totalGensForRun;
      let totalGensCompletedForProject = 0;
      let totalGensSuccessfulForProject = 0;
      let totalGensFailedForProject = 0;
      let totalGensAbortedForProject = 0;
      let totalGensRemainingForProject = 0;

      $('#projectConfig').html(projectConfigText(projectId, data));

      $.each(data.runs, (runIndex, run) => {
        let totalGensCompletedForRun = 0;
        let totalGensSuccessfulForRun = 0;
        let totalGensFailedForRun = 0;
        let totalGensAbortedForRun = 0;
        let totalGensRemainingForRun = 0;
        let lastGenDate = '';

        $.each(run.clones, (cloneIndex, clone) => {
          // Total WUs completed (successfully or otherwise) for this clone
          // Used to calculate percentage and remaining work
          const totalGensCompletedForClone = clone.aborted ? data.maxGensPerClone : clone.gen + 1;

          // Gens (WUs) have been successfully completed for this clone
          const totalGensSuccessfulForClone = clone.gen !== -1 && clone.aborted ? clone.gen : clone.gen + 1;

          // Gens (WUs) failed for this clone (1 or 0)
          const totalGensFailedForClone = clone.aborted ? 1 : 0;

          // Gens (WUs) aborted for this clone if a gen failed
          const totalGensAbortedForClone = clone.aborted ? (data.maxGensPerClone - totalGensSuccessfulForClone - 1) : 0;

          // Gens (WUs) remaining for this clone
          const totalGensRemainingForClone = data.maxGensPerClone - totalGensCompletedForClone;

          // Run level accumulators
          totalGensCompletedForRun += totalGensCompletedForClone;
          totalGensSuccessfulForRun += totalGensSuccessfulForClone;
          totalGensFailedForRun += totalGensFailedForClone;
          totalGensAbortedForRun += totalGensAbortedForClone;
          totalGensRemainingForRun += totalGensRemainingForClone;

          // Project level accumulators
          totalGensCompletedForProject += totalGensCompletedForClone;
          totalGensSuccessfulForProject += totalGensSuccessfulForClone;
          totalGensFailedForProject += totalGensFailedForClone;
          totalGensAbortedForProject += totalGensAbortedForClone;
          totalGensRemainingForProject += totalGensRemainingForClone;

          if (lastGenDate < clone.genDate) {
            lastGenDate = clone.genDate;
          }
        });

        // Determine color for the progress bar for the run
        colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForRun) / totalGensForRun) - 1);

        // Percentage completion for the run
        percentage = Math.round((((100 * totalGensCompletedForRun) / totalGensForRun) + Number.EPSILON) * 100) / 100;

        // Display string to show for Run # along with any indicators for aborted trajectories
        let runText = prcgProgress2Link(projectId, run.run);
        runText = totalGensFailedForRun > 0 ? `${runText} ${failedAlert(totalGensFailedForRun)}` : runText;

        // Run data table row
        metricsRun[runIndex] = {
          runVal: run.run,
          runText,
          lastGenDate,
          trajLength: round(totalGensSuccessfulForRun * data.trajLengthPerWU, 3),
          completed: totalGensSuccessfulForRun,
          failed: totalGensFailedForRun,
          aborted: totalGensAbortedForRun,
          remaining: totalGensRemainingForRun,
          progressVal: percentage,
          progress: getProgressBar(percentage, colorClass[colorClassIndex]),
        };
      });

      const metricsProject = [];
      // Project level metrics
      metricsProject[0] = {
        wuPlanned: totalGensForProject,
        wuCompleted: totalGensSuccessfulForProject,
        wuFailed: totalGensFailedForProject,
        wuAborted: totalGensAbortedForProject,
        wuRemaining: totalGensRemainingForProject,
        trajPlanned: round(totalGensForProject * data.trajLengthPerWU, 3),
        trajCompleted: round(totalGensSuccessfulForProject * data.trajLengthPerWU, 3),
        trajFailed: round(totalGensFailedForProject * data.trajLengthPerWU, 3),
        trajAborted: round(totalGensAbortedForProject * data.trajLengthPerWU, 3),
        trajRemaining: round(totalGensRemainingForProject * data.trajLengthPerWU, 3),
      };

      // Populate data into project details table
      $('#prcgProjectTable').bootstrapTable({
        data: metricsProject,
        formatNoMatches() {
          return 'No data found.';
        },
      });

      // Populate data into run details table
      $('#prcgRunTable').bootstrapTable({
        data: metricsRun,
        formatNoMatches() {
          return 'No data found.';
        },
      });

      // Determine color for the progress bar for the overall project
      colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForProject) / totalGensForProject) - 1);

      // Percentage completion for the overall project
      percentage = Math.round((((100 * totalGensCompletedForProject) / totalGensForProject) + Number.EPSILON) * 100) / 100;

      // Populate progress bar
      $('#prcgProgressBar').html(getProgressBar(percentage, colorClass[colorClassIndex]));

      // Show tables
      $('#prcgProjectTable').show();
      $('#prcgRunTable').show();
    })
    .fail(() => {
      // The project specified in the URL does not point to a valid project
      alert(`Unable to get data for Project: ${projectId}`);
    })
    .always(() => {
      // alert('always');
    });
}

function prcgProgress2() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('project')) {
    alert('Missing project ID');
    return;
  }
  if (!urlParams.has('run')) {
    alert('Missing run ID');
    return;
  }

  let projectId = urlParams.get('project');
  $('#titleProjectID').html(`<a href="../pages/prcgProgress?project=${projectId}">${projectId}</a>`);
  if (!Number.isInteger(parseInt(projectId, 10))) {
    alert(`Unable to get data for Project: ${projectId}`);
    return;
  }

  let runId = urlParams.get('run');
  $('#titleRunID').html(`Run ${runId}`);
  if (!Number.isInteger(parseInt(runId, 10))) {
    alert(`Unable to get data for Project: ${projectId}; Run: ${runId}`);
    return;
  }

  projectId = parseInt(projectId, 10);
  runId = parseInt(runId, 10);

  $.getJSON(`../assets/data/${projectId}.json`)
    .done((data) => {
      const runData = data.runs.find((run) => run.run === runId);
      if (!runData) {
        alert(`Unable to get data for Project: ${projectId}; Run: ${runId}`);
        return;
      }

      $('#prcg2Title').html(`Progress for Project: ${projectId}; Run: ${runId}`);
      $('#timeUpdated').html(`Last updated at ${formattedDateString(data.lastUpdated)}`);

      const dataSeries = [];
      const metricsClone = [];
      let percentage = 0.0;
      let colorClassIndex = '';
      const totalGensForRun = data.maxClonesPerRun * data.maxGensPerClone;
      let totalGensCompletedForRun = 0;
      let totalGensSuccessfulForRun = 0;
      let totalGensFailedForRun = 0;
      let totalGensAbortedForRun = 0;
      let totalGensRemainingForRun = 0;

      $('#projectConfig').html(projectConfigText(projectId, data));

      $.each(runData.clones, (cloneIndex, clone) => {
        // Total WUs completed (successfully or otherwise) for this clone
        // Used to calculate percentage and remaining work
        const totalGensCompletedForClone = clone.aborted ? data.maxGensPerClone : clone.gen + 1;

        // Gens (WUs) successfully completed for this clone
        const totalGensSuccessfulForClone = clone.gen !== -1 && clone.aborted ? clone.gen : clone.gen + 1;

        // Gens (WUs) failed for this clone (1 or 0)
        const totalGensFailedForClone = clone.aborted ? 1 : 0;

        // Gens (WUs) aborted for this clone if a gen failed
        const totalGensAbortedForClone = clone.aborted ? (data.maxGensPerClone - totalGensSuccessfulForClone - 1) : 0;

        // Gens (WUs) remaining for this clone
        const totalGensRemainingForClone = data.maxGensPerClone - totalGensCompletedForClone;

        // Run level accumulators
        totalGensCompletedForRun += totalGensCompletedForClone;
        totalGensSuccessfulForRun += totalGensSuccessfulForClone;
        totalGensFailedForRun += totalGensFailedForClone;
        totalGensAbortedForRun += totalGensAbortedForClone;
        totalGensRemainingForRun += totalGensRemainingForClone;

        // Determine color for the progress bar for the clone
        colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForClone) / data.maxGensPerClone) - 1);

        // Percentage completion for the clone
        percentage = Math.round((((100 * totalGensCompletedForClone) / data.maxGensPerClone) + Number.EPSILON) * 100) / 100;

        // Create coordinates for chart
        dataSeries[cloneIndex] = { data: [{ x: clone.clone, y: 0 }, { x: clone.clone, y: Math.max(0, clone.gen) }], borderColor: colorClass[colorClassIndex], backgroundColor: colorClass[colorClassIndex] };

        // Display string to show for Last completed gen # along with any indicator for aborted trajectories
        const genVal = clone.gen === -1 ? '-' : clone.gen;
        let genText = clone.gen === -1 ? '-' : wuLookupLink(projectId, runId, clone.clone, clone.gen);
        genText = clone.aborted ? `${genText} ${failedAlert(1)}` : genText;

        // Clone data table row
        metricsClone[cloneIndex] = {
          clone: clone.clone,
          genVal,
          genText,
          genDate: clone.genDate,
          trajLength: round(totalGensSuccessfulForClone * data.trajLengthPerWU, 3),
          completed: totalGensSuccessfulForClone,
          failed: totalGensFailedForClone,
          aborted: totalGensAbortedForClone,
          remaining: totalGensRemainingForClone,
          progressVal: percentage,
          progress: getProgressBar(percentage, colorClass[colorClassIndex]),
        };
      });

      const metricsRun = [];
      // Run level metrics
      metricsRun[0] = {
        wuPlanned: totalGensForRun,
        wuCompleted: totalGensSuccessfulForRun,
        wuFailed: totalGensFailedForRun,
        wuAborted: totalGensAbortedForRun,
        wuRemaining: totalGensRemainingForRun,
        trajPlanned: round(totalGensForRun * data.trajLengthPerWU, 3),
        trajCompleted: round(totalGensSuccessfulForRun * data.trajLengthPerWU, 3),
        trajFailed: round(totalGensFailedForRun * data.trajLengthPerWU, 3),
        trajAborted: round(totalGensAbortedForRun * data.trajLengthPerWU, 3),
        trajRemaining: round(totalGensRemainingForRun * data.trajLengthPerWU, 3),
      };

      // Draw chart
      prcg2Chart(projectId, runId, data.maxClonesPerRun, data.maxGensPerClone, dataSeries);

      // Populate data into run details table
      $('#prcg2RunTable').bootstrapTable({
        data: metricsRun,
        formatNoMatches() {
          return 'No data found.';
        },
      });

      // Populate data into clone details table
      $('#prcg2CloneTable').bootstrapTable({
        data: metricsClone,
        formatNoMatches() {
          return 'No data found.';
        },
      });

      // Determine color for the progress bar for the run
      colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForRun) / totalGensForRun) - 1);

      // Percentage completion for the run
      percentage = Math.round((((100 * totalGensCompletedForRun) / totalGensForRun) + Number.EPSILON) * 100) / 100;

      // Populate progress bar
      $('#prcg2ProgressBar').html(getProgressBar(percentage, colorClass[colorClassIndex]));

      // Show tables
      $('#prcg2RunTable').show();
      $('#prcg2CloneTable').show();

      // Display button to navigate up to project details
      $('#prcg2UpToProjectURL').attr('href', `./prcgProgress?project=${projectId}`);
      $('#prcg2UpToProject').show();

      // Display buttons to navigate across runs
      if (runId !== 0) {
        $('#prcg2PreviousRunURL').attr('href', `./prcgProgress2?project=${projectId}&run=${runId - 1}`);
        $('#prcg2PreviousRun').show();
      }
      if (runId !== data.maxRuns - 1) {
        $('#prcg2NextRunURL').attr('href', `./prcgProgress2?project=${projectId}&run=${runId + 1}`);
        $('#prcg2NextRun').show();
      }
    })
    .fail(() => {
      // The project specified in the URL does not point to a valid project
      alert(`Unable to get data for Project: ${projectId}`);
    })
    .always(() => {
      // alert('always');
    });
}

function totalLabelFormatter() {
  return 'Total:';
}

function totalNumberFormatter(data) {
  const { field } = this;
  let total = 0;
  $.each(data, (i, row) => {
    total += row[field];
  });
  return round(total, 3);
}

$(document).ready(() => {
  // PRCG Progress
  const page = window.location.pathname.split('/').pop();
  if (page === 'prcgProgress') {
    prcgProgress();
  }

  // PRCG Progress 2
  if (page === 'prcgProgress2') {
    prcgProgress2();
  }

  // Toggle page description visibility
  $('#togglePageDescription').on('click', function togglePageDescription(e) {
    e.preventDefault();
    if ($('#pageDescription').is(':visible')) {
      $('#pageDescription').hide();
      $(this).text('Show instructions:');
    } else {
      $('#pageDescription').show();
      $(this).text('Hide instructions:');
    }
  });

  // Fetch credit for WU
  $('#fetchCredit').on('click', function fetchCredit(e) {
    const logLine = $('#logLine').val();
    if (logLine !== null && logLine !== '') {
      const logLinePattern = /^.*.project\D*(\d*)\D*run\D*?(\d*)\D*clone\D*(\d*)\D*gen\D*s?(\d*).*.$/i;
      const match = logLinePattern.exec(logLine);
      if (match === null || match.length !== 5) {
        $('#projectId').val('');
        $('#runId').val('');
        $('#cloneId').val('');
        $('#genId').val('');
        $('#wuStatus').text('Unable to parse line from log file.');
        $('#wuStatus').removeClass('good').addClass('bad');
        $('#wuStatusData').hide();
        e.preventDefault();
        return;
      }
      const p = match[1];
      const r = match[2];
      const c = match[3];
      const g = match[4];

      $('#projectId').val(p);
      $('#runId').val(r);
      $('#cloneId').val(c);
      $('#genId').val(g);
    }

    if ($(this).closest('form')[0].checkValidity()) {
      e.preventDefault();

      const projectId = $('#projectId').val();
      const runId = $('#runId').val();
      const cloneId = $('#cloneId').val();
      const genId = $('#genId').val();

      const creditAPIURL = `https://api.foldingathome.org/project/${projectId}/run/${runId}/clone/${cloneId}/gen/${genId}?callback=?`;
      const wuDescription = `Project: ${projectId} (Run: ${runId}; Clone: ${cloneId}; Gen: ${genId})`;

      $.getJSON(creditAPIURL)
        .done((data) => {
          $('#wuStatus').text(`WU credit check complete for ${wuDescription}.`);
          $('#wuStatus').removeClass('bad').addClass('good');
          $('#wuStatusTable').bootstrapTable({
            data,
            formatNoMatches() {
              return 'No credits found.';
            },
          });
          $('#wuStatusTable').bootstrapTable('load', data);
          $('#wuStatusData').show();
        })
        .fail(() => {
          $('#wuStatus').text('An error occured when checking WU credits.');
          $('#wuStatus').removeClass('good').addClass('bad');
          $('#wuStatusData').hide();
        })
        .always(() => {
          $('#fetchCredit').attr('disabled', true);
          setTimeout(() => {
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
