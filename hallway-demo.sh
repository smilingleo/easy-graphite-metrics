#! /bin/bash
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
BASEDIR=$(dirname "$SCRIPT")

echo 'starting Skipper....'

cd $BASEDIR/ws

bin/itier >> /tmp/skipper.log &

echo 'starting Tailor....'
cd $BASEDIR/tailor
npm start >> /tmp/tailor.log &

echo 'starting navbar fragment server....'
cd $BASEDIR/navbar-fragement
npm start >> /tmp/navbar.log &

echo 'starting footer as fragment....'
cd $BASEDIR/fragment0
./start.sh >> /tmp/footer.log &


echo 'start a sample angular2 app as a fragment server...'
cd $BASEDIR/angular2-express-starter
npm start >> /tmp/angular2.log &



