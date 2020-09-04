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
            return `Clone: ${tooltipItem.xLabel}; Gen: ${tooltipItem.yLabel} (${round(((tooltipItem.yLabel + 1) / maxGensPerClone) * 100, 2)}%)`;
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

function failedAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg class="bi bi-exclamation-circle-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="red" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} failed (aborted)</title><path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>`;
}

function failedWhenDumpedAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bug-fill" fill="red" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} failed (aborted) due to issue #1549</title><path fill-rule="evenodd" d="M4.978.855a.5.5 0 1 0-.956.29l.41 1.352A4.985 4.985 0 0 0 3 6h10a4.985 4.985 0 0 0-1.432-3.503l.41-1.352a.5.5 0 1 0-.956-.29l-.291.956A4.978 4.978 0 0 0 8 1a4.979 4.979 0 0 0-2.731.811l-.29-.956zM13 6v1H8.5v8.975A5 5 0 0 0 13 11h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 1 0 1 0v-.5a1.5 1.5 0 0 0-1.5-1.5H13V9h1.5a.5.5 0 0 0 0-1H13V7h.5A1.5 1.5 0 0 0 15 5.5V5a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-.5.5H13zm-5.5 9.975V7H3V6h-.5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 0-1 0v.5A1.5 1.5 0 0 0 2.5 7H3v1H1.5a.5.5 0 0 0 0 1H3v1h-.5A1.5 1.5 0 0 0 1 11.5v.5a.5.5 0 1 0 1 0v-.5a.5.5 0 0 1 .5-.5H3a5 5 0 0 0 4.5 4.975z"/>
</svg>`;
}

function failedWhenSuccessAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bug-fill" fill="purple" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} failed (aborted) due to issue #1532</title><path fill-rule="evenodd" d="M4.978.855a.5.5 0 1 0-.956.29l.41 1.352A4.985 4.985 0 0 0 3 6h10a4.985 4.985 0 0 0-1.432-3.503l.41-1.352a.5.5 0 1 0-.956-.29l-.291.956A4.978 4.978 0 0 0 8 1a4.979 4.979 0 0 0-2.731.811l-.29-.956zM13 6v1H8.5v8.975A5 5 0 0 0 13 11h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 1 0 1 0v-.5a1.5 1.5 0 0 0-1.5-1.5H13V9h1.5a.5.5 0 0 0 0-1H13V7h.5A1.5 1.5 0 0 0 15 5.5V5a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-.5.5H13zm-5.5 9.975V7H3V6h-.5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 0-1 0v.5A1.5 1.5 0 0 0 2.5 7H3v1H1.5a.5.5 0 0 0 0 1H3v1h-.5A1.5 1.5 0 0 0 1 11.5v.5a.5.5 0 1 0 1 0v-.5a.5.5 0 0 1 .5-.5H3a5 5 0 0 0 4.5 4.975z"/>
</svg>`;
}

function failedWhenSuccessAndDumpedAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bug-fill" fill="magenta" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} failed (aborted) due to issues #1532 and #1549</title><path fill-rule="evenodd" d="M4.978.855a.5.5 0 1 0-.956.29l.41 1.352A4.985 4.985 0 0 0 3 6h10a4.985 4.985 0 0 0-1.432-3.503l.41-1.352a.5.5 0 1 0-.956-.29l-.291.956A4.978 4.978 0 0 0 8 1a4.979 4.979 0 0 0-2.731.811l-.29-.956zM13 6v1H8.5v8.975A5 5 0 0 0 13 11h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 1 0 1 0v-.5a1.5 1.5 0 0 0-1.5-1.5H13V9h1.5a.5.5 0 0 0 0-1H13V7h.5A1.5 1.5 0 0 0 15 5.5V5a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-.5.5H13zm-5.5 9.975V7H3V6h-.5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 0-1 0v.5A1.5 1.5 0 0 0 2.5 7H3v1H1.5a.5.5 0 0 0 0 1H3v1h-.5A1.5 1.5 0 0 0 1 11.5v.5a.5.5 0 1 0 1 0v-.5a.5.5 0 0 1 .5-.5H3a5 5 0 0 0 4.5 4.975z"/>
</svg>`;
}

function skippedAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg class="bi bi-info-circle" width="1em" height="1em" viewBox="0 0 16 16" fill="black" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} skipped</title><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588z"/><circle cx="8" cy="4.5" r="1"/></svg>`;
}

function lateAlert(count) {
  const entity = count > 1 ? 'trajectories' : 'trajectory';
  return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-hourglass-bottom" fill="orange" xmlns="http://www.w3.org/2000/svg"><title>${count} ${entity} running late</title><path fill-rule="evenodd" d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5zm2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702s.18.149.5.149.5-.15.5-.15v-.7c0-.701.478-1.236 1.011-1.492A3.5 3.5 0 0 0 11.5 3V2h-7z"/></svg>`;
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

function isNextGenLate(checkedAt, lastGenAt) {
  const latePeriod =  15 * 24 * 60 * 60 * 1000; // 15 days
  return Date.parse(lastGenAt) < (checkedAt - latePeriod);
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
      let totalGensFailedWhenDumpedForProject = 0;
      let totalGensFailedWhenSuccessForProject = 0;
      let totalGensFailedWhenSuccessAndDumpedForProject = 0;
      let totalGensAbortedForProject = 0;
      let totalGensRemainingForProject = 0;
      let totalGensLateForProject = 0;

      $('#projectConfig').html(projectConfigText(projectId, data));

      $.each(data.runs, (runIndex, run) => {
        let totalGensCompletedForRun = 0;
        let totalGensSuccessfulForRun = 0;
        let totalGensFailedForRun = 0;
        let totalGensFailedWhenDumpedForRun = 0;
        let totalGensFailedWhenSuccessForRun = 0;
        let totalGensFailedWhenSuccessAndDumpedForRun = 0;
        let totalGensSkippedForRun = 0;
        let totalGensAbortedForRun = 0;
        let totalGensRemainingForRun = 0;
        let totalGensLateForRun = 0;
        let lastGenDate = '';

        $.each(run.clones, (cloneIndex, clone) => {
          // Total WUs completed (successfully or otherwise) for this clone
          // Used to calculate percentage and remaining work
          const totalGensCompletedForClone = clone.aborted || clone.skipped ? data.maxGensPerClone : clone.gen + 1;

          // Gens (WUs) have been successfully completed for this clone
          const totalGensSuccessfulForClone = clone.gen !== -1 && clone.aborted ? clone.gen : clone.gen + 1;

          // Gens (WUs) failed for this clone (1 or 0)
          const totalGensFailedForClone = clone.aborted ? 1 : 0;

          // Gens (WUs) failed when dumped for this clone (1 or 0)
          const totalGensFailedWhenDumpedForClone = clone.abortedWhenDumped ? 1 : 0;

          // Gens (WUs) failed when dumped for this clone (1 or 0)
          const totalGensFailedWhenSuccessForClone = clone.abortedWhenSuccess ? 1 : 0;

          // Gens (WUs) failed when dumped for this clone (1 or 0)
          const totalGensFailedWhenSuccessAndDumpedForClone = clone.abortedWhenSuccessAndDumped ? 1 : 0;

          // Gens (WUs) skipped for this clone (1 or 0)
          const totalGensSkippedForClone = clone.skipped ? 1 : 0;

          // Gens (WUs) aborted for this clone if a gen failed
          const totalGensAbortedForClone = clone.aborted ? (data.maxGensPerClone - totalGensSuccessfulForClone - 1) : 0;

          // Gens (WUs) remaining for this clone
          const totalGensRemainingForClone = data.maxGensPerClone - totalGensCompletedForClone;

          // Gens (WUs) late for this clone (1 or 0)
          const totalGensLateForClone = totalGensRemainingForClone > 0 && isNextGenLate(data.lastUpdated, clone.genDate) ? 1 : 0;

          // Run level accumulators
          totalGensCompletedForRun += totalGensCompletedForClone;
          totalGensSuccessfulForRun += totalGensSuccessfulForClone;
          totalGensFailedForRun += totalGensFailedForClone;
          totalGensFailedWhenDumpedForRun += totalGensFailedWhenDumpedForClone;
          totalGensFailedWhenSuccessForRun += totalGensFailedWhenSuccessForClone;
          totalGensFailedWhenSuccessAndDumpedForRun += totalGensFailedWhenSuccessAndDumpedForClone;
          totalGensAbortedForRun += totalGensAbortedForClone;
          totalGensRemainingForRun += totalGensRemainingForClone;
          totalGensSkippedForRun += totalGensSkippedForClone;
          totalGensLateForRun += totalGensLateForClone;

          // Project level accumulators
          totalGensCompletedForProject += totalGensCompletedForClone;
          totalGensSuccessfulForProject += totalGensSuccessfulForClone;
          totalGensFailedForProject += totalGensFailedForClone;
          totalGensFailedWhenDumpedForProject += totalGensFailedWhenDumpedForClone;
          totalGensFailedWhenSuccessForProject += totalGensFailedWhenSuccessForClone;
          totalGensFailedWhenSuccessAndDumpedForProject += totalGensFailedWhenSuccessAndDumpedForClone;
          totalGensAbortedForProject += totalGensAbortedForClone;
          totalGensRemainingForProject += totalGensRemainingForClone;
          totalGensLateForProject += totalGensLateForClone;

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
        let flags = [];
        if (totalGensFailedForRun > 0) {
          flags.push('F');
          runText = `${runText} ${failedAlert(totalGensFailedForRun)}`;
        }
        if (totalGensFailedWhenDumpedForRun > 0) {
          flags.push('B1549');
          runText = `${runText} ${failedWhenDumpedAlert(totalGensFailedWhenDumpedForRun)}`;
        }
        if (totalGensFailedWhenSuccessForRun > 0) {
          flags.push('B1532');
          runText = `${runText} ${failedWhenSuccessAlert(totalGensFailedWhenSuccessForRun)}`;
        }
        if (totalGensFailedWhenSuccessAndDumpedForRun > 0) {
          flags.push('B1532');
          flags.push('B1549');
          runText = `${runText} ${failedWhenSuccessAndDumpedAlert(totalGensFailedWhenSuccessAndDumpedForRun)}`;
        }
        if (totalGensLateForRun > 0) {
          flags.push('L');
          runText = `${runText} ${lateAlert(totalGensLateForRun)}`;
        }
        if (totalGensSkippedForRun > 0) {
          flags.push('S');
          runText = `${runText} ${skippedAlert(totalGensSkippedForRun)}`;
        }

        // Run data table row
        metricsRun[runIndex] = {
          runVal: run.run,
          runText,
          flags: flags.toString(),
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
      let totalGensFailedWhenDumpedForRun = 0;
      let totalGensFailedWhenSuccessForRun = 0;
      let totalGensFailedWhenSuccessAndDumpedForRun = 0;
      let totalGensAbortedForRun = 0;
      let totalGensRemainingForRun = 0;
      let totalGensLateForRun = 0;

      $('#projectConfig').html(projectConfigText(projectId, data));

      $.each(runData.clones, (cloneIndex, clone) => {
        // Total WUs completed (successfully or otherwise) for this clone
        // Used to calculate percentage and remaining work
        const totalGensCompletedForClone = clone.aborted || clone.skipped ? data.maxGensPerClone : clone.gen + 1;

        // Gens (WUs) successfully completed for this clone
        const totalGensSuccessfulForClone = clone.gen !== -1 && clone.aborted ? clone.gen : clone.gen + 1;

        // Gens (WUs) failed for this clone (1 or 0)
        const totalGensFailedForClone = clone.aborted ? 1 : 0;

        // Gens (WUs) failed when dumped for this clone (1 or 0)
        const totalGensFailedWhenDumpedForClone = clone.abortedWhenDumped ? 1 : 0;

        // Gens (WUs) failed when dumped for this clone (1 or 0)
        const totalGensFailedWhenSuccessForClone = clone.abortedWhenSuccess ? 1 : 0;

        // Gens (WUs) failed when dumped for this clone (1 or 0)
        const totalGensFailedWhenSuccessAndDumpedForClone = clone.abortedWhenSuccessAndDumped ? 1 : 0;

        // Gens (WUs) aborted for this clone if a gen failed
        const totalGensAbortedForClone = clone.aborted ? (data.maxGensPerClone - totalGensSuccessfulForClone - 1) : 0;

        // Gens (WUs) remaining for this clone
        const totalGensRemainingForClone = data.maxGensPerClone - totalGensCompletedForClone;

        // Gens (WUs) late for this clone (1 or 0)
        const totalGensLateForClone = totalGensRemainingForClone > 0 && isNextGenLate(data.lastUpdated, clone.genDate) ? 1 : 0;

        // Run level accumulators
        totalGensCompletedForRun += totalGensCompletedForClone;
        totalGensSuccessfulForRun += totalGensSuccessfulForClone;
        totalGensFailedForRun += totalGensFailedForClone;
        totalGensFailedWhenDumpedForRun += totalGensFailedWhenDumpedForClone;
        totalGensFailedWhenSuccessForRun += totalGensFailedWhenSuccessForClone;
        totalGensFailedWhenSuccessAndDumpedForRun += totalGensFailedWhenSuccessAndDumpedForClone;
        totalGensAbortedForRun += totalGensAbortedForClone;
        totalGensRemainingForRun += totalGensRemainingForClone;
        totalGensLateForRun += totalGensLateForClone;

        // Determine color for the progress bar for the clone
        colorClassIndex = Math.max(0, Math.floor((30 * totalGensCompletedForClone) / data.maxGensPerClone) - 1);

        // Percentage completion for the clone
        percentage = Math.round((((100 * totalGensCompletedForClone) / data.maxGensPerClone) + Number.EPSILON) * 100) / 100;

        // Create coordinates for chart
        dataSeries[cloneIndex] = { data: [{ x: clone.clone, y: 0 }, { x: clone.clone, y: Math.max(0, clone.gen) }], borderColor: colorClass[colorClassIndex], backgroundColor: colorClass[colorClassIndex] };

        // Display string to show for Last completed gen # along with any indicator for aborted trajectories
        const genVal = clone.gen === -1 ? '-' : clone.gen;
        let genText = clone.gen === -1 ? '-' : wuLookupLink(projectId, runId, clone.clone, clone.gen);
        let flags = [];
        if (clone.aborted) {
          flags.push('F');
          genText = `${genText} ${failedAlert(1)}`;
        }
        if (clone.abortedWhenDumped) {
          flags.push('B1549');
          genText = `${genText} ${failedWhenDumpedAlert(1)}`;
        }
        if (clone.abortedWhenSuccess) {
          flags.push('B1532');
          genText = `${genText} ${failedWhenSuccessAlert(1)}`;
        }
        if (clone.abortedWhenSuccessAndDumped) {
          flags.push('B1532');
          flags.push('B1549');
          genText = `${genText} ${failedWhenSuccessAndDumpedAlert(1)}`;
        }
        if (totalGensLateForClone > 0) {
          flags.push('L');
          genText = `${genText} ${lateAlert(1)}`;
        }
        if (clone.skipped) {
          flags.push('S');
          genText = `${genText} ${skippedAlert(1)}`;
        }

        // Clone data table row
        metricsClone[cloneIndex] = {
          clone: clone.clone,
          genVal,
          genText,
          flags: flags.toString(),
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
    });
}

function addOrgEntry(orgName, orgLogo, orgTitle, orgLink, orgActions, orgTeamId) {
  let content = [];
  content.push('	<div class="card mb-4">');
  content.push('		<div class="card-body">');
  content.push(`			<img src="../assets/images/entity/${orgLogo}" class="card-img-top cardimg" alt="/${orgName} logo">`);
  content.push('			<p>&nbsp;</p>');
  content.push(`			<div class="card-title"><a href="${orgLink}" rel="noopener" target="_blank">${orgTitle}</a></div>`);
  content.push('		</div>');
  content.push('		<div class="card-footer">');
  if (orgActions.includes('FAH')) {
    content.push('			<i class="material-icons" title="Running Folding@home">computer</i>');
  }
  if (orgActions.includes('BUILD')) {
    content.push('			<i class="material-icons" title="Collaborating in Software Development">build</i>');
  }
  if (orgActions.includes('INFRA')) {
    content.push('			<i class="material-icons" title="Providing infrastructure/ hosting">storage</i>');
  }
  if (orgActions.includes('AWARE')) {
    content.push('			<i class="material-icons" title="Spreading awareness">campaign</i>');
  }
  if (orgActions.includes('COMPETE')) {
    content.push('			<i class="material-icons" title="Hosting Folding@home competitions">emoji_events</i>');
  }

  if (orgTeamId) {
    content.push(`			<div class="float-right"><a href="https://stats.foldingathome.org/team/${orgTeamId}" class="text-body" rel="noopener" target="_blank"><i class="material-icons" title="FAH Team">group_add</i></a></div>`);
  }
  content.push('		</div>');
  content.push('	</div>');

  return content.join('');
}

function participatingOrganisations() {
  $.getJSON('../assets/data/participatingOrganisations.json')
    .done((data) => {
      // Generated content
      let content = [];

      $.each(data.orgs, (orgIndex, org) => {
        content.push(addOrgEntry(org.name, org.logo, org.title, org.source, org.actions, org.team));
        if ((orgIndex + 1) % 2 === 0) {
          content.push('	<div class="w-100 d-none d-sm-block d-md-none"><!-- wrap every 2 on sm--></div>');
        }
        if ((orgIndex + 1) % 3 === 0) {
          content.push('	<div class="w-100 d-none d-md-block d-lg-none"><!-- wrap every 3 on md--></div>');
        }
        if ((orgIndex + 1) % 4 === 0) {
          content.push('	<div class="w-100 d-none d-lg-block d-xl-none"><!-- wrap every 4 on lg--></div>');
        }
        if ((orgIndex + 1) % 5 === 0) {
          content.push('	<div class="w-100 d-none d-xl-block"><!-- wrap every 5 on xl--></div>');
        }
      });

      $('#orgs').html(content.join(''));
    })
    .fail(() => {
      $('#orgs').html('Unable to get data.');
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

  // Participating organisations
  if (page === 'participatingOrganisations') {
    participatingOrganisations();
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
