#! /bin/bash

findPid() {
    PID=`lsof -i4TCP:$1 | head -n 2 | tail -n +2 | awk '{print $2}'`
}

closeIfFound() {    
    PID=0
    findPid $1
    if [[ $PID -gt 0 ]]; then
        echo "going to kill $PID which hosts service at $1"
        kill -9 $PID
    fi
}

closeIfFound 9090
closeIfFound 8000
closeIfFound 8002
closeIfFound 8100
closeIfFound 4200
closeIfFound 4300


