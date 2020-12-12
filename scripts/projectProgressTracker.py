"""Creates data set for FAH project summary."""

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
                project_summary_entry['type'] = item['type']
                project_summary_entry['ws'] = item['ws']
                project_summary_entry['credit'] = item['credit']
                project_summary_entry['timeout'] = item['timeout']
                project_summary_entry['deadline'] = item['deadline']
                project_summary_entry['atoms'] = item['atoms']
                project_summary_entry['contact'] = item['contact']

                # If project is in internal, do not set beta and public indicators.
                # The expectation at this time is that these should be set manually, if the project is also released to Beta/ Public
                # The first internal=true indicator would need to be added manually to the projectSummary.json until psummary provides a way to identify these projects.
                if project_summary_entry.get('internal', False):
                    project_summary_entry['beta'] = item['beta']
                    project_summary_entry['public'] = item['public']
                break

        if not projectIsInPsummary:
            project_summary_entry['active'] = project_summary_entry['beta'] = project_summary_entry['public'] = False
            # Do not set internal = false as the expectation at this time is that this flag is manually controlled in the json file
            project_summary_entry['ws'] = '-'

        if not project_summary_entry.get('cause'):
            # Get cause from project details
            project_details = get_api_response('https://api.foldingathome.org/project/' + str(project))
            project_summary_entry['cause'] = project_details.get('cause', 'unknown')

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

                # Total WUs completed (successfully or otherwise)
                totalGensCompletedForClone = maxGensPerClone if (aborted or skipped) else (gen + 1)

                # Update project level accumulators
                totalGensCompletedForProject += totalGensCompletedForClone

        # Percentage completion for the project
        project_summary_entry['percentage'] = 100 * totalGensCompletedForProject / totalGensForProject

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
    if response.status_code != 200 and response.status_code != 404:
        print('ERROR: Error in API response')
        exit(1)

    return response.json()


if __name__ == '__main__':
    main(sys.argv[1:])
