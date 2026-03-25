#!/usr/bin/env bash
set -euo pipefail

cmd=${1:-}

case "$cmd" in
  status)
    docker compose ps
    ;;
  logs)
    docker compose logs -f --tail=200
    ;;
  restart)
    docker compose up -d --build
    ;;
  deploy)
    echo "Building and deploying..."
    docker compose build && docker compose up -d
    echo "Done. Run './scripts/ops.sh status' to verify."
    ;;
  ssl-renew)
    certbot renew --quiet
    docker compose exec frontend nginx -s reload
    ;;
  *)
    echo "Usage: $0 {status|logs|restart|deploy|ssl-renew}"
    exit 1
    ;;
esac
