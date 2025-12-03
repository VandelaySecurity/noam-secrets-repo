from setuptools import setup, find_packages

setup(
    name='bi_collector',
    packages=find_packages(),
    zip_safe=False,
    entry_points={
        'console_scripts': ['legit_bi_collector=bi_collector.__main__:main'],
    },
    install_requires=[
        'typer==0.6.1',
        'dynaconf==3.1.9',
        'boto3==1.39.17',
    ]
)
