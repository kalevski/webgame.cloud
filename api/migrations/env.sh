ENV_FILE="${ENV_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/.env}"

if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            ''|\#*) continue ;;
            *=*) ;;
            *) continue ;;
        esac
        key=${line%%=*}
        value=${line#*=}
        eval "current=\${$key-__unset__}"
        if [ "$current" = '__unset__' ]; then
            export "$key=$value"
        fi
    done < "$ENV_FILE"
fi
