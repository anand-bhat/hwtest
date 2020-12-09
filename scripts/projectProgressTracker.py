"""Creates data set for FAH WU DB."""

import getopt
import json
import sys
import requests

requests.packages.urllib3.disable_warnings()

s = requests.Session()


def main(argv):
    """Main function."""
    psummary = get_api_response('https://apps.foldingathome.org/psummary.json')
    project_summary = read_json('projectSummary')
    projects = project_summary['projects']

    # Loop for each project
    for project_summary_entry in projects:
        project = project_summary_entry['project']
        print('Starting processing for Project ' + str(project) + '...')

        # Check if project exists in psummary
        projectIsInPsummary = False
        for item in psummary:
            if item['id'] == project:
                projectIsInPsummary = True
                project_summary_entry['active'] = True
                project_summary_entry['beta'] = item['beta']
                project_summary_entry['public'] = item['public']
                project_summary_entry['type'] = item['type']
                project_summary_entry['ws'] = item['ws']
                project_summary_entry['credit'] = item['credit']
                project_summary_entry['timeout'] = item['timeout']
                project_summary_entry['deadline'] = item['deadline']
                project_summary_entry['atoms'] = item['atoms']
                project_summary_entry['contact'] = item['contact']
                break

        if not projectIsInPsummary:
            project_summary_entry['active'] = False
            project_summary_entry['beta'] = '-'
            project_summary_entry['public'] = '-'
            project_summary_entry['ws'] = '-'
            
        if not project_summary_entry.get('cause'):
            # Get project details
            project_details = get_api_response('https://api.foldingathome.org/project/' + str(project))
            project_summary_entry['cause'] = project_details['cause']

        # Get project progress data
        project_entry = read_json(str(project))

        maxRuns = project_entry['maxRuns']
        maxClonesPerRun = project_entry['maxClonesPerRun']
        maxGensPerClone = project_entry['maxGensPerClone']
        totalGensForRun = maxClonesPerRun * maxGensPerClone
        totalGensForProject = maxRuns * totalGensForRun
        totalGensCompletedForProject = 0
        runs = project_entry['runs']

        for run_entry in runs:
            run = run_entry['run']
            clones = run_entry['clones']
            for clone_entry in clones:
                clone = clone_entry['clone']
                aborted = clone_entry.get('aborted', False)
                skipped = clone_entry.get('skipped', False)
                gen = clone_entry['gen']

                # Total WUs completed (successfully or otherwise) for this clone
                totalGensCompletedForClone = maxGensPerClone if (aborted or skipped) else (gen + 1)

                # Update project level accumulators
                totalGensCompletedForProject += totalGensCompletedForClone

        # Percentage completion for the project
        project_summary_entry['percentage'] = (100 * totalGensCompletedForProject) / totalGensForProject
        
    write_json('projectSummary', project_summary)


def read_json(filename):
    """Read the JSON file."""
    # Read JSON
    with open('../docs/assets/data/' + filename + '.json', 'r') as myfile:
        data = myfile.read()

    return json.loads(data)


def write_json(filename, entry):
    """Write the JSON file."""
    # Write JSON
    with open('../docs/assets/data/' + filename + '.json', 'w+') as myfile:
        myfile.write(json.dumps(entry, indent=2))
        myfile.close()


def get_api_response(url):
    """Get an API response."""
    response = s.get(url)
    if response.status_code != 200:
        print('ERROR: Error in API response')
        exit(1)

    return response.json()


if __name__ == '__main__':
    main(sys.argv[1:])
