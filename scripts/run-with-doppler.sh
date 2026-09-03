#!/usr/bin/env bash
# Layers both Doppler configs the app needs and execs the given command.
#
#   hazl-general/prd        database, storage, session secrets, Turnstile
#   dr-keys/prd_llm_opus4-8 Anthropic gateway credentials
#
# The INNER `doppler run` wins on a key collision, so if dr-keys ever defines a
# key that hazl-general also defines, the LLM config's value is what the app sees.
# `npm run vibe:check` asserts the resolved DATABASE_URL host for exactly that
# reason.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 64
fi

exec doppler run -p hazl-general -c prd -- \
     doppler run -p dr-keys -c prd_llm_opus4-8 -- "$@"
