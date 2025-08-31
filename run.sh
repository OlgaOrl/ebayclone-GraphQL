#!/bin/bash

# Main run script - delegates to scripts/run.sh
# This provides the required run.sh in the project root

cd "$(dirname "$0")"
exec ./scripts/run.sh "$@"
