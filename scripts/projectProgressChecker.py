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
s = requests.Session()


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
    parser.add_argument('-l', '--length', type=float, default=0, help='Trajectory length (in ns) per WU (default: 0)')
    parser.add_argument('-ra', '--retryaborted', type=bool, default=False, help='Retry Gens previously marked as aborted')
    parser.add_argument('-rc', '--rechecklastgen', type=bool, default=False, help='Recheck the last recorded Gen. Useful when there was a bug in scanning and things need correction')
    parser.add_argument('-st', '--searchtype', type=str, default='alternate', help='Specifies the search type -- binary or alternate (default: binary)')
    parser.add_argument('-sr', '--startingrun', type=int, default=0, help='Start at Run X')
    parser.add_argument('-sc', '--startingclone', type=int, default=0, help='Start at Clone X')
    parser.add_argument('-zz', '--checkfinalgenfirst', type=bool, default=False, help='Check the final Gen first. Useful for first time runs for projects that are almost complete')
    args = parser.parse_args()

    projectFile = args.file
    startingRun = args.startingrun
    startingClone = args.startingclone
    checkFinalGenFirst = args.checkfinalgenfirst
    recheckLastGen = args.rechecklastgen
    if not projectFile:
        project = args.project
        maxRuns = args.run
        maxClonesPerRun = args.clone
        maxGensPerClone = args.gen
        maxFailures = args.errors
        trajLengthPerWU = args.length
        if not project or not maxRuns or not maxClonesPerRun or not maxGensPerClone:
            print('projectProgressChecker.py: error: Missing argument -f/--file OR all of the following arguments: -p/--project, -r/--run, -c/--clone, -g/--gen')
            sys.exit(2)
        projectFile = str(project) + '.json'
        create_projects_json(projectFile, project, maxRuns, maxClonesPerRun, maxGensPerClone, maxFailures, trajLengthPerWU)

    global MAX_FAILURES

    # Should aborted Gens be rechecked for progress?
    retryAborted = args.retryaborted

    # Search type to be used
    searchType = args.searchtype

    # Project to update
    project_entry = read_projects_json(projectFile)

    project = project_entry['project']
    MAX_FAILURES = project_entry['maxFailures']
    maxRuns = project_entry['maxRuns']
    maxClonesPerRun = project_entry['maxClonesPerRun']
    maxGensPerClone = project_entry['maxGensPerClone']
    runs = project_entry['runs']

    print('Starting processing for Project {}...'.format(project))
    try:
        # Loop for each run
        for run_entry in runs:
            run = run_entry['run']
            if run < startingRun:
                continue

            print(' Starting processing for Project {}, Run {}...'.format(project, run))

            clones = run_entry['clones']
            for clone_entry in clones:
                clone = clone_entry['clone']
                if run == startingRun and clone < startingClone:
                    continue

                print('  Starting processing for Project {}, Run {}, Clone {}...'.format(project, run, clone))

                # Skip manually terminated Gens
                if clone_entry.get('skipped', False):
                    print('   Not checking progress for skipped Clone')
                    continue

                gen = clone_entry['gen']
                # Recheck the last recorded Gen
                if recheckLastGen and gen >= 0:
                    gen = gen - 1

                # Have all Gens been processed?
                if gen == maxGensPerClone - 1:
                    print('   All Gens accounted for')
                    continue

                # Should aborted Gens be rechecked?
                if (not retryAborted) and (not recheckLastGen) and clone_entry.get('aborted', False):
                    print('   Not checking progress for aborted Gen')
                    continue

                if checkFinalGenFirst:
                    # Special case: Check last gen
                    response = wu_check(project, run, clone, maxGensPerClone - 1)
                    if response[0] == 1:
                        # Record this gen where traj has completed
                        record_clone_entry(clone_entry, maxGensPerClone - 1, response[1], response[0])
                        continue
                    elif response[0] >= 2:
                        # Record this gen where traj has been aborted
                        record_clone_entry(clone_entry, maxGensPerClone - 1, response[1], response[0])
                        continue

                # Special case: Check next gen
                response = wu_check(project, run, clone, gen + 1)
                lastGenDate = '-'
                if response[0] == 0:
                    print('   No progress detected')
                    continue
                elif response[0] == 1:
                    # Record this gen where traj has completed
                    record_clone_entry(clone_entry, gen + 1, response[1], response[0])
                    if (gen + 1) == (maxGensPerClone - 1):
                        # This is the last gen
                        continue
                    lastGenDate = response[1]
                elif response[0] >= 2:
                    # Record this gen where traj has been aborted
                    record_clone_entry(clone_entry, gen + 1, response[1], response[0])
                    continue

                if not checkFinalGenFirst:
                    # Special case: Check last gen
                    response = wu_check(project, run, clone, maxGensPerClone - 1)
                    if response[0] >= 1:
                        # Record this gen where traj has completed
                        record_clone_entry(clone_entry, maxGensPerClone - 1, response[1], response[0])
                        continue

                if searchType == 'alternate':
                    # Search Gens by hopping alternate Gens (useful for deltas)
                    response = alternate_search_wu_check(project, run, clone, gen, maxGensPerClone - 1, lastGenDate)
                elif searchType == 'binary':
                    # Binary search
                    response = binary_search_wu_check(project, run, clone, gen + 2, maxGensPerClone - 1)

                # Record this gen
                if (response[0] >= 1):
                    record_clone_entry(clone_entry, response[1], response[2], response[0])
    except Exception as e:
        print('ERROR: {}'.format(str(e)))
    finally:
        write_projects_json(projectFile, project_entry)
        print('Done')


def record_clone_entry(clone_entry, gen, genDate, code):
    """Record an updated gen entry."""
    clone_entry['gen'] = gen
    clone_entry['genDate'] = genDate

    clone_entry.pop('aborted', None)
    clone_entry.pop('abortedWhenDumped', None)
    clone_entry.pop('abortedWhenSuccess', None)
    clone_entry.pop('abortedWhenSuccessAndDumped', None)

    if code >= 2:
        clone_entry['aborted'] = True
    if code == 3:
        clone_entry['abortedWhenDumped'] = True
    elif code == 4:
        clone_entry['abortedWhenSuccess'] = True
    elif code == 5:
        clone_entry['abortedWhenSuccessAndDumped'] = True


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
    project_entry['lastUpdated'] = math.floor(time.time() * 1000)
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
    # 0 - No results found
    # 1 - Success; not reissued after Ok record
    # 2 - Permantently failed; never completed
    # 3 - Permanently failed; dumped at least once
    # 4 - Permanently failed; completed Ok at least once but reissued

    print('   Checking status for Project {}, Run {}, Clone {}, Gen {}...'.format(project, run, clone, gen))
    url = 'https://api.foldingathome.org/project/{}/run/{}/clone/{}/gen/{}'.format(project, run, clone, gen)
    sleep(1)
    response = s.get(url)
    if response.status_code != 200:
        print('ERROR: Error in API response')
        exit(1)

    response = response.json()
    response.reverse()
    faultCount = 0
    dumped = False
    success = False
    faulty = False
    genDate = None
    for result in response:
        if genDate is None:
            genDate = result['log_time'] + ' UTC'
        code = result['code']
        if code in ['Ok', 'Relayed']:
            if faulty or dumped:
                success = True
            else:
                return (1, genDate)
        elif code in ['Faulty', 'Faulty 2', 'Failed']:
            faulty = True
            faultCount = faultCount + 1
        elif code == 'Dumped':
            dumped = True
            faultCount = faultCount + 1
    if faultCount >= MAX_FAILURES:
        if dumped and not success:
            return (3, genDate)
        if success and not dumped:
            return (4, genDate)
        if success and dumped:
            return (5, genDate)
        return (2, genDate)
    return (0, '-')


def binary_search_wu_check(project, run, clone, lower, upper):
    """Binary search for last completed WU."""
    lastGen = -1
    lastGenDate = '-'

    while lower <= upper:
        mid = (lower + upper) // 2
        response = wu_check(project, run, clone, mid)
        if response[0] >= 2:
            return (response[0], mid, response[1])

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


def alternate_search_wu_check(project, run, clone, lower, upper, lastGenDate):
    """Alternate search for last completed WU."""
    while lower <= upper:
        response = wu_check(project, run, clone, lower + 2)
        if response[0] >= 2:
            return (response[0], lower + 2, response[1])

        if response[0] == 0:
            # Not found, check previous Gen
            response = wu_check(project, run, clone, lower + 1)
            if response[0] >= 1:
                return (response[0], lower + 1, response[1])
            return (1, lower, lastGenDate)

        if response[0] == 1:
            # Found, check next step
            lower = lower + 2
            lastGenDate = response[1]

            if lower <= upper:
                continue
            elif lower == upper:
                return (1, lower - 2, lastGenDate)
            else:
                response = wu_check(project, run, clone, lower - 1)
                if response[0] >= 1:
                    return (response[0], lower - 1, response[1])
                return (1, lower - 2, lastGenDate)


if __name__ == '__main__':
    main(sys.argv[1:])
