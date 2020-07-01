"""Creates project progress report for a given FAH project."""

import argparse
import json
import math
import requests
import sys
import time
from time import sleep


requests.packages.urllib3.disable_warnings()

MAX_FAILURES = 0


def main(argv):
    """Main function."""
    project_file = ''
    # Create the argument parser
    parser = argparse.ArgumentParser(allow_abbrev=False, description='Creates project progress report for a given FAH project.')
    parser.add_argument('-f', '--file', type=str, help='The project JSON file')
    parser.add_argument('-p', '--project', type=int, help='Project ID')
    parser.add_argument('-r', '--run', type=int, help='Max. number of runs for project')
    parser.add_argument('-c', '--clone', type=int, help='Max. number of clones per run')
    parser.add_argument('-g', '--gen', type=int, help='Max. number of gens per clone')
    parser.add_argument('-e', '--errors', type=int, default=5, help='Max. number of errors before the trajectory is aborted (default: 5)')
    parser.add_argument('-l', '--length', type=float, help='Trajectory length (in ns) per WU')
    args = parser.parse_args()

    projectFile = args.file
    if not projectFile:
        project = args.project
        maxRuns = args.run
        maxClonesPerRun = args.clone
        maxGensPerClone = args.gen
        maxFailures = args.errors
        trajLengthPerWU = args.length
        if not project or not maxRuns or not maxClonesPerRun or not maxGensPerClone or not trajLengthPerWU:
            print('projectProgressChecker.py: error: Missing argument -f/--file OR all of the following arguments: -p/--project, -r/--run, -c/--clone, -g/--gen, -l/--length')
            sys.exit(2)
        projectFile = str(project) + '.json'
        create_projects_json(projectFile, project, maxRuns, maxClonesPerRun, maxGensPerClone, maxFailures, trajLengthPerWU)

    global MAX_FAILURES

    # Project to update
    project_entry = read_projects_json(projectFile)

    project = project_entry['project']
    MAX_FAILURES = project_entry['maxFailures']
    maxRuns = project_entry['maxRuns']
    maxClonesPerRun = project_entry['maxClonesPerRun']
    maxGensPerClone = project_entry['maxGensPerClone']
    runs = project_entry['runs']

    print('Starting processing for Project {}...'.format(project))

    # Loop for each run
    for run_entry in runs:
        run = run_entry['run']
        print(' Starting processing for Project {}, Run {}...'.format(project, run))

        clones = run_entry['clones']
        for clone_entry in clones:
            clone = clone_entry['clone']
            print('  Starting processing for Project {}, Run {}, Clone {}...'.format(project, run, clone))
            gen = clone_entry['gen']
            if gen == maxGensPerClone - 1:
                print('   All gens accounted for')
                continue

            # Special case: Check last gen
            response = wu_check(project, run, clone, maxGensPerClone - 1)
            if response[0] == 1:
                # Record this gen where traj has completed
                record_clone_entry(clone_entry, maxGensPerClone - 1, response[1], False)
                continue
            elif response[0] == 2:
                # Record this gen where traj has been aborted
                record_clone_entry(clone_entry, maxGensPerClone - 1, response[1], True)
                continue

            # Special case: Check next gen
            response = wu_check(project, run, clone, gen + 1)
            lastGenDate = '-'
            if response[0] == 0:
                print('   No progress detected')
                continue
            elif response[0] == 1:
                # Record this gen where traj has completed
                record_clone_entry(clone_entry, gen + 1, response[1], False)
                if (gen + 1) == (maxGensPerClone - 1):
                    # This is the last gen
                    continue
            elif response[0] == 2:
                # Record this gen where traj has been aborted
                record_clone_entry(clone_entry, gen + 1, response[1], True)
                continue

            # Binary search
            latest = binary_search_wu_check(project, run, clone, gen, gen + 2, maxGensPerClone - 1)
            # Record this gen
            if (latest[0] == 1):
                # Record this gen where traj has completed
                record_clone_entry(clone_entry, latest[1], latest[2], False)
            elif (latest[0] == 2):
                # Record this gen where traj has been aborted
                record_clone_entry(clone_entry, latest[1], latest[2], True)

    project_entry['lastUpdated'] = math.floor(time.time() * 1000)
    write_projects_json(projectFile, project_entry)
    print('Done')


def record_clone_entry(clone_entry, gen, genDate, aborted):
    """Record an updated gen entry."""
    clone_entry['gen'] = gen
    clone_entry['genDate'] = genDate
    if aborted:
        clone_entry['aborted'] = True
    else:
        clone_entry.pop('aborted', None)


def create_projects_json(projectFile, project, maxRuns, maxClonesPerRun, maxGensPerClone, maxFailures, trajLengthPerWU):
    """Create the projects file."""
    # Write projects JSON
    project_entry = json.loads(json.dumps({}))
    project_entry['project'] = project
    project_entry['maxFailures'] = maxFailures
    project_entry['lastUpdated'] = 0
    project_entry['maxRuns'] = maxRuns
    project_entry['maxClonesPerRun'] = maxClonesPerRun
    project_entry['maxGensPerClone'] = maxGensPerClone
    project_entry['trajLengthPerWU'] = trajLengthPerWU
    runs = []

    for run in range(maxRuns):
        run_entry = json.loads(json.dumps({}))
        run_entry['run'] = run
        clones = []

        for clone in range(maxClonesPerRun):
            clone_entry = json.loads(json.dumps({}))
            clone_entry['clone'] = clone
            clone_entry['gen'] = -1
            clone_entry['genDate'] = '-'
            clones.append(clone_entry)

        run_entry['clones'] = clones
        runs.append(run_entry)

    project_entry['runs'] = runs

    with open(str(project) + '.json', 'w+') as myfile:
        myfile.write(json.dumps(project_entry, indent=2))
        myfile.close()


def write_projects_json(projectFile, project_entry):
    """Write the projects file."""
    # Write projects JSON
    with open(projectFile, 'w+') as myfile:
        myfile.write(json.dumps(project_entry, indent=2))
        myfile.close()


def read_projects_json(projectFile):
    """Read the projects file."""
    # Read projects JSON
    with open(projectFile, 'r') as myfile:
        projects = myfile.read()
        myfile.close()

    projects_json = json.loads(projects)
    return projects_json


def wu_check(project, run, clone, gen):
    """Check WU status."""
    print('   Checking status for Project {}, Run {}, Clone {}, Gen {}...'.format(project, run, clone, gen))
    url = 'https://api.foldingathome.org/project/{}/run/{}/clone/{}/gen/{}'.format(project, run, clone, gen)
    sleep(1)
    response = requests.get(url)
    if response.status_code != 200:
        print('ERROR: Error in API response')
        exit(1)

    response = response.json()
    response.reverse()
    faultCount = 0
    genDate = None
    for result in response:
        if genDate is None:
            genDate = result['log_time'] + ' UTC'
        code = result['code']
        if code == 'Ok':
            return (1, genDate)
        elif code in ['Faulty', 'Faulty 2']:
            faultCount = faultCount + 1

    if faultCount >= MAX_FAILURES:
        return (2, genDate)

    return (0, '-')


def binary_search_wu_check(project, run, clone, gen, lower, upper):
    """Binary search for last completed WU."""
    lastGen = -1
    lastGenDate = '-'

    while lower <= upper:
        mid = (lower + upper) // 2
        response = wu_check(project, run, clone, mid)
        if response[0] == 2:
            return (2, mid, response[1])

        if response[0] == 0:
            # Not found, check lower half
            upper = mid - 1
            continue

        if response[0] == 1:
            # Found, check upper half
            lastGen = mid
            lastGenDate = response[1]
            lower = mid + 1
            continue

    if lastGen == -1:
        return (0, -1, '-')
    return (1, lastGen, lastGenDate)


if __name__ == '__main__':
    main(sys.argv[1:])
