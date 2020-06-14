"""Checks if FAH projects have descriptions and causes."""

import json
import requests
import sys

from time import sleep


def main(argv):
    """Main function."""

    # Get list of projects
    url = 'https://apps.foldingathome.org/psummary.json'
    projects = requests.get(url)

    if projects.status_code != 200:
        print('Error')

    s = requests.session()
    projects = json.loads(projects.text)
    url = 'https://api.foldingathome.org/project/'
    print('project_id,project_cause')

    # Loop for each project
    for project_entry in projects:
        project_id = project_entry['id']
        # Sleep to avoid getting blacklisted
        sleep(1)
        description = s.get(url + str(project_id))
        if description.status_code != 200:
            print(str(project_id) + ',Missing description')
            continue

        description = json.loads(description.text)
        project_cause = description['cause']
        print(str(project_id) + ',' + project_cause)


if __name__ == '__main__':
    main(sys.argv[1:])
