#!/bin/bash
echo "=== Docker PS ==="
docker ps -a
echo "=== Port 5000 Listeners ==="
ss -tulpn | grep 5000
echo "=== HTTP Check ==="
curl -i -s localhost:5000
echo "=== Portainer Check ==="
curl -i -s localhost:9000
