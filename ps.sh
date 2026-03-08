#!/bin/bash
echo "=== PS Aux ==="
ps aux | grep -iE 'registry|portainer|docker'
echo "=== Fuser ==="
/sbin/fuser 5000/tcp
echo "=== Systemctl ==="
systemctl list-units --type=service | grep -iE 'registry|portainer'
echo "=== Snap ==="
snap list
