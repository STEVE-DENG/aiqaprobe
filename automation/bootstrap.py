#!/usr/bin/env python3
"""Provision trusted infrastructure only; no task execution or credentials embedded."""
import argparse, json, pathlib, plistlib, shutil, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['init','vm','image','install-service']);args=parser.parse_args()
home=pathlib.Path.home();state=home/'.config/aiqa-automation';state.mkdir(parents=True,exist_ok=True,mode=0o700)
if args.action=='init':
    config=state/'config.json';env=state/'secrets.env'
    if not config.exists():shutil.copyfile(ROOT/'config.example.json',config);config.chmod(0o600)
    if not env.exists():
        env.write_text('OPENAI_API_KEY=\nDEEPSEEK_API_KEY=\nAIQA_RUNNER_TOKEN=\nAIQA_GITHUB_APP_ID=\nAIQA_GITHUB_INSTALLATION_ID=\nAIQA_GITHUB_APP_KEY_FILE=\n');env.chmod(0o600)
    print('Private configuration initialized. No executor has been started.')
elif args.action=='vm':
    subprocess.run(['colima','start','--profile','aiqa','--mount','none','--ssh-agent=false','--ssh-config=false','--activate=false','--cpu','4','--memory','6','--disk','30','--port-forwarder','none'],check=True,cwd='/')
    mounts=subprocess.run(['colima','ssh','--profile','aiqa','--','findmnt','--json','--output','FSTYPE,SOURCE,TARGET'],check=True,stdout=subprocess.PIPE,cwd='/')
    def unmount(items):
        for item in items:
            unmount(item.get('children',[]))
            if item.get('fstype') in ('virtiofs','9p','fuse.sshfs'):
                subprocess.run(['colima','ssh','--profile','aiqa','--','sudo','umount','--',item['target']],check=True,cwd='/')
    unmount(json.loads(mounts.stdout)['filesystems'])
elif args.action=='image':
    subprocess.run(['docker','--context','colima-aiqa','build','-t','aiqa-executor:0.1.0',str(ROOT)],check=True)
else:
    cfg=json.loads((state/'config.json').read_text())
    if 'YOUR-WORKER' in cfg['api_base']:sys.exit('Configure API URL before installing service')
    secrets=state/'secrets.env'
    if not secrets.exists() or any(not v.strip() for l in secrets.read_text().splitlines() if l and not l.startswith('#') for v in [l.partition('=')[2]]):sys.exit('Configure credentials before installing service')
    logs=home/'Library/Logs/AIQA';logs.mkdir(parents=True,exist_ok=True,mode=0o700)
    plist=home/'Library/LaunchAgents/com.aiqaprobe.executor.plist';plist.parent.mkdir(parents=True,exist_ok=True)
    data={'Label':'com.aiqaprobe.executor','ProgramArguments':[sys.executable,str(ROOT/'runner.py'),'--config',str(state/'config.json'),'--env-file',str(secrets)],'RunAtLoad':True,'StartInterval':60,'ProcessType':'Background','EnvironmentVariables':{'PATH':'/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'},'StandardOutPath':str(logs/'executor.log'),'StandardErrorPath':str(logs/'executor-error.log')}
    if plist.exists():sys.exit('Service plist already exists; preserve it and update explicitly')
    plist.write_bytes(plistlib.dumps(data));plist.chmod(0o600)
    import os
    subprocess.run(['launchctl','bootstrap',f'gui/{os.getuid()}',str(plist)],check=True)
    print('Executor service installed.')
