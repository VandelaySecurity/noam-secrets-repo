from setuptools import setup, find_packages

setup(
    name='bi_collector',
    version='0.1',
    packages=find_packages(),
    zip_safe=False,
    entry_points={
        'console_scripts': ['legit_bi_collector=bi_collector.__main__:main'],
    },
    install_requires=[
        'typer==0.6.1',
        'dynaconf==3.1.9',
        'boto3==1.39.17',
        'simple-salesforce==1.12.2',
        'pylegit==0.1.dev29+g6ed318b84',
        'scm-data-management-module-client==1.1.4363',
        'slack-module-client==1.0.241',
        'jira-service-module-client==2.1.321',
        'microsoft-team-module-client==1.0.142',
        'outgoing-webhook-module-client==1.0.90',
        'user-management-module-client==1.1.275',
        'sentry-sdk~=1.14.0',
        'issue-service-module-client==1.1.1739',
        'gql==3.4.1'
    ]
)
