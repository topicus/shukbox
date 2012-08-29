from fabric.api import * 
import os
FAB_ROOT = os.path.dirname(os.path.realpath(__file__))
def prod():
 env.hosts=['topicus@topicus.webfactional.com',]

def deploy():
    with lcd('shuk'):
        local("~/Plattforms/meteor/meteor bundle shuk")
        local("tar xvfz shuk")
        local("rm -rf shuk")
        local(" rsync -a --exclude 'fibers' --verbose  --progress --stats --compress bundle/* topicus@topicus.webfactional.com:~/webapps/shukbox")
        local("rm -rf bundle")
    local("./restart_server.sh")   
