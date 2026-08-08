.PHONY: run migrate build test fmt vet tidy

# .env があれば読み込んでから起動する（なければ既定値で動く）
run:
	@set -a; [ -f .env ] && . ./.env || true; set +a; go run ./cmd/server

# スキーマを DB に適用する。サーバー起動とは分けて明示的に実行する。
migrate:
	@set -a; [ -f .env ] && . ./.env || true; set +a; go run ./cmd/migrate

build:
	go build -o bin/server ./cmd/server

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

tidy:
	go mod tidy
